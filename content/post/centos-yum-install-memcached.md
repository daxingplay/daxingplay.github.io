+++
author = "daxingplay"
categories = ["CentOS", "Discuz", "eAccelerator", "memcached"]
date = 2010-08-21T20:28:37Z
description = ""
draft = false
slug = "centos-yum-install-memcached"
tags = ["CentOS", "Discuz", "eAccelerator", "memcached"]
title = "CentOS下用yum简单安装Memcached"
aliases = [
    "/centos-yum-install-memcached/"
]
+++


CentOS真是太好用了。尤其是那个yum命令，装东西真是太简单了，自己连配置都不用。所以这篇文章没什么技术含量，主要是来记录我安装过程中遇到的一些问题。和大家分享一下。

DiscuzX 1.0开始对一些常见的缓存和内存优化系统进行了支持，比如Memcached、Eaccelerator、Xcache。但是对Eaccelerator的支持貌似有一些莫名其妙的问题。比如版本太高了不行，而且不能用yum等方式安装，安装的时候要加特定的参数–enable-shared-memory，所以我虽然装好了，在phpinfo里面也能看到，但是在DX后台里面就是看不到。我想算了，那就装一个memcached用一用吧。于是，在网上搜了一些安装方法，发现大多数都是wget然后自己去配置安装的。我不是很喜欢这样，所以决定尝试yum方式安装。

先yum search一下。发现有这个包。于是yum install memcached。顺利安装好。此时，可以编辑/etc/sysconfig/memcached这个文件配置一下memcached。

PORT="11211" #配置memcached使用的端口 USER="nobody" #配置它启动使用的用户 MAXCONN="2048" #最大并发连接 CACHESIZE="64" #最大使用内存，这里是指64M OPTIONS="" #其它的配置参数

配置好之后，我们再安装memcached对php的扩展module。

yum search memcache的时候，还找到了如下几个包：

php-pecl-memcache      x86_64  #这个是网上一般常用的包。

php-memcache      x86_64  #这个是我找到的一个包。

我按照网上的教程，使用php-pecl-memcache这个包的话，安装完之后，运行php -v发现有问题。提示module在编译的时候参数不对，有一个api不匹配。具体的错误信息找不到了，无法贴出来了，大体就这个意思。没办法，我猜是因为php版本过新，而php-pecl-memcache这个包稍微旧了一些的缘故。因为php我是用另外一个源更新到了5.2.6，而且刚才yum搜到的php-memcache也正是这个源提供的，于是我尝试安装了一下这个包php-memcache，一切正常，而且phpinfo里面也显示了！

这时候还没完。要启动memcached服务器才行。运行下面的命令即可。

memcached -d -u root -m 64 -c 1024

**Memcached参数说明：**

- -d选项是启动一个守护进程
- -m分配给Memcache使用的内存数量，单位是MB
- -u运行Memcache的用户
- -l监听的服务器IP地址
- -p设置Memcache监听的端口,最好是1024以上的端口
- -c最大运行的并发连接数，默认是1024，按照你服务器的负载量来设定
- -P设置保存Memcache的pid文件

接下来我们设置让memcached自动启动，防止系统重启后memcached失效。

chkconfig --add memcached

然后检查一下是否设置成功。

chkconfig --list memcached

如果2~5写的是on的话说明设置成功。但是在一些CentOS版本中，–add命令无法成功，可以用下面的语句代替：

chkconfig memcached on

然后再次检查一下，一般不会有问题了，只要2~5设置为on，那么memcached就已经会随着系统自动启动了。

至此，memcached即可使用，在DiscuzX的后台管理面板中也可以看到并且使用了。

 (2073)


