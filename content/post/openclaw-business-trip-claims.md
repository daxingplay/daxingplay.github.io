+++
author = "daxingplay"
categories = ["OpenClaw", "AI", "报销", "差旅"]
date = 2026-05-01T15:20:00Z
description = ""
draft = false
slug = "openclaw-business-trip-claims"
tags = ["OpenClaw", "AI", "报销", "差旅", "Telegram"]
title = "我的养龙虾经验之差旅报销"
aliases = [
    "/openclaw-business-trip-claims/"
]
+++

## 前言

春节前 OpenClaw 开始火起来，我刚看到就立刻产生了极大的兴趣，第一时间就开始折腾了。那段时间挺兴奋的，放假期间就一直在折腾这个，经常一弄就到夜里一两点。等各种配置都配得差不多以后，问题反而来了：

**到底让它帮我做什么？**

如果只是问答、总结网页、写几段代码，那当然也能用，但总觉得那跟 Chatbot 有啥区别，何必这么折腾，一点都不像是一个“个人助理”。真正的助理不应该只是在我打开聊天框的时候回答问题，而应该长期知道我在做什么、帮我处理那些反复发生又很烦的杂事。

我脑海里跳出来的第一个真实场景，是差旅报销。因为这两年我出差比较多，每次最麻烦的不是出差本身，而是回来报销。各种票据散落在不同地方：

- 12306 的电子发票在邮箱里；
- 酒店 folio 可能是前台给的 PDF，也可能是邮件附件；
- Uber、Grab、高德打车各有自己的邮件格式；
- 国内很多餐饮可以开电子发票；
- 海外 meal 往往只有纸质 receipt，只能拍照；
- 有些国家/地区还涉及外币、汇率、行程单和发票是否齐全的问题。

每次报销时，我都要重新翻邮箱、翻聊天记录、翻相册、对日期、改文件名、核金额。有时候一忙起来，就会堆积好几次报销一起报，这个时候就更花时间了，得每个票据仔细核对，生怕放到了错误的报销单里。这个事其实一点都不难，只要自己仔细就能做好，但就是很重复很花时间，所以它就应该被 AI 的工作流重构。

那么问题来了：

**能不能让 OpenClaw 帮我从“出差发生”开始，就把报销这件事一路接住？**

这听起来像是很“简单”的一个事情，不就是“让 AI 识别票据并生成表格”吗？但真正做起来之后我才发现，它完全不是一个简单任务。

因为一个真正可用的报销 agent，至少要回答三个问题：

1. **这张票属于哪次差旅？** 只看票据本身不够，它必须知道我的差旅明细。
2. **这张票据合不合格？** 国内电子发票、酒店专票+水单、海外餐厅小票、打车行程单，各有不同规则。
3. **怎么避免大模型幻觉？** 报销不是写作文，金额、日期、城市、发票错一个都会出问题被财务打回。

这篇文章想记录的，就是我怎么从一个“让 OpenClaw 帮我整理票据”的想法，一步步把它做成一条差旅报销工作流。

<!-- TODO screenshot: OpenClaw 主界面 / Telegram 里和 OpenClaw 对话的截图 -->

## 整体架构：不是一个功能，而是一条链路

最终我把这件事拆成了四个核心模块：

1. **Trip Planner**：先知道我有哪些差旅，哪天在哪个城市；
2. **Claim Intake**：从 Telegram、Gmail、文件里收集和解析票据；
3. **Export / Audit**：按某次差旅导出 claim.csv 和所有相关文件为 zip 包，并检查缺失和错误；
4. **Submit**：把整理好的材料录入内部报销系统。

这四个模块里面，最重要的其实是第一个：Trip Planner。

很多人一开始会把报销自动化理解成“票据识别”。但票据识别只解决了“这是什么”——比如这是一张 2026-03-23 的餐饮小票，金额 CNY 33。真正难的是“它应该去哪”——它属于哪次出差？是否在差旅日期内？城市是否匹配？这次出差是否允许这类费用？

所以整个系统的基础不是 OCR，而是一张可靠的 trip map。

