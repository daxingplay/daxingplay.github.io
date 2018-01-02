+++
author = "daxingplay"
date = 2012-02-19T22:20:30Z
description = ""
draft = false
slug = "release-ucenter-authentication-for-dokuwiki"
title = "Ucenter Authentication for DokuWiki发布啦"
aliases = [
    "/release-ucenter-authentication-for-dokuwiki/"
]
+++


For English Users, please visit project page directly at: [https://github.com/daxingplay/dokuwiki_ucenter](https://github.com/daxingplay/dokuwiki_ucenter)

### 写这个验证程序的原因

[Dokuwiki](http://www.dokuwiki.org)确实是个很棒的百科程序，它本身不依赖数据库，小巧、灵活，上手很快，而且插件什么的都很多。顺便吐槽一下，相比国内的互动百科，我觉得Dokuwiki的页面管理方式才真的是wiki的管理方式，互动百科那种，感觉更像是资讯类的，看看页面的链接就知道了。

不用说，[Discuz](http://www.discuz.net)是国内最知名的论坛建站软件了，我的[橘汁仙剑网](http://www.ojpal.com)就是采用了Discuz + Dokuwiki这样一个组合。当然，Discuz本身是基于Ucenter验证用户的，而Dokuwiki是自带的一套验证机制（默认是文本方式存储在一个文件当中），这样，一个网站就有两个用户注册和登录接口了，如果两个程序的用户都很多，那必将是个很大的问题，所以Discuz的Ucenter正是这么一个解决方案，所有的PHP程序（当然其他语言应该也可以）都可以使用Ucenter来实现用户注册、登录等，这样，一个网站，无论使用了多少个PHP程序，都可以通过Ucenter来同步登录和退出，对用户而言，在这个网站上，只要有一个账户就可以了，当然用户体验会好很多。

所以，我觉得Dokuwiki有必要有个Ucenter的验证方式，在网上搜了一下，没有现成的，于是终于想自己写一个了。

### 具体介绍

Ucenter Authentication for Dokuwiki是将Dokuwiki和Ucenter整合的一套程序，项目目前托管在github上，地址是：[https://github.com/daxingplay/dokuwiki_ucenter](https://github.com/daxingplay/dokuwiki_ucenter)

#### 兼容性

只适用于2012-10-13 “Adora Belle”以及以前的版本。对于之后版本的DokuWiki，请使用[https://github.com/daxingplay/dokuwiki-plugin-authucenter](https://github.com/daxingplay/dokuwiki-plugin-authucenter)

#### 特点

1. 基于Ucenter进行用户注册、登录、退出
2. 支持同步登录、退出
3. 绿色，不修改任何原版程序文件

#### 使用方法

1. 先到https://github.com/daxingplay/dokuwiki_ucenter/downloads下载源码包。
2. 下载好源码后，将所有文件放置在Dokuwiki的根目录下。
3. 将conf/uc.conf.php.dist复制一份为conf/uc.conf.php（当然你也可以直接重命名）
4. 进入Ucenter后台，点击应用管理，添加新应用，如下图1所示
5. 选择自定义安装，应用类型选择“其它”，应用名称、应用URL根据自己需要填写，然后写一个稍微复杂点的通信密钥，是否开启同步登录，是否接受通知可以根据自己的需要进行选择，如下图2所示
6. 点击提交之后，下面会出现“应用的Ucenter配置信息”，复制里面的所有内容，如下图3所示
7. 编辑conf/uc.conf.php这个文件，把前面的define部分替换为刚才复制的内容
8. 进入Dokuwiki的管理后台，进入配置设置，将authtype（认证后台管理方式）设置为uc，superuser（超级用户）设置为Discuz或者Ucenter的超级管理员的用户名，然后点提交即可，如下图4所示
9. 至此，已经安装完毕，进入Ucenter后台看看是否通信成功

[![](https://daxingplay.me/wp-content/uploads/2012/02/1.jpg "1")](https://daxingplay.me/website/dokuwiki/release-ucenter-authentication-for-dokuwiki.html/attachment/1-2)  
[![](https://daxingplay.me/wp-content/uploads/2012/02/2.png "2")](https://daxingplay.me/website/dokuwiki/release-ucenter-authentication-for-dokuwiki.html/attachment/2-2)  
[![](https://daxingplay.me/wp-content/uploads/2012/02/3.png "3")](https://daxingplay.me/website/dokuwiki/release-ucenter-authentication-for-dokuwiki.html/attachment/3)  
[![](https://daxingplay.me/wp-content/uploads/2012/02/4.png "4")](https://daxingplay.me/website/dokuwiki/release-ucenter-authentication-for-dokuwiki.html/attachment/4)

#### 用户组使用指南

2.0Beta开始，已经慢慢开始支持用户组管理功能了。2.0Beta中只支持discuz 2.5的用户组验证，因为时间关系，其他版本的discuz还未测试，但是dz7这样的版本肯定是不行的。配置方法也很简单：

1. 编辑uc.conf.php
2. 配置用户组类型：$conf[‘auth’][‘uc’][‘group_type’] = ‘discuz’;
3. 配置discuz根目录所在位置：$conf[‘auth’][‘uc’][‘discuz_root’] = ‘../’;这里的位置是指相对于dokuwiki根目录的位置。
4. 根据自己的需要在Dokuwiki的ACL中设置相应用户组权限吧。

如果不想启用用户组功能，将group_type设置为空即可。这样，所有非管理员用户默认为普通用户组user

#### Todo List

1. <del>目前只实现了用户的注册和登录验证，没有实现用户组功能，如果实现用户组，可能需要创建数据库了，暂时，你可以通过Dokuwiki自带的ACL功能进行用户的授权，比较适合那些只有少数人编辑的wiki或者完全开放的wiki</del>
2. <del>目前在Dokuwiki端的用户管理功能还有些bug，稍候会慢慢修复，既然都是用Ucenter了，那干脆到Ucenter里面管理用户吧！:)</del>
3. 将语言包独立出来，这样方便在多语言环境下使用

### 结束语

好了，介绍就到此啦，如果发现bug或者有任何问题，请提交[issues](https://github.com/daxingplay/dokuwiki_ucenter/issues)

 (37255)


