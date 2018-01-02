+++
author = "daxingplay"
date = 2012-10-16T15:11:35Z
description = ""
draft = false
slug = "ucenter-authentication-for-dokuwiki-user-group-settings-tutorial"
title = "Ucenter Authentication for DokuWiki用户组设置教程"
aliases = [
    "/ucenter-authentication-for-dokuwiki-user-group-settings-tutorial/"
]
+++


[Ucenter Authentication for DokuWiki 2.0 Beta](https://daxingplay.me/website/dokuwiki/release-ucenter-authentication-for-dokuwiki.html)中内置了用户组功能，因为时间关系，然后用户催的急，所以Beta版本只实现了Discuz的功能，发布那天又有别的事情，忘记写教程了，导致用户可能不知道怎么弄。于是补上。以后增加其他验证方式的时候，就不再开新文章了，直接修改这个好了。


## 使用Discuz方式链接用户组

### 基础设置

请先修改uc.conf.php，增加如下设置（如果已经有了，就直接修改）

 $conf['auth']['uc']['group_type'] = 'discuz'; $conf['auth']['uc']['discuz_root'] = '../';

第一行表示使用discuz的用户组功能，第二行是设置discuz的根目录相对于dokuwiki的地址。比如：

- 你的dokuwiki是放在discuz的根目录下的，那么就是’../’;
- 你的dokuwiki是和discuz同级的，比如dz的目录是bbs，那么就是’../bbs/’,注意，目录末尾需要带斜杠。
- ……

配置我想应该是非常简单的。目前只支持x2.5，理论上2.0也是可以的。

### 如何设置用户组

既然已经和dz互通了，所以如果这个用户在dz里面有帐号的话，那么肯定是能取到他用户组的，但是因为dz的用户组需要设置的项目是很多的，所以，如果使用这种方式的话，是不能直接在dokuwiki里面改用户组的（已经想好了其他方式，待实现），所以先请您在dz里面改用户组吧。

如果这个用户在dz里面取不到，那么就是默认的user组。

如果您说，他的用户组我不想改怎么办，或者因为这个用户是会员用户组的（会员用户组只能通过积分升级来改变用户组），不是属于系统/管理用户组的，没法改，其实dz已经有一个解决办法了，就是扩展用户组，比如你可以新建一个用户组叫百科编辑员，然后设置这个用户的扩展用户组为百科编辑员，如下：  
[![在dz中给用户设置扩展用户组](https://daxingplay.me/wp-content/uploads/2012/10/dokuwiki-acl-settings-3.jpg "dokuwiki-acl-settings-3")](https://daxingplay.me/website/dokuwiki/ucenter-authentication-for-dokuwiki-user-group-settings-tutorial.html/attachment/dokuwiki-acl-settings-3)  
 然后，到dokuwiki的访问控制列表（ACL）管理器中，给相应的用户组赋予权限：

[![](https://daxingplay.me/wp-content/uploads/2012/10/dokuwiki-acl-settings.jpg "dokuwiki-acl-settings")](https://daxingplay.me/website/dokuwiki/ucenter-authentication-for-dokuwiki-user-group-settings-tutorial.html/attachment/dokuwiki-acl-settings)

没错，用户组可以用汉字，就是你在dz里面设置的用户组。

[![](https://daxingplay.me/wp-content/uploads/2012/10/dokuwiki-acl-settings-2.jpg "dokuwiki-acl-settings-2")](https://daxingplay.me/website/dokuwiki/ucenter-authentication-for-dokuwiki-user-group-settings-tutorial.html/attachment/dokuwiki-acl-settings-2)

然后你想给他神马权限都可以的。记得保存就好了。

怎么样，我觉得还是很简单的。想设置几个用户组就设置几个。而且两边用户组互通，这样用户不容易迷惑，而且你也可以结合dz发挥更多用户组的功能，比如在dz设置一个奖励，用户升级到xx用户组，就能编辑百科了……尽情发挥吧！

至于其他dz版本，稍候会一并支持。


## MySQL方式

待完成


## 文本存储方式

待完成


## 小结

如果您有其他问题，欢迎留言或到github里面提[issue](https://github.com/daxingplay/dokuwiki_ucenter/issues)。

 (3307)


