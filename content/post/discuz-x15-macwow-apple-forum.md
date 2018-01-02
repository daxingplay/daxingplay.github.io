+++
author = "daxingplay"
categories = ["Discuz", "MacWow", "作品", "风格", "麦客窝"]
date = 2010-10-02T23:17:23Z
description = ""
draft = false
slug = "discuz-x15-macwow-apple-forum"
tags = ["Discuz", "MacWow", "作品", "风格", "麦客窝"]
title = "[DiscuzX1.5]MacWow麦客窝-专业苹果论坛"
aliases = [
    "/discuz-x15-macwow-apple-forum/"
]
+++


这是最近一个星期的作品。这个作品其实制作的时间花了并不久，后期磨磨蹭蹭地修复BUG。也因为这几天太累了，所以修复BUG拖延了很久。做完之后，觉得这个风格看起来简单，实际上做下去的时候遇到了不少问题，也学到了不少东西。

风格由一位专业的设计师设计的，结合了这个苹果论坛的特点，以黑白为主，搭配得很不错。PSD拿过来的时候，看起来也很舒服，给我省了很多很多的麻烦。

作品特点：

- 支持宽窄版切换，理论上兼容无限宽的屏幕；
- 做到了A-grade浏览器兼容。IE6+、FF、Chrome、Opera、Safari等都经过测试；
- 应用了部分CSS3技术和一些浏览器私有属性；
- 针对FF、Chrome、Opera、Safari等非IE的A-grade浏览器进行了优化，减少了10余个HTTP请求；
- 尽可能地做到了精确到像素的设计（尤其是在非IE的A-grade浏览器下）；
- 使用jQuery完成了游客登录弹窗提醒（自动关闭）和一些广告位的特效；

作品地址：[http://www.macwow.com](http://www.macwow.com)

好了，废话不多说，先上图。

首页（自适应屏幕状态）

[![](https://daxingplay.me/wp-content/uploads/2010/10/MacWow-麦客窝-专业苹果技术社区-首页-161x300.jpg "MacWow-麦客窝-[专业苹果技术社区] - 首页")](https://daxingplay.me/wp-content/uploads/2010/10/MacWow-麦客窝-专业苹果技术社区-首页.jpg)

帖子页面（自适应屏幕状态）

[![](https://daxingplay.me/wp-content/uploads/2010/10/MacWow-发帖页面-80x300.jpg "MacWow-发帖页面")](https://daxingplay.me/wp-content/uploads/2010/10/MacWow-发帖页面.jpg)

帖子列表（自适应屏幕状态）

[![](https://daxingplay.me/wp-content/uploads/2010/10/-MacWow-197x300.jpg "版块 - MacWow")](https://daxingplay.me/wp-content/uploads/2010/10/版块-MacWow.jpg)

首页（窄版）

[![](https://daxingplay.me/wp-content/uploads/2010/10/MacWow-麦客窝-专业苹果技术社区-首页窄版-159x300.jpg "MacWow-麦客窝-[专业苹果技术社区] - 首页窄版")](https://daxingplay.me/wp-content/uploads/2010/10/MacWow-麦客窝-专业苹果技术社区-首页窄版.jpg)

帖子列表（窄版）

[![](https://daxingplay.me/wp-content/uploads/2010/10/-MacWow-麦客窝-窄版-197x300.jpg "综合讨论区 - MacWow-麦客窝-窄版")](https://daxingplay.me/wp-content/uploads/2010/10/综合讨论区-MacWow-麦客窝-窄版.jpg)

帖子页面（窄版）

[![](https://daxingplay.me/wp-content/uploads/2010/10/-综合讨论区-MacWow-麦客窝-窄版-275x300.jpg "帖子 - 综合讨论区 - MacWow-麦客窝-窄版")](https://daxingplay.me/wp-content/uploads/2010/10/帖子-综合讨论区-MacWow-麦客窝-窄版.jpg)

好了，接下来说说做这个作品的感受吧。

这个作品的最大特点就是圆角。这也符合苹果系统的风格。在FF等非IE的A-grade浏览器下很好实现，包括CSS3技术，但是在IE9以下的浏览器就郁闷了。所以只能添加额外的DIV来进行background设置。在CSS3下就很好实现，可以直接用圆角，用box-shadow，哪怕这些达不到你的效果，你也可以用background设置多个背景。所以我愈发地希望广大IE用户升级到IE9了。呵呵。

给这些需要圆角的地方添加DIV和background属性之后，问题也来了，这些图像基本上是不能进行CSS Sprite优化的，这是因为我们还要自适应屏幕的功能，不能确定DIV有多宽。有的人就会说，我可以假设最大的屏幕是1920X1280之类的，但是这不是个完美的解决办法，事实上，已经有很多更大的屏幕出现了，我在我自己的网站上都看到了甚至有5000多宽的分辨率，所以假设不是最完美的办法。对于这些，既要分出四个角，也还要水平和垂直方向上的box-shadow，加入的DIV又要尽可能地少，所以我们要寻找合适的，已经存在的DIV插入background。这些问题也正是这个作品里面比较棘手的。

同时棘手的不光这些。还有即使找到位置插入背景了，但是在IE下又冒出了不少BUG。DZ默认的情况下，帖子详细内容页面的主题部分是Table布局的，Table在IE下是有HasLayout的，所以也会有不少问题。我在这里也第一次遇到了IE下TD继承背景的问题，还有TD与TD之间如果想要缝隙怎么办（TD不能应用margin属性）等等。不过最后我都想到了较好的办法解决。

时间关系，就技术细节我就不多说了。总结一下：

- 更加深入地理解了一些浏览器的私有属性，温习了IE的HasLayout，也使用了CSS3的技术；
- 对圆角的处理，也上网找了一些资料，学习了结合JS对IE针对性地添加DIV的方法；
- 提高了自己在IE下结合多种工具进行debug的能力；

总之，这个作品是我很满意的作品（毕竟是专业的设计师设计的），而且自己也学到了不少东西。我也担任了这个网站的管理员，接下来的时间里面会继续完善网站功能，比如门户等，随后为大家展示。

 (1953)


