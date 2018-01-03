+++
author = "daxingplay"
categories = ["plugin", "wordpress"]
date = 2010-08-10T10:47:34Z
description = ""
draft = false
slug = "use-easy-google-syntax-highlighter"
tags = ["plugin", "wordpress"]
title = "新的代码高亮插件：easy-google-syntax-highlighter"
aliases = [
    "/use-easy-google-syntax-highlighter/"
]
+++


换了好几个代码高亮的插件，今天终于找到一个比较顺手的，那就是：easy-google-syntax-highlighter。

这个插件的特点是基于google-syntax-highlighter，但是有配置项目，可以设定你需要使用哪些语言，以及brush*.js的插入方式，对网站优化来说这些设置是必不可少的。

而且这个插件的语法也比较简单，且不会和wp自带的编辑器冲突。

 ＜pre class="brush:html;"＞这里自己插入代码哦，＜/pre＞

支持的语言如下：

 $brushes = array('shBrushAS3.js' => array('as3', 'actionscript3'), 'shBrushBash.js' => array('bash', 'shell'), 'shBrushCSharp.js' => array('c-sharp', 'csharp'), 'shBrushCpp.js' => array('cpp', 'c'), 'shBrushCss.js' => array('css'), 'shBrushDelphi.js' => array('delphi', 'pas', 'pascal'), 'shBrushDiff.js' => array('diff', 'patch'), 'shBrushGroovy.js' => array('groovy'), 'shBrushJScript.js' => array('js', 'jscript', 'javascript'), 'shBrushJava.js' => array('java'), 'shBrushJavaFX.js' => array('jfx', 'javafx'), 'shBrushPerl.js' => array('perl', 'pl'), 'shBrushPhp.js' => array('php'), 'shBrushPlain.js' => array('plain', 'text'), 'shBrushPowerShell.js' => array('ps', 'powershell'), 'shBrushPython.js' => array('py', 'python'), 'shBrushRuby.js' => array('rails', 'ror', 'ruby'), 'shBrushScala.js' => array('scala'), 'shBrushSql.js' => array('sql'), 'shBrushVb.js' => array('vb', 'vbnet'), 'shBrushXml.js' => array('xml', 'xhtml', 'xslt', 'html', 'xhtml'));

只要使用上面数组中定义的关键字即可。

 (1242)


