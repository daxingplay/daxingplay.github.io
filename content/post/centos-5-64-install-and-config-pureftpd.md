+++
author = "daxingplay"
categories = ["CentOS", "ftp", "pure-ftpd"]
date = 2010-08-23T22:43:23Z
description = ""
draft = false
slug = "centos-5-64-install-and-config-pureftpd"
tags = ["CentOS", "ftp", "pure-ftpd"]
title = "CentOS 5.5 x86_64下安装配置pure-ftpd"
aliases = [
    "/centos-5-64-install-and-config-pureftpd/"
]
+++


最近买了一个很便宜的openVZ的VPS，spacerich这个服务商的。当时买的时候有终身25%的优惠码（使用优惠码时必须月付，很奇怪，呵呵），据说spacerich是一个印度人开的，已经有五年的历史了，所以暂时不必担心跑路的问题，而且我用监控宝监控了很长一段时间了，没有一分钟当机发生过。我买的是512M内存的，机房位于西雅图的softlayer（很有名气的哦），月流量非常大，而且是1G的port，很不错吧，用了优惠码一个月才7.5刀。可是现在优惠码已经没有了，如果大家想要的话，可以找我。

好了，费话不多说，这次的重点在于，在基于openVZ的VPS（操作系统为CentOS 5.5 x86_64）上yum安装和自己编译安装pure-ftpd都有问题。

### pure-ftpd介绍

pure-ftpd大家应该都听说过，一个很好用的ftp服务端。功能很多，也比较安全，而且还可以和mysql整合，通过mysql建立和验证帐户，并实现流量限制、磁盘配额限制等功能。这就说明，可以通过自己开发的PHP程序来实现Web管理。其它的功能，大家可以到官网上去看。

### Yum安装pure-ftpd遇到的问题

CentOS装软件最简单的办法就是用yum了。所以我毫不犹豫地yum install pure-ftpd。找到的也是x86_64的，心想肯定不会有问题。安装完之后，/etc/init.d/pure-ftpd start运行一下，发现[failed]，启动失败。查看一下服务器日志：

tail -n 200 /var/log/messages | grep ftp

如果您看到了下面的错误：

> pure-ftpd: (?@?) [ERROR] Unable to switch capabilities : Operation not permitted

那么恭喜您，您遇到了和我一样的问题（这是什么话……）。这会出现于基于openVZ的vps上。因为这种vps限制一种包libcap.so。这个只能修改母机的设置，在VPS上是不现实的。解决的办法也很简单，自己去下载pure-ftpd的源码包进行编译安装，编译的时候加上–without-capabilities这个参数就行了。具体的命令如下：

 wget ftp://ftp.pureftpd.org/pub/pure-ftpd/releases/pure-ftpd-1.0.29.tar.gz tar zxf pure-ftpd-1.0.29.tar.gz cd pure-ftpd-1.0.29 ./configure --without-capabilities --with-virtualchroot --with-mysql --with-pam --with-altlog --with-mysql --with-cookie --with-throttling --with-ratios --with-paranoidmsg --with-quotas --with-everything make make install

### pure-ftpd编译的时候遇到的问题

#### 第一个问题

出现如下的错误：

 configure: error: PAM headers not found.

解决办法：

yum -y install pam-devel

#### 第二个问题：

我的是CentOS 5.5 x86_64，MySQL也是yum安装的。结果编译pure-ftpd的时候，加了–with-mysql参数之后，编译过程中出现下面的错误：

> checking for mysql_init in -lmysqlclient… no  
>  configure: error: libmysqlclient is needed for MySQL support

我很纳闷，怎么会缺少这个，用find命令一搜，能找到呀，在/usr/lib64/mysql/下面，四个库文件老老实实地躺在那儿呢。难道是需要装额外的扩展包？yum search libmysqlclient以下，竟然米有这个。

在GG上一搜，遇到这个问题的人真不少（国内竟然米有相关的文章），可是大家的解决办法无怪乎以下几种：

1、编译的时候不加–with-mysql这个参数（对于我们来说当然不行，要的就是mysql支持）

2、删除mysql、apache、php等，安装一些人编译好的LAMP或LNMP套件，这个不现实，都装好了为啥要删。

3、修改pure-ftpd源码中的configure文件，在mysql那一段加上编译参数。这个只适用于老版本的pure-ftpd，新版的configure文件已经改过了。

4、用ln -s将/usr/lib64/mysql/下面的几个libmysqlclient.so文件指向别的位置，比如/usr/local/mysql、/usr/include等位置，我试了一下，我几乎把这些快捷方式创建到我能创建的任何地方，还是米有用。不过有的人能用了。

