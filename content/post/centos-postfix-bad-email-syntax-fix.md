+++
author = "daxingplay"
categories = ["CentOS", "Postfix", "Spamassassin"]
date = 2011-09-30T15:27:37Z
description = ""
draft = false
slug = "centos-postfix-bad-email-syntax-fix"
tags = ["CentOS", "Postfix", "Spamassassin"]
title = "Centos Postfix bad email syntax 解决方法"
aliases = [
    "/centos-postfix-bad-email-syntax-fix/"
]
+++


在服务器上安装了postfix、dovecot、spamassassin，配置感觉没有啥问题，但是每天logwatch发来的邮件都会显示有下面的错误日志：

> 55D70CA509B: to=<-@[ojpal.com](http://ojpal.com/)>, orig_to=<->, relay=none, delay=1.6, delays=1.5/0.1/0/0, dsn=5.1.3, status=bounced (bad address syntax)   
>  55D70CA509B: sender non-delivery notification: 8899ECA509C

在gg里面搜了很久的postfix bad address syntax的错误解决方案，都是说在配置里面加上allow_min_user这个选项，但是看官方文档说貌似这样并不好。于是打算自己找根本原因。

我自己给自己发一个测试邮件，发现他也会发送到这个地址上[-@ojpal.com](mailto:-@ojpal.com)，确实很让人纳闷，为啥postfix会把邮件发到这个地址上呢？难道是因为我是用的虚拟账户的原因？

应该不是，仔细看日志：

> Sep 27 00:18:12  postfix/smtpd[23006]: warning: 58.61.54.42: host   
> name 42.54.61.58.broad.sz.gd.dynamic.163data.com.cn verification failed: Name or   
>  service not known   
> Sep 27 00:18:12 postfix/smtpd[23006]: connect from unknown[58.61   
> .54.42]   
> Sep 27 00:18:12 postfix/smtpd[23006]: 3C12ECA4E95: client=unknow   
> n[58.61.54.42]   
> Sep 27 00:18:12 postfix/cleanup[23025]: 3C12ECA4E95: message-id=   
> <20110926161812.3C12ECA4E95@mail.ojpal.com>   
> Sep 27 00:18:12 postfix/qmgr[763]: 3C12ECA4E95: from=<1341045845   
> 2@163.com>, size=883, nrcpt=1 (queue active)
> 
> ========= 分隔符 ==========   
> Sep 27 00:18:12 spamd[11311]: spamd: connection from localhost [   
> 127.0.0.1] at port 59357   
> Sep 27 00:18:12 spamd[11311]: spamd: setuid to spamfilter succee   
> ded   
> Sep 27 00:18:12 spamd[11311]: spamd: processing message <2011092   
> 6161812.3C12ECA4E95@mail.ojpal.com> for spamfilter:5001   
> Sep 27 00:18:12 postfix/smtpd[23006]: disconnect from unknown[58   
> .61.54.42]   
> Sep 27 00:18:13 spamd[11311]: spamd: identified spam (12.5/5.0)   
> for spamfilter:5001 in 0.7 seconds, 895 bytes.   
> Sep 27 00:18:13 spamd[11311]: spamd: result: Y 12 – BAYES_99,FRO   
> M_LOCAL_DIGITS,FROM_LOCAL_HEX,FROM_STARTS_WITH_NUMS,RCVD_IN_BL_SPAMCOP_NET,RCVD_   
> IN_PBL,RCVD_IN_SORBS_DUL,RDNS_NONE,TVD_SPACE_RATIO scantime=0.7,size=895,user=sp   
> amfilter,uid=5001,required_score=5.0,rhost=localhost,raddr=127.0.0.1,rport=59357   
> ,mid=<20110926161812.3C12ECA4E95@mail.ojpal.com>,bayes=1.000000,autolearn=no   
> Sep 27 00:18:13 spamd[24866]: prefork: child states: II
> 
> ====== 分隔符 ======   
> Sep 27 00:18:13 postfix/pickup[14476]: 49B0ECA4E9F: uid=5001 fro   
> m=<13410458452@163.com>   
> Sep 27 00:18:13 postfix/cleanup[23025]: 49B0ECA4E9F: message-id=   
> <20110926161812.3C12ECA4E95@mail.ojpal.com>   
> Sep 27 00:18:13 postfix/pipe[23026]: 3C12ECA4E95: to=<admin@ojpa   
> l.com>, relay=spamfilter, delay=1.1, delays=0.35/0.02/0/0.76, dsn=2.0.0, status=   
> sent (delivered via spamfilter service)   
> Sep 27 00:18:13 postfix/qmgr[763]: 3C12ECA4E95: removed   
> Sep 27 00:18:13 postfix/qmgr[763]: 49B0ECA4E9F: from=<1341045845   
> 2@163.com>, size=2219, nrcpt=2 (queue active)   
> Sep 27 00:18:13 postfix/qmgr[763]: 49B0ECA4E9F: to=<-@mail.ojpal   
> .com>, orig_to=<->, relay=none, delay=0.79, delays=0.74/0.05/0/0, dsn=5.1.3, sta   
> tus=bounced (bad address syntax)

在第一个分隔符之前，是postfix获得新邮件，没有任何问题，然后postfix将邮件交给spamassassin处理，这是中间那一段，也没有任何错误，spamassassin检查出该邮件为spam，

在第三段，我们发现这个被判定为spam的邮件发了两次，一个投递到了[admin@ojpal.com](mailto:admin@ojpal.com)，这个是正确的投递方向，另外一次投递到了[-@mail.ojpal.com](mailto:-@mail.ojpal.com)上，很明显是刚才那个邮件，说明这个邮件被投递了两次，第一次成功，第二次失败（因为[-@mail.ojpal.com](mailto:-@mail.ojpal.com)是不存在的），报错。再仔细看第一次投递的时候是交由spamfilter这个程序投递的，也就是spamassasin的调用程序，这个是一个shell文件，内容就是使用spamc把判断之后的邮件再转给postfix进行投递（之后就交给dovecot了，这个不在这个问题的范围内），那说明spamassasin把两封相同的邮件转给了postfix投递，只不过收件人不一样罢了。那我猜测可能是spamassassin的问题，于是在postfix中的配置master.cf中禁用掉spamassassin，reload一下，发现该问题消失，确实是spamassassin的问题。

那为啥spamassassin会把邮件转发到两个邮箱呢，我最后检查了一下master.cf中的配置，发现确实是spamassassin的配置问题：

> # spam filter   
> spamfilter unix – n n – – pipe flags=Rq user=spamfilter argv=/usr/local/bin/spamfilter -f ${sender} – ${recipient}

${recipient}前面我少加了一个横杠，正确的配置应该是：

> # spam filter   
> spamfilter unix – n n – – pipe flags=Rq user=spamfilter argv=/usr/local/bin/spamfilter -f ${sender} –**<font color="#ff0000">–</font>** ${recipient}

这样就给spamassassin指明了收件人是谁，对于刚才那个错误配置，spamassassin不知道投递给谁，因此就投递给了[-@mail.ojpal.com](mailto:-@mail.ojpal.com)，有点像广播，问问这个邮件到底是谁的，呵呵。