另一个关键设计是：**用 skill 约束模型的行为，用 script 固化确定性逻辑。**

我不希望每次都让 LLM 自由发挥：“请帮我看看这张票怎么处理”。这种方式 demo 起来很快，但稳定性很差，比如对于同一个电子发票，如果单纯依赖 LLM 去读取，每次解析出来的内容可能都不太一样，每个费用的不确定性叠加起来之后，最后只能是一个灾难。所以后来基本形成了一个原则：

- 稳定规则写进 script；
- 操作流程写进 skill；
- LLM 负责调度、判断异常、补洞、做多模态理解；
- 最终状态落到 SQLite，而不是只存在聊天上下文里。

截至写这篇文章，我自己的这个项目已经有 200 多个 commit、180 多个文件、4 万多行内容。其中光是 trip-expense-claims 这一个 skill 就有 90 个 commit，里面有十几个 deterministic parser、一个 SQLite evidence DB（带 source/expense/attachment 三张表 + schema_meta，做过一次分 10 chunk 的迁移）、一组 audit 脚本、若干 reverse-engineering 出来的下载器，以及大约 350 多个 unit test。有意思的是，前期我还会认真看 AI 每个 commit 改了什么，后面迭代速度实在太快，已经变成“看测试、看审计结果、看最终产物”。这也是我对 agent 编程感受变化很大的地方：人不再逐行控制所有实现，而是在更高层控制目标、边界和验证方式。

<!-- TODO screenshot: 这里可以放一张整体架构图，展示 Trip Planner / Claim Intake / Export / Submit 四个模块 -->

## 第一关：先让它知道我哪天在出差

Trip Planner 最开始看起来很简单：读日历，找出差。比如让 LLM 读取日历里所有的 event，解析 event 的 location，看看是不是一个其他城市的地址，比如上海静安区XXX，那就认为这一天需要出差，然后根据每天有没有外地的行程，看是不是一个连续多日的出差。

但真实日历很快教我做人。

### 挑战一：日历事件并不标准

公司里不同的人创建会议的习惯完全不一样：

- 有人把城市写在 title；
- 有人写在 location；
- 有人写了其他分公司的会议室名字，被误识别为一个出差（其实我只用远程参加就好）；
- 有些 event 是 tentative；
- 有些取消的会议依然留在日历里。

如果让 LLM 去猜，短期看起来很聪明，长期一定会翻车。比如它把一个 tentative meeting 当成真实出差，后面的票据就可能匹配到一趟根本不存在的 trip。

后来我给 Trip Planner 加了很多硬规则：只信任结构化 location；通过代码的方式过滤 cancelled/tentative；必要时重新拉完整 ICS；对 organizer 做去重；对过去 trip 做保留，不能因为一次同步没扫到就删除。