5、关闭SElinux和防火墙，试过了，也不行，而且感觉不安全，所以没用之后又打开了。

……

总之，网上的一些办法我都试过了，都不行。

我无意中收到了一个pure-ftpd的rpm包，上面列出了他运行所依赖的库文件，其中就有libmysqlclient，我点进去看了一下，发现Federo有一个专门的mysql库的包。我猜想CentOS是不是应该也有呢。于是，yum search mysql了一下，发现除mysql以外，还有一些其它的在我本机上没有安装，我看到一个为mysql-devel的包，这个应该比较像，尝试安装了一下，再次编译pure-ftpd，顺利通过，太激动了。两天的问题终于解决了。

### 配置pure-ftpd

接着刚才的./config 之后的：

 make make install cp pureftpd-mysql.conf /etc/ cp configuration-file/pure-config.pl /usr/local/sbin/ chmod 755 /usr/local/sbin/pure-config.pl cp configuration-file/pure-ftpd.conf /etc/ cp contrib/redhat.init /etc/rc.d/init.d/pureftpd chmod u+x /etc/rc.d/init.d/pureftpd chkconfig --add pureftpd chkconfig --level 2345 pureftpd on service pureftpd start

这样是把pure-ftpd安装为一个服务，这样以后使用起来就方便了。启动成功后显示信息如下：

> 启动 pure-config.pl：Running: /usr/local/sbin/pure-ftpd –daemonize -A -c50 -B -C8 -D -fftp -H -I15 -lmysql:/etc/pureftpd-mysql.conf -L10000:8 -m4 -s -U133:022 -u100 -j -k99 -Z

pureftpd 安装好了，现在我们开始配置其支持虚拟用户，并把虚拟用户存储在 mysql 中。  
 首先我们创建 pureftpd 用到的用户组和用户帐户，所有的虚拟帐户都会被映射到这个帐户的目录下。组号和用户号自己定义一个，只要是系统空闲的即可，这里默认写一个2001。

groupadd -g 2001 ftpgroup useradd -u 2001 -s /bin/false -d /bin/null -c "pureftpd user" -g ftpgroup ftpuser

创建 pureftpd 数据表并赋予 mysql 权限：

 mysql -u root -p CREATE DATABASE pureftpd; GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP ON pureftpd.* TO 'pureftpd'@'localhost' IDENTIFIED BY '对应的密码'; GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP ON pureftpd.* TO 'pureftpd'@'localhost.localdomain' IDENTIFIED BY '对应的密码'; FLUSH PRIVILEGES; USE pureftpd; CREATE TABLE ftpd ( User varchar(16) NOT NULL default '', status enum('0','1') NOT NULL default '0', Password varchar(64) NOT NULL default '', Uid varchar(11) NOT NULL default '-1', Gid varchar(11) NOT NULL default '-1', Dir varchar(128) NOT NULL default '', ULBandwidth smallint(5) NOT NULL default '0', DLBandwidth smallint(5) NOT NULL default '0', comment tinytext NOT NULL, ipaccess varchar(15) NOT NULL default '*', QuotaSize smallint(5) NOT NULL default '0', QuotaFiles int(11) NOT NULL default 0, PRIMARY KEY (User), UNIQUE KEY User (User) ) TYPE=MyISAM;

看一下表结构

 mysql> desc ftpd; +-------------+---------------+------+-----+---------+-------+ | Field | Type | Null | Key | Default | Extra | +-------------+---------------+------+-----+---------+-------+ | User | varchar(16) | NO | PRI | | | | status | enum('0','1') | NO | | 0 | | | Password | varchar(64) | NO | | | | | Uid | varchar(11) | NO | | -1 | | | Gid | varchar(11) | NO | | -1 | | | Dir | varchar(128) | NO | | | | | ULBandwidth | smallint(5) | NO | | 0 | | | DLBandwidth | smallint(5) | NO | | 0 | | | comment | tinytext | NO | | NULL | | | ipaccess | varchar(15) | NO | | * | | | QuotaSize | smallint(5) | NO | | 0 | | | QuotaFiles | int(11) | NO | | 0 | | +-------------+---------------+------+-----+---------+-------+ 12 rows in set (0.02 sec)

数据表说明：

