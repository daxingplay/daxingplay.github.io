+++
author = "daxingplay"
categories = ["iframe", "流氓", "电信"]
date = 2010-08-10T10:15:51Z
description = ""
draft = false
slug = "anti-telecom-iframe"
tags = ["iframe", "流氓", "电信"]
title = "如何防止自己的网站被电信iframe"
aliases = [
    "/anti-telecom-iframe/"
]
+++


电信耍流氓不是一天两天了，竟然拿别人的网站开刀，给网站加上iframe进行弹窗广告，既影响了别人网站的形象，还导致了一些其它问题。

比如我的网站橘汁仙剑网采用的是GBK编码，而电信的iframe强制网页编码为UTF-8，这样，我的网站一旦被电信iframe，那么只要用户在网站中点击浏览器的后退链接，那么网站就会显示乱码。这对网站形象来说真是天大的打击。试想用户看到这种网页肯定不会来第二次了。

于是在网上狂搜，终于找到了合适的解决办法，并且测试有效。在网站头部加入

<script language="javascript" type="text/javascript"> 
 if (top.location !== self.location) { 
 top.location=self.location; 
 } 
</script>

即可解决。

原理是只要遇到网页被iframe框住就从里面跳出来。

 (10311)


