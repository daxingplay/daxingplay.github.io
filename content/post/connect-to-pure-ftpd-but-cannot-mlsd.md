+++
author = "daxingplay"
categories = ["CentOS", "ftp", "pure-ftpd"]
date = 2010-08-25T15:33:47Z
description = ""
draft = false
slug = "connect-to-pure-ftpd-but-cannot-mlsd"
tags = ["CentOS", "ftp", "pure-ftpd"]
title = "连接pure-ftpd服务端时MLSD无法列出目录的解决办法"
aliases = [
    "/connect-to-pure-ftpd-but-cannot-mlsd/"
]
+++


前几天在[CentOS里面安装了pure-ftpd](https://daxingplay.me/study/centos/centos-5-64-install-and-config-pureftpd.html)作为FTP服务端。结果今天用FileZilla进行连接的时候（使用的是被动连接PASV模式）发现停在MLSD命令处，然后显示无法列出目录的错误。经过一番研究，找到了解决办法。

这个问题的原因是：pure-ftpd和CentOS防火墙iptables配置有问题。

首先看pure-ftpd的配置，vi打开conf文件，找到下面的一行，取消注释，修改pure-ftpd被动连接的端口。

PassivePortRange          30000 50000

然后保存退出，重启pure-ftpd服务。

再运行下面的命令在防火墙中打开上述PASV端口。

 iptables -I INPUT 2 -p tcp --dport 30000:50000 -j ACCEPT iptables -I INPUT 2 -p udp --dport 30000:50000 -j ACCEPT

然后运行一下iptables -L查看一下FTP端口是否打开，如果没打开，运行下面的命令：

 iptables -I INPUT 2 -p tcp --dport 21 -j ACCEPT iptables -I INPUT 2 -p udp --dport 21 -j ACCEPT

好了，再用客户端连接一下看看吧。

 (2451)


