+++
author = "daxingplay"
categories = ["hostmonster", "Linux主机", "空间推荐", "美国主机", "虚拟主机"]
date = 2010-09-08T13:10:06Z
description = ""
draft = false
slug = "hostmonster-introduction"
tags = ["hostmonster", "Linux主机", "空间推荐", "美国主机", "虚拟主机"]
title = "美国著名虚拟空间商HostMonster介绍"
aliases = [
    "/hostmonster-introduction/"
]
+++


我用[Hostmonster](http://www.hostmonster.com/track/daxingplay)空间已经3年了。用的过程还是有不少感受的，写下来和大家分享一下。毕竟现在“出国”的站长很多，写下来给你们一些参考。

### 空间简介（Intro）

Hostmonster是美国的一家著名的Linux主机提供商，和Bluehost、FastDomain属于同一家公司，他只提供一种空间方案，所以很专业。

### 空间稳定性（Uptime）

俗话说的好，网站最重要的两个因素之一就是稳定性了。不用说，我用了3年的[Hostmonster](http://www.hostmonster.com/track/daxingplay)，稳定性不是一般的好。不可用的时间屈指可数，还都是啥升级。我印象中就这几次当机：

1. shared IP被墙。我买了独立IP就好了。LiveChart联系客服购买，立刻就生效了。
2. 系统升级（CentOS 4升级到5，用了差不多4个小时）、PHP版本升级（记得3年内升级了两次，每次3个小时左右）、Apache升级（一次，也是3个小时）等
3. 机房集体迁移了一次，中间就停了不到2小时，估计是他们wget过去的。

把上面的总共加起来，也就不到20个小时，就是说3年的使用时间，网站不能访问的时间连一天都不到（当然除去你的非法操作。比如一些500错误，可能是你错误地设置了目录权限造成的）。对于我们这种小站来说，已经是极品的虚拟主机了。

不信的话可以看我的[监控宝](http://www.jiankongbao.com/invite/x2r376)监控的数据：  
<script src="http://exp.jiankongbao.com/avai.php?t=17da4ae351634da2" type="text/javascript"></script>

这一个因素我可以给它打满分10分。

### 空间速度（Speed）

第二个重要的因素就是速度了。上面的简介说过了，[Hostmonster](http://www.hostmonster.com/track/daxingplay)、[Bluehost](http://www.bluehost.com/track/daxingplay)、Fastdomain都是同一家公司，他们的服务器也都在同一个机房。我上面的空间稳定性提到了，有一次机房的迁移，就是把所有的服务器，不管是哪个子公司的，都迁移到了同一个机房，据说是他们自己的机房。所以管理起来肯定更方便了，所有的服务器配置应该也是一样的。

机房是在犹他州的Provo这个城市，离Salt Lake（盐湖城）很近，机房是他们自己的，所以带宽什么的都控制的不错，网站大部分时间访问速度还是很不错的。当然除去个别时间一些线路抽风。虽然一般走的不是极品线路，但是总体来说，速度还是不错的。比如现在热门的he线路，但是[Hostmonster](http://www.hostmonster.com/track/daxingplay)目前来说，电信走的xo线路。结点竟然比he的还少。我自己也买过一些热门线路的vps来测速，发现其实速度差不了很多。国内访问国外，总是有瓶颈的问题。另外，热门线路有热门的好处，但是一旦热门，也表明了很多国人蜂拥而至，总的带宽是固定的，当然分到每个人的就少了很多。所以这个问题应该辩证地去看。您也可以点击[这个链接](http://exp.jiankongbao.com/load.php?host_id=2272)测试一下我们网站的速度。

### 空间配置（Features）

空间配置基本上不用说太多，无限空间和无线流量。三个子公司都是一样的，无限的子域名绑定，无限的域名停放，ssh登录等等，具体可以查看[Hostmonster](http://www.hostmonster.com/track/daxingplay)官网的介绍。

另外，我说一下我使用3年中的感受。

关于无限空间和无限流量。基本上很多美国空间商都有这个特性，但是事实上你也不可能用到这么多的空间和带宽。即使你有能耐一个月跑个1T的带宽，但是还没等你跑到那个带宽，网站就已经因为超资源而暂停了。我一个朋友做视频在线观看的，一个月2000G以上的流量，在Hostgator因为超资源经常被暂停，就搬到[Hostmonster](http://www.hostmonster.com/track/daxingplay)了，也差不多跑这么多，幸好没有事，但是再稍微多一点还是会被暂停。想比Hostgator，[Hostmonster](http://www.hostmonster.com/track/daxingplay)是自动控制CPU使用的，如果你超了使用限制，会自动throttled，下一个CPU时间段又恢复了。

这里就要说到[Hostmonster](http://www.hostmonster.com/track/daxingplay)对于资源的限制。以前我刚到[Hostmonster](http://www.hostmonster.com/track/daxingplay)的时候，[Hostmonster](http://www.hostmonster.com/track/daxingplay)的资源限制是很严格的，我那时候[网站](http://www.ojpal.com)访问量也不大，所以从没超过资源。后来，[Hostmonster](http://www.hostmonster.com/track/daxingplay)发邮件通知客户，说[Hostmonster](http://www.hostmonster.com/track/daxingplay)的资源限制策略升级，大家可以用更多的资源了，对于一些恶意使用服务器资源的会更加智能地终止。所以我现在，最高一天IP4300都没事。

[Hostmonster](http://www.hostmonster.com/track/daxingplay)对于CPU的限制的定义比较古怪，大家可以不必理会，除非你的网站很大，在[Hostmonster](http://www.hostmonster.com/track/daxingplay)跑个论坛，开几个网站，都不会有任何问题。

关于文件数量，也是最近一年才开始闹腾的。据说有一些客户的文件数过多，几十万，严重影响了服务器的性能，所以后来[Hostmonster](http://www.hostmonster.com/track/daxingplay)开始了一些限制性策略。说文件数不能超过5万。我也咨询过[Bluehost](http://www.bluehost.com/track/daxingplay)的客服，确实有这个事情，但是我这里要说的是，这个文件数量限制不是硬性的，就是在不影响服务器整体性能的情况下，文件数多一些没有任何问题的，我自己就有8万多的文件也没有任何问题，也看到过一些人10万多的文件也没有任何问题，只要不严重影响磁盘IO性能就行。[Hostmonster](http://www.hostmonster.com/track/daxingplay)在服务器上都是开启了IO监控的。所以你经常超过资源的话，他就会建议你更换到独立服务器或者是VPS上，当然他们只做虚拟空间。

基于以上的方面，[Hostmonster](http://www.hostmonster.com/track/daxingplay)对于资源的控制是很到位的，不会让一个单一的客户超过使用资源，保证了服务器上的其它客户的网站正常运行，无论对于你还是同一个服务器上的其他人来说，都是一个很好的事情。更何况，据我观察，[Hostmonster](http://www.hostmonster.com/track/daxingplay)对服务器的限制还是相对宽松的。

### 客服（Support）

客服对于一些不是很懂网站配置等的人来说还是很有必要的，[Hostmonster](http://www.hostmonster.com/track/daxingplay)、[Bluehost](http://www.bluehost.com/track/daxingplay)、Fastdomain这三家公司都提供了LiveChart，基本上相当于免费国际电话，只要你通过Livechart，不到2分钟就会有客服来回答你的问题，你的问题基本上可以在10分钟以内解决，这个是很多空间商所没有的。当然，[Hostmonster](http://www.hostmonster.com/track/daxingplay)也像其他空间商一样，提供了Tickets，没有很重要的事情可以发Tickets询问，在美国的白天时间内问基本上两个小时内会回复。

对了，忘了说，LiveChart确实是7*24小时的哦！我们中国的白天基本上是美国的夜晚，无论我什么时候发起LiveChart，他们2分钟内都有人回应，这点绝对不骗您。您可以到他们官网上试一试。

### 价格（Pricing）

关于[Hostmonster](http://www.hostmonster.com/track/daxingplay)的价格，算是虚拟主机里面价格中上的。第一年很便宜，6.95美元/月，通过[我的链接](http://www.hostmonster.com/track/daxingplay)进去，一个月只要5.95美元，并且送一个免费的COM域名。第二年开始，恢复一个月9.95美元。按年购买是有很大的优惠的，比如你按一年购买续费，8.95美元一个月，按照两年续费好像是7.95美元一个月，按3年的话是6.95美元一个月。所以多年购买和续费还是很划算的。

还有按年购买或者续费的话送免费域名（com）并永久免费（只要你用他们的空间并按年续费）。这个域名可以随时转出，同时提供免费的域名保护，Privacy Protection。

### 其他（Others）

虚拟空间嘛，其他的都没啥好说的了。我的网站共享IP（shared IP）是被封的，但是换个角度想，共享IP被封了，就不会有国人买了，我一个中国人和外国人用，他们用的资源都很少，所以我才可以文件数超5万没有任何问题。

另外，[Hostmonster](http://www.hostmonster.com/track/daxingplay)国人用的比较多，当然不排除一些做X站的，所以建议您，想正规做站的，务必购买独立IP。独立IP只能购买一次，如果独立IP都被封，[Hostmonster](http://www.hostmonster.com/track/daxingplay)是不会给你换的。

最后，如果您有其他关于[Hostmonster](http://www.hostmonster.com/track/daxingplay)的问题，随时可以像我提问，或者给我发邮件。或者如果您没有信用卡等仍旧想购买，可以联系我代购。联系方式请看本博客的[关于](https://daxingplay.me/about)页面。

给大家提供一下网站地址：[www.hostmonster.com](http://www.hostmonster.com/track/daxingplay)



