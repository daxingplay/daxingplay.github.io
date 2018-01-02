+++
author = "daxingplay"
categories = ["CSS Hack"]
date = 2010-09-18T15:14:06Z
description = ""
draft = false
slug = "css-hack-and-backward-compatibility"
tags = ["CSS Hack"]
title = "全面的CSS Hack和向后兼容的方法"
aliases = [
    "/css-hack-and-backward-compatibility/"
]
+++


在[幸福收藏夹](http://www.happinesz.cn/archives/1331/)里面读到的一篇关于浏览器兼容的文章，特找了一些资料，整合了一些自己的想法成文（主要内容还是原博客的）。尽量整理得齐全一些，并针对新的浏览器提供更新，以供自己以后使用。

在解决兼容方法上，想定出一个统一的规范，sofish认为应该以下面3点为基本原则：

1. 权衡成本：在浏览器被淘汰后，如何快速清理掉无用代码
2. 可维护：在资源成本和完美间平衡的向后兼容
3. 可读：省力、易记

这里把成本放在了第一位，并不是说我们不愿意追求完美，而只是，太刻意追求完美有时候可能会阻碍我们前进；在成本后，应该是可维护和可读，这点对于团队的合作来说至关重要，而最终结果也是为了减少成本。

先把这三个原则存起来，来看看我们平时解决兼容的写法（后面会附详细的Hack方法列表）：

### 一、CSS 选择器 Hack

 /* Opera */ @media all and (-webkit-min-device-pixel-ratio:10000), not all and (-webkit-min-device-pixel-ratio:0) {head~body .sofish{display:block;}}

**这种写法的优缺点是：**

- 优点：全面，各种HACK都有；清理无用代码里易认
- 缺点：选择器名称不易记；代码量多（要重复写选择器）

### 二、CSS 属性 Hack

 .sofish{ padding:10px; padding:9px\9; /* all ie */ padding:8px\0; /* ie8-9 */ *padding:5px; /* ie6-7 */ +padding:7px; /* ie7 */ _padding:6px; /* ie6 */ } /* IE9 only */ :root #dorange { padding: 1px\0; }

**这种写法的优缺点是：**

- 优点：易记；代码少
- 缺点：不全面

### 三、IE 注释

**这种写法的优缺点是：**

- 优点：安全；向后兼容好；易维护
- 缺点：用不好会增加HTTP请求；用得好代码又多

### 四、浏览器探测：JS/后端程序判断

 // 以jQuery为例，检测是否是IE6，是则加上class="ie6" if ($.browser.msie && $.browser.version = 6 ){ $('div').addClass('ie6'); }

**这种写法的优缺点是：**

- 优点：全面；易维护；可读性高
- 缺点：占资源；代码量大（要重写选择器）

上面4种是我们最常用的方法。现在，让我们抽出心里存着的那3个原则，看看如何选择。要时间思考一下么？这里简单地说一下我的选择：

1. 尽量使用单独HACK 这样维护起来成本比较低，改动不会影响其他的浏览器，而一旦有浏览器淘汰，只要搜索关键字，就可以批量去掉这些代码。比如，ie6的单独hack：`_padding:6px;；`
2. 向后兼容的目标：1年 你想现在的网站兼容IE10么，谁不想，但这可预见性太低了，也可以说，成本太高了。暂时没必要。不过，IE9可能要发布了，所以，选择像`padding:8px\0;`这样的IE8+的hack，在删掉其他代码不影响向后兼容上，会更好；并且，如果IE10出来，一旦支持这个hack，而又没有这个bug，可能删掉只影响2个浏览器，也会更方便；
3. 尽可能省资源 你要是不考虑页面加载速度，不考虑服务器承受能力的话，那在向后兼容和淘汰的处理上可以做得很完美（从代码上），但这从某种程度上，不如不做。

### 五、个人推荐写法

其实可以纠结的还真多，这里结合A-Grade浏览器的种类和HACK的种类，写两种个人认为比较合理的HACK和向后兼容相兼顾的写法，仅供大家参考的。

**经济实惠型写法：**注重单独的HACK。 IE的HACK比较多，选择省力易记的属性HACK；其他浏览器HACK少，选择块状的选择器HACK(推荐)

 .sofish{ padding:10px; padding:9px\9; /* all ie */ padding:8px\0; /* ie8-9 目前应用于IE8的单独hack，情况比较少 */ *padding:5px; /* ie6-7 */ +padding:7px; /* ie7 */ _padding:6px; /* ie6 */ } /* webkit and opera */ @media all and (min-width: 0px){ .sofish{padding:11px;} } /* webkit */ @media screen and (-webkit-min-device-pixel-ratio:0){ .sofish{padding:11px;} } /* opera */ @media all and (-webkit-min-device-pixel-ratio:10000), not all and (-webkit-min-device-pixel-ratio:0) { .sofish{padding:11px;} } /* firefox * / @-moz-document url-prefix(){ .sofish{padding:11px;}} /* all firefox */ html>/**/body .sofish, x:-moz-any-link, x:default { padding:11px; } /* newest firefox */

**准完美主义写法：**配合IE注释，一律采用选择器HACK（选择性推荐）

 HTML: 添加body class

 .sofish{padding:10px;} .non-ie .sofish{padding:12px;} .ie9 .sofish{padding:9px;} .ie8 .sofish{padding:8px;} .ie7 .sofish{padding:7px;} .ie6 .sofish{padding:6px;} /* webkit and opera */ @media all and (min-width: 0px){ .sofish{padding:11px;} } /* webkit */ @media screen and (-webkit-min-device-pixel-ratio:0){ .sofish{padding:11px;} } /* opera */ @media all and (-webkit-min-device-pixel-ratio:10000), not all and (-webkit-min-device-pixel-ratio:0) { .sofish{padding:11px;} } /* firefox * / @-moz-document url-prefix(){ .sofish{padding:11px;}} /* all firefox */ html>/**/body .sofish, x:-moz-any-link, x:default { padding:11px; } /* newest firefox */

### 六：全面的IE6+ / Firefox / Webkit / Opera CSS HACK列表：

 /***** Selector Hacks ******/ /* IE6 and below */ * html #uno { color: red } /* IE7 */ *:first-child+html #dos { color: red } /* IE7, FF, Saf, Opera */ html>body #tres { color: red } /* IE8, FF, Saf, Opera (Everything but IE 6,7) */ html>/**/body #cuatro { color: red } /* Opera 9.27 and below, safari 2 */ html:first-child #cinco { color: red } /* Safari 2-3 */ html[xmlns*=""] body:last-child #seis { color: red } /* safari 3+, chrome 1+, opera9+, ff 3.5+ */ body:nth-of-type(1) #siete { color: red } /* safari 3+, chrome 1+, opera9+, ff 3.5+ */ body:first-of-type #ocho { color: red } /* saf3+, chrome1+ */ @media screen and (-webkit-min-device-pixel-ratio:0) { #diez { color: red } } /* iPhone / mobile webkit */ @media screen and (max-device-width: 480px) { #veintiseis { color: red } } /* Safari 2 - 3.1 */ html[xmlns*=""]:root #trece { color: red } /* Safari 2 - 3.1, Opera 9.25 */ *|html[xmlns*=""] #catorce { color: red } /* Everything but IE6-8 */ :root *> #quince { color: red } /* IE7 */ *+html #dieciocho { color: red } /* Firefox only. 1+ */ #veinticuatro, x:-moz-any-link { color: red } /* Firefox 3.0+ */ #veinticinco, x:-moz-any-link, x:default { color: red } /***** Attribute Hacks ******/ /* IE6 */ #once { _color: blue } /* IE6, IE7 */ #doce { *color: blue; /* or #color: blue */ } /* Everything but IE6 */ #diecisiete { color/**/: blue } /* IE6, IE7, IE8 */ #diecinueve { color: blue\9; } /* IE7, IE8 */ #veinte { color/*\**/: blue\9; } /* IE6, IE7 -- acts as an !important */ #veintesiete { color: blue !ie; } /* string after ! can be anything */

好了，转载到此结束，说下我的观点。  
 其实我个人比较推荐准完美的方法，因为给body添加了额外的浏览器表示的class之后，在css里面给特定浏览器添加样式就很方便了，而且比较容易通过W3C的验证。当然，虽然不是说写CSS就是为了通过验证，但这不失为一个比较不错的办法，也不用太纠结于到底该用哪个CSS Hack。

 (567)


