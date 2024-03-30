+++
author = "daxingplay"
categories = ["plugin", "wordpress"]
date = 2010-07-02T14:55:32Z
description = ""
draft = false
slug = "google-syntax-highlighter-break-w3c-strict"
tags = ["plugin", "wordpress"]
title = "Google Syntax Highlighter造成页面无法通过W3C验证问题"
aliases = [
    "/google-syntax-highlighter-break-w3c-strict/"
]
+++


由于博客中需要添加一些代码，比如PHP、CSS等，所以必须使用一些代码高亮和显示的插件，我找了找，发现Google Syntax Highlighter算是比较好用而且在本博客中显示正常的插件。所以安装之。

安装完之后，无意间让W3C检查了一下，竟然发现10多处的错误！

于是，决定一定要查清缘由，解决之…

仔细看了看，有一处是：

> Line 288, Column 1: character data is not allowed here  
>  ﻿

这一处后来解决了，是因为我的footer.php文件用的是GBK，改成UTF-8编码即可正常解决，顺便也解决了博客下边凭空冒出一个间隙的状况。

第二处是

> Line 294, Column 15: there is no attribute “class”  
> <script class="javascript" src="https://daxingplay.me/wp-content/plugins/goo… </blockquote">// <![CDATA[
> 这个明显是Google Syntax Highlighter插件的问题了，因为这个显示的是插件插入主题中的一段代码，意思是script标签在XHTML Strict 1.0中是没有class属性的。在wp后台编辑Google Syntax Highlighter插件，改动主文件，将其中的class="javascript"全部删除即可。
> 
> 第三处之后是
> 
> 
> <blockquote>
> Line 294, Column 121: required attribute "type" not specified
> …g.com/wp-content/plugins/google-syntax-highlighter/Scripts/shCore.js">
> // ]]></script>

我仔细看了下插件的源代码，发现它是在主题底部插入所有的代码显示的JS文件，比如shBrushCss.js这个文件就是控制CSS代码显示的（如果你的博客永远不会涉及一些代码显示，比如delphi，就可以修改插件主程序把这一行去掉，加快页面显示速度），主要是标示代码高亮用。说这些script标记缺少type属性，同样，在wp后台编辑插件主文件，在每个js的script标记中加入type=”text/javascript”这个属性声明即可。

终于，再一次提交w3c验证，终于看到了passed的标志，爽。

不过，还是发现，有代码的页面还是有问题，这个就是没办法的了，毕竟和插件有关系，而且和pre标记也有关系。其它页面都是能够正常passed。毕竟，做前端不能过分地追求一定要pass W3C的验证，通过了只能说明你的页面没有语法错误，能否做到语义化等还是要靠自己去体会。

好了，最后，还是再次庆祝下，自己的主题再次通过W3C XHTML Strict 1.0的验证。



