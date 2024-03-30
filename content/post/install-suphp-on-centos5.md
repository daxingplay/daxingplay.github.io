+++
author = "daxingplay"
categories = ["CentOS", "Linux", "PHP", "suPHP"]
date = 2010-08-21T15:41:22Z
description = ""
draft = false
slug = "install-suphp-on-centos5"
tags = ["CentOS", "Linux", "PHP", "suPHP"]
title = "在CentOS 5.x下安装和配置suPHP"
aliases = [
    "/install-suphp-on-centos5/"
]
+++


最近花了一些时间研究了CentOS，遇到了不少问题，也学到了不少东西，有机会的话慢慢分享~

### 什么是suPHP

suPHP是一个很不错的开源工具。它可以让你的PHP代码以一种安全的方式进行运行。你可以为每个虚拟主机或者站点指定一个特定的用户来运行PHP代码。而不是像PHP和Apache默认的那样运行于nobody或者apache或者root（这样是相当危险的）这些账户下。试想，一个不成熟的PHP代码运行于root帐户下，将带来多么大的安全隐患。另外，一般而言，为了外界能正常使用网站，很多目录（比如附件目录、缓存目录等）都要设置为777才能够正常写入。这样其实也是不安全的。

而suPHP正好可以解决这个问题。首先，suPHP可以指定PHP代码以哪个帐户运行。这样您就可以把一些不安全的未经测试的PHP代限制在一些并没有实际权限的用户下进行运行。另外，通过suPHP，要求写入的目录可以只设置为755，文件等设置为644就可以让外界用户正常使用网站的每一个功能了。所以，suPHP是一个增强型的安全工具。尤其对于那些空间提供商来说。

### suPHP运行的原理

PHP代码将由suPHP进行解释，然后suPHP将通过您设置好的那个帐户运行PHP解释器。

### 安装和配置

昨天尝试安装suPHP的时候还是遇到了不少问题，在网上也找了不少教程，但是都不是很具体或者根本用不起来。对于空间提供商来说，如果他们购买了一些面板，比如Cpanel、DirectAdmin等，那么安装suPHP和在Windows里面装软件没有多大的区别。但是对于我们这等米有钱的人来说，都要从头靠自己了。

#### 第一步 yum安装

确定自己的系统配置和架构，32位系统和64位系统是不能装一个包的。您可以运行uname -a查看具体的信息。我的是64位的CentOS，所以架构Arch为x86_64。如果32位的话应该是i386。

另外，本文的介绍是基于CentOS系统的。其它系统配置应该是类似的，但是文件位置和命令可能不同。

suPHP安装很简单，因为可以直接通过yum进行（发现这个方式比Windows上安装软件还简单！）。

yum -y install mod_suphp

suPHP就会自动安装，另外，安装过程中，会自动创建两个配置文件：

 /etc/suphp.conf – suPHP自己的配置文件 /etc/httpd/conf.d/suphp.conf – 是suPHP作为Apache扩展的配置文件

#### 编辑suPHP的配置文件 /etc/suphp.conf

我们需要改变一些suPHP的配置。

 webserver_user=apache

这一行是指定Apache运行的时候基于的帐户名。有的是nobody，而我的是用yum安装的最新的Apache 2.2，所以是以apache这个账户运行WebServer的。

x-httpd-php=php:/usr/bin/php

这一行很有意思，必须在等号后面的值两侧加上引号，否则suPHP无法识别。另外，还需要改为PHP命令行解释器（PHP commandline interpreter），即php-cgi。改后的为：

x-httpd-php="php:/usr/bin/php-cgi"

下面继续：

x-suphp-cgi=execute:!self

这一行也一样，加上引号：

x-suphp-cgi="execute:!self"

#### 编辑suPHP模块文件/etc/httpd/conf.d/suphp.conf

这个文件会被自动加载到Apache的配置文件httpd.conf中，因此，改变这个文件，就相当于为所有的虚拟主机用户和网站用户配置了suPHP。出于一些其它方面的考虑，可能一些用户并不需要suPHP，比如phpmyadmin的站点，如果用suPHP运行的话会造成无法登陆的情况（因为用suPHP运行的时候，是基于您已经定义的帐户进行运行，所以phpmyadmin无法将session写入系统的一个文件夹/var/lib/php/session内，造成登录失败）。

所以我就把suphp.conf这个文件的所有内容都注释掉了。或者您可以可以通过mv /etc/httpd/conf.d/suphp.conf /etc/httpd/conf.d/suphp.conf.disable的方法把该配置文件改名，不让Apache加载它。

那怎么用suPHP呢，表急，我们可以通过修改虚拟主机的conf来为每一个网站用户配置suPHP。

#### 编辑虚拟主机的配置文件

这里，我的虚拟主机配置文件放在/etc/httpd/conf.d/vhost.conf下。有的人直接把它写在了httpd.conf中，当然都可以的。单独写出来就不用每次都改httpd.conf了，主要是为了以后升级方便。

比如这里的一个虚拟主机的配置文件：

<virtualhost> ServerName packetsense.net ServerAlias www.packetsense.net DocumentRoot /home/packetsense/www/ </virtualhost>

想要这个网站运行于suPHP之下，只要在这段配置中加入下面四行就行了。

 suPHP_Engine on suPHP_UserGroup username groupname AddHandler x-httpd-php .php .php3 .php4 .php5 suPHP_AddHandler x-httpd-php

注意，username和groupname请修改为该网站的用户名和所在的用户组。

#### 最后一步 重启Apache

我们的配置就到这儿啦，重启一下Apache吧。

service httpd restart

当然，重启之前您可以运行一下测试，防止conf中出错。

service httpd configtest

好了，测试一下。

 您可以在一个配置了suPHP的网站下创建一个这样的PHP文件测试。

<?php echo "Output of the 'whoami' command:

\n";
echo exec('/usr/bin/whoami');
??>

### 常见问题

#### 500 Internal Server Error

您可以查看一下服务器的错误日志。一般而言，是由于文件的权限设置错误造成的。在本文最开始的时候，我们也提到了，suPHP只允许PHP以不高于644的权限运行，所以检查一下PHP文件的权限和所属用户组吧。

当然您可以修改suPHP的全局配置让suPHP容忍较高的文件权限等不安全的行为。

修改/etc/suphp.conf

 ; Security options allow_file_group_writeable=false allow_file_others_writeable=false allow_directory_group_writeable=false allow_directory_others_writeable=false

把这些改为true就可以了。当然我还是建议去修改文件和文件夹权限。

另外，造成服务器500错误还有可能是刚才的配置不对，检查一下suPHP使用的解释器，在/etc/suphp.conf这个文件中：

错误的：x-httpd-php=”php:/usr/bin/php”

正确的：x-httpd-php=”php:/usr/bin/php-cgi”

### 参考：

[http://www.chrisam.net/blog/2009/10/11/installing-and-configuring-suphp-on-centos-5-3/](http://www.chrisam.net/blog/2009/10/11/installing-and-configuring-suphp-on-centos-5-3/)




