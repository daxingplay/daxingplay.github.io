+++
author = "daxingplay"
categories = ["hostmonster", "Manyou", "漫游", "虚拟主机"]
date = 2011-02-17T14:08:46Z
description = ""
draft = false
slug = "hostmonster-discuz-manyou"
tags = ["hostmonster", "Manyou", "漫游", "虚拟主机"]
title = "HostMonster支持Discuz漫游Manyou服务"
aliases = [
    "/hostmonster-discuz-manyou/"
]
+++


呃，标题有些错误了。其实[Hostmonster](http://www.hostmonster.com/track/daxingplay "Hostmonster著名美国主机商")的空间本来就支持开启Discuz的Manyou服务。而且你不需要任何配置就可以，[Bluehost](http://www.bluehost.com/track/daxingplay "BlueHost美国著名提供商")、Hostgator、[LunarPages](http://www.lunarpages.com/id/daxingplay "LunarPages")等知名国外空间商也都是支持的。但是为什么有这么多人开启不了而显示Empty Response (ERRCODE:111)的错误呢？

我的网站橘汁仙剑网也是在[Hostmonster](http://www.hostmonster.com/track/daxingplay "Hostmonster著名美国主机商")上的。也是一直开启不了Manyou应用。为此我也费了不少脑筋，也咨询了[Hostmonster](http://www.hostmonster.com/track/daxingplay "Hostmonster著名美国主机商")的客服。但是都是无功而返。Discuz官方对这个错误的解决办法是：

### 问题原因

您网站的服务器，无法访问 Manyou 服务器。

### 测试方法

下载附件中的程序在 UCenter Home 根目录运行，测试您的服务器是否可以链接到 Manyou。[manyoutest.zip](http://faq.comsenz.com/batch.download.php?aid=1796)

如果站长的服务器没法访问漫游服务器，即manyoutest.php显示无法链接到漫游，那么可能有如下几种常见情况：   
 1、网站服务器防火墙的问题，防火墙不允许向外网post数据，或者根本就不允许post数据       
 解决方法：暂时关闭防火墙。或者告诉空间商，您的服务器无法向外网post数据，能否做调整，如果不能调整，只能更换服务器。   
 2、网络因素，常见于国外虚拟主机        
 解决方法：更换服务器   
 3、MYOP的IP地址填写错误   
 解决方法：请重新填写    打开UCH的管理后台，点击“站点设置”，找到“MYOP的IP”，这里默认是留空的，如果您网站链接不到漫游，请尝试在此填写 124.238.249.8 或者  221.194.139.132  （两者选一，请指定一个速度较快的即可）

这几种方法我都已经在自己的主机上测试过了。对于第1种解决办法，在[Hostmonster](http://www.hostmonster.com/track/daxingplay "Hostmonster著名美国主机商")和[Bluehost](http://www.bluehost.com/track/daxingplay "BlueHost美国著名提供商")等知名主机上根本不存在这个问题的。他们的服务器都是允许向外网POST数据的，不信的朋友可以拿Twitter或者Facebook的API来测试。第二种相当于没说；第三种我也尝试填写了，仍旧无效。

这种情况已经持续2年多了。回忆自己用HM的经历，也就一次因为共享IP被墙买了独立IP，一直没出现过问题。难道是因为共享IP被墙的缘故？可是我有独立IP啊，而且独立IP访问还很正常。

但是我自己在SSH里面wget国内服务器的文件，或者是Traceroute国内的某一个网站，都是在进入国内的节点断掉。现在让我们来仔细分享一下连不上manyou的原因。

### 究竟为何连不上漫游

想使用漫游服务，必须要向Manyou的API服务发送（POST）一些数据，我没仔细看代码，但是感觉至少应该是你网站的域名等信息，发送过去之后，漫游服务器会在自己的数据库中记录下你的站点信息和你的会员使用应用的情况。所以，如果你的站点没法向漫游的API服务器POST数据的话，那自然没法开通漫游服务。

让我们具体用traceroute命令跟踪一下：

[![](https://img2.ojcdn.com/daxingplay/2011/02/1.jpg "1")](https://daxingplay.me/website/sharedhosting/hostmonster-discuz-manyou.html/attachment/1)

可以看出，在202.97.50.73这个地方断掉，去查一下这个ip，发现是电信骨干网。而前面的几个节点，很明显都是美国的节点。

为了进一步验证，我又跟踪了几个国内的网站，比如百度、新浪等，结果不谋而合。

[![](https://img2.ojcdn.com/daxingplay/2011/02/2.jpg "2")](https://daxingplay.me/website/sharedhosting/hostmonster-discuz-manyou.html/attachment/2)

很明显，在**每次**进入国内骨干网的情况下断掉，是墙的缘故。所以我得出了一个结论：

**<span style="color: #ff0000;">对于绝大多数国外虚拟空间服务商，只要你共享IP被墙，即使买了独立IP也是无法连接国内的Manyou服务的（同时包括腾讯微博、新浪微博等需要登录授权的API服务）</span>**，不论是HM、BH、HG还是LP、GD这些，都是这样的。这主要是因为在虚拟主机的环境中，绝大多数服务商都是将网站外出的流量outbound connection绑定到了共享IP上，一旦共享IP被封，那网站就无法向国内网站POST数据了。那大家就会问了，为什么虚拟主机商不把你的outbound connection绑定到独立IP上呢？很简单，主要是方便管理。一般一台服务器上有这么多网站，但只有一个共享IP，服务商只要把这个共享IP提交到其他提供商或者Visa管理机构（用于付款等）的白名单就行了，这样省了不少麻烦（据我了解的是这样）。如果一个独立IP一个独立IP地提交，必然很麻烦，管理起来也不是特别方便。而且这些也不是由于主机商造成的。共享IP被屏蔽理论上他们没有任何责任。而且HM对内容也有限制，但是人家也明确表明了他们认为言论自由的态度，在美国绝大多数主机商也是持同样的观点。要怪也只能怪。。呵呵，你懂得。

### 终极解决办法

那如何解决呢？显然，让空间商把你的outbound connection和你的独立IP绑定即可。一般来说，服务商可能不愿意，那么就跟空间商协调换服务器，那这也不是一个万全之策。试想，一个服务器上这么多空间，保不准哪天又被墙了，尤其对于[Hostmonster](http://www.hostmonster.com/track/daxingplay "Hostmonster著名美国主机商")这种国人较多的服务商。要么就是自己买个VPS或者独立服务器，但明显价格又要高很多，很多刚建站的朋友一下子也拿不出来那么多钱。

经过我和[Hostmonster](http://www.hostmonster.com/track/daxingplay "Hostmonster著名美国主机商")客服几天以来不断地协商（前前后后十几封邮件），他们今天终于给我回复邮件了，并且他们愿意为所有的客户都实施这种改变！

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

大意是说，我的网站将在美国西部Mountain Time的2月22日下午2点之后，**<span style="color: #ff0000;">所有的outbound connection都会被绑定到我的独立IP上，在这种情况下，和漫游API服务器的通讯就不会被阻拦</span>**，这样也省去了换服务器的麻烦（因为我自己目前所在的服务器很稳定，没当过机），不知道其它使用[Hostmonster](http://www.hostmonster.com/track/daxingplay "Hostmonster著名美国主机商")独立IP的站长朋友有没有收到类似的邮件。如果收到了，说明你也会有这样的好事~

我也会在那个时间测试我的网站是否正常，之后会为大家提供结果。

### 测试结果

几天后，我于北京时间2011年2月23日上午十点（即美国西部Mountain Time的2月22日晚上7点）测试网站到漫游服务器的访问，**<span style="color: #ff0000;">发现已经完全正常！</span>**在SSH里面也可以正常Wget和Traceroute国内的服务器了！

再次感谢HM对中国客户做出的这些改变！

如果您想深入地了解[Hostmonster](http://www.hostmonster.com/track/daxingplay "Hostmonster著名美国主机商")的主机，请看：

#### [美国著名虚拟空间商HostMonster介绍](https://daxingplay.me/website/sharedhosting/hostmonster-introduction.html)

