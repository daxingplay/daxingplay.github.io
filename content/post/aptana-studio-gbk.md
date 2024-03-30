+++
author = "daxingplay"
categories = ["Aptana", "GBK", "中文编码", "开发工具"]
date = 2010-05-06T07:39:46Z
description = ""
draft = false
slug = "aptana-studio-gbk"
tags = ["Aptana", "GBK", "中文编码", "开发工具"]
title = "让Aptana Studio支持GBK编码的方法"
aliases = [
    "/aptana-studio-gbk/"
]
+++


Aptana Studio是我最近发现的一个很强大的Web开发工具。该工具是基于强大的Eclipse开发的。我原来喜欢用EPP（EclipsePHP Studio）进行PHP的开发，而用DW进行CSS的开发。现在，就可以通过Aptana Studio一起完成了。当然，默认的Aptana只是用来开发JS的，它对JS、Ajax、CSS有着很好的支持，并且提供代码提示和多浏览器兼容测试功能，这个对于Web前端开发的人来说实在太重要了。另外，给Aptana添加一个PHP插件即可让它支持PHP的开发，功能丝毫不逊色于EPP。

但是这两天用Aptana写PHP的时候发现，Aptana不支持GBK编码。是个很头疼的问题。后来终于找到了解决办法。

首先是要给Aptana安装一个charest的包，大家可以直接从EPP中获取。在EPP安装目录下的jre/lib文件夹下面。复制charsets.jar到aptana的jre/lib/目录中即可让Aptana拥有GBK包。然后我们进入Aptana，在菜单栏中的Windows——Preferences——General——Content Types，选择 Text ，在下方的Default Encoding指定默认编码为GBK，这样就可以让Aptana完美地支持GBK编码的中文了！



