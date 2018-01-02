+++
author = "daxingplay"
categories = ["CentOS", "HttpAccessKeyModule", "Nginx"]
date = 2010-10-04T19:43:01Z
description = ""
draft = false
slug = "nginx-http-accesskey-module"
tags = ["CentOS", "HttpAccessKeyModule", "Nginx"]
title = "Nginx防盗链模块HttpAccessKeyModule"
aliases = [
    "/nginx-http-accesskey-module/"
]
+++


关于Nginx，我就不多废话了，网上一搜一大堆。关于HttpAccessKeyModule，网上一搜也是一堆，可是都是互相抄袭，或者抄的官方Wiki。真正遇到问题了，看这些其实没用。

因为是Nginx的第三方扩展，所以官网Wiki里面的内容并不多。我今天在安装这个Module的时候遇到了一些问题，经过一番研究解决了，于是过来跟大家分享下。

先是安装过程。

1. 下载NginxHttpAccessKeyModule模块文件：[Nginx-accesskey-2.0.3.tar.gz](http://wiki.nginx.org/File:Nginx-accesskey-2.0.3.tar.gz)

2. 解压此文件后，找到nginx-accesskey-2.0.3下的config文件。编辑此文件：替换其中的”$HTTP_ACCESSKEY_MODULE”为”ngx_http_accesskey_module”；

3. 用一下参数重新编译nginx：

./configure 这里加上以前编译的参数 –add-module=这里是你解压的模块路径

编译完之后make一下，但是不要make install，否则会覆盖掉你以前的conf文件。

编译完的东西在objs这个文件夹下，剩下的步骤其实和升级nginx没差别了，简单介绍一下，把原来的nginx执行文件重命名，

mv /usr/local/nginx/sbin/nginx /usr/local/nginx/sbin/nginx.old

然后把objs下新的nginx执行文件复制过去。

把原来的进程kill掉，系统自动会使用新的nginx执行文件。

这样nginx就已经加载了新的模块HttpAccessKeyModule了，然后我们需要为站点启用这个模块。

找到你想启用防盗链模块的网站（可以是虚拟主机）的配置文件，在server段中加入：

 location /download { accesskey             on; accesskey_hashmethod  md5; accesskey_arg         "key"; accesskey_signature   "mypass$remote_addr"; }

/download替换为你想要防盗链的目录。

好了，然后让nginx reload一下，配置即可生效。这样，没有一个合适的key，那nginx会返回一个403错误。

配合PHP做下载：

 $ipkey= md5("mypass".$_SERVER['REMOTE_ADDR']); $output_add_key="[download_add_key](https://daxingplay.me/download/xxx.rar?key=".$ipkey.")  
"; $output_org_url="[download_org_path](https://daxingplay.me/download/xxx.rar)  
"; echo $output_add_key; echo $output_org_url; ?>

常见问题：

1、加入配置后，还是可以直接下载。

这点肯定是配置有问题了。网上盛传三种防盗链方法，还有一种是靠nginx本身来进行判断的。

 location ~* \.(gif|jpg|png|swf|flv)$ { valid_referers none blocked www.techcheng.com techcheng.com ; if ($invalid_referer) { rewrite ^/ https://daxingplay.me/retrun.html; return 403; } }

如果加入了上面这个防盗链方法，又启用了HttpAccessKeyModule的防盗链方法，那么，HttpAccessKeyModule的防盗链方法必然失效，无论你把它放在其他防盗链方法的前面还是后面。所以如果您启用了其他防盗链方法，还想使用HttpAccessKeyModule的方法，那请自己选择一个吧。

2、启用这个之后，目录下的所有文件都打不开，包括php文件。

嗯，所有的文件都返回403错误。这个我测试过了，一开始以为是自己站点的权限问题，发现非这个防盗链目录下的php文件是可以正常访问的。关闭HttpAccessKeyModule之后，即使防盗链目录下的php文件也可以正常访问了。

所以，建议HttpAccessKeyModule只对下载目录启用。

以上就是我遇到的两个问题，希望能对大家有所帮助。从问题可以看出，HttpAccessKeyModule主要是针对下载的，普通的图片神马的防盗链用这个确实有点大材小用了。

 (4000)