但即便如此，真实世界总有例外。最后我接受了一个很朴素的方案：**dummy event + override**。所谓 dummy event，其实就是我在日历里额外建一个专门给 OpenClaw 看的事件(核心是标题和时间范围）。它不代表真实会议，而是代表“这几天我确实有一趟差旅”。override 则是另一种补丁：当某个真实 event 的 location 不够标准时（往往我不是会议组织者），我会在日历里复制这个 event 并填写正确的地点，告诉 Trip Planner 这条 event 应该怎么解释。比如把一个模糊的会议地点映射成高德地图上具体的地点，这样后续 Trip Planner 就能基于这个帮我进行路径规划。

虽然这两种方式看起来都不算优雅，但很可靠，而且不会花费很多时间，基本上就是顺手在手机上就能完成。对于个人助理系统来说，可靠比自动猜测更重要。

### 挑战二：JSON 文件不可靠

早期 trip map 是 JSON 文件。做 demo 很方便，但后面问题越来越多：

- 随着不断迭代，有些 trip 的字段可能缺失；
- 历史 trip 和未来 trip 容易混在一起；
- 日程更新时容易覆盖旧状态；
- 不同脚本读写 JSON 时容易产生不一致；
- 出错后很难知道到底是哪一步写坏了。

后来我跟 Claude Code 讨论了一下，把它迁移成了 SQLite，并且通过脚本的方式提供稳定查询接口，LLM 不直接“凭感觉读文件”，而是调用固定脚本查询：`trips_query.py` 提供 `find_by_date / find_matching_trips / get_trip` 等几个固定入口，写入则只能走 `trips_db` 的 upsert，LLM 既不能 SELECT 也不能 UPDATE 原表。

这里还做了几个看起来很琐碎、但救过命的硬约束：

- **Grace day 匹配**：票据日期落在 trip 起止日的 ±1 天也允许命中，处理跨日航班和 23:59 的发票时间；
- **Historical trip 保留**：日历同步只能 upsert 未来 trip，过去 trip 一旦 finalize，再也不会被一次失败的拉取删掉；
- **Tentative / cancelled 过滤**：在写入前由代码硬过滤，不交给 LLM 判断；
- **Trip ID 即邮件 Conversation Id 风格的不可猜值**：避免任何脚本拼出 ID 去做 side-channel 写入。

这个变化非常关键。因为从这里开始，Trip Planner 不再是一个临时中间文件，而变成了整个报销工作流的事实来源——后面所有 evidence 行都要带一个 `trip_id` 外键，没有匹配就显式记成 `unmatched`，不允许“先放着等以后再说”。

<!-- TODO screenshot: 这里可以放 trip detection / trip store 查询结果截图 -->

## 第二关：Claim Intake，真正的坑都在票据里

有了 trip map 以后，下一步就是收集票据。我设计了几种入口，核心目标是让收集票据这件事尽量贴近日常动作，而不是等到报销时再集中整理：

- Telegram topic：吃完饭拍照，直接发到指定话题，一些特殊 PDF 或历史材料也可以手动放进去；
- Gmail intake：电子发票、12306、Uber、酒店邮件从邮箱里抓。Gmail 这块我没有直接让 OpenClaw 去扫我整个主邮箱，而是给它单独准备了一个 Gmail 账号。主邮箱里符合规则的发票邮件被转发过去，再在那边打上 `Invoice` label，OpenClaw 只处理这个更干净的 inbox——并且所有 search 都被一个 `gog_client.py` 的 wrapper 统一加上 `label:Invoice` 前缀，env 里改 `GMAIL_INTAKE_LABEL` 才能放开。这样既减少隐私暴露，也降低搜索噪音；
- repair 流程：导出时发现缺东西，再回头补扫 Gmail 或历史保存下来但是未解析成功的文件。

整体来说，这部分花的时间最多，因为票据世界非常混乱。这里我后来尽量避免让 LLM 直接“看一眼然后给结论”，而是给不同来源写不同 parser：12306、Uber/Grab、高德、国内电子发票、酒店 folio、普通 receipt，都走各自更稳定的路径。

<!-- TODO 这里补充一下整体的 intake 流程 -->

### 12306：最规范，但也有坑

12306 算是最规范的。邮件、发票、行程信息相对稳定，parser 可以写得比较确定，invoice_number 直接当 strong key 用，去重几乎是零成本的。

但它也不是完全没有坑。比如退票、红字发票、手续费、补开、改签合票都要排除或特殊处理。曾经有一次 parser 看到“红字”就直接把内容判断成退款，结果一张正常的负数行项目让整张发票被丢掉。fix 是把红字判断收紧到“整张发票合计为负 + 标题包含‘红字发票’”两个条件同时成立，再加一组 fixture 回归测试覆盖：正常发票、纯红字、混合行项目、退票手续费 5 种场景。后来又把这种 fixture-driven test 推广到所有 deterministic parser。

这个案例让我意识到：**越是看起来规则明确的东西，越要把边界条件写进测试。** Parser 一旦上了量，所有“小概率分支”都会变成必发的事故。

### 国内电子发票：XML 是救命稻草

国内很多电子发票邮件里会带 XML、PDF、OFD 三种附件。PDF 给人看，OFD 是国家标准的电子发票格式（其实是个 zip + XML），真正的 XML 是给机器读。

早期如果只让 LLM/OCR 读 PDF，稳定性其实一般；后来我把重点转到 XML 解析上，发票代码、号码、金额、购买方、销售方地址、IssueTime、价税合计这些核心字段基本都能稳定拿到。再配合一个 `canonicalize_city()` 把发票里的 `深圳市宝安区...` 别名前缀映射回标准的 `Shenzhen`，就可以让 evidence 的 city 字段和 Gemini 出来的英文城市名对齐，不至于同一笔费用 city 一会儿是中文、一会儿是英文导致 group 不到一起。

最终导出时，同一笔费用如果同时存在 PDF/OFD/XML，会按 `pdf > ofd > xml` 选一份给财务（人要看的是 PDF），但 expense_key 仍然来自 XML 里的 `InvoiceNumber`，保证去重命中率。

所以这里的经验很明确：只要有结构化数据，就不要迷信多模态。多模态是 fallback，不是第一选择。

### Uber：HTML 邮件 + 转发 + 营销文案的三连击

Uber 看起来该跟 12306 一样规整，但实际是 deterministic parser 里被反复 fix 的那一档。它有几个重叠的坑：

- 收据是 HTML 邮件，正文里穿插 `<style>` / `<script>` 块，naive 取 text 会把 CSS 一起塞进去。后来 `_SimpleHTMLText` 专门 strip 掉 style/script，并对所有 block-level 标签 emit 换行；
- 转发 Uber 收据时，HTML body 顶部会被加一段 “From: ... Date: ... Subject: ...” 的 wrapper。之前 parser 抓到的是 wrapper 上的 `Date`（也就是转发那天的日期），结果 2 月 4 号的 ride 被记成 4 月 4 号；fix 是同时对 plaintext 和 HTML 走一遍 `_unwrap_forwarded`，砍掉 wrapper 行；
- pickup / dropoff 抽取以前是宽松的“两行连续地址”，结果把 “HK) → switch your payment method?” 这种营销文案当成路线。后来改成必须有 `Pickup` / `Drop-off` label 的行，且地址不能命中 CTA 动词黑名单（switch / update / confirm / verify / view ...）；
- 香港 Uber 的金额是 `HK$`，需要单独识别成 `HKD`，否则会被 fallback 当成 USD。

