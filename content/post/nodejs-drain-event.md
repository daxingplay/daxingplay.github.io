+++
author = "daxingplay"
date = 2015-12-31T15:51:35Z
description = ""
draft = false
image = "https://img2.ojcdn.com/daxingplay/2015/12/drain.jpg"
slug = "nodejs-drain-event"
title = "探究 Node.js 中的 drain 事件"
aliases = [
    "/nodejs-drain-event/"
]
+++



## 起因

最近在用 Node.js 写一些网络请求相关的代码时，频繁在一些开源代码中看到 drain 事件的使用，于是我也依葫芦画瓢写到了自己的代码里面：

```
socket.on('drain', function(){
    console.log('drain event fired.');
});

socket.write('some data.');
```

实际放到线上测试的时候发现，在一些情况下，drain 事件真的会被触发，那到底什么时候会触发 drain 事件呢？drain 事件能用来做什么呢？本着打破砂锅问到底的精神，我决定探究一番。


## TLDR

请直接跳到`小结`部分。


## 探究

最简单的办法就是查文档。因为我写的是网络请求相关的代码，那么我就先翻越了 net 和 socket 相关的部分。在 Node.js 官方文档中，对于 socket.write 有这么一部分描述：

> Returns true if the entire data was flushed successfully to the kernel buffer. Returns false if all or part of the data was queued in user memory. ‘drain’ will be emitted when the buffer is again free.

也就是说，drain 事件是和 socket.write 的返回值强关联的，那么我们可以做一个简单的实验（只写关键部分）：

```
socket.on('drain', function(){
    console.log('drain event fired.');
});

var ret = socket.write('some data.');

console.log('write data returned %s.', ret);
```

可是无论我怎么运行这部分代码，返回值总是 true，drain 事件没有被触发。那为啥线上就能触发呢？按照文档所说，只有全部或者部分数据被缓冲在了内存里面才会返回 false。那问题又来了，什么时候数据才会被缓冲呢？

既然是被缓冲了，那最先猜测到就是数据流量太大。就像每天上下班高峰期的文一西路那样，一旦车流量太大，前面的路口塞满了，交警就会让后面的车停下来。

好，那我们加大“车”流量（为节省篇幅，部分代码省略）：

服务端代码：

```
var net = require('net');
net.createServer(function(socket){
    // do something
}).listen(6666, '127.0.0.1');
```

客户端代码：

```
var net = require('net');

function writeToRemote(){
    var client = new net.Socket();
    client.connect(6666, '127.0.0.1', function(){
        if(!client.write('some data by ziying.')){
            console.log('write returned false.');
        }
    });
    client.on('drain', function(){
        console.log('drain event fired.');
    });
    client.on('data', function(){
        client.destroy();
    });
}

// 加大流量
for(var i = 0; i < 1000; i++){
    writeToRemote();
}
```

但运行多次之后发现仍旧没有看到任何 drain 事件的迹象。难道次数不够？随着我继续增大 i 的最大值，直到遇到`(libuv) kqueue(): Too many open files in system`的错误时候，我仍旧没看到 drain 事件。

逼我用绝招。看 Node.js 源代码！

