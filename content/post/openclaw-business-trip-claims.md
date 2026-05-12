+++
author = "daxingplay"
categories = ["OpenClaw", "AI", "报销", "差旅"]
date = 2026-05-12T10:00:00Z
description = "把差旅报销这件事彻底交给 agent：从 trip map、证据数据库到下游 submit agent 的完整工程实录，以及那些把 demo 撑成可用系统的真实坑。"
draft = false
slug = "openclaw-business-trip-claims"
tags = ["OpenClaw", "AI", "报销", "差旅", "SQLite", "Gemini", "Telegram"]
title = "我的养龙虾经验之差旅报销"
aliases = [
    "/openclaw-business-trip-claims/"
]
+++

我用 OpenClaw 给自己写了一套差旅报销系统。它现在能从我出差结束那天起，自己把发票、行程单、酒店 folio、小票照片从 Gmail 和 Telegram 里收拢起来，按照公司的报销规则拼成一张 claim 表，打包发到我的手机上，最后再交给另一个 agent 去公司内网填表。

到今天为止，trip-expense-claims 这一个 skill 已经 110+ commit、12 个 parser、3 次 schema 演进、394 个单测。这篇文章想把这段过程从工程角度讲清楚——不只是它最后长什么样，更包括途中那些我没想到的坑、被推翻又重写的设计、以及为什么这个看起来像"AI 帮我做 OCR"的事，其实是一个数据一致性问题。

## 这事到底有多麻烦

一次两天的出差能产生 10~30 份证据，覆盖 6 种来源、3 种主流格式，分散在 2~4 周里陆续到达：

- Baiwang 通用电子发票：PDF + OFD + XML 三件套，邮件正文是一个下载链接；
- 12306 火车票发票：带 InvoiceNumber，偶尔会有红字冲红；
- 高德 / 曹操 / 滴滴的网约车：一张发票 + 一张行程单 PDF，必须两份齐全；
- 酒店 folio：万豪、喜来登的水单 PDF，国内的还需要配一张 Baiwang 增值税专票；
- Uber / Grab：纯 HTML 邮件正文，没有附件；
- Telegram 里来的小票照片：海外餐饮、停车票、地铁卡截图。

公司的报销系统对这些证据的要求又不统一。国内餐饮必须电子发票，照片只能用来匹配；国内酒店必须 *电子发票 + folio* 两份；国内打车必须 *电子发票 + 行程单* 两份；香港地铁、出租车允许 screenshot，但酒店仍要 folio；国际基本只要 receipt 加翻译。漏一个 folio → 整张单驳回，重走一周；两笔重复 → 被风控标记；上海的打车单算到深圳的差旅里 → 这张已提交的报销单几乎没法改，只能整单退掉重做。

所以这个事看起来像 OCR，骨子里是 **怎么把一堆来源不可信、格式各异、时间跨度大的证据，在截止时间之前收拢成一张干净的 claim 表**。

## 整体架构：四个模块，一条状态主线

最终我把这件事拆成四个模块：

1. **Trip Planner**——先知道我哪几天在哪个城市；
2. **Claim Intake**——从 Telegram、Gmail、文件里收集和解析证据；
3. **Export / Audit**——按 trip 导出 claim.csv 和 zip 包，并审计缺失；
4. **Submit**——把整理好的材料录入公司内部报销系统。

但比拆模块更关键的是一条贯穿四个模块的设计原则：**所有最终产物都是派生物，所有事实只活在一个可查询的状态库里**。

具体来说，trip map 不是 JSON 文件，是 SQLite 里的 `trips` 表；证据不是 trip 文件夹里的一堆 PDF，是 SQLite 里的 `evidence` / `evidence_source` / `evidence_attachment` 三张表；claim.csv 也不是手工维护的 ledger，是每次导出从数据库重新生成的报表。这条原则听起来很朴素，但在 v1 里我就是没做到，然后吃了大亏。

另一条原则是 **稳定逻辑写进 script，调度逻辑写进 skill**。

我不希望 LLM 每次都自由发挥"请帮我看看这张票怎么处理"。这种 demo 跑得快，但稳定性极差——同一张电子发票，纯靠 LLM 读，每次提取出来的金额、商户、日期可能都有微小差异，叠加几十张证据之后报销单就废了。所以现在的格局是：

