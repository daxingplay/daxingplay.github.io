+++
author = "daxingplay"
categories = ["hostmonster", "独立IP", "虚拟主机"]
date = 2011-02-19T14:59:56Z
description = ""
draft = false
slug = "hostmonster-dedicated-ip-outband-change"
tags = ["hostmonster", "独立IP", "虚拟主机"]
title = "Hostmonster向所有独立IP用户发出IP变更通知"
aliases = [
    "/hostmonster-dedicated-ip-outband-change/"
]
+++


相信很多[Hostmonster](http://www.hostmonster.com/track/daxingplay)的独立IP用户和我一样，已经在几天前或者最近收到了HM关于IP变更的邮件，大体内容如下：

> HostMonster.Com customer,   
>  HostMonster.Com is making a minor change to accounts with a   
>  dedicated IP address. This change will affect all customers making   
>  outbound connections from their account.   
>  Previously outbound connections came from the shared IP address of   
>  the server (此处省略我的共享IP). This IP was provided for whitelisting   
>  to other HostMonster.Com accounts, third party hosting   
>  companies and credit card processing services.   
>  Beginning Feburary 22th, 2011 at 2 PM MST, all outbound connections   
>  will come from your account’s dedicated IP address (此处省略我的独立IP).   
>  Please provide this IP to any services that require whitelisted IP   
>  addresses.   
>  These changes are a reflection of HostMonster.Com’s   
>  continued devotion to security, privacy and stability. Please   
>  call us toll-free at (866) 573-4678 if you have   
>  any questions, our world-class Support will be happy to help.

很多人看不懂这是什么意思。我给大家解释一下：

1、首先，这封邮件是针对所有独立IP用户发出的，没有购买独立IP的用户没有任何改变；

2、这个改变的意思是将你的站点向外网POST数据的方式绑定到你的独立IP上，原来是直接绑定在你的共享IP上。

### 这个改变对我的网站有什么影响

这个改变不会影响到你网站的任何访问，也没有给你更换IP，也没有给你换服务器，相反，他是一个很好的改变。很多站长使用被qiang过的HM主机是无法连接Discuz的漫游服务的，也无法使用腾讯微博、新浪微博等的登录验证，**<span style="color: #ff0000;">经过这个改变之后，在美国西部时间2月22日下午2点之后，你的网站就可以正常连接国内的API服务了！</span>**具体的分析请看本站的另一篇文章：[传送门](https://daxingplay.me/website/sharedhosting/hostmonster-discuz-manyou.html)

所以你不用担心，相反很多美国虚拟主机商是不会给你做这种改变的，而Hostmonster做的很好，愿意为你做这种大规模的change，并且不会影响到你网站的访问。

### **<span style="color: #ff0000;">结果</span>**

几天后，我于北京时间2011年2月23日上午10点测试，发现我的网站橘汁仙剑网（独立IP，共享IP被墙）已经可以正常访问Manyou服务了！并且在SSH中也可以Wget国内文件了！相当于外部链接outband connection已经完全正常了！再次感谢Hostmonster做出的改变~！

 (547)


