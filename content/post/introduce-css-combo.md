+++
author = "daxingplay"
date = 2012-12-06T15:44:22Z
description = ""
draft = false
slug = "introduce-css-combo"
title = "好用的CSS模块化打包工具CSS-Combo"
aliases = [
    "/introduce-css-combo/"
]
+++


上半年在团队做自动化之类的工作，也学习了NodeJS，确实，NodeJS很适合做一些小工具神马的，今天我给大家介绍的就是我自己基于NodeJS写的CSS模块化打包工具：CSS Combo，项目地址：https://github.com/daxingplay/css-combo

说起模块化，前端一般谈JS模块化的居多，毕竟JS是编程语言，比如业内的[seajs](http://seajs.org)、KISSY loader等，都有很成熟的模块化规则和方案了，前端工程师可以采用模块化的方法去编写页面，打包，上线，但是CSS界却没有。

后来，CSS界出现了SASS、LESS之类的语言，这些语言的出现可以说是非常应景的，有一点很重要，拿LESS举例，less支持了模块化，你可以@import ‘xxx.less’的形式导入其他less文件（模块），方便模块化。我也正是从这点得到了灵感，想出了如何去做css模块化。


## CSS模块化

其实，CSS规范里面就已经提到相关内容了，就是@import语法。这个语法是被当前主流浏览器（当然包括ie6）原生支持的。具体怎么用我想我不用在这里浪费大量篇幅给大家介绍语法，大家可以看下mozilla里面对@import语法的解释（[链接](https://developer.mozilla.org/en-US/docs/CSS/@import)），为啥大家很少用呢，大概很大一部分原因是因为steve的这篇[博文](http://www.stevesouders.com/blog/2009/04/09/dont-use-import/)。确实，如果在生产环境单独去用@import，会有较为严重的性能，而且不同的浏览器以及不同的用法下也有不同的表现，比较让人郁闷。但是，这并不妨碍@import成为CSS模块化的利器。

想必@import诞生就是为了解决css模块化的问题吧。我们先来举一个例子看看CSS模块化的优势：

### 传统的开发

假如你要开发某大型网站首页，那html的head里面应该是这样引用样式的：

<link href="/wp-includes/css/admin-bar.min.css?ver=4.1.1" rel="stylesheet" type="text/css"></link>

为了页面上比较好的性能，减少创建http请求的消耗，我们一般会选择尽量减少link的css文件数量，假如本例中，页面上所有的样式都写在了style.css里面。可想而知对于一个大型网站来讲，这个文件会有多长多长多长长长长。。。。如果出现bug或者想改个东西，肯定找半天；而且现在界内对于CSS开发并没有很成熟的最佳实践或者约定可循，很多时候，前端为了加快进度，可能会把某一个功能的代码放在css不同的地方，如果想下线某个功能，肯定不敢乱删。

这时候，CSS模块化的优势就体现出来了！

### 模块化开发

页面不改，我们还是只引用那一个样式，style.css，但是文件内容改成下面的：

 /** * xxx页面入口样式文件style.css */ @import './utils/base.css'; /*页面基础框架（骨架）*/ @import './mods/layout.css'; @import './mods/header.css'; @import './mods/nav.css'; /*首页焦点图*/ @import './mods/flash-pic.css'; ………这里省略诸多模块……… @import './mods/footer.css';

这里，我们把style.css中混乱的样式划分成了一个一个的子文件，作为模块。可以看到，作为示例，我把页面的一些reset样式以及一些站点公用样式放在了util目录下的base.css中，把页头拆分成header.css，把首页焦点图的样式单独拆分成falsh-pic.css，把页面的基础布局都放在了layout.css这个文件中。然后相应的代码就在对应的模块中写，是不是看起来简洁、好维护很多？

不光是简洁，使用@import形式的模块化还有下列好处：

1. 浏览器原生支持。这点是这个工具或者这种模块化形式的亮点。对于less，想要在开发环境下方便地修改，还需要额外引入一个js文件，或者采取less实时编译之类的方法。对于实时编译，像我这种用idea编辑器自动保存的人很蛋疼，每次自动保存的时候less编译报错。。。而采用这种@import xxx.css文件的方法，我们可以很方便地在开发阶段，直接调试。不需要引入额外的js文件去解析style.css文件。页面中直接引入style.css文件，通过http瀑布图可以看到，base.css、layout.css等被一个一个加载进来了。
2. 方便下线某个功能。这个是所有语言模块化的优势，比如哪天PD说，首页焦点图那个地方我想换个样式，以往，我们很多都是直接在html里面改掉原来的class，然后在style.css里面直接加上新的样式，老的也不敢删，怕删错了，即使删了也可能会漏，因为不停的bugfix可能会导致代码乱写。而采用模块化的方案，我直接把@import ‘./mods/flash-pic.css’这一行注释掉，然后再@import新的样式，这样，即使上线了，PD说效果不好，想换回原来的，只要改一下注释，重新打包，岂不是很方便？
3. 便于管理各种日常需求。好，页面做好了，上线了，PD今天脑袋抽风，说我要加一个功能，首页右侧加一个建议反馈入口，以往，我们要打开style.css，想想在哪儿加好，或者直接加在最后，也不管最后的地方是放什么的。采用模块化之后，我们在style.css的最后再@import ‘./mods/feedback.css’即可，然后加上注释：/* 2012-12-06 PD要求加上建议反馈 */，这样以后其他修改者也能快速知道你这个模块是干神马的。
4. 方便合作开发。这也是所有语言模块化的优势。对于一个大型项目，往往共同开发一个文件，冲突的可能性非常大，很多情况下，我改了一个小地方，提交上去就冲突了，然后再花费比bugfix多10倍的时间去解决冲突，然后还不知道会不会产生另外10个新bug，而模块化，每个人负责哪些模块，职责非常明确，不容易出现问题。
5. 依赖写在入口文件，而不是打包脚本的配置文件。这样开发和打包分离，新加、减少模块不需要去修改打包配置，方便多人协作
6. 方便调试，这是非常重要的特点，我会在后面详细阐述。

好，说完CSS模块化，以及如何利用@import形式来组织自己的模块，大家是不是感觉这种形式让你眼前一亮呢？慢着，steve大牛不是说这种@import方式有性能问题么？

是的，如果这样开发完直接上线的话，页面会有一些问题，我就不拿steve的博文再说一遍了，感兴趣的同学可以自己去看看大牛的文章。我就挑一些比较明显的问题说一下：

1. 因为@import的文件是额外请求的，所以页面加载的时候会有一小会儿的裸体（样式没加载进来），要等这些模块一个一个加载
2. 请求数太多，页面性能不佳，对服务器压力也会相对大一些。
3. steve大牛提到的不同的浏览器以及不同的书写形式可能会有不同的加载顺序。

所以，最好的办法就是把模块打包！这和js模块化一样的，模块化开发，然后上线之前打包，线上完美使用。


## CSS Combo：CSS模块打包利器

像js打包，一般都会有配备的打包工具。比如seajs有他的spm，kissy有我写的[module-compiler](https://github.com/daxingplay/ModuleCompiler)（NodeJS版本）等等，对于css，很多人是用ant的concat或者grunt的concat，这样做的不利的一面就是要把css模块依赖写在打包脚本的配置文件中，很不利于维护。很多时候，你新增了模块，忘记了修改打包脚本的配置，然后发上去发现我的脚本怎么没生效？查了半天才发现是没打包进去。

如果你利用我上面介绍的@import形式来组织你的css，那么你就可以用我写的配套打包工具CSS Combo了：

首先安装css combo：

npm install -g css-combo

然后进入你所在的入口文件（本例为style.css）目录，输入：

csscombo style.css style.combo.css

这样就会把style.css文件打包成style.combo.css文件。很简单吧。当然还有其他参数，请见github文档

好吧，你不喜欢用命令，或者你想整合该工具到你自己的一整套打包工具中，可以到github上看相关的api文档：https://github.com/daxingplay/css-combo


## 如何利用CSS模块化方便调试

模块化，非常重要的一个特点就是要方便调试。否则我把压缩之后的打包文件发上去了，发现线上出bug了怎么办？这里，你只需要选择一个代理工具将style-min.css（或者style.combo.css）文件代理成你的源码文件style.css，然后刷新一下，看看是不是都模块加载了？

或者，我也推荐你用这种方案，和开发配合起来，比如后台是php，我可以在引用style-min.css的时候这么写：

 if(!empty($_GET['css-debug'])){ echo ' <link href="http://xxx/style.css"></link>'; }else{ echo ' <link href="http://xxx/style-min.css"></link>'; }

这样，在线上，你可以在url后面加上css-debug参数，那么页面就引用了style.css脚本，样式文件全部模块化载入，方便你调试，能够快速定位到出错的模块；而普通访客进来，没有加这个参数，全部是引用的style-min.css这个压缩之后的脚本。

当然，你也可以任意发挥，比如在淘宝内部，我们可以结合ucool方便切换源码和非源码，或者使用现成的代理工具，比如windows下的fiddler等，当然你可以在js脚本里面，把源码的link标记删除掉，在动态插入源码的link等等。

总之，利用模块化，可以很方便调试，定位出问题的代码在哪个文件。


## 一些最佳实践

首先，我务必要提醒大家，@import语法一定要仔细看。  
 基本上，以下几种用法：

 @import "./mod/mod1.css"; @import "f:/website/htdocs/xxx/assets/css/mod/mod2.css"; @import url("http://assets.taobaocdn.com/tbsp/tbsp.source.css");

这里，我们不推荐使用本地绝对路径的引用方式，因为不利于团队协作，相对目录绝对够用了，当然css-combo是支持解析本地绝对路径的。

至于直接@import线上的路径，css-combo工具也是支持的，会帮你下载下来～

另外，一定要注意，CSS规范中，@import必须放在其他样式之前，比如：

 @import "./mod/mod1.css"; @import "./mod/mod2.css"; body { margin:0; }

而下面这种写法：

 @import "./mod/mod1.css"; body { margin:0; } @import "./mod/mod2.css";

mod2.css是无法被浏览器@import进来的。所以我们推荐的最佳实践就是把所有的模块import都放在入口文件的最开始，方便管理。


## 其他

### 为啥不直接用less

团队里面不是每人都会less，不是每个人都喜欢less。而且less不支持gbk编码，还有上面提到的，调试需要引入一段js，很多情况下，开发套页面的时候都保留了。。。其实，最根本的原因就是less和css combo解决的不是一类问题，less更多的是把css编程化，css combo只专注css模块打包:)

好，先写到这儿吧，思路比较乱，大家有问题欢迎提出，对于css combo工具有任何需求和bug，欢迎到github上提issue。

 (14719)