- User：帐号名；
- status：0 表示帐号被禁用，无法登录服务器；
- Password：密码，使用MD5加密；
- Uid：前面创建的ftpuser帐户号，我们填写的是2001；
- Gid：前面创建的ftpgroup组号，我们填写的是2001；
- Dir：虚拟用户的个人目录路径，将在/home下创建（第一次登录）；
- ULBandwidth：上传文件限制速度，KB/s，0为不限制；
- DLBandwidth：下载文件限制速度，KB/s，0为不限制；
- comment：备注信息；
- ipaccess：* 表示任意IP都可以访问此ftp服务器，输入具体IP地址可以只允许此IP连接服务器；
- QuotaSize：用户磁盘空间分配，单位：MB，0表示不加限制；
- QuotaFiles：用户可以保存的文件数量限制，0表示不加限制。

编辑/etc/pure-ftpd.conf，确保ChrootEveryone、MySQLConfigFile、CreateHomeDir被开启：

 ChrootEveryone              yes MySQLConfigFile             /etc/pureftpd-mysql.conf CreateHomeDir               yes

ChrootEveryone 限制每一个虚拟用户在其目录下；  
 CreateHomeDir 会在ftp用户登录时创建其个人目录。

编辑 /etc/pureftpd-mysql.conf 如下：

 MYSQLSocket      /tmp/mysql.sock #MYSQLServer     localhost #MYSQLPort       3306 MYSQLUser       pureftpd MYSQLPassword   这里输入前面给mysql授权时的密码 MYSQLDatabase   pureftpd #MYSQLCrypt md5, cleartext, crypt() or password() - md5 is VERY RECOMMENDABLE uppon cleartext MYSQLCrypt      md5 MYSQLGetPW          SELECT Password FROM ftpd WHERE User="\L" AND status="1" AND (ipaccess = "*" OR ipaccess LIKE "\R") MYSQLGetUID         SELECT Uid FROM ftpd WHERE User="\L" AND status="1" AND (ipaccess = "*" OR ipaccess LIKE "\R") MYSQLGetGID         SELECT Gid FROM ftpd WHERE User="\L"AND status="1" AND (ipaccess = "*" OR ipaccess LIKE "\R") MYSQLGetDir         SELECT Dir FROM ftpd WHERE User="\L"AND status="1" AND (ipaccess = "*" OR ipaccess LIKE "\R") MySQLGetBandwidthUL SELECT ULBandwidth FROM ftpd WHERE User="\L"AND status="1" AND (ipaccess = "*" OR ipaccess LIKE "\R") MySQLGetBandwidthDL SELECT DLBandwidth FROM ftpd WHERE User="\L"AND status="1" AND (ipaccess = "*" OR ipaccess LIKE "\R") MySQLGetQTASZ       SELECT QuotaSize FROM ftpd WHERE User="\L"AND status="1" AND (ipaccess = "*" OR ipaccess LIKE "\R") MySQLGetQTAFS       SELECT QuotaFiles FROM ftpd WHERE User="\L"AND status="1" AND (ipaccess = "*" OR ipaccess LIKE "\R")

重新启动pureftpd：

service pureftpd restart

创建ftp虚拟用户：

mysql -u root -p use pureftpd; INSERT INTO `ftpd` (`User`, `status`, `Password`, `Uid`, `Gid`, `Dir`, `ULBandwidth`, `DLBandwidth`, `comment`, `ipaccess`, `QuotaSize`, `QuotaFiles`) VALUES ('帐号名', '1', MD5('密码'), '2001', '2001', '/home/路径', '100', '100', '', '*', '50', '0'); quit

这里手动添加sql，实际上可以做一个web页面，申请帐号，管理员后台设置帐号生效等等操作… …该php闪亮登场了… …

现在可以使用你的ftp客户端连接ftp服务器测试一下了。

另附：如何配置匿名ftp访问

修改 /etc/password 如下：

ftp:x:14:50:FTP User:/home/anon_ftp_dir:/sbin/nologin

给匿名访问目录加上权限：

 [root@server home]# chmod 755 anon_ftp_dir/ [root@server ~]# ls -dl /home/anon_ftp_dir/ drwxr-xr-x 3 root root 4096 05-31 10:07 /home/anon_ftp_dir/ [root@server ~]# ls -l /home/anon_ftp_dir/ 总计 8 drwxr-xr-x 2 root root 4096 05-31 10:07 anon

再登录FTP客户端测试一下吧。

如果在登录过程中出现无法列出目录（即执行MLSD命令时）的情况，请参考：[连接pure-ftpd服务端无法列出目录的解决办法。](https://daxingplay.me/study/centos/connect-to-pure-ftpd-but-cannot-mlsd.html)

 (3684)


