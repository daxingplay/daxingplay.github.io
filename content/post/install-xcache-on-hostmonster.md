+++
author = "daxingplay"
categories = ["bluehost", "hostmonster", "xcache"]
date = 2010-09-08T12:00:08Z
description = ""
draft = false
slug = "install-xcache-on-hostmonster"
tags = ["bluehost", "hostmonster", "xcache"]
title = "在HostMonster虚拟主机空间上安装Xcache加速PHP运行"
aliases = [
    "/install-xcache-on-hostmonster/"
]
+++


用[Hostmonster](http://www.hostmonster.com/track/daxingplay)主机有差不多3年了，确实很稳定，具体可以看我[写的介绍](https://daxingplay.me/website/sharedhosting/hostmonster-introduction.html)。

呃，又开始说废话了。现在进入主题。

最近随着网站升级到Discuz X1，并且装了一些插件，发现数据库查询次数飙升，网页执行时间也增加了不少。看X1原生态支持一些内存优化程序，memcached、Xcache、Eaccelerator。于是我也想在后台开启这些，发现都不支持。LiveChart问了一下[Hostmonster](http://www.hostmonster.com/track/daxingplay)的客服，发现他们服务器并没有安装Eaccelerator等这些优化程序。我想了想，主要是因为他们服务器为了安全，都是用的suPHP，用suPHP的时候，默认是不能使用eAccelerator和Xcache的。必须要用php的fast-cgi模式才行。而且并不是服务器上的每个账户都想用fast-cgi模式跑网站，所以他们没装。

很诧异的是，他们的Technical Support竟然给我发了一封邮件，说是已经给我的账户单独装了eAccelerator，只要启用php的fast-cgi模式就可以用。我ssh登录之后发现，果然给我装了eAccelerator。我切换到了php fast-cgi，发现DZ后台还是显示不支持eAccelerator。我到官方论坛上搜了一下，发现DZ对eAccelerator的支持并不是很好，很多人都有问题，主要是在安装eAccelerator的时候要加一个参数，DZ才可以用。而且有人还说eAccelerator不能太新，因为最新的0.9.6.1去掉了一些支持项，导致DZ不能支持。我一看，[Hostmonster](http://www.hostmonster.com/track/daxingplay)客服正是给我装的最新版的eAccelerator。好吧，我放弃了，我用用Xcache试一试，据说是国人开发的，而且DZ官方演示站discuz.org也是用的Xcache。

在官方网站上了看了[wiki](http://xcache.lighttpd.net/wiki/)，把安装过程给大家分享一下。

首先要有登录ssh的权限，可以直接到cpanel里面的ssh，提交自己的身份证照片，很快他们就会给你开通。

开通好之后，登录ssh，依次运行下面的命令：

cd ~ mkdir modules xcache cd xcache wget http://xcache.lighttpd.net/pub/Releases/1.3.0/xcache-1.3.0.tar.gz tar -zxf xcache-1.3.0.tar.gz cd xcache-1.3.0 phpize ./configure --enable-xcache make cd modules mv xcache.so /home/这里替换为你的账户名/modules

接下来找到你的站点根目录下的php.ini文件，如果米有的话，自己到cpanel后台，进入php config，点击install php master file，安装一份默认的php.ini.default到网站根目录下（public_html），将其重命名为php.ini即可。

然后编辑php.ini文件，vi也行，下载到本地编辑也行，但不要用记事本。

找到最后的zend_extension=/usr/lib64/php/zend/ZendOptimizer-5.2.so（不同的主机可能不太一样，但是记得xcache这段一定加在其他zend_extension的上面，否则不能用）在上面加入：

zend_extension = /home/你的账户名/modules/xcache.so zend_extension_ts = /home/你的账户名/modules/xcache.so xcache.shm_scheme = "mmap" xcache.size = 32M xcache.count = 8 xcache.slots = 8K xcache.ttl = 0 xcache.gc_interval = 0 xcache.var_size = 16M xcache.var_count = 1 xcache.var_slots = 8K xcache.var_ttl = 0 xcache.var_maxttl = 0 xcache.var_gc_interval = 300 xcache.test = Off xcache.readonly_protection = Off xcache.mmap_path = "/dev/zero" xcache.coredump_directory = "" xcache.cacher = On xcache.stat = On xcache.optimizer = Off xcache.coverager = Off xcache.coveragedump_directory = ""

接下来编辑根目录下的.htaccess文件，在最前面加入下面的语句，如果有其他的php handler，记得注释掉。当然你也可以到cpanel里面进入php config，将php运行模式选为fast-cgi。

AddHandler fcgid-script php cgi fcgi

好了，在ssh里面运行一下php -v，看看是不是出现了xcache的信息呢？如果出现了，标明您已经正确配置好了。这时候，在DZ后台就可以看到支持xcache了，当然要打开了。呵呵。

xcache还有一个特色功能，提供一个web的管理界面。接下来我教大家如何安装xcache官方的web管理界面，从里面就可以看到xcache目前运行的状况，缓存了哪些php文件，还可以手动清空缓存，很实用的哦。

还是在ssh里面，进入我们刚才下载并且编译的xcache目录：

cd ~/xcache

上面的命令是进入xcache目录，然后将xcache的管理目录admin拷贝到你的网站根目录下。目录名等可以根据自己的需要更改。

进入网站根目录，新建一个php文件（不要和其他相同），命令如下：

vi xcachepass.php

这一步也可以在你自己的本地电脑环境完成，然后在里面输入下面的语句。

echo md5("password");

这里的意思是用md5给你的密码进行加密，把里面的password修改为自己需要的密码。运行该php后记录下这段加密后的密码。然后将该文件删除。

修改网站根目录下的php.ini文件，在刚才我们添加的xcache配置信息的后面加入：

xcache.admin.user = "你的账户名" xcache.admin.pass = "刚才加密过的密码"

注意将xcache.admin.pass后面的值替换为刚才生成的密码。

好了，保存，在网址里面输入xcache的管理地址吧，就会看到弹出一个登陆框，用刚才配置的账户名和密码（加密之前的）登录，就可以看到xcache的管理界面了！

进去之后就可以看到Xcache的一些统计信息了，具体大家可以自己琢磨下，很好懂的。安装好之后，确实发现网站速度提升了很多，页面解析速度变快了，最明显的就是页面执行时间由普通的0.1s下降到0.01~0.04秒之间，这个几乎是200%~1000%的速度提升呀！具体欢迎看看[橘汁仙剑网](http://www.ojpal.com)。在页面最右下角有页面执行速度的显示。

 (6903)