因为 socket.write 实际上是调用的 Stream.write（[参考此处源代码](https://github.com/nodejs/node/blob/cc0342a517279c9c52543e3a37e11da3fc6cdb36/lib/net.js#L615)），最后我们在 Stream.write 的[代码](https://github.com/nodejs/node/blob/cc0342a517279c9c52543e3a37e11da3fc6cdb36/lib/_stream_writable.js#L255)中找到了一丝端倪：

```
var ret = state.length < state.highWaterMark;
// we must ensure that previous needDrain will not be reset to false.
if (!ret)
  state.needDrain = true;

// something else

return ret;
```

可以看到当要写的数据的长度大于 highWaterMark （字面理解：高水位线）的时候，那么 Stream.write 就会返回 false，也就会触发 drain 事件了。

那这个高水位线具体是多少呢？可以继续看[代码](https://github.com/nodejs/node/blob/cc0342a517279c9c52543e3a37e11da3fc6cdb36/lib/_stream_writable.js#L40)：

```
var hwm = options.highWaterMark;
var defaultHwm = this.objectMode ? 16 : 16 * 1024;
this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;
```

默认值是 16KB，看来还是挺大的啊。所以回想一下刚才我们的实验程序，一个是写的数据比较小，另外一个是实验代码中的服务器端没有复杂逻辑，数据处理的也比较快，我们仍旧拿刚才的车流量的例子，虽然车很多很多，但是如果每辆车都开得飞快，那路也不会堵。只有当一些车比较慢，影响到了后面车的速度的时候，整体速度就会下来，就变堵了。

根据这个思路，我们换成下面这个实验：

```
var http = require('http');
var fs = require('fs');


http.createServer(function(req, res) {
    // 哈哈，这个代码写于圣诞，于是就用了圣诞的歌曲，大家圣诞快乐哦！
    var filePath = './Christmas.mp3'; 
    var stat = fs.statSync(filePath);

    response.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size
    });

    var readStream = fs.createReadStream(filePath);
    readStream.on('data', function(data) {
        res.write(data);
    });

    res.on('drain', function() {
      console.log('drain event fired.'); 
    });

    readStream.on('end', function() {
        res.end();
    });
}).listen(6969);
```

这里我们启动了一个简单的 HTTP server，任何 requset 过来，都会返回一个 5M 大小的 圣诞歌曲的内容。然后我们对这个 HTTP server 发起 1000 次 GET 请求。果然不出所料，还没等所有请求发完，一堆的 drain event fired 日志出现了：

![](http://img1.tbcdn.cn/L1/461/1/bc2589358317b14b49aa2116e99446771e611710.png)

如果对 res.write 的返回值做下日志，也会发现返回了很多 false。

原因也很容易想到，硬盘读取这个 MP3 文件的速度（测试环境为 RMBP 的 SSD 硬盘）一般都会快于将数据通过 HTTP Response 返回给用户（即便是 localhost 的访问，更不用说外网复杂错综的网络环境了），所以，当 MP3 很快就被读取过来，但又没有很快的将数据写回，那么这个 Stream 中的 data 就被缓存了。于是，我很自然而然的设想，在我这个小应用中，也许这么做并没有什么，但当应用的访问量逐渐增大的时候，这个问题就可能会爆发，比如造成个内存泄露啊之类的。


## 怎么用

那上面的代码该怎么改进呢？

```
var readStream = fs.createReadStream(filePath);
readStream.on('data', function(data) {
    if(!res.write(data)){
        readStream.pause();
    }
});

res.on('drain', function() {
    readStream.resume(); 
});
```

也就是说，当 write 返回 false 的时候，我们暂停读取流，当缓存的数据清空之后，我们再继续读取流，相当于我们根据输出流来对读取流做限流。反过来，如果写入流快于读取流，我们也可以对写入流限流。


## 真的是这样吗？

刚才提到了，我想如果我们没做这部分处理的话，应该很容易造成内存泄露，那我们不妨做个实验验证下。使用上面两段代码分别进行不带限流和带限流的实验，每隔 1s 使用 `process.memoryUsage()` 打印出来内存使用（我们在启动 server 之后就开始打印内存数据）：

```
xxx.listen(PORT, function(){

  setInterval(function(){
    var memoryUsage = process.memoryUsage();
    // 用这个格式是为了方便我使用 Markdown 生成表格导入到 Numbers
    console.log('| %s | %s | %s |', memoryUsage.rss, memoryUsage.heapTotal, memoryUsage.heapUsed);
  }, 1000);

});
```

最终我得出了如下数据：

##### 限流

![](http://img2.tbcdn.cn/L1/461/1/88bd2e048926e49b9363bfc219d162fc1171c505.png)

##### 没有限流

![](http://img2.tbcdn.cn/L1/461/1/970bd9066ae3c7fead5ebba7d92c3d4a38974c1b.png)

可以看到，内存使用其实差不多……

难道我猜想错了么？最简单的办法，继续看源代码。

看下 `fs.createReadStream` 的代码，就可以知道它的工作方式是先在内存中准备一段 Buffer，然后在 fs.read() 读取文件到这个 Buffer 中，完成一次读取时，则从 Buffer 中通过 slice 方法取出那个数据作为一个小 Buffer 对象，再通过 data 事件传给调用方<sup>[1]</sup>。

再看下 pause 具体是怎么[实现](https://github.com/nodejs/node/blob/cc0342a517279c9c52543e3a37e11da3fc6cdb36/lib/_stream_readable.js#L729)的：

```
Readable.prototype.pause = function() {
  if (false !== this._readableState.flowing) {
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};
```

pause 方法设置了一个状态位。在 `flow` 方法中，如果是 paused 的状态，那么就不再从 文件流中读取数据了：

```
function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}
```

所以在 pause 的时候，文件的数据流依旧在 Buffer 中。

回头看下我们这个例子，其实是写比较慢，如果我们没有对写入的返回值做判断的话，Writable Stream 本身也会把多余的数据缓存起来。具体可以看 `WriteOrBuffer` 这个方法的[实现](https://github.com/nodejs/node/blob/cc0342a517279c9c52543e3a37e11da3fc6cdb36/lib/_stream_writable.js#L255)：

```
if (state.writing || state.corked) {
    // buffer data
} else {
    doWrite();
}
```

可以看出这里如果之前的写入没有完成，那么会把需要写入的数据缓存起来。

这样就不难理解了，如果我们采用限制读取流的方案，那么数据缓存在读取流的 Buffer 里，如果我们采取不限制读取流的方案，那么数据缓存在写入流的 Buffer 里，总之这部分数据都是要被缓存，只是缓存到不同的流的 Buffer 而已，所以这也能解释了为啥我们的测试结果，内存占用基本没有差别了。


## 更好的解决方案

其实，Node.js 里面提供了更好的解决方案，也就是 pipe。

我们将上面的代码继续改造下：

```
var readStream = fileSystem.createReadStream(filePath);
readStream.pipe(res);
```

是不是更简单了呢？

我们看下[官方代码](https://github.com/nodejs/node/blob/cc0342a517279c9c52543e3a37e11da3fc6cdb36/lib/_stream_readable.js#L452)是怎么实现的（缩减版）：

```
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);


  src.on('data', ondata);
  function ondata(chunk) {
    var ret = dest.write(chunk);
    if (false === ret) {
      src.pause();
    }
  }
```

是不是和我们自己的实现差不多呢？当然官方代码处理的更加细致，对很多情况做了判断，感兴趣的同学不妨阅读看看:)


## 该怎么用？

看到这里，大家可能会问，那按照你这么说，drain 就完全没用了是么？非也非也。虽然我一开始也是这么想的，但经过我在 github 上一阵狂搜，终于有了一些端倪。

再回想我们刚才的案例，我们的写入流是以 HTTP Response 的形式返回给用户，但如果写入流是我们的一个服务呢？比如我们需要往一台 Redis Server 里面插入大量数据，而这台 Redis 又承担对外提供服务的艰巨任务，那么，为了保证我们写入的同时这台 Server 依旧能较好的对外服务，很自然的就可以想到我们可以对写入流做限流。比如 `node_redis` 这个模块里面的一个 [example](https://github.com/NodeRedis/node_redis/blob/afc4989495245e683ce70a234c55046a51e73c08/examples/backpressure_drain.js)：

```
'use strict';

var redis = require('../index'),
    client = redis.createClient(),
    remaining_ops = 100000, paused = false;

function op() {
    if (remaining_ops <= 0) {
        console.error('Finished.');
        process.exit(0);
    }

    remaining_ops--;
    client.hset('test hash', 'val ' + remaining_ops, remaining_ops);
    if (client.should_buffer === true) {
        console.log('Pausing at ' + remaining_ops);
        paused = true;
    } else {
        setTimeout(op, 1);
    }
}

client.on('drain', function () {
    if (paused) {
        console.log('Resuming at ' + remaining_ops);
        paused = false;
        process.nextTick(op);
    } else {
        console.log('Got drain while not paused at ' + remaining_ops);
    }
});

op();
```

在这个例子中，当写入流开始缓存的时候，我们就停止写入了，等 buffer flush 完，我们再继续写入。通过这种形式，我们可以控制发送命令的速率。

如果你有更好的案例，欢迎与我一起探讨。


## 小结

其实在我们平时写代码的过程中，并不需要刻意用到 drain 事件。Node.js 本身已经帮我们处理了很多细节。对于流的处理，推荐大家直接用简单方便的 pipe 方法。而drain 事件比较适合用在一些需要自己手工处理限流的场景。另外，在看 Node.js 源码的时候很多细节还是很赞的，推荐大家可以阅读下。


## 注解

1. 朴大师的《深入浅出 Node.js》6.4节


## 后记

写的比较匆忙，可能中间有理解错误或者需要补充的地方，欢迎 Node.js 爱好者一起探讨。

 (30)