每一条都对应一个真实费用被错处理的事故，每一条都有 fixture 回归测试。**所有“脆弱字段”最后都用 fixture 锁死**，是这个 parser 给我留下最深的工程习惯。

### Telegram 小票：不是“收到图片”这么简单

海外 meal 很多只有纸质 receipt。我的理想流程是：吃完饭，拍照，发到 Telegram 的某个报销 topic，OpenClaw 自动记录。

一开始这个流程很不稳定。有时候我发一张小票，它会问：“这张图片是干嘛的？”

这其实很合理。站在一个通用聊天机器人的角度，它并不知道这个 topic 的语境。后来我发现可以在 `openclaw.json` 里给特定 Telegram topic 配 system prompt，把这个话题定义成 expense intake channel。之后它就稳定很多：收到图片就按票据处理，而不是把它当成普通聊天图片。

这也是 skill/system prompt 的价值：它不是让模型“更聪明”，而是让模型在正确的场景里做正确的事。

附带一个相关的 trick：海外 Uber / Grab 的“收据”有时候只是一封邮件正文，没有 PDF 附件——但财务系统要的是文件。后来加了一个 `render_gmail_pdf.py`，对这一类 body-only 的 receipt parser 调 `google-chrome --headless --print-to-pdf` 把邮件正文（去掉转发 wrapper）渲染成一个 `<msg_id>_invoice_itinerary.pdf`，挂到对应 evidence row 上当 attachment。条件控制得很死：parser 在 body-receipt 集合里 + 邮件本身没有任何 attachment 才触发，避免给真正带 PDF 的 e-hailing 邮件再生一个多余 body PDF。

### 酒店 folio：最难处理的一类

酒店材料是我花时间最多的地方之一。

因为酒店报销往往不只是一个发票。可能需要：

