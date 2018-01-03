+++
author = "daxingplay"
categories = ["Discuz", "Marco", "风格"]
date = 2010-09-12T18:50:00Z
description = ""
draft = false
slug = "my3talk-discuzx1-style"
tags = ["Discuz", "Marco", "风格"]
title = "[DiscuzX1风格]My3Talk社区"
aliases = [
    "/my3talk-discuzx1-style/"
]
+++


这是最近的一款已经上线使用的作品。是给一个比较有名的香港地方论坛[My3Talk](http://www.my3talk.com)社区制作的。这个社区面向的对象主要是香港人，所以我进去之后很多话都看不懂…郁闷。

主要的任务是

- 将原来该社区的Discuz 7.2风格升级为DiscuzX1风格
- 增加论坛首页直排美化
- 增加论坛首页N格

程序部分的修改主要是该社区的负责人、同时也是DSU Team的插件开发者Marco完成。我负责所有的界面部分。

一下是完成的效果图。

[![](https://img2.ojcdn.com/daxingplay/2010/09/My-3Talk-討論區-_-您的自由、免費、討論的好地方-Powered-by-Discuz-553x1024.jpg "My 3Talk 討論區 _ 您的自由、免費、討論的好地方 - Powered by Discuz!")](https://img2.ojcdn.com/daxingplay/2010/09/My-3Talk-討論區-_-您的自由、免費、討論的好地方-Powered-by-Discuz.jpg)

里面一些看不到的地方是因为使用了Facebook等一些被封网站的服务，在国内看不到，但对于这个香港地方论坛来说，用户基本上是看得到的，我没法截图，请大家见谅。

[![](https://img2.ojcdn.com/daxingplay/2010/09/-橘子-My-3Talk-討論區-_-您的自由、免費、討論的好地方-Powered-by-Discuz-814x1024.jpg "動態 - 橘子- My 3Talk 討論區")](https://img2.ojcdn.com/daxingplay/2010/09/-橘子-My-3Talk-討論區-_-您的自由、免費、討論的好地方-Powered-by-Discuz-e1285351153143.jpg)

其它页面由于我上传的时候有问题，稍候提供。

其实本套风格重点在于论坛页面的制作。以为上述要求中主要是集中在论坛的首页。

其它的呢，相对修改较大的地方是页头和页脚。

在DiscuzX1中，是使用JS实现的下拉菜单，而该菜单是靠JS进行定位，这个定位是基于浏览器边缘而不是某个DIV的边缘。于是在该风格的制作过程中，想要使主导航居右的话，是不能使用position这种绝对定位的方法的，否则下拉菜单会偏移一定的地方。经过测试发现，偏移的距离是一样的，那为啥不用margin负边距强行拉回来呢？是因为在浏览器resize的时候，这个便宜的距离会再次改变。所以除了改JS，才能解决根本问题，但是为了网站程序升级方便，我还是研究出了用css实现的办法。

原理也很简单。因为导航ul外层有个div nv，所以我让#nv居中，宽度和头部宽度一样970px。然后让ul居右。但是这样的话，就会使导航有下移的感觉，解决办法也很简单，对#nv使用margin-top负边距即可。

所以灵活运用负边距还是很有效的。记得看过一篇文章说，css大师的技能之一就是灵活使用负边距。呵呵，当然我还有一定距离。

