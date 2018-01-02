+++
author = "daxingplay"
categories = ["Apache", "PHPnow", "Subversion", "SVN", "Tortoise"]
date = 2010-08-11T08:32:27Z
description = ""
draft = false
slug = "windows-phpnow-add-svn"
tags = ["Apache", "PHPnow", "Subversion", "SVN", "Tortoise"]
title = "Windows下为PHPnow添加SVN应用"
aliases = [
    "/windows-phpnow-add-svn/"
]
+++


PHPnow是Windows下一个很好用的WAMP服务器环境集成套件。最近做项目，团队协作的时候越来越发现SVN的重要性，于是打算在本机测试一下SVN服务器的搭建。正好我的电脑里面有PHPnow的服务器环境。

环境概览：

> PHPnow-1.5.5：Apache 2.2+MySQL 5.1+PHP  
>  操作系统：Windows 7（操作系统没什么关系，只要PHPnow正确安装）

好了，接下来介绍一下本次配置用到的工具，我说的详细一点：  
 1、PHPnow  
 下载地址：http://www.phpnow.org/download.php  
 下载好之后呢，解压到某一个文件夹，比如我这里解压到E:\webiste，运行setup.cmd，选apache 22，选mysql 51，然后不断根据提示即可完成phpnow的安装。  
 安装过程中应该不会有什么问题，确保80端口不被其他程序占用。常见的会占用80端口的程序有IIS、迅雷、电驴、快车、傲游下载（Maxthon Download Server）、PPlive等基于P2P的下载或者电影观看程序。如果不知道有哪些，可以尝试注销之后，不启动任何程序进行PHPnow的安装。  
 在Vista以上系统中，可能会因为权限不足导致Apache无法注册为服务。解决办法也很简单，只要在开始菜单中找到命令行工具，右键选择使用管理员运行，在命令中定位到PHPnow的安装程序setup.cmd进行安装，如果setup.cmd没有的话，可以运行pncp.cmd再选择restart之类的进行重置。  
 如果有其他问题，欢迎留言讨论。  
 2、SVN服务器端  
 下载地址：http://subversion.tigris.org/servlets/ProjectDocumentList?folderID=11151&expandFolder=11151&folderID=74  
 这里我选择的是Setup-Subversion-1.6.6.msi，安装很简单，不再赘述。  
 3、SVN客户端  
 这里我用的是TortoiseSVN-1.6.6.17493-win32-svn-1.6.6.msi，网上一搜很多，安装也很简单。

以上三个程序建议按照顺序安装哦，先PHPnow，然后Subversion，最后Tortoise。

接下来开始配置SVN服务器了。

先建立SVN项目目录。我这里是E:\SVN。必须确保这个SVN目录是空的。  
 然后我在这个文件夹下建立了一个新的目录，app1，毕竟以后可能还有其它项目嘛。一个项目一个子文件夹。当然，这个目录也必须是空的。

之后在E:\SVN\app1这个目录上点击右键，选择TortoiseSVN—Create repository here。之后Tortoise会自动在这个文件夹下建立一些新的文件夹，这些都是用于项目库的。

新建一个E:\users.auth.bat的文件，文件内容：

 E:\website\Apache-22\bin\htpasswd.exe -cb users.auth admin 123456

里面的地址根据你的PHPnow安装目录而定。admin 123456 分别为用户名和密码，根据自己需要设置。  
 双击执行users.auth.bat，然后在复制E:\users.auth 文件到E:\svn\app1\conf（即你的项目库的conf目录下）

在 E:\svn\app1\conf目录下一共有4个文件：  
 authz  
 passwd  
 svnserve.conf  
 users.auth

特别注意：passwd文件和users.auth文件是完全不同内容的，虽然功能上很类似。

下面进行配置项目库的用户权限：  
 1、打开authz文件，然后删除全部内容，然后粘贴如下内容：

 [app1:/] admin=rw

这里app1是你刚才建立的项目库的目录名，admin是刚才的用户名，rw表示既可读（R），也可写（W）

2、打开passwd文件，然后清空内容，最后粘贴如下内容：

 [users] admin=123456

这里是加入的用户名和用户密码。admin是用户名，密码是123456。这里一定要和刚才设置的密码一样。  
 如果还有用户，继续在后面添加即可。

3、打开svnserve.conf文件，然后将内容如下覆盖原来的部分：

 [general] ### These options control access to the repository for unauthenticated ### and authenticated users. Valid values are "write", "read", ### and "none". The sample settings below are the defaults. anon-access = none auth-access = write ### The password-db option controls the location of the password ### database file. Unless you specify a path starting with a /, ### the file's location is relative to the directory containing ### this configuration file. ### If SASL is enabled (see below), this file will NOT be used. ### Uncomment the line below to use the default password file. password-db = passwd ### The authz-db option controls the location of the authorization ### rules for path-based access control. Unless you specify a path ### starting with a /, the file's location is relative to the the ### directory containing this file. If you don't specify an ### authz-db, no path-based access control is done. ### Uncomment the line below to use the default authorization file. authz-db = authz ### This option specifies the authentication realm of the repository. ### If two repositories have the same authentication realm, they should ### have the same password database, and vice versa. The default realm ### is repository's uuid. realm = My First Repository

看英文注释的话就知道这些设置项是什么意思了，这里不再赘述。

4、来到 E:\website\Apache-22\conf 目录，然后打开httpd.conf文件，然后ctrl+end来到文件最底部，然后粘贴如下内容：

 LoadModule dav_module modules/mod_dav.so LoadModule dav_fs_module modules/mod_dav_fs.so LoadModule dav_svn_module "E:/Subversion/bin/mod_dav_svn.so" LoadModule authz_svn_module "E:/Subversion/bin/mod_authz_svn.so" <location> DAV svn SVNPath "E:\svn\app1" AuthType Basic AuthName "Subversion repositories" AuthUserFile "E:\svn\app1\conf\users.auth" AuthzSVNAccessFile "E:\svn\app1\conf\authz" Require valid-user </location>

注意，将里面的E:/Subversion替换为你的Subversion安装目录。将E:\svn\app1替换为你的项目目录。

然后进入PHPnow安装目录，执行Pncp.cmd，重启Apache服务器即可完成SVN的配置。

打开浏览器，输入地址：http://localhost/svn/app1 回车后，会有询问用户名密码对话框，输入admin、123456，然后会页面内容出现：

app1 – Revision 0: /

那么代表成功配置完成。

 (834)