- 解析、去重、合并、审计——全是确定性 Python 脚本；
- skill 只负责"什么时候调哪个脚本""异常时怎么追问"；
- LLM 担任调度者 + 多模态兜底（看 PDF、识小票照片）；
- 状态全部落在 SQLite，不依赖聊天上下文。

后面每一节都在用这两条原则。

## Trip Planner：基础设施，不是一个功能

很多人第一次想"AI 报销"，会把它理解成票据识别。但识别只解决了"这是什么"，没解决"它应该去哪"。

一张 2026-03-24 的港币 248 元餐饮小票——它属于哪次出差？是否在差旅日期内？城市匹配吗？这次出差是否允许这种 expense？这些问题的答案都不在小票上，而在 trip map 里。所以 Trip Planner 不是一个功能，它是整个系统的"事实主轴"。

最早 trip map 是一个 JSON 文件，靠 LLM 读日历生成。看着很现代，但很快暴露了问题：字段经常缺；历史 trip 和未来 trip 容易混；backfill 时容易覆盖旧状态；多个脚本同时读写时容易跑出不一致；出错以后基本看不出来是哪一步写坏的。

后来把它迁到了 SQLite，配套写了一个查询 CLI，所有读写都走它。LLM 不再"凭感觉读 JSON 文件"，而是调用 `trips_query.py` 问"某天有哪些 trip"或者"某个 trip 的窗口和城市是什么"。从这步开始，Trip Planner 才真正成了底座。

但底座再硬，也得面对真实日历的混乱。同一家公司里不同同事建会的习惯完全不同：城市有人写在 title、有人写在 location；有人只写会议室名字；有 tentative、有 cancelled 但没删；同一会议出现在多个 calendar 里。如果让 LLM 自由发挥，短期看着聪明，长期一定翻车——会把一个 tentative meeting 当成真实出差，然后后面所有票据都匹配到一趟根本不存在的 trip。

所以我加了一堆硬规则：只信结构化 location；过滤 cancelled/tentative；必要时重新拉完整 ICS；对 organizer 去重；保留历史 trip，不能因为某次同步没扫到就删。但即便如此，真实世界总有例外。最后我接受了一个朴素方案：**dummy event + override**。某次出差日历本身不够标准，我就手动建一个结构清晰的 dummy event，或者在配置里加一行 override。它不优雅，但可靠。对于个人助理，可靠比聪明重要。

## Claim Intake：parser 动物园

有了 trip map 之后是收集证据。这一步花的时间最多，因为每种发票都有自己的"个性"。我挑四个最有代表性的讲。

### Baiwang：把网页操作还原成 5 行函数

Baiwang 的邮件正文里只有一个链接。点进去是个 Vue 页面，要等前端渲染完再点几次按钮才能拿到真正的 PDF + OFD + XML 三件套。如果用 browser automation，当然能做——但太脆弱了，页面慢一点、按钮变一下、登录态失效都会失败。

我让 Claude Code 直接读那个页面的前端 JS，搞清楚下载链接是怎么生成的。最后把这个过程压成一段 5 行的 Python，邮件正文里有那个链接就能直接拼出 PDF / OFD / XML 的下载 URL，不用真的打开浏览器。

这是 agent 工作方式的一个典型转换——不是"让 AI 代替人点网页"，而是让它理解网页背后的机制，把一次浏览器操作升级成一段稳定脚本。

### 网约车：发票上的城市是骗人的

最坑的一类。高德、曹操、滴滴的电子发票上的"城市"字段写的是 *开票方所在城市*，不是行程发生城市。一张在伊斯坦布尔机场打的车，发票上印的可能是"上海"（因为携程是上海公司）。如果直接信这个字段，这趟车就被算到了上海的某次出差里。

解法是发票同时带的"行程单 PDF"。行程单里有真实的起讫地址和用车时间，但它是无结构 PDF，正则解不出来。最后用 Gemini Vision 跑过行程单，给一个明确的提取 schema（pickup、dropoff、用车时间），把结果回灌到 ParseResult 里。

这之后又踩了 parser 调度顺序的坑：通用 mainland-invoice parser 太贪心，看到网约车发票也想自己解析，把行程信息全丢了。一个 commit 把 e-hailing parser 提到 generic invoice 之前，事情才正常。

### 12306：红字冲红的坑

