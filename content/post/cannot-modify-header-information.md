+++
author = "daxingplay"
categories = ["WordPress安装问题", "文件编码"]
date = 2010-04-24T15:08:15Z
description = ""
draft = false
slug = "cannot-modify-header-information"
tags = ["WordPress安装问题", "文件编码"]
title = "安装WordPress后出现Cannot modify header information错误的解决办法"
aliases = [
    "/cannot-modify-header-information/"
]
+++


这次建博客很不顺利，遇到了很多的问题，当然也都解决了。比如这次谈到的就是比较郁闷的一个低级错误。

刚把wp-config.php文件改好以后，上传到橘子的空间，没想到刷新页面竟然在头部出现了错误，也没管它，继续安装，正常，结果进入后台后还是有问题，以至于有些操作无法正常进行，想必很多童鞋也遇到了这个问题：

> Warning: Cannot modify header information – headers already sent by (output started at /home/*****/wp-config.php:1) in /home/****/wp-admin/install.php on line 36

后面出现的文件错误的地方不一定是一样的，但是前面都是一样的，都是wp-config.php:1。很郁闷，一开始片面地以为是php.ini设置问题，仔细检查了一遍所有的设置也没有发现问题。后来在网上找到了一些解决办法。原因很简单，“:1”标明是在那个文件最开始出现的问题。而wp-config.php是用UTF-8编码的，我当时直接使用记事本改的这个文件，由于记事本本身问题，会自动在这个文件前面加上DOM。而PHP在header输出之前是不允许有DOM出现的，所以会出现那个错误。解决办法也很简单，直接使用一些高级的语言脚本编辑工具（如EditPlus、Eclipse等）重新修改wp-config-sample.php文件即可，记得修改时候注意文件编码，确保为UTF-8即可。

 (1470)


