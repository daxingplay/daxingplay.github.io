+++
author = "daxingplay"
date = 2011-03-09T20:52:18Z
description = ""
draft = false
slug = "howto-use-cdn-for-discuzx"
title = "如何安全地为DiscuzX静态文件实现CDN加速功能"
aliases = [
    "/howto-use-cdn-for-discuzx/"
]
+++


我认为DiscuzX系列是划时代的系列。刚发布的时候，很多人都觉得太丑。很多站长只看表面，其实DiscuzX的架构和功能是其他同类产品远远不及的。今天我给大家介绍一下如何给DiscuzX系列安全地实现CDN加速功能，不需要修改任何模板文件！

另外，首先向您声明，本文所提及的CDN加速功能设置是只针对静态文件加速的。动态文件加速不在本文考虑范围内。

首先修改config/config_global.php这个文件，修改这句：

$config['output']['staticurl']="http://www.ojcdn.com/";

请把里面的网址替换为你自己的CDN加速网址。确保这个地址是为http://www.yourdomain.com/static加速的（这个需要你查看您的域名记录和CDN供应商那边的设置）。

然后进入管理后台，界面，风格管理。编辑你正在使用的风格。

将里面界面基础图片目录和扩展图片目录也设置为相应的CND加速的值。比如这里，我的网站橘汁仙剑网的CDN域名www.ojcdn.com指向的是http://www.ojpal.com/static，本来界面基础图片目录的值为static/image/common（翻译为完整的绝对URL是http://www.ojpal.com/static/image/common），那么此处的CDN加速的地址就是http://www.ojcdn.com/image/common。务必要注意这个替换关系。如果这个都看不懂的话，说句难听的话，我建议您先好好学学互联网基础知识再来做站。

给大家看看我的改动的情况：

[![](https://img2.ojcdn.com/daxingplay/2011/03/CDN设置.jpg "CDN设置")](https://img2.ojcdn.com/daxingplay/2011/03/CDN设置.jpg)

经过以上两步设置完毕之后，您的网站已经可以使用CDN加速了，清空下浏览器缓存，重新打开一下您的网站，如果图片都显示正常，则说明您设置成功了！如果不正常的话，建议您检查下您的CDN服务供应商那边的设置以及上面两个步骤中的URL是否填写正确。


