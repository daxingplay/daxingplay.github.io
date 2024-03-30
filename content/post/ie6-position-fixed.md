+++
author = "daxingplay"
categories = ["CSS", "IE6", "绝对定位"]
date = 2010-09-22T00:22:05Z
description = ""
draft = false
slug = "ie6-position-fixed"
tags = ["CSS", "IE6", "绝对定位"]
title = "IE6不支持Position:fixed的解决办法"
aliases = [
    "/ie6-position-fixed/"
]
+++


今天修改网站模板的时候遇到的问题，经过搜索和研究总结一下。

方法一：

 html{overflow:hidden;} body{height:100%;overflow:auto;} #fixed {position:absolute;right:30px;top50px;}

这个方法有一个bug未解决：在IE6下会把所有position:absolute都变成“浮动”的元素；还有使用js方法滚动滚动条时会出现对象闪烁的现象。所以如果页面里面只有一个绝对定位的话，这样做米啥问题。另外，在!DOCTYPE 声明是XHTML1.0 Strict或者是XHTML1.1时，有的人喜欢在声明前面加上XML Prolog(如：<?xml version="1.0" encoding="utf-8"??>
)，但此时IE7以下都处于Quirks（兼容）模式，所以上述针对IE6的Hack失效，显然适应性不是很强。

方法二：

针对IE6，为要固定的元素添加一个CSS表达式。你不可以直接使用该表达式，因为它可能会因为缓存而不更新。解决这一点的最简单的方式是使用eval包裹你的语句。比如：

 top:expression(eval(document.documentElement.scrollTop));

但是单纯地这样做也有问题。在IE6下滚动屏幕的时候，会发现固定的元素有很明显的闪烁振动现象。这是因为IE有一个多步的渲染进程。当你滚动或调整你的浏览器大小的时候，它将重置所有内容并重画页面，这个时候它就会重新处理css表达式。这会引起一个丑陋的“振动”bug，在此处固定位置的元素需要调整以跟上你的(页面的)滚动，于是就会“跳动”。

解决此问题的技巧就是使用background-attachment:fixed为body或html元素添加一个background-image（如果你的body定义了背景图片，就可以把把这句CSS Hack加到html里面，反之亦然）。这就会强制页面在重画之前先处理CSS。因为是在重画之前处理CSS，它也就会同样在重画之前首先处理你的CSS表达式。这将让你实现完美的平滑的固定位置元素！为了不增加额外的HTTP Request，我们可以使用about:blank作为这个背景图片。

 /*让position:fixed在IE6下可用! */ .fixed-top /* 头部固定 */{position:fixed;bottom:auto;top:0px;} .fixed-bottom /* 底部固定 */{position:fixed;bottom:0px;top:auto;} .fixed-left /* 左侧固定 */{position:fixed;right:auto;left:0px;} .fixed-right /* 右侧固定 */{position:fixed;right:0px;left:auto;} /* 上面的是除了IE6的主流浏览器通用的方法 */ /* 修正IE6振动bug */ * html,* html body {background-image:url(about:blank);background-attachment:fixed;} /* IE6 头部固定 */ * html .fixed-top {position:absolute;bottom:auto;top:expression(eval(document.documentElement.scrollTop));} /* IE6 右侧固定 */ * html .fixed-right { position:absolute; right:auto; left:expression(eval(document.documentElement.scrollLeft+document.documentElement.clientWidth-this.offsetWidth)-(parseInt(this.currentStyle.marginLeft,10)||0)-(parseInt(this.currentStyle.marginRight,10)||0)); } /* IE6 底部固定 */ * html .fixed-bottom { position:absolute; bottom:auto; top:expression(eval(document.documentElement.scrollTop+document.documentElement.clientHeight-this.offsetHeight-(parseInt(this.currentStyle.marginTop,10)||0)-(parseInt(this.currentStyle.marginBottom,10)||0)));} /* IE6 左侧固定 */ * html .fixed-left { position:absolute; right:auto; left:expression(eval(document.documentElement.scrollLeft)); }

对比两个纯粹的CSS hack发现，两个原理似乎相同，在于html元素和body元素的应用和对CSS的{position:fixed}的支持程度上，但是这实际上是一种Hack，基本上不具备通用性，知道这个方法就可以了。需要提醒的是IE6 standards-compliant模式下HTML元素不管给它设置什么样的高度和宽度，它的大小都始终充满整个浏览器的可视区域，而IE5 以及 Quirks 模式下html元素和body元素所有宽高设置都会被忽略而保持充满浏览器的可视区域，更多内容请看[《IE 中的 html 元素》](http://old9.blogsome.com/2007/03/14/html-element-in-ie/)