12306 已经算最规范的一类。但它偶尔会有"红字"发票——蓝字是正常开票，红字是冲红（相当于负值）。早期 parser 看到金额就当成有效报销凭证，结果某次出现了"168 元车票 + 红字 168 元"两条记录，前者被当成有效报销，后者被忽略，或者反过来变成双倍。专门重写了 12306 parser，并加了红字识别的回归测试。

这个 case 让我对一条原则更确信：**越是看起来规则清楚的发票，越要把边界条件写进测试**。

### Uber：HTML 是个泥潭

Uber 没有 PDF 附件，所有 receipt 信息都在 HTML 邮件正文里。听起来比 PDF 容易，实际上更脏：

- `<style>` 和 `<script>` 块里的内容会被当成正文文本，要剥掉；
- Gmail 把转发邮件包了一层 `<div class="gmail_quote">`，要 unwrap；
- "Need help? Visit our help center" 这种营销 CTA 曾经被当成 dropoff 地址。

每一个都是单独的 commit。HTML parser 比 PDF parser 更需要防御性编程，因为发件方随时可以改模板。

### 信任但要验证

Gemini Vision 在结构化字段提取上不是 100% 可靠。同一份 folio 多次问 check-in 日期，偶尔差一天。所以关键字段都做了二次校验：行程单的日期跟发票开票日期对齐；folio 总额跟邮件正文里的金额对齐；`reroute_evidence_trip.py --audit --verify` 会重新跑一遍 Gemini，把库里的日期跟 Gemini 重新提取的日期对比，发现 mismatch 就标红。

LLM 不要作为唯一信源，但拿来做 cross-check 非常合适。

## 证据数据库：最关键的一步

intake 跑稳之后，第一版的存储设计就开始崩。v1 是"每个 trip 一个文件夹"：

```text
state/trips/<trip-id>/
├── raw/           # 原始下载
├── processed/     # 重命名后
└── claim.csv      # 这次报销的明细
```

每来一封邮件就解析 → 重命名 → 塞文件夹 → 往 claim.csv 追加一行。第一次出差能跑通，第二次就翻车了。

**问题一：同一张发票从多个渠道来。** 我拍了张餐饮小票发到 Telegram，第二天商家又把电子发票发到了邮箱。两个来源都被识别成"一笔餐饮支出"，claim.csv 里就出现了两行。仅靠文件名去重不行——一个是 JPG，一个是 PDF+OFD+XML，重命名规则都不一样。

**问题二：晚到的证据没地方放。** 出差结束三周后，酒店补开了一张增值税专票。但 trip 文件夹早就归档了，claim.csv 已经导出过。新证据要么被扔进 unmatched 忘掉，要么手动塞回旧文件夹然后想办法不破坏已有 claim.csv。

**问题三：parser 改进无法回溯。** 我后来给 12306 parser 加了红字识别，但已经存进 claim.csv 的错数据怎么办？文件系统没有"再跑一次"这个概念，只能手动改 CSV。

所以第二版把所有状态都搬到了 SQLite。核心是三张表：

```sql
-- 一个真实世界的费用
CREATE TABLE evidence (
    evidence_id      TEXT PRIMARY KEY,    -- 'baiwang:<inv_no>' / 'gmail-content:<sha>' / ...
    key_strength     TEXT NOT NULL,       -- 'strong' | 'fallback'
    expense_group_id TEXT,                -- 把一组相关证据归为同一笔报销
    trip_id          TEXT,
    parser_name      TEXT, confidence REAL,
    parsed_date TEXT, effective_date TEXT,
    date TEXT GENERATED ALWAYS AS (COALESCE(effective_date, parsed_date)) STORED,
    category TEXT, amount REAL, currency TEXT,
    city TEXT, merchant TEXT, route TEXT, description TEXT,
    invoice_number TEXT, extra TEXT,
    ingested_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

-- 每条证据从哪儿来（一对多）
CREATE TABLE evidence_source (
    source_ref  TEXT PRIMARY KEY,        -- 'gmail:<msg_id>' / 'tg:<chat>:<msg>' / ...
    evidence_id TEXT REFERENCES evidence(evidence_id),
    source_type TEXT NOT NULL,           -- gmail | telegram | migrated | manual
    status      TEXT NOT NULL,           -- ok | pending_key | parse_failed | ...
    ...
);

-- 每个具体文件
CREATE TABLE evidence_attachment (
    attachment_id   TEXT PRIMARY KEY,    -- sha256(bytes)[:16]
    evidence_id     TEXT NOT NULL REFERENCES evidence(evidence_id),
    source_ref      TEXT REFERENCES evidence_source(source_ref),
    kind            TEXT NOT NULL,       -- invoice | folio | itinerary | xml | ofd | pdf
    saved_path      TEXT NOT NULL,       -- state/evidence/raw/<sha[:2]>/<sha[:16]>.<ext>
    ...
);
```

