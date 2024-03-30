+++
author = "daxingplay"
categories = ["DreamHost", "hostmonster", "博客"]
date = 2010-11-21T18:02:28Z
description = ""
draft = false
slug = "blog-to-dreamhost"
tags = ["DreamHost", "hostmonster", "博客"]
title = "博客搬到DreamHost了"
aliases = [
    "/blog-to-dreamhost/"
]
+++


其实我本来是不打算搬的，在[HostMonster](http://www.hostmonster.com/track/daxingplay "美国著名虚拟主机提供商HostMonster")上好好的，而且还有独立的IP。一个小博客也不会给[我的站点](http://www.ojpal.com)带来多大的CPU负担。原因其实也不是神马很正当的原因，只是因为我需要一个演示站，给别人做东西的时候演示用的。以前也有，是放在我的一个VPS上的，可惜VPS内存太小，跑演示站的论坛有些吃力，必须要关掉suPHP才能跑起来，我一向是要给VPS配suPHP的，原因很简单，因为我懒得上传完一个站点后还一个一个地去修改权限，只是想上传完之后直接可以用。但是128M的小内存VPS跑suPHP再跑论坛确实吃力了不少，我也不喜欢用Nginx跑PHP，确实不如apache效率高。

总之，也许是临时决定，先搬到DreamHost上再说。反正DH是我花9刀买的一年的那种（777优惠码），不用就浪费了。

一开始是想把博客还是放在[HostMonster](http://www.hostmonster.com/track/daxingplay "美国著名虚拟主机提供商HostMonster")上，毕竟[Hostmonster](http://www.hostmonster.com/track/daxingplay "美国著名虚拟主机提供商HostMonster")各个方面我都很喜欢，而且灰常灰常稳定。但是可恶的DreamHost绑定主域名或者子域名的时候必须把主域名的DNS指向到他们的DNS服务器上，所以我把主站放在[HostMonster](http://www.hostmonster.com/track/daxingplay "美国著名虚拟主机提供商HostMonster")上的愿望就破灭了（其实也未尝不可以，只是太麻烦，我觉得还不如一起搬过去更快些。）

现在再想想都有些后悔了，说不定哪天我又搬回[HostMonster](http://www.hostmonster.com/track/daxingplay "美国著名虚拟主机提供商HostMonster")了。

不过折腾了一个下午，说说我用DreamHost的感受。

其实DreamHost还是很不错的，虽然他们不像[HostMonster](http://www.hostmonster.com/track/daxingplay "美国著名虚拟主机提供商HostMonster")那样用的是Cpanel的主机面板，但是他们自己开发的面板还是有很多功能很赞。

1、我发现貌似DreamHost的虚拟主机，每添加一个站点，这个新添加的站点的IP和原来的站点的IP是不一样的，但是同一个主域名，子域名的站点是和主域名一个IP的。难道DreamHost的虚拟主机都是类似于那种云主机的么？还是？反正觉得这样相当于Cpanel面板来说（一个虚拟主机账号只能有一个IP，无论添加多少个主域名都是在同一个IP下），DreamHost这种形式很利于做站群（虽然我不是干这个的），而且不同IP下的也可以互相外链，呵呵。

2、DreamHost可以给添加新账户，每个账户都可以设置独立的权限和文件夹。这样一些人就可以拿来倒卖了。比如我的主账户下，还可以添加user1、user2……，有的账户我可以只设置为FTP账号，有的账户我可以允许他使用SSH登录等。每个账户还可以设置单独的用户文件夹，当然也可以用一个。这样，每个账户的网站都是独立的了，互相看不到对方的站点。这个功能我觉得超级赞的。

3、DreamHost很喜欢尝试一些新的东西。比如Google最近才出来的一个Apache网站优化模块PageSpeed，DreamHost就给他的虚拟主机装上了。你添加站点的时候可以选择是否使用这个模块，相对于其它虚拟主机不能自己装Apache模块的来说，这样的功能确实很方便，更何况自己可以自由开关。

4、DreamHost添加数据库的时候可以自定义数据库名，虽然HostMonster也可以，但是HM自动加了一个主域的前缀。

5、DreamHost可以添加SVN站点，这个确实在虚拟主机中很少见。

当然，DreamHost还有一些我觉得不如HM好的。比如：

1、DH没有HM那样的域名DNS管理面板。HM的域名管理面板超级赞的，可以更改任意类型的记录，他里面也会给你列出你域名的所有记录，甚至还可以添加一些不常用的记录，比如TXT、S神马R之类的，堪比任意一家国际知名的域名注册机构的管理面板。说到这儿，不禁要嘲笑下国内的域名注册机构，域名管理面板不但只能添加A、CNAME这样三四个种类的记录，而且还限制最多的记录数。唉。

2、DH的面板感觉有些功能找起来很麻烦，归类不是很清楚。

3、前面说的，要想添加站点必须把主域名的DNS服务器改为DH的，这点让我很是不爽。HM这点就做的很好，添加其他站点，可以只把IP解析过来，甚至可以只需要在网站里面上传一个文件验证一下域名的所有权就行，对于那些不想改DNS或者改解析快速迁移站点的站长来说，实在是太方便了。

总之，DH和HM作为美国前十的虚拟主机商，主机的服务、稳定、速度自然是不用多说，每一家也都有每一家的特点和长处。正好用了777优惠码买了一年，不如先用个一年，好的话，续费就是（虽然续费要原价了）。

好吧，不多说了。欢迎大家测试速度。



