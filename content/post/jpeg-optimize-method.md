+++
author = "daxingplay"
categories = ["jpeg", "优化"]
date = 2010-08-12T15:26:40Z
description = ""
draft = false
slug = "jpeg-optimize-method"
tags = ["jpeg", "优化"]
title = "JPEG图片优化方法"
aliases = [
    "/jpeg-optimize-method/"
]
+++


译文地址：[http://hi.baidu.com/jjmaxer/blog/item/aa4c5bdd0db825d08c102905.html](http://hi.baidu.com/jjmaxer/blog/item/aa4c5bdd0db825d08c102905.html)

原文地址：[http://www.smashingmagazine.com/2009/07/01/clever-jpeg-optimization-techniques/](http://www.smashingmagazine.com/2009/07/01/clever-jpeg-optimization-techniques/)

当人们讨论图像优化时，他们只注意到一些流行软件提供的那几个仅有的参数调节工具，例如“质量”滑块，颜色数调板，抖动等。此外，少数专门的软件，如OptiPNG和JPEGtran，设法压缩一些多余的数据来优化图像。所有这些都是非常有名的工具，它们为网页开发者和设计师提供简单直接的方法来优化图像。

在本文中，我们会向您展示一种不同的方法来优化图像，这种方法是源于“图像数据在不同图片格式中的储存原理”。我们从JPEG格式开始，这里有个基础技术称“8像素栅格” (原文：eight-pixel grid )

eight-pixel grid

就如你已知的，JPEG图像由一系列8px × 8px区块组成，当您吧JPEG的图像质量调的太低的时候，这些区块尤其明显。这些东西如何帮助我们优化我们的图像呢？请观察下面的例子：

<div>  
[![](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/bw-square.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/bw-square.png)</div>32×32 px, 图片质量:10（PS中），396 bytes

两个白色小方块都是8×8 px。虽然都是低质量，但右下角看起来失真更加的严重了（正如您预料的一样），而左上角的却非常的干净。这是怎么回事？要回答这个问题，我们需要看看这个衬在网格下的图像：

<div>  
[![](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/grid-block.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/grid-block.png)</div>正如你看到的，左上角的小方块正好对齐在“eight-pixel grid”，这样就确保小方块保持是锐利。

当保存的时候，图片会被分成许多的8×8 px的区块，而软件是对每一个区块进行独立优化的。由于右下方的方块并不匹配这些区块（也就是这个方块跨越了几个区块，正好落于区块的交接线上），优化器在寻找索引的时候就会在黑色和白色之间寻找平衡（在JPEG里，每一个8×8 px的区块都是依据正弦算法来进行编码的  
 原句：in JPEG, each 8×8 block is encoded as a sine wave）。这就解释了失真的原因了。许多专门的JPEG优化软件都有选择性优化的功能，它能根据图像的不同区域设置不同的优化质量，以达到保留更多图像信息的目的。

这项技术对在保存含有有矩形图形的图片时尤其有效。我们一起来看看在实际中是怎样应用的：

<div>  
[![](http://media1.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/8grid-bad.jpg)](http://media1.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/8grid-bad.jpg)</div>13.51 KB.

<div>  
[![](http://media1.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/8grid-good.jpg)](http://media1.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/8grid-good.jpg)</div>12.65 KB.

在第一个图像里，微波炉的位置是随机的，在保存第二个文件之前，我们把图像按照eight-pixel grid来对齐。质量一样都设置在55。让我们把图像放大看看（红线标示出区块的边界）

<div>  
[![](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/8grid-zoom.png)](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/8grid-zoom.png)</div>正如你看到的一样，我们只是调整好图片的位置就已经缩小了1kb的空间。当然，我们也把图片变得“干净”了！

优化颜色

这项技术相当复杂而且仅适用于某些类型的图像，不过我们会继续下去，我们只是学习它的道理。

首先，我们需要知道JPEG使用哪一种颜色模式。大多数的图片格式都是使用RGB颜色模式，但JPEG格式也可以是YcbCr，这是一种广泛用于电视的颜色模式。RGB类似于HSV模式（大多数设计师都熟悉HSV模式）。HSV由三部分组成，色彩（H），纯度（S），明度（V）。其中在这里最重要的就是明度（也称为亮度），优化图像的时候通常是压缩颜色通道，但尽可能保持高亮的亮度通道，因为人们对它最为敏感。Photoshop有一个叫Lab的颜色模式，这有助于我们对图像做出预处理，以便使JPEG优化有更好的效果。

我们继续使用微波炉来作为我们的例子。在微波炉的门上有一层很小的网纹，这是一个很好的例子来演示我们的优化颜色方法。经过一个简单的压缩后，图像质量调节到55，文件体积是64.39KB。

<div>  
[![](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/co-original-preview.jpg)](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/co-original-preview.jpg)</div>990×405 px, 图像质量: 55 (PS中), 64.39 KB.  
[浏览大图](http://media1.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/co-original.png)![](http://www.cssforest.org/faq/image/ext.gif)  
 在Photoshop中打开上面的大图，然后转换成Lab模式：图像>>图像>>Lab颜色。

Lab模式与HSV或YcbCr非常接近，但不完全相同。亮度通道包含了图像里的亮度信息。A通道显示了图像包含了多少的红色和绿色信息，而B通道则控制图像的黄色和蓝色部分。尽管有些区别，但这个颜色模式使我们避免了很多多余的颜色信息。

转到通道面板，查看A通道和B通道，这时候我们很明显能够看到网纹的纹理，并且我们能看到它是由三种不同亮度的色块组成的。

<div>  
[![](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/a-with-blocks.jpg)](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/a-with-blocks.jpg)</div>我们继续做一些颜色上的优化，为了保留原来的文件，先复制一份，这样在一个独立的窗口里编辑会非常有用。我们的目的在两个颜色通道里是光滑这些颗粒状的纹理。这样就能有更多简化的数据来让优化器处理了。你可能会奇怪为什么我们选择这样的一块区域（微波炉的门）来处理呢？很简单，因为这个部分是由黑色像素和橙色像素相间而成的。黑色意味着0亮度，这个信息已经被保留在了亮度通道里了。所以～如果我们在颜色通道里将这个区域完全变为橙色，我们将不会损失任何的信息。因为亮度通道决定了那些像素应该是黑色的，而在这样的纹理上，纯黑色和暗橙色则显得十分的含糊。（这里的意思大概是在亮度通道中的对比更强一些，容易看清楚）

转换到A通道，单独选择每一区块，为每个区块分别应用：滤镜>>杂色>>中间值，半径应该尽可能的小（直到纹理消失为止），这样不会损失太多的眩光效果。在此图中，第1区块半径应调节成4，第2区块为2，然后第3区块调节成4。现在，这个门看起来应该是这样的：

<div>  
[![](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/channel-a-blured-preview.jpg)](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/channel-a-blured-preview.jpg)</div>[浏览大图](http://media1.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/channel-a-blured.jpg)![](http://www.cssforest.org/faq/image/ext.gif)

现在，图片的饱和度比较低，我们需要去改善它。为了使颜色的变化能够实时地显示出来，所以这里我们复制一个活动窗口：窗口>>排列>>新建窗口。在新的窗口里，点击Lab通道查看图片，现在你的工作界面应该像下面这样了：

<div>  
[![](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/workspace.jpg)](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/workspace.jpg)</div>右边的是原始的图像，左边的是复制出来的副本，底下的是工作现在的工作空间。  
 在A通道里把三个区块都选择上，打开色阶窗口（Ctrl+L 或 图像>>调整>>色阶）。将中间的滑块向左边移动，这样副本里的微波炉的颜色就和原始的图像非常接近了（这里我把中间的滑块移到1.08的位置）。B通道进行同样的处理，现在的效果应该是这样的：

<div>  
[![](http://media1.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/optimized-preview.jpg)](http://media1.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/optimized-preview.jpg)</div>990×405 px, 图像质量: 55 (PS中), 59.29 KB  
[浏览大图](http://media1.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/optimized.jpg)![](http://www.cssforest.org/faq/image/ext.gif)

正如你所见，我们又减少了5 KB的大小（之前是64.39 KB）。虽然这项技巧看似非常得复杂麻烦，但是它仅需要你用上一分钟就能完成：转换到Lab颜色模式，选择颜色通道里的不同部分应用中间值滤镜，然后做一些饱和度修正。如前面说的一样，这个技巧比它的理论更来的有用，我常常使用这个技巧来调整一些大型广告图片，使他们看起来干净而锐利。

常规的JPEG优化技巧

本文将以以下的JPEG优化技巧作为尾声。

每次你选择压缩图片的时候，请仔细选择你的压缩软件，JPEG标准非常严格的，它只决定如何在转换的时候减少图片的体积，而软件的开发商却决定了该怎样正确利用JPEG优化器。（这里的意思大概是每个软件的优化算法都不同）

例如，有些商家使他们的软件做出做大程度的优化，允许您将文件压缩到很小的体积但依然保持高质量的设置，而photoshop则保存出来一个比这个大了一倍的文件。不要依赖这样的软件，每个软件都有他们的价值观来决定哪些信息是有用的，他们会根据这些标准来设定他们的优化算法。

唯一的判定标准是图像的质量和图像大小之间的比。如果你在Photoshop中保存一个质量55到60的文件，它可能跟在其他软件里把质量设置在80的时候输出的质量和体积差不多。

不要保存质量为100的图片。这个并不是最高质量的图片，只是一个数值上的优化底线，最终你会得到一个不合理的大文件。事实上把质量设置在95以上就已经足以防止丢失信息了。

记住，当你在Photoshop中把质量设置低于50的时候，它就会执行另一个叫做“降色采样（原文：color down-sampling）”的优化算法，它会在8个像素周围平均采样，这样会在边缘产生杂色：

<div>  
[![](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/q50.jpg)](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/q50.jpg)</div>48×48 px, 图像质量: 50 (PS中), 530 bytes.

<div>  
[![](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/q51.jpg)](http://media2.smashingmagazine.com/wp-content/uploads/images/jpg-optimization-techniques/q51.jpg)</div>48×48 px, 图像质量: 51 (PS中), 484 bytes.

因此，如果图片很小而且对比很大，建议在Photoshop中不要设置质量低于51。