三张表的分工很清楚：

- **`evidence`** 是逻辑上的一笔费用。一顿饭一行，一晚酒店一行（哪怕背后有 invoice 和 folio 两份证据）。
- **`evidence_source`** 是"这条 evidence 是从哪儿来的"。多个 source 可以指向同一个 evidence——比如 Telegram 的照片和 Gmail 的 Baiwang 发票最终合并成同一笔餐饮。
- **`evidence_attachment`** 是真正落盘的文件，按内容哈希存。同一份 OFD 即使从 Gmail 和邮件转发到达两次，磁盘上也只存一份。

写入路径的核心方法叫 `upsert_evidence(source_ref, parse_result)`。它做的事：

1. 用 `source_ref` 找这个来源对应的旧 evidence；
2. 计算 `expense_key`（强键，来自 parser，比如发票号码）和 `fallback_key`（弱键，内容 sha256）；
3. 旧 evidence 存在：根据 confidence 决定字段合并方向（高 confidence 覆盖低，低 confidence 只填空白）；
4. 旧 evidence 不存在：用强键插入；强键产不出来就用弱键并标 `key_strength='fallback'` + `status='pending_key'`；
5. 如果以后 parser 改好了能解出强键 → **rekey**：建强键新 row，把附件和 source 都迁过去，删掉老的弱键 row。

这一步让 parser 改进可以**回溯影响所有历史数据**。后来加的 12306 红字识别、Uber 转发邮件 unwrap、e-hailing 调度顺序修复，都是靠这个机制把过去的错误自动修正掉的。文件系统时代每次 parser 改进都要手动重跑邮件、改 CSV、对账；数据库时代一句 `python3 run_gmail_intake.py` 就够。

迁移不是大爆炸式重写，分了 10 个 chunk 提交，每个 chunk 单独可测。中间任何一步出问题都可以回滚单个 commit。这种节奏在生产系统重构里挺关键的，因为我不相信自己一次性想清楚了所有细节。

## 最有意思的部分：一张报销单 vs 多个证据

报销系统的复杂度大头不在 OCR，而在"把多份证据合并成一行 claim"。最典型的就是国内酒店：

- 邮件 A：酒店发的 folio 水单 PDF；
- 邮件 B：酒店财务系统几天后开的 Baiwang 增值税电子发票。

两封邮件，两个 parser，两条 evidence row。但在公司报销单里它们应该合并成 **一行**，金额是 invoice 的金额，folio 和 invoice 都得作为附件上传。

第一版方案是给两条 row 算同一个 group id：

```python
hotel_group_id = sha256('hotel' | canonical_city | amount_2dp | currency)[:16]
```

理论上完美。实际上翻车——前阵子那次成都出差，导出报错了，因为 Baiwang parser 在某些情况下提取不出干净的 city，会回落到 `invoice.seller_address`，里面装的是：

```text
中国四川省成都市锦江区东御街19号
```

而 folio parser 提取出来的 city 是 `Chengdu`。两边 canonicalize 之后还是不同字符串，group_id 算出来两个不同的哈希：

```text
evidence_id                           | city                          | group_id
baiwang_invoice:26512000001933404841  | 中国四川省成都市锦江区东御街19号   | 0b21e63bd31ba8d6
hotel_folio:565052                    | Chengdu                       | 8f215434343244e7
```

同一晚酒店，两条 row，两个 group_id，导出时变成两行 claim：一行只有 invoice 缺 folio，一行只有 folio 缺 invoice，全标红。

修了三次：

**第一次**，给 intake 时的完整性检查改成"sibling-aware"——这条 evidence 加上同 group_id 的 sibling 上的所有附件 union 起来满足规则就算 complete。但这只在 group_id 真的匹配时管用，JW 万豪那个 case 直接绕过了。

