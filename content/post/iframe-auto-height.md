+++
author = "daxingplay"
categories = ["iframe"]
date = 2010-08-11T08:49:17Z
description = ""
draft = false
slug = "iframe-auto-height"
tags = ["iframe"]
title = "iframe自适应高度的解决办法"
aliases = [
    "/iframe-auto-height/"
]
+++


这篇文章转载自口碑网UED的博客。作者为大米。在开发中遇到这个问题，于是转载过来收藏。

这贴比较长，没有耐性的朋友请直接拖到帖子末尾的代码示例，或者直接去玩我提供的Demo。

Demo页面：主页面 [iframe_a.html](http://ued.koubei.com/wp-content/iframe_a.html "iframe_a.html") ，被包含页面 [iframe_b.htm](http://ued.koubei.com/wp-content/iframe_b.html "iframe_b.html") 和 [iframe_c.html](http://ued.koubei.com/wp-content/iframe_c.html "iframe_c.html")

下面开始讲：

通过Google搜索iframe 自适应高度，结果5W多条，搜索iframe 高度自适应，结果2W多条。  
 我翻了前面的几十条，刨去大量的转载，有那么三五篇是原创的。而这几篇原创里面，基本上只谈到如何自适应静的东西，就是没有考虑到JS操作DOM之后，如何做动态同步的问题。另外，在兼容性方面，也研究的不彻底。

这篇文章，希望在这两个方面再做一些深入。

可能有人还没接触到这个问题过，先说明一下，什么是自适应高度吧。所谓iframe自适应高度，就是，基于界面美观和交互的考虑，隐藏了iframe的border和scrollbar，让人看不出它是个iframe。如果iframe始终调用同一个固定高度的页面，我们直接写死iframe高度就可以了。而如果iframe要切换页面，或者被包含页面要做DOM动态操作，这时候，就需要程序去同步iframe高度和被包含页的实际高度了。

顺便说下，iframe在迫不得已的时候才去用，它会给前端开发带来太多的麻烦。

传统做法大致有两个：  
 方法一，在每个被包含页在本身内容加载完毕之后，执行JS取得本页面的高度，然后去同步父页面的iframe高度。  
 方法二，在主页面iframe的onload事件中执行JS，去取得被包含页的高度内容，然后去同步高度。  
 在代码维护角度考虑，方法二是优于方法一的，因为方法一，每个被包含页都要去引入一段相同的代码来做这个事情，创建了好多副本。

两个方法都只处理了静的东西，就是只在内容加载的时候执行，如果JS去操作DOM引起的高度变化，都不太方便。

如果在主窗口做一个Interval，不停的来获取被包含页的高度，然后做同步，是不是即方便，又解决了JS操作DOM的问题了呢？答案是肯定的。

Demo页面：主页面 [iframe_a.html](http://ued.koubei.com/wp-content/iframe_a.html "iframe_a.html") ，被包含页面 [iframe_b.htm](http://ued.koubei.com/wp-content/iframe_b.html "iframe_b.html") 和 [iframe_c.html](http://ued.koubei.com/wp-content/iframe_c.html "iframe_c.html")

主页面代码示例：

<script type="text/javascript"><!--mce:0--></script>

一直执行，效率会不会有问题？  
 我做了测试，同时开5个窗口（IE6、IE7、FF、Opera、Safari）执行这个代码，不会对CPU有什么影响，甚至调整到2ms，也没影响（基本维持在0%占用率）。

下面谈谈各浏览器的兼容性问题，如何获取到正确的高度，主要是对body.scrollHeight和documentElement.scrollHeight两个值得比较。注意本文用的是HTML 4.01的doctype，不同的doctype应该不会影响结果，但是假如你的页面没有申明doctype，那还是先去加一个吧。

在主页面追加以下测试代码，以输出这两个值，代码示例：

<div><button onclick="checkHeight()">Check Height</button></div><script type="text/javascript"><!--mce:1--></script>

被加载页面，可以切换一个绝对定位的层，来使页面高度动态改变。如果层展开，则会撑高页面高度。代码示例：

<div><button onclick="toggleOverlay()">Toggle Overlay</button></div><div style="position: relative; height: 160px;"></div><script type="text/javascript"><!--mce:2--></script>

下面列出以上代码在各浏览器的测试值：  
 （bHeight = body.scrollHeight, dHeight = documentElement.scrollHeight, 红色 = 错误值, 绿色 = 正确值）

<table border="1" cellspacing="0" width="100%"><thead><tr><th rowspan="2">/</th><th colspan="2">层隐藏时</th><th colspan="2">层展开时</th></tr><tr><th>bHeight</th><th>dHeight</th><th>bHeight</th><th>dHeight</th></tr><tr><td>IE6</td><td>184</td><td>184</td><td><span style="color: #ff0000;">184</span></td><td>303</td></tr><tr><td>IE7</td><td>184</td><td>184</td><td><span style="color: #ff0000;">184</span></td><td>303</td></tr><tr><td>FF</td><td>184</td><td>184</td><td><span style="color: #ff0000;">184</span></td><td>303</td></tr><tr><td>Opera</td><td>181</td><td>181</td><td>300</td><td>300</td></tr><tr><td>Safari</td><td>184</td><td>184</td><td>303</td><td><span style="color: #ff0000;">184</span></td></tr></thead><tbody></tbody></table> 

暂且无视Opera比别人少3像素的问题…可以看出，如果没有绝对定位的东西，两个值是相等的，取哪个都无所谓。  
 但是如果有，那么各个浏览器的表现不太相同，单取哪个值都不对。但可以找到了一条规律，那就是取两个值得最大值可以兼容各浏览器。所以我们的主页面代码就要改造成这样了：

 function reinitIframe(){var iframe = document.getElementById("frame_content"); try{ var bHeight = iframe.contentWindow.document.body.scrollHeight; var dHeight = iframe.contentWindow.document.documentElement.scrollHeight; var height = Math.max(bHeight, dHeight); iframe.height = height; }catch (ex){} } window.setInterval("reinitIframe()", 200);

这样子，基本解决了兼容性问题。顺便说下，不光绝对定位的层会影响到值，float也会导致两个值的差异。

如果你演示Demo后，会发现，除了IE，其他浏览器中，当层展开后再隐藏，取到的高度值还是维持在展开的高度303，而非隐藏回去的真正值184，就是说长高了之后缩不回去了。这个现象在不同被包含页面之间做切换也会发生，当从高的页面切换到矮页面的时候，取到的高度还是那个高的值。  
 可以归纳为，当iframe窗体高度高于文档实际高度的时候，高度取的是窗体高度，而当窗体高度低于实际文档高度时，取的是文档实际高度。因此，要想办法在同步高度之前把高度设置到一个比实际文档低的值。所以，在iframe的添加 onload=”this.height=100″，让页面加载的时候先缩到足够矮，然后再同步到一样的高度。  
 这个值，在实际应用中决定，足够矮但又不能太矮，否则在FF等浏览器里会有很明显的闪烁。DOM操作的时候主页面无法监听到，只能DOM操作完了之后把高度变小了。  
 在我的一个实际项目中，在成本和收益之间权衡，我并没有做这个事情，因为每个DOM函数中都要插入这个代码，代价太高，其实层缩回去不缩掉也不是那么致命。包括Demo里，也没有去做这个事情。如果读者有更好的方法，请告诉我。

这是最终的主页面的代码：

<script type="text/javascript"><!--mce:3--></script>

附Demo页面： 主页面 [iframe_a.html](http://ued.koubei.com/wp-content/iframe_a.html "iframe_a.html") ，被包含页面 [iframe_b.htm](http://ued.koubei.com/wp-content/iframe_b.html "iframe_b.html") 和 [iframe_c.html](http://ued.koubei.com/wp-content/iframe_c.html "iframe_c.html")

如果只考虑FX和IE，并且，iframe里面内容也不进行DOM操作，那仍然可以用最简单的传统处理方式：

<iframe frameborder="0" id="frame_content" onload="this.height=this.contentWindow.document.documentElement.scrollHeight" scrolling="no" src="iframe_b.html"></iframe>