- invoice；
- folio / 水单；
- check-in / check-out 日期；
- 房费、税费、服务费拆分；
- 有时还要和 trip 的住宿日期对齐。

而且酒店 folio 格式极其不统一。英文里可能叫 check-in date / arrival / stay period，中文里可能是入住日期/离店日期，香港或台湾酒店还可能出现繁体中文。很多 PDF 文本层也不干净，普通 parser 抽不到关键字段。

最后我用了 Gemini 多模态来解析这类材料，把它作为酒店 folio 的 fallback。确定性 parser 能处理的先处理，处理不了的再交给多模态。Gemini 这边专门定义了一个 `GeminiFolioResult`：除了金额、日期，还要它返回 `folio_number / hotel_name / city / check_in / check_out`，方便后面跟 invoice 配对。

配对是在 expense 这一层做的：folio 和 invoice 各自是独立的 evidence row，通过一个 `expense_group_id = sha256(hotel|city|amount|currency)[:16]` 把它们绑成一个 expense。导出时 group 内的 row 会折叠成一行，但所有 evidence 文件都保留并按 kind（folio / invoice）分桶，财务系统那边一行一笔费用，附件按种类提交。

这样既保留稳定性，也能覆盖真实世界里那些乱七八糟的扫描件。

### Baiwang 发票：一次很典型的 reverse engineering

最让我印象深的是 Baiwang 的发票。

它不是直接在邮件里给一个附件，而是给一个链接。点进去以后是一个 Vue 页面，要等前端渲染完，再点击下载 PDF。

如果用 browser automation，当然也能做：打开网页、等待、点击下载。但这太脆弱了。页面慢一点、按钮变一下、登录态失效，都可能失败。

后来我让 Claude Code 去做 reverse engineering。它没有停留在“模拟人点击页面”，而是先抓 network panel，再去读前端 JS bundle，顺着接口调用和参数生成方式往下找。中间还踩过一个很有意思的坑：邮件正文的 plaintext 版本会把那个超长的下载 URL 在某个字符截断，导致参数残缺；HTML 版本反而是完整的——所以 parser 后来固定从 HTML body 里提 URL，而不是 plaintext。

最后它发现下载链接其实可以从邮件里的参数（`invoiceCode / invoiceNumber / token`）拼出来，真正的下载入口是 `/bwmg/mix/bw/downloadFormat`，前端那一堆 Vue 路由只是包装。整个流程就被压缩成一个 `extract_baiwang_invoice.py`：拿邮件 → 解参数 → curl 下载 PDF/XML → 走 XML parser 抽 InvoiceNumber 当 strong key。从“headless Chrome + 等 5 秒 + click” 缩成不到 200ms 的 HTTP 调用。

这个例子很能代表 agent 的新工作方式：不是“让 AI 代替人点网页”，而是让它理解网页背后的机制，把一次浏览器操作升级成一个稳定脚本。**Browser automation 是最后退路，不是默认选项。**

### 去重与 Evidence DB：把“文件整理器”升级成“证据系统”

去重是后面才意识到的大坑。

同一笔费用可能有多个来源：

- Gmail 里有一封邮件；
- 邮件里有 PDF、XML、OFD 多个附件；
- Telegram 里我又转发了一遍；
- 酒店 invoice 和 folio 分两封邮件；
- repair 时又从 Gmail 重新扫出来一次。

如果简单用文件 hash 去重，很快就不够了。因为不同附件可能代表同一笔费用；反过来，同一封邮件也可能包含多笔费用。

后来重新设计了一套 evidence DB，三张表 + schema_meta：

```
evidence            (evidence_id, key_strength, expense_group_id, trip_id,
                     parser_name, confidence, date, amount, currency, city,
                     merchant, invoice_number, extra JSON, ...)
evidence_source     (source_ref PK, evidence_id FK, source_type, status,
                     gmail_message_id, telegram_message_id, ...)
evidence_attachment (attachment_id PK, evidence_id FK, source_ref, kind,
                     original_filename, saved_path, sha256, is_primary)
```

