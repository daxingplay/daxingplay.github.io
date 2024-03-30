+++
author = "daxingplay"
categories = ["png", "优化"]
date = 2010-08-12T15:10:00Z
description = ""
draft = false
slug = "png-optimize-method"
tags = ["png", "优化"]
title = "PNG图片优化的方法"
aliases = [
    "/png-optimize-method/"
]
+++


译文地址：[http://www.csspeople.cn/archives/86](http://www.csspeople.cn/archives/86)

原文地址：[http://www.smashingmagazine.com/2009/07/15/clever-png-optimization-techniques](http://www.smashingmagazine.com/2009/07/15/clever-png-optimization-techniques)

引言

做为一名网页设计师你或许已经对 png 格式非常熟悉，它提供了完整的透明度，这是一种无损的，功能强大的图像格式。能够很好代替 gif 图像格式。但是绝大多数人认为它不可被压缩，带着这样的疑问我们来认真看完下面这篇文章。

每一种图像格式都有自己的优缺点，如果掌握了相关知识，在进行图像优化时能够针对不同图像格式进行相应处理，以得到高品质的图像和高压缩率，这是图像优化的关键所在。

png 被称为开源的 gif 图像格式，它们之间有很多相同的地方（如：索引色），但 png 在每一个方面都要强于 gif。它介绍了一些非常酷的功能，图像封装和压缩，但对网页设计师来说最重要的还是线性过滤（也称为“三角过滤”）。

什么是线性过滤？

这里来介绍下它的原理，假如我们有一张5*5像素水平渐变的图片，如下图（每个数字代表了一种颜色）

<div>[![](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/scanline1.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/scanline1.png)</div>通过上图你会发现相同的颜色都是在垂直方向上扩展，而不是水平方向。这样的图片如果用 gif 格式将很难获得高压缩率，它只压缩水平方向扩展的颜色（图像尺寸越大，越能说明问题）。让我们看看线性过滤是怎样将这类图像压缩的：

<div>[![](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/scanline2.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/scanline2.png)</div>以数字2为标识的每一行都经过了“Up过滤”，“Up过滤”向 png 解码器发送信息：“对于当前的像素，提取上方像素的值，并将其添加到当前值”。图中2-5行垂直方向都拥有相同的值。所以它们的值都是0，如果这样的图片越大那么压缩比率也越大。

在理想情况下，“Sub过滤”能提供更好的结果：

<div>[![](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/scanline3.png)](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/scanline3.png)</div>以数字1为标识的每一行都经过了“Sub过滤”，它发送信息给解码器：“当前像素提取左侧像素的值，添加到当前值”。例子中的值全为1，我想你大概也猜到这样的数据肯定能被有效的压缩。

线性过滤是非常重要的概念，尤其是在图片处理时可以针对过滤特点进行处理以便得到更好的过滤效果。有5种过滤器：None（无过滤），Sub（当前值减去左侧像素的值），Up（减去上方像素的值），Average（减去左侧和上方像素的平均值）和Paeth（替换上方，左边或者上方的左边像素值，并重新以Alan Paeth命名）。

通过比较下面的图片，我想大家应该都能明白“线性过滤”的魅力所在。

<div>[![](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/gradient.gif)](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/gradient.gif)</div>gif：2568字节

<div>[![](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/gradient24.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/gradient24.png)</div>png：372字节  
 图片类型

png 是一种存储元数据信息的图片类型。如果你是 Photoshop 用户，你应该已经对 png8（索引图像）和 png24（真彩色图像）非常熟悉，如果你是 Fireworks 用户，或许已经知道 png32（真彩色透明图像）。但是 Photoshop 的 png24 格式也能存储真彩色透明图像，其实这些命名都不是官方的，所以在 png 图像格式说明面并不能找到这些概念，为了方便起见，在这次讨论中我们采用Photoshop 的命名方式。

png 可提供5种图片类型：灰度，真彩色，索引色，带alpha通道的灰度，带alpha通道的真彩色。遗憾的是 Photoshop 只能导出3种图像类型：带透明的索引颜色，真彩色，带透明度的真彩色。这就是为什么大家一直认为 Fireworks 是 Png 图像最好处理工具。其实不然，Fireworks 并没有足够的工具来处理导出的 png 图像，它仅仅是在导出时做一些微小的优化工作。

那还有没有更好的 png 压缩工具呢？答案是肯定的。[OptiPNG](http://optipng.sourceforge.net/) 和 [pngcrush](http://pmt.sourceforge.net/pngcrush/) 都是非常有效的工具，从本质上来看，这些工具主要做以下优化：

 1. 1.选择最合适的图像类型（例如：如果图像中没有太多的颜色，真彩色图像会被转化为索引色图像）  
 2. 2.选择最合适的过滤方式  
 3. 3.选择最合适的压缩策略以及选择性的减少颜色深度

所有这些操作都不会影响到图像质量，却能减小 png 图像文件的大小，所以我强烈建议您每次保存 png 图像时都使用这些工具。

下面来介绍几种处理图像的方法，使图片更好的执行“线性过滤”。

1.色调分离

色调分离的优化方法已经广为人知。在 Photoshop 中打开样例图片，点击图层面板中的“

<div>[![](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/adj-layer.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/adj-layer.png)</div>”，并选择色调分离：

<div>[![](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/posterize-example.jpg)](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/posterize-example.jpg)</div>选择尽可能小的数值（通常40就够了）并保存图片：

<div>[![](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/original.png)](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/original.png)</div>原图：84K

<div>[![](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/original-posterized.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/original-posterized.png)</div>压缩后：53K

优化原理：有效的减少色彩数，合并相似的颜色，创建出色调区域，更好的执行“线性过滤”，得到高压缩率。

这种方法有一定的局限性，尤其是优化的图片与 html 背景融合的情况下须慎用（蓝色为 html 背景）。

2.多余的透明

看看下面的图片：

<div>[![](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/downside-posterize1.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/downside-posterize1.png)</div>75K

<div>[![](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/downside-posterize2.png)](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/downside-posterize2.png)</div>30K

两张图片都是用 Photoshop 导出的，而且没有经过任何优化。即使对比图中的每个像素，你都不会发现它们之间存在任何区别。但是为什么前者居然是后者的2.5倍大？

在探寻奥秘之前，你必须安装一个“Remove Transparency”的 Photoshop 插件才可以看到隐藏的细节。

在 Photoshop 中打开上面的两张图片，选择 Filer -> Photo Wiz -> Remove Trasparency。现在，你就可以看到保存在图像中的真实像素信息了：

<div>[![](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/dirty-tr-sample1-2.jpg)](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/dirty-tr-sample1-2.jpg)</div><div>[![](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/dirty-tr-sample2-2.jpg)](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/dirty-tr-sample2-2.jpg)</div>这是怎么回事？其实很简单。带 alpha 通道的真彩色图像每个像素都用了4个字节来表示：RGBA。最后一个是 alpha 通道，控制该像素透明度：值为0则完全透明，255则完全不透明。这意味着每一个像素（任何RGB值）只要 alpha 值设为0就可以完全隐藏。但是这些 RGB 数据仍然存在，而且，它不利于 PNG 编码器对数据流进行有效的封装和编码。因此，我们必须在导出图像前删除这些隐藏数据（例如上图中填充的黑色）。下面是一个比较便捷的方法：

1.在 Photoshop 中打开上面例子中第一张图片；

2.Ctrl+单击（Mac系统中为 ？+单击）图层面板中的缩略图，建立选区 -> 单击选择栏目 -> 选中反向。

<div>[![](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/dirty-qmask1.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/dirty-qmask1.png)</div>3.切换到快速蒙版模式，按Q键：

<div>[![](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/dirty-qmask2.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/dirty-qmask2.png)</div>4.我们已经建立了一个半透明图像的蒙版，但我们只需要完全透明的图像。图像 -> 调整 -> 阈值，并将阈值色阶滑到最右端，从而使选区完全透明：

<div>[![](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/dirty-qmask3.png)](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/dirty-qmask3.png)</div>5.退出快速蒙版模式（按Q键），并用黑色填充选区：

<div>[![](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/dirty-qmask4.png)](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/dirty-qmask4.png)</div>6.再次反选（选择 -> 反向），点击图层面板的“

<div>[![](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/mask-icon.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/mask-icon.png)</div>”图标，添加蒙版。

对于上述这些操作我们只须了解即可，因为png二次压缩工具内已经内置了该项操作。  
 3.透明分离

有时候因为图片中存在一些半透明像素，你不得不保存一个“重量级”的PNG-24文件。如果将此类图像一分为二，一部分是不透明像素，另一部分则为半透明，然后各以适当格式保存。比如你可以用 PNG-24 格式保存半透明像素，而不透明像素则用 PNG-8 甚至 JPEG 格式保存。这样操作下来在实际应用中你将会节省很大的图片流量。看一下实际案例：

<div>[![](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split-reference.png)](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split-reference.png)</div>PNG24 62K

1.在图层面板中 Ctrl+单击（或 ？+单击）图像缩略图建立选区：

<div>[![](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split1.png)](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split1.png)</div>2.在通道面板中选择“将选区存储为通道”：

<div>[![](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split2.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split2.png)</div>3.取消（Ctrl+D 或 ？+D）选区，选择新建的通道，然后打开阈值（图像 -> 调整 -> 阈值）。将滑块尽量向右拖动：

<div>[![](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split3.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split3.png)</div>4.我们已经为不透明的像素创建了蒙版。现在利用这个蒙版来分离原始图层。Ctrl+单击（或 ？+单击）alpha1通道，转到图层面板，选择原始图层层，打开图层 -> 新建 -> 通过剪切的图层。这样我们就分离出了不透明和半透明像素。

现在你需要将这两个文件分别存储为不同的文件格式：不透明像素保存为 PNG-8，半透明像素保存为 PNG-24。针对半透明像素图层你还可以使用色调分离技术让文件变得更小。

<div>[![](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split4_1.png)](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split4_1.png)</div>PNG-8 17KB

<div>[![](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split4_2.png)](http://media1.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split4_2.png)</div>PNG-24 色调分离（色阶=35） 6KB

最终对比结果：

<div>[![](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split-reference.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split-reference.png)</div>原图：63K

<div>[![](http://www.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split4_1.png)](http://www.smashingmagazine.com/wp-content/uploads/images/png-optimization-guide/split4_1.png)</div>优化后：23KB

优化后的图片大小几乎只有原图的1/3，在原来的基础上能够节省2/3的流量。但是这种方法有一个明显的缺点：将一个图片分成两个图片，增加了重构人员的工作量，减少图片大小的同时却又增加了 Http 连接数。

这里只是介绍些优化方法，在实际应用中请大家多去尝试，发现不同方法的应用规律，总结出来大家一起分享！

在原文中Sergey Chikuyonok提到还会有第二部分的内容，将进一步探讨更高层次的技术，会谈到灰度模式的图像，使用更少的颜色，降低细节，并讨论进一步优化 PNG 的小技巧，以及 PNG 优化的实例。让我们一起期待下一篇大作。