**第二次**，给 dedupe 工具加 invoice_number matcher。历史迁移数据里有大量没强键的 row，按 (date, amount, category) 匹配不总稳——有些 migration row 当时只记了税额没记总额，date 也可能丢失。但 invoice_number 全球唯一，跨 trip 都能查到。加了这层之后，历史数据干净了一截。但 JW 万豪那个 case 还是绕过——两条 row 都是 *合法的* parser 输出，不是 migration noise，删谁都不对。

**第三次**，新建一个共享的 `claim_grouper.py`，跨 export 和 intake 共用一个 `claim_key(row)`：

```python
def claim_key(row):
    # 1. 对于「可能多源」的 category（目前就是国内酒店），
    #    用 (trip, category, amount, currency) 作为 fuzzy key。
    #    这个 key 不依赖任何一个 parser 给出的 city，所以最稳。
    if category in PAIRABLE_CATEGORIES and trip_id and amount and currency:
        return ('fuzzy', trip_id, category, round(amount, 2), currency)
    # 2. 否则用 expense_group_id（如果有）。
    if row.expense_group_id:
        return ('group', row.expense_group_id)
    # 3. 否则按 evidence_id 各自一行。
    return ('solo', row.evidence_id)
```

`PAIRABLE_CATEGORIES = {'hotel'}`。把 export 和 intake summary 都改用它之后，那次成都出差从 3 claim（2 error）变成了 2 claim（0 issue）。最关键的是这个 key 不再依赖 parser 把 city 提取对。

得到的教训：**用"parser 希望它能提取对的字段"做 key 是脆弱的，用"行程本身已经决定的事实"（trip + amount + currency）做 key 是稳的。**

这个原则我后来在好几个地方都重新验证了一遍——任何一个 fragile field 做主键，迟早会因为某种边界条件失效；用更上层的、操作员已知的事实做主键则稳得多。

## 第二个 schema 升级：日期也有 issue date 问题

国内餐饮电子发票上只有"开票日期"，没有"消费日期"。4 月 16 日吃的饭，5 月 10 日才申请开票的话，发票上印的就是 5 月 10 日。

最早的实现里 `evidence.date` 直接存的就是 parser 提取出来的开票日期。然后 trip 匹配按这个 date 找 trip——结果 4 月 16 日上海出差的饭，绑到了 5 月 10 日的成都出差上。

第一版改派工具是直接 *覆盖* `evidence.date` 的。但这有两个问题：失去 provenance（以后想知道原本开票日期没了）；下次 intake 重新 parse 时会把 date 写回开票日期，手动改派失效。

第三版 schema 把 date 拆成两个真实列加一个生成列：

```sql
parsed_date    TEXT,                          -- parser 写入，永远是 parser 的最新结论
effective_date TEXT,                          -- 手动改派写入，parser 永不触碰
date           TEXT GENERATED ALWAYS AS
               (COALESCE(effective_date, parsed_date)) STORED,
```

下游代码完全不变（继续读 `evidence.date`），但底下：

- parser 重跑只写 `parsed_date`；
- reroute CLI 只写 `effective_date`；
- `date` 由 SQLite 在两者改变时自动重算。

加了个单测钉住这个不变量：parser 重跑必须不能覆盖手动设过的 `effective_date`。

把"解析逻辑"沉到 SQLite 里而不是放到读时的 Python 代码里，所有读 path 自动一致。这个决策是这个系统里最 underrated 的一个——系统里有几十个地方读 `evidence.date`：export、audit、reconcile、各种 CLI。一旦漏改一个，就会出现某条路径用 parsed_date、另一条用 resolved date，数据立刻分裂。

## Export 和送到下游 agent 手里

Export 比 intake 看着简单：用户在 Telegram 里说"导出某次 trip"，系统生成 claim.csv，打包 zip，发回 Telegram。但这里有一个不显眼的设计点。

claim.csv 不是终点。最终它会被另一个 agent 拿去——一个跑在 browser MCP 里的 *submit agent*，由它去公司内部报销网页填表、上传附件。submit agent 有个硬限制：每个文件不能超过某个尺寸（MCP 传输限制）。直接传本地路径也不行——submit agent 跑在隔离环境里没法访问磁盘。