关键不在于这几张表本身，而在它们背后的几条规则——这些规则后来都写进了 `evidence_upsert.py`，所有 intake 路径只能通过这个唯一入口写库：

- **source_ref 是稳定锚**：同一个 Gmail message id 或 Telegram message id 再被处理一次，永远 UPDATE 不 INSERT。哪怕 expense_key 变了，也是去 re-key 那条 evidence，不会留下重复 source 行。
- **key_strength 分两档**：parser 算出 InvoiceNumber 之类的就是 `strong`，只能用文件 sha256 兜底就是 `fallback`。strong key 跨 source 可以合并；fallback key 跨 source_type 永远不合并，必要时还会 salt evidence_id 防撞。
- **status 状态机**：写入时 strong key → `ok`，fallback key → `pending_key`。等到后续有 strong parser 出结果，会被自动 promote 到 `ok` 并把 evidence row 合并过去。
- **置信度加权 merge**：高置信度 parse overwrite 非空字段，低置信度只填 None 的洞，`extra` JSON 浅合并。同一笔费用被多个 parser 看到时，结果是单调收敛的。
- **expense_group_id**：把 hotel folio + 发票、e-hailing 行程单 + 发票、Uber charge summary + receipt 这种“同一笔费用的多张证据”绑成一个 group，导出时折叠成一行。

这套设计其实是分 10 个 chunk、跨 1 周迁移上去的：chunk 1 只放 schema 和 state path，chunk 2 写纯函数 upsert + 18 个测试，chunk 3 让所有 parser 输出 expense_key，到 chunk 4/5 才开始让 Gmail / Telegram intake 真正写库，chunk 6 写一个 rebuild-from-source 的迁移脚本，chunk 7 让 export 从 DB 而不是 claim.csv 取数，chunk 8/9 加 reconcile 和 integrity audit。每个 chunk 都自带测试，main 分支始终能跑。在一个全是 LLM 写代码的项目里，这种节奏是少数能让我睡得着觉的工程实践之一。

这一步让系统从“文件整理器”变成了“证据系统”，所有的文件都会被记录到数据库里，而不是直接写入最终的导出文件。`claim.csv` 不再是事实来源，而只是最终导出的一个视图。所有 LLM 操作都必须经过 skill 里的脚本——LLM 不能 SQL，只能调函数。

### Trip 路由：用“事实日期”而不是“到达日期”

这里有一个看起来很小但被反复踩到的坑：**应该按什么日期把一张票路由到 trip？**

最早是用邮件接收日期。后果是：3 月 31 日的 e-hailing 发票要 4 月 5 日才到邮箱，结果被分到了 4 月那次出差，金额对得上、城市对得上，肉眼几乎查不出来。

后来强制改成 parser 抽出来的 ride/stay/issue 日期。e-hailing 这边的日期优先级被固定成：

```
itinerary PDF 里 Gemini 看到的“用车时间”
    > 邮件正文里“用车时间”/“行程时间”关键词
    > XML <IssueTime>
    > 自由文本日期 fallback（最后兜底）
```

itinerary PDF 出现时直接 override 一切，因为它是最接近“费用真实发生时间”的来源。同一时期还加了 `reroute_evidence_trip.py --audit --verify`：扫一遍所有 ride evidence，把存储日期跟 itinerary PDF 里 Gemini 抽出来的日期对比，不一致就标红。这个工具帮我抓出过几条历史迁移留下的“盖了 trip 日期戳”的脏数据。

<!-- TODO screenshot: 这里可以生成一张图片，表示整个流程 -->

## 第三关：Export，不只是打包，而是审计

Export 相比 intake 看起来简单：用户说“帮我导出某次 trip”，系统生成 `claim.csv`，把相关 evidence 打包成 zip，再发回 Telegram。

但这里也踩过很多坑。

早期依赖 JSON trip plan 时，导出经常遇到一些奇怪问题：字段缺失、历史 trip 查不到、future trip 和 historical trip 混淆、某天的一日往返被多日 trip 覆盖。后来通过 SQLite trip store + query script，导出逻辑稳定了很多。

现在我可以在 Telegram 里直接说“导出某一天/某一次出差的报销材料”。OpenClaw 会先把这个自然语言请求解析成具体 trip，再从 evidence DB 里重新生成 `claim.csv` 和 zip 包。

<!-- TODO screenshot: 这里可以放 Telegram 里请求导出、OpenClaw 返回 zip 的截图 -->

这里我特意保留了 audit 步骤：导出不只是把文件打包，而是要检查证据是否完整、日期城市是否匹配、某些文件是否重复。Audit 一共有几类 finding：

- `pending_key`：还停在 fallback key 的 evidence，提示可能缺 strong parser；
- `outside_window`：ride/stay 日期落在 trip 日期之外；
- `missing_invoice` / `missing_itinerary` / `missing_folio`：按 region + category 查 claim_rules 缺哪类附件；
- `blob_missing` / `blob_checksum_mismatch`：底层 blob store 的 integrity 检查；
- `schema_version_drift`：schema_meta.version 跟代码里 `SCHEMA_VERSION` 对不上时拒绝导出。

最后拿到的不是一个“看起来像报销包”的文件夹，而是一个有审计结果支撑的交付物。

CSV 里也专门为这个分类做了改动：原本只有一个 `evidence_file` 列堆所有附件，后来拆成 `invoice_file / itinerary_file / folio_file` 三个独立列，每列只放一个文件，按 `pdf > ofd > xml` 选优。这样下游提交 agent 不用再 split string、做 mime 判断，直接一列对一个上传位。

附件分类时还有一个很 subtle 的规则：filename 推断 evidence kind 时，中文 token（行程 / 发票 / fapiao）匹配字符串任意位置，但英文 token（`_invoice` / `_itinerary` / `_folio`）必须前后是下划线边界。原因是 Gmail 里太多附件就叫 `invoice.pdf`，宽匹配会把所有 PDF 都误标成 invoice。一个边界条件搞错过两次，最后才放进 fixture 测试里。

<!-- TODO screenshot: 这里可以放 claim.csv / zip 目录结构 / audit summary 截图 -->

## 第四关：Submit，最后一公里永远最脏

最后一步是提交到内部报销系统。

这部分因为涉及公司内部系统，就不展开具体细节了。大概思路是：先让 OpenClaw capture 正常提交过程里的浏览器请求，再让大模型分析这些请求之间的关系。哪些字段来自表单，哪些字段来自前置接口，哪些步骤只是前端校验，拆清楚以后再写成 skill。这里我用了 Qoder work 配合 browser automation 一类方式去探索内部系统，让模型去寻找页面上如何发起请求完成相应的操作，因为很多录入和校验其实可以直接调用页面背后的 API 完成，比 UI 自动化稳定得多。

但文件上传没有完全搞定。模型一直判断是被内部安全系统拦截，直接 API 上传很难稳定复现浏览器里的完整状态。最后还是需要回到 UI automation：打开页面、选择文件、上传、检查状态。这也很真实。agent 做企业系统自动化，不是“有 API 就万事大吉”。它必须能在 API、browser、文件系统、人工确认之间切换。能 API 就 API，不能 API 就像人一样操作浏览器。

## 我真正学到的东西

做完这一轮，我对 agent 的理解变化挺大。

### 1. 未来系统一定会 API 化和 CLI 化

这次最明显的感受是：凡是有 API、有 CLI、有结构化数据的地方，agent 就能稳定工作；凡是只有复杂 UI、没有稳定接口的地方，就很痛苦。

这个趋势我觉得不可逆。未来如果一个系统完全不考虑 agent 访问方式，它就会越来越难被自动化，也越来越难进入新的工作流。

当然 API 不一定是免费的。相反，我觉得高质量 API 会成为新的内容和能力变现方式。比如这次 trip planning、地点解析、汇率查询，我都愿意调用付费 API，因为它们提供的是稳定、准确、可验证的能力。

### 2. Skill 的本质是 SOP，不是 prompt 魔法