所以附件必须先上传到公网可访问的位置，claim.csv 里写 URL，submit agent 在浏览器里 `fetch(URL)` 拿到 bytes 再喂上传表单。

我选了阿里云 OSS，结果踩了 BlockPublicAccess。bucket 启用了它之后，任何带 `public-read` ACL 的 PUT 都会 403。三个方向可选：关掉 BlockPublicAccess、改 bucket policy、或者全程不公开走 signed URL。最后选了第三个——7 天有效期的 signed URL：

- 安全策略不用动；
- 每次 export 重新签 URL，自动续期；
- bucket 维持私有，泄露的 URL 7 天后自动失效。

每次 export 都会重新签，所以"7 天"实际是"距离下次 export 的最大有效期"，对实际工作流来说够用了。

为了让 submit agent 工作起来无歧义，CSV schema 一路加列：

```text
date, city, category, amount, currency, exchange_rate, amount_cny,
description, merchant,
invoice_number, mainland_einvoice, check_in, check_out,
source_type, evidence_types,
invoice_file, itinerary_file, folio_file,
invoice_url, itinerary_url, folio_url,
invoice_size, itinerary_size, folio_size,
evidence_file, evidence_urls, evidence_sizes,
original_file, normalized_file, trip_id, notes,
```

每一列都有具体作用。`mainland_einvoice` 让 submit agent 决定走"电子发票"还是"普通发票"路径；`check_in`/`check_out` 是公司酒店报销表单的必填项；`*_size` 让 submit agent 提前决定哪些文件需要分块上传，不用每个 URL 都 HEAD 一次；按 kind 分开的 file/url 列让 submit agent 知道每个文件该传到哪个附件 slot。这份 CSV 现在有一份独立的 schema 文档，是给 submit agent 当合同读的。

Export 的另一个职责是 audit。如果某条证据只有 fallback key，audit 会标出来；如果国内酒店的 invoice 和 folio 没配齐，也会标出来；如果某条 evidence 的日期落在 trip 窗口外，audit 也会标。所以我能信任这份导出，而不是拿到一份漂亮但不知道对不对的表格。

## Submit：最后一公里

最后一步是把 zip 里的内容录入公司报销系统。这部分涉及内网就不展开细节了，思路是：让 LLM 分析浏览器里的请求结构，能 API 化的就走 API，能不走 UI 就不走 UI。很多录入和校验其实可以直接调页面背后的 API 完成，比 UI 自动化稳定得多。

但文件上传没完全搞定。直接调 API 上传被内部安全系统拦截，复现浏览器的完整 session 很难稳定。最终还是回到 UI automation：打开页面、选择文件、上传、检查状态。

这点很真实。agent 做企业系统自动化不是"有 API 就万事大吉"，必须能在 API、browser、文件系统、人工确认之间切换。能 API 就 API，不能 API 就像人一样操作浏览器。

## Telegram 当作运维控制台

这个系统真正"活"起来的方式不是 dashboard 也不是 CLI prompt，是 Telegram。

迭代循环大概长这样：

1. Gmail intake 跑完，结果通过 bot 发回 Telegram；
2. 看到"1 evidence-incomplete: Shenzhen Four Points hotel"之类的提示；
3. 我在 Telegram 里直接告诉 Claude："这个 folio 没附件，去查一下"；
4. Claude 在 SQLite 里挖、找到附件后用 SQL 改派、commit + push；
5. 顺手把这次的修复抽象成新脚本（比如 invoice_number matcher）+ test；
6. 下次 intake 跑就没这个 noise 了。

每个"小问题"最后都沉淀成了一个 commit + 一段文档 + 一个 test。这是这个项目最让我意外的地方：**它一直在变得更稳，不是因为我提前设计周到，而是因为每次踩坑都被沉淀掉了**。

具体几个例子：

- 香港地铁的 Octopus 渡轮被识别成 `others` → 一行 SQL 改成 `bus` + 加一个 `_coerce_public_transit_category` helper + 改 schema 文档；
- 系统误识别两张 IKEA 购物凭证为餐饮 → 删除两条 row + flip gmail-index status 为 `ignored_non_business` 防止下次 intake 重新拉；
- 西贝发票开票日期是 5/10 但消费日期是 4/16 → 加 effective_date 整套机制（前面提到的 schema v3）；
- JW 万豪的 invoice + folio 因为 city 不一致没合并 → 加 claim_grouper（前面提到的那个）。