这次也让我更确信：skill 不是“写一段很长的 prompt”。

真正可靠的 skill，背后一定有成熟 SOP：收到什么输入，先检查什么，调用哪个脚本，状态写到哪里，失败怎么标记，什么时候需要人工确认。

如果人类自己都没有稳定流程，直接把一堆混乱经验塞给模型，只会得到一个看起来很聪明但不可靠的系统。

不过 skill 的测试依然是难题。代码可以写 unit test，parser 可以做 fixture，但一个完整 skill 涉及模型行为、工具调用、外部系统、聊天上下文，怎么系统性测试还没有特别成熟的答案。

### 3. 代码没有消失，但人和代码的关系变了

这个项目里已经有 200 多个 commit、4 万多行内容。前期我还会认真看每个 diff，后来实在看不过来了。

但这不代表代码不重要。恰恰相反，代码更重要了：确定性逻辑必须靠代码固化，状态必须靠数据库保存，审计必须靠脚本检查。

变化在于，人不再需要逐行控制所有代码。我的注意力更多放在：

- 目标是否定义清楚；
- skill 的边界是否正确；
- 状态模型是否可靠；
- audit 能不能发现问题；
- 最终产物是否能被人类复核。

这有点像从“亲手拧每颗螺丝”变成“设计流水线和质检标准”。

### 4. 让 LLM 写代码，但用工程纪律收住它

让 Claude Code 这种 agent 帮我写代码确实快，但越写越发现：放任它一把梭，仓库会很快变成一个“看起来都对、跑起来都不太对”的状态。这个项目里我逼自己保住的几条纪律：

- **大改造分 chunk**：evidence DB 那次重写硬切成 10 个 chunk，每个 chunk 一个 PR，自带测试，main 分支始终 green。LLM 一次想改 10 个文件的时候，强制让它先只改 schema；
- **fixture-driven parser 测试**：每个真实事故必须留一份脱敏 fixture 和一个会失败的测试，再去 fix。否则同一类 bug 会在 LLM 重写代码时悄悄复发；
- **状态只允许通过脚本写**：LLM 永远不直接 SQL、不直接改 JSON、不直接 rename 文件，所有变更走 `evidence_upsert` / `trips_db.upsert` / `reroute_evidence_trip` 这种带不变量检查的入口；
- **Audit 不只是报告**：`integrity_audit` / `reroute --audit --verify` 这类脚本在 export 前必跑，发现 schema drift / blob_missing / date_mismatch 直接拒绝出包，宁可中断流程也不交出可疑数据。

agent 越能干，越要把这些“看起来很重”的工程脚手架立起来。否则你最后会得到一坨速度极快的技术债。

### 5. 个人助理最有价值的不是聪明，而是可靠

报销这个场景一点也不炫酷。它没有科幻感，也不会让人惊呼 AGI。

但它很真实。

它需要 agent 长期记住我的日历、理解我的出差、接住我随手发的票据、从邮箱里找附件、知道哪些证据合格、导出时能审计、出错时能留下线索。

这才是我心目中个人助理应该做的事。

不是每次都完美回答一个问题，而是长期维护一条工作流。

## 小结

一开始我以为这是一个“AI 帮我报销”的小项目，写几个 skill 就能搞定。后来才发现，它真正的难点不是识别一张票据，而是让 agent 稳定维护一条长期工作流。

这条工作流里有日历、邮箱、Telegram、PDF、图片、数据库、汇率、审计、内部系统提交。每个点都不复杂，但只要串起来，就会遇到大量真实世界的不确定性。

我最大的收获是：agent 要真正有用，不能只靠模型聪明。它需要清晰的 SOP、稳定的工具、可持久化的状态、能复核的审计结果，以及在失败时留下线索的能力。

OpenClaw 让我觉得有趣的地方也在这里。它不是把某一个步骤变得更快，而是能够把这些零散流程一点点组织成自己的自动化系统，配合上聊天式的自然交互，能真正地提升效率，帮你处理一些杂事，成为你的个人助理，这可能才是我最兴奋的地方。