不在 Telegram 里报修的时候，audit 命令承担"反向 lint"角色：`reroute --audit` 找日期落在 trip 窗口外的网约车；`reroute --audit-overrides` 列所有手动改派过的 effective_date；`export --strict` 在有 error 时非零退出；`dedupe_migration_twins` 默认 dry-run，加 `--apply` 才真的删；`purge_remote_evidence --trip <id>` 清掉某次 trip 在 OSS 上的所有对象。每个都是 5 分钟的"我又没记忆地把数据搞坏了"的 reverse gear。

## 我学到的几件事

按踩坑顺序：

**第一天就用 SQLite。** 文件系统加 CSV 这种方案只能撑住一两次出差。一开始就用 SQLite 我能省下 10 个 chunk 的迁移工作。

**每个 parser 都要输出 confidence。** 早期 parser 只输出字段不输出 confidence，后来 merge 策略想根据 confidence 决定字段方向，几乎所有 parser 都得改一遍。第一天就强制 parser 接口必须返回 confidence，后面会顺很多。

**别相信任何一个 parser 字段做主键。** 永远准备一个 fallback identity。强键解不出来用弱键，弱键找不到用 (trip, amount, currency) 这种行程层面的事实。JW 万豪那次就是这个原则的反向教学。

**用 SQLite generated column 把"派生"沉到底。** 不要在每个读 path 上做 COALESCE，迟早有一个 path 忘了改。把派生关系写进 schema，所有读 path 自动一致。

**Dry-run 当默认。** 所有破坏性脚本（dedupe、purge、reroute、ACL flip）默认 dry-run，加 `--apply` 才真的写。这条规矩救了我至少 3 次。

**Audit 子命令是回报最高的投资。** 写一个 audit 命令大概只比写一个 fix 多花 20% 时间，但它能在你不在的时候自动发现新出现的同类问题。

**Skill 的本质是 SOP，不是 prompt 魔法。** 真正可靠的 skill 背后一定有成熟 SOP：收到什么输入、先检查什么、调哪个脚本、状态写到哪、失败怎么标、什么时候需要人工确认。如果人类自己都没有稳定流程，直接把混乱经验塞给模型，只会得到一个看起来聪明但不可靠的系统。

## 写在最后

到现在这个系统：110+ commit、12 个 parser、3 次 schema 升级、394 个单测、8 个 audit/运维 CLI。但真正让它"可用"的不是这些数字，而是一个性质：

**它能在我把 parser 写错的情况下继续工作，因为重新解析和重新改派都是廉价的。**

出错的不是 parser 准确率，是"出错之后能不能修"。文件系统时代每次 parser 改进都要手动重跑邮件、改 CSV、对账；证据数据库时代一句命令就够。这个量级的差别决定了系统能不能用。

工程上没什么特别"聪明"的设计，全是一些**朴素的、不要相信自己写对了的**实践：

- 把派生物从源数据里分离；
- 把每次写入做成幂等的；
- 让每一步都可以 audit；
- 让破坏性操作默认 dry-run；
- 让 Telegram 当 inbox 也当 outbox。

一开始我以为这是一个"AI 帮我报销"的小项目，做完之后发现它是个相当完整的 agent workflow 实验。Trip Planner 解决上下文，Claim Intake 解决证据收集，Evidence DB 解决状态和去重，Export/Audit 解决可交付和可信任，Submit 解决最后一公里。中间踩了几十个坑：日历事件不标准、JSON 状态不可靠、12306 红字误判、酒店 folio 多语言、Baiwang 网页下载、Telegram topic 语境不稳、dedupe key 设计、城市提取漂移、issue date vs consumption date、OSS BlockPublicAccess。每一个看上去都是小事，叠在一起就决定了 demo 能不能撑成可用系统。

agent 真正改变的不是"写代码更快"或"回答问题更聪明"，而是它让个人也可以拥有一套持续演进的自动化工作流。以前这种东西需要一个团队做系统集成。现在，一个人、一台机器、一组 skills、一堆 scripts，加上足够多的迭代，就能把生活和工作里那些麻烦的小流程一点点交给 agent。

这可能才是最让我兴奋的地方。
