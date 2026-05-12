+++
author = "daxingplay"
categories = ["OpenClaw", "AI", "报销", "差旅"]
date = 2026-05-12T10:00:00Z
description = "OpenClaw 差旅报销系统是怎么从一坨乱糟糟的文件夹长成一条带 SQLite 证据库的流水线的：架构演进、解析坑、合规挑战、运维工具，以及那些 commit log 不会告诉你的事。"
draft = false
slug = "openclaw-trip-claims-engineering"
tags = ["OpenClaw", "AI", "报销", "差旅", "SQLite", "Gemini", "OSS", "Telegram"]
title = "把差旅报销做成一条数据流水线：OpenClaw 报销系统的工程实录"
aliases = [
    "/openclaw-trip-claims-engineering/"
]
+++

## 写在前面

之前那篇 [《我的养龙虾经验之差旅报销》](/openclaw-business-trip-claims/) 是从“为什么要做”讲起的，更多在讲产品形态和我自己作为用户的体验。这一篇换个角度——纯工程视角，把这套系统每一个真正难啃的问题都摊开讲一遍。

到目前为止，trip-expense-claims 这个 skill 已经有 110+ commit，包括：

- 1 次完整的架构重写（从“每个 trip 一个文件夹”迁移到 SQLite 证据数据库，分了 10 个 chunk 提交）；
- 3 次 schema 演进（v1 → v2 加 trip_id → v3 加 `parsed_date` / `effective_date` 生成列）；
- 12 个确定性 parser，覆盖 Baiwang 数电票、12306、高德/曹操/Uber/Grab、酒店 folio、邮件正文照片、Telegram 图片；
- 394 个单测；
- 一堆运维脚本：去重、改派、ACL 回填、远端清理、orphan audit、override audit……

但 commit log 看上去都是“fix this fix that”，很多关键决策是在 Telegram 对话里发生的，被 commit message 概括成了一句话。这篇文章想把那些决策为什么会那样做、踩过哪些坑、最后留下的设计是什么样子，整理成一份连贯的工程实录。

如果你只想看核心问题和最终答案，可以直接跳到第 3 节（证据 DB）和第 5 节（多证据合并），那两节是整个系统最有意思的部分。

<!-- TODO screenshot: 一张某次出差的 zip 包目录结构 -->

## 1. 问题为什么这么难

一次为期两天的出差，从邮件、消息和拍照里能产生 10~30 份证据材料，覆盖至少 6 个来源、3 种主流文件格式（PDF / OFD / XML），分散在 2~4 周里陆陆续续出现：

- Baiwang 通用电子发票（PDF + OFD + XML 三件套，链接式邮件，下载需要逆向接口）；
- 12306 火车票发票（带 InvoiceNumber，需要识别红字冲红）；
- 高德、曹操、滴滴的网约车发票 + 行程单（一个证明开了发票，一个证明真的发生了行程）；
- 酒店 folio（万豪、喜来登的水单 PDF，国内有，海外也有，国内的需要再配一张 Baiwang 增值税专票）；
- Uber / Grab 的纯邮件正文 receipt（一段 HTML，没有附件）；
- Telegram 里发来的小票照片（海外餐饮、停车票、地铁卡截图）；
- 老版本 CSV 历史数据（之前手工记录的旧账，得迁过来）。

公司报销系统对这些材料的要求又很苛刻：

- **国内餐饮**：必须电子发票，照片只能用来匹配，不能作为唯一凭证；
- **国内酒店**：必须 *电子发票 + folio 水单两份*；
- **国内打车**：必须 *电子发票 + 行程单两份*；
- **香港**：地铁、出租车允许 screenshot，但酒店必须有 folio；
- **国际**：基本只要 receipt + 翻译，但金额和日期不能错。

漏一个 folio → 整张报销单驳回，重新走流程一周起。两张重复的票 → 风控审计标记。把上海的打车单算到深圳的差旅里 → 走样过的报销单事后改不了，只能整张退掉重做。

所以这个事看着像 OCR，骨子里其实是 **数据一致性问题**：一堆来源不可信、格式各异、时间跨度大的证据，要在公司表单的截止时间之前，被收拢成一张干净的 claim 表。

## 2. v1：朴素的“每个 trip 一个文件夹”

最早的设计非常直觉：

```text
state/
└── trips/
    └── <trip-id>/
        ├── raw/           # 原始下载下来的文件
        ├── processed/     # 重命名过的文件
        └── claim.csv      # 这次报销的明细
```

每来一个邮件、Telegram 文件，就解析 → 重命名 → 塞进对应 trip 文件夹 → 往 claim.csv 追加一行。

这套设计跑通了第一次出差，跑垮了第二次。两类问题马上暴露：

**问题一：同一张发票从多个渠道到。** 我自己拍了一张餐饮小票发到 Telegram，第二天商家又把 Baiwang 电子发票发到了邮箱。两个来源都被识别成了"这是一笔餐饮支出"，于是 claim.csv 里就出现了两行。仅靠文件名去重做不到，因为两个文件根本是不同格式（一个是 JPG，一个是 PDF + OFD + XML），重命名规则也不一样。

**问题二：晚到的证据没地方放。** 出差结束三周后，酒店补开了一张增值税专票。这时候 trip 文件夹早就归档了，claim.csv 已经导出过、报销也走过了。新到的发票要么扔在 unmatched 里被忘掉，要么手动塞回老 trip 文件夹然后想办法不要破坏已经存在的 claim.csv。

**问题三：parser 改进无法回溯。** 我后来给 12306 parser 加了一个修复（红字冲红的发票别当成有效凭证），但已经存进 claim.csv 的错误数据怎么办？文件系统没有"再跑一次"这个概念，只能手动改 CSV。

到这里我意识到：claim.csv 不应该是源头，而应该是 *派生物*。我需要一个真正的证据库。

## 3. 关键决策：SQLite 证据数据库

第二版的核心就一句话：

> claim.csv 是 derived artifact，每次导出都从证据库重新生成，**永远不直接编辑**。

证据库的 schema（v1 版本，后来 v2 加了 `trip_id`，v3 加了 `effective_date`）：

```sql
-- 一个真实世界的“费用”
CREATE TABLE evidence (
    evidence_id     TEXT PRIMARY KEY,    -- 'baiwang:<inv_no>' / 'gmail-content:<sha>' / ...
    key_strength    TEXT NOT NULL,       -- 'strong' (parser 给出 expense_key) | 'fallback' (内容哈希)
    expense_group_id TEXT,               -- 把一组相关证据归为同一笔报销
    trip_id         TEXT,                -- 关联到哪次差旅
    parser_name     TEXT, confidence REAL,
    date TEXT, category TEXT, amount REAL, currency TEXT,
    city TEXT, merchant TEXT, route TEXT, description TEXT,
    invoice_number TEXT, extra TEXT,     -- JSON 杂项
    ingested_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

-- 每条证据从哪里来（一张证据可以有多个来源）
CREATE TABLE evidence_source (
    source_ref      TEXT PRIMARY KEY,    -- 'gmail:<msg_id>' / 'tg:<chat>:<msg>' / 'file:<sha>'
    evidence_id     TEXT REFERENCES evidence(evidence_id),
    source_type     TEXT NOT NULL,       -- gmail | telegram | migrated | manual
    status          TEXT NOT NULL,       -- ok | pending_key | parse_failed | skipped | error
    ...
);

-- 每个具体文件
CREATE TABLE evidence_attachment (
    attachment_id   TEXT PRIMARY KEY,    -- sha256(bytes)[:16]
    evidence_id     TEXT NOT NULL REFERENCES evidence(evidence_id),
    source_ref      TEXT REFERENCES evidence_source(source_ref),
    kind            TEXT NOT NULL,       -- invoice | folio | itinerary | receipt_photo | xml | ofd | pdf
    saved_path      TEXT NOT NULL,       -- state/evidence/raw/<sha[:2]>/<sha[:16]>.<ext>
    ...
);
```

三张表的角色很清晰：

- **`evidence`** 是逻辑上的一笔费用。一笔餐 = 一行，一晚酒店 = 一行（哪怕背后有两份证据）。
- **`evidence_source`** 是“这条 evidence 是从哪儿冒出来的”。多个 source 可以指向同一个 evidence——比如 Telegram 的照片和 Gmail 的 Baiwang 发票最终合并成同一笔餐饮。
- **`evidence_attachment`** 是真正落在磁盘上的文件。按内容哈希存储，所以同一份 OFD 即使从 Gmail 和邮件转发两次到达，磁盘上也只存一份。

附件统一放在 `state/evidence/raw/<sha[:2]>/<sha[:16]>.<ext>`，**不再按 trip 分目录**。每个 trip 的 zip 包在导出时即时生成，用人类友好的目录结构（`2026-05-10-Chongqing-Chengdu/`）和文件名（`19e14936..._ctumj_folio_ef_sj_gc586598186.pdf`）写入临时目录然后打包。

### 上 sert 策略：source-ref anchored

上写入路径的核心方法叫 `upsert_evidence(source_ref, parse_result)`：

1. 用 `source_ref` 找到这个来源对应的旧 evidence。
2. 计算 `expense_key`（强键，来自 parser，比如发票号码）和 `fallback_key`（弱键，内容 sha256）。
3. 如果旧 evidence 存在：根据 confidence 决定字段合并方向（高 confidence 覆盖低，低 confidence 只填空白）。
4. 如果不存在：用强键插入；如果强键产生不出来，就用弱键并标记 `key_strength='fallback'` + `status='pending_key'`。
5. 如果以后 parser 改好了，能从这个 source 解析出强键 → **rekey**：新建强键 evidence，把附件和 source 都迁过去，删掉老的弱键 row。

这一步让 parser 改进可以**回溯影响所有历史数据**。我后来加 12306 红字冲红识别、Uber 转发邮件 unwrap、e-hailing 优先级调度修复之类的 fix，都是靠这个机制把过去的"错误"自动修正掉的。

### 10 chunk 迁移

从老的文件系统结构迁到这个 schema，我没有大爆炸式重写。分成了 10 个 chunk 提交，每个 chunk 单独可测：

```text
chunk 1: schema 模块 + state_paths
chunk 2: source_ref anchored upsert + merge 策略
chunk 3: parser 侧 expense_key + group_id
chunk 4: Gmail intake write-through
chunk 5: Telegram intake write-through
chunk 6: 从源数据 rebuild 整个 DB 的脚本
chunk 7: 导出侧路径派生
chunk 8: claim.csv 调和 fallback
chunk 9: tier-2 完整性 audit
chunk 10: 撤掉 per-trip raw/ + processed/ 目录
```

每个 chunk 落地之后老的代码路径继续工作，最后 chunk 10 才把老路径删掉。中间任何一步出问题都可以回滚单个 commit。这个节奏在生产系统重构里挺关键的，不要相信自己一次性想清楚了所有细节。

## 4. Parser 动物园

我最低估的部分。一开始觉得 OCR + 几个正则能搞定，结果每种发票都有自己的"个性"：

### Baiwang 链接式邮件：逆向下载

Baiwang 发的电子发票邮件正文里就一个链接：「请点击这里下载 PDF/OFD/XML」。但点了之后是一个网页，需要点几次按钮才能拿到真正的三件套。这个流程在浏览器自动化里很慢、很易碎。

解法：观察一次完整的网络请求，把 PDF/OFD/XML 的真实下载 URL 模式从链接里直接拼出来。最后变成了一个 5 行的 Python 函数。`scripts/parsers/extract_baiwang_invoice.py` 现在能直接从邮件正文链接拿到所有附件。

### 12306：红字冲红

12306 的发票偶尔会有"红字"版——蓝字是正常开票，红字是冲红（相当于负值发票）。早期 parser 把红字也当成有效报销凭证，结果一张实际只用了 168 块的车票，因为有红字记录，被解析成"168 + (-168) = 0"或者反过来"双倍"。`fix: 12306 refund false positives on 红字` 这个 commit 干掉了它。

### 网约车：发票里说的城市是骗你的

最坑的一个。高德、曹操、滴滴的电子发票上的「城市」字段是 *开票方所在城市*，不是行程发生城市。一张在伊斯坦布尔机场打的车，发票上写的可能是「上海」（因为携程是上海公司）。

解法：发票同时附带「行程单 PDF」，行程单里有真实的起讫地址。但行程单是无结构 PDF，正则解不出来。最后用 Gemini Vision 跑过一遍行程单，提取出 pickup / dropoff / 用车时间，回灌到 ParseResult 里。`feat(ehailing): extract itinerary PDF via Gemini Vision` 这个 commit 是 Gemini 第一次在这个系统里担当关键角色。

Parser 调度顺序也踩过：`fix(registry): dispatch e-hailing parser before mainland generic invoice`——通用发票 parser 太贪心，把网约车发票当成普通餐饮发票去解析，丢了所有行程信息。

### 酒店 folio：仅靠正文也能解析

不是所有酒店都用 Baiwang。海外酒店常常直接邮件附 PDF folio。folio 里要提取的关键字段是 check_in、check_out、folio_number、total。这些字段在 PDF 里位置不固定，OCR + 正则可以做但准确率低。

直接 Gemini Vision 跑 PDF，给一个明确的提取 schema，准确率好得多。`scripts/parsers/extract_hotel_folio.py` 里现在的主路径是 Gemini，正则是 fallback。

### Uber：把 HTML 正文当主战场

Uber 没有 PDF 附件，所有 receipt 信息都在 HTML 邮件正文里。这意味着：

- 要先剥离 `<style>` / `<script>` 噪音；
- 要 unwrap 转发邮件（Gmail 把转发邮件包了一层 `<div class="gmail_quote">`）；
- 要拒绝营销文案当成行程地址——比如 "Need help? Visit our help center" 这种 CTA 文本曾经被当成 dropoff。

每一个都是单独的 commit。HTML parser 比 PDF parser 更需要"防御性编程"，因为发件方随时可以改 HTML 模板。

### 信任但要验证：Gemini 也会出错

Gemini Vision 在结构化字段提取上不是 100% 可靠。给同一份 folio 多次问 check_in 日期，偶尔会差一天。为了避免这种偶发误差污染数据库，关键字段我都做了二次校验：

- 行程单的日期跟发票的开票日期对齐（偏差 > 3 天就 flag 出来）；
- folio 的 total 跟邮件正文里的金额对齐；
- `reroute_evidence_trip.py --audit --verify` 会重新跑一遍 Gemini，把库里的日期跟 Gemini 重新提取的日期对比，发现 mismatch 就标红。

LLM 不要拿来作为唯一信源，但拿来作为 "cross-check" 是非常合适的。

<!-- TODO screenshot: --audit --verify 命令的输出截图 -->

## 5. 最有意思的部分：一张报销单 vs 多个证据

报销系统的复杂度大头不在 OCR，而在「把多份证据合并成一行 claim」。最典型的就是国内酒店：

- 邮件 A：酒店发的 folio 水单 PDF；
- 邮件 B：酒店财务系统几天后开的 Baiwang 增值税电子发票（PDF + OFD + XML）。

两封邮件，两个 parser，两条 evidence row。但在公司报销单里，它们应该合并成 **一行**：金额是 invoice 的金额（含税），folio 和 invoice 都得作为附件上传。

### `expense_group_id` 的设计

最初的方案是给两条 row 都计算一个相同的 group id：

```python
hotel_group_id = sha256('hotel' | canonical_city | amount_2dp | currency)[:16]
```

只要两个 parser 都能给出干净的 city + amount + currency，group_id 就会匹配。

**理论上**完美，**实际上**翻车。Baiwang parser 在某些情况下没法干净地提出 city，会回落到 `invoice.seller_address`，那个字段里的内容是：

```text
中国四川省成都市锦江区东御街19号
```

而 folio parser 提取出来的 city 是 `Chengdu`。两边 `canonicalize_city` 之后还是不同字符串，group_id 算出来两个不同的哈希。

具体看一下这次成都出差的实际数据：

```text
evidence_id                           | city                          | group_id
baiwang_invoice:26512000001933404841  | 中国四川省成都市锦江区东御街19号  | 0b21e63bd31ba8d6
hotel_folio:565052                    | Chengdu                       | 8f215434343244e7
```

同一晚酒店，两条 row，两个 group_id，根本对不上。导出时变成两行 claim：一行只有 invoice 没有 folio（标红 missing folio），一行只有 folio 没有 invoice（标红 missing invoice）。

### 第一道防线：sibling-aware completeness check

最早的修复是改 intake 时的完整性检查。原先逻辑是「这条 evidence 上有 invoice + folio 两种 kind 的附件才算 complete」。改成：「这条 evidence 加上同 group_id 的 sibling 上的所有附件 union 起来，满足规则就算 complete」。

`scripts/run_gmail_intake.py` 里的 `_docs_with_group_siblings` 就是干这个的。

但这条防线只在 group_id 真的匹配时管用。JW 万豪那个 case 直接绕过了它。

### 第二道防线：dedupe_migration_twins

历史数据从老 CSV 迁移过来时会产生大量 `parser_name='migration'` 的 fallback row。理想情况下，等 Gmail intake 跑过之后，新 parser 会产生强键 row，把老的 migration row 替代掉。但 (date, amount, category) 三元组匹配不总是稳——有些 migration row 当时只记了「税额」没记总额，date 也可能丢失。

`scripts/dedupe_migration_twins.py` 现在有三层 matcher，按优先级：

1. **invoice_number 匹配**——最强信号。发票号码全球唯一，跨 trip 都能查到。
2. **(trip_id, date, amount, category) strong-key 匹配**——经典策略。
3. **expense_group_id 匹配**——hotel folio 这种 fallback-keyed 行的兜底。

加完 invoice_number matcher 之后，立刻又踩了个 SQLite FK 坑：一行 migration row 在 source 表里可能有多条记录，所以 `find_twins()` 返回的同一行会出现 N 次。最早实现是按结果直接 delete，第二次循环就触发 `FOREIGN KEY constraint failed`，因为 evidence 被删了但 evidence_source 还有引用没清。修复是先按 evidence_id 去重，再 delete 全部相关 source 之后再 delete evidence。这种"看似简单实际复杂"的细节是教科书不写的。

### 第三道防线（也是最终的）：fuzzy claim_grouper

dedupe 解决的是「同一笔报销在 DB 里有两个独立 row 怎么合并」。JW 万豪那个 case 是另一种问题：两条 row 都是 *合法的* parser 输出，只是 group_id 算错了。删谁都不对，应该合并展示。

最终方案是新建 `scripts/claim_grouper.py`，定义一个跨 export 和 intake 共用的 `claim_key(row)`：

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

`PAIRABLE_CATEGORIES = {'hotel'}` 目前只放了酒店。其他 category 没有"一笔报销跨多个邮件"的常见模式，加进来反而会把巧合金额相同的两笔餐饮误合并。

把 export 和 intake summary 都改用这个 claim_grouper 之后，那次成都出差的导出从 3 claim（2 error）变成 2 claim（0 issue）。最关键的是：**这个 key 不依赖 parser 把 city 提取对**，所以它比之前的 group_id 更鲁棒。

得到的教训：

> 用「parser 希望它能提取对的字段」做 key 是脆弱的。用「行程本身已经决定的事实」（trip + amount + currency）做 key 是稳的。

## 6. 两个跟日期有关的难题

### 国内数电票的开票日期 ≠ 消费日期

国内餐饮电子发票上只有「开票日期」（issue date），没有「消费日期」。一顿饭 4 月 16 日吃的，5 月 10 日才申请开票的话，发票上印的就是 5 月 10 日。

最早的实现里，`evidence.date` 直接存的就是 parser 提取出来的开票日期。然后 trip 匹配按这个 date 找 trip——结果 4 月 16 日上海出差的那顿饭，被绑到了 5 月 10 日的成都出差上。

第一版改派工具 `reroute_evidence_trip.py --date` 是直接 *覆盖* `evidence.date` 的。但这有两个问题：

1. **失去 provenance**：以后想知道发票本来的开票日期，没了；
2. **被下次 intake 重置**：parser 重跑这条邮件时，会把 date 写回开票日期，手动改派失效。

### Schema v3：parsed_date + effective_date + 生成列

第三版 schema 把 date 拆成两个真实列加一个虚拟列：

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

SQLite 不允许 `ALTER COLUMN` 把一个普通列改成 generated，所以迁移是「建新表 → 拷数据 → drop 老表 → rename」，guard 在 `schema_meta` 版本判断里。生产 DB 上一次性跑掉，行数 71，秒级完成。

加了个单测来钉住这个不变量：

```python
def test_re_parse_preserves_override(self):
    # 第一次 parse 给出 issue date
    upsert(... date='2026-05-10' ...)
    # 操作员手动改派
    UPDATE evidence SET effective_date='2026-04-16' WHERE ...
    # parser 重跑
    upsert(... date='2026-05-10' ...)
    # parsed_date 是 parser 写的最新值，effective_date 不动
    assert row.parsed_date == '2026-05-10'
    assert row.effective_date == '2026-04-16'
    assert row.date == '2026-04-16'   # COALESCE 结果
```

### 用 generated 列的另一个好处

如果走「读时 COALESCE」而不是 generated 列，每个读取 `date` 的地方都要改。系统里有几十个地方读 `evidence.date`：export、audit、reconcile、reroute audit、各种 CLI……。一旦漏改一个，就会出现某个路径用的还是 parsed_date，另一个路径用的是 resolved date，数据分裂。

generated 列把"解析逻辑"沉到 SQLite 里，所有读 path 自动一致。这个决策是这个系统里最 underrated 的一个。

## 7. 把文件送到「下游 agent」的手里

claim.csv 不是终点。最终它会被传给一个跑在 browser MCP 里的 *submit agent*，由后者去公司内部报销网页上填表 + 上传附件。submit agent 有一个硬限制：每个文件不能超过某个尺寸（通过 MCP 桥传输的限制）。

直接传本地路径不行——submit agent 跑在隔离环境里没法访问本地磁盘。所以需要：附件先 **上传到公网可访问的位置**，claim.csv 里写 URL，submit agent 在浏览器里 `fetch(URL)` 拿到 bytes，再喂给上传表单。

### OSS 上传：踩了 BlockPublicAccess 的坑

选了阿里云 OSS。第一版直接给每个对象设 `public-read` ACL，结果 PUT 直接 403：

```text
Put public object acl is not allowed (EC: 0016-00000901)
```

这个 bucket 启用了 BlockPublicAccess，任何带 ACL 头的 PUT 都被拒。三个方向可选：

A. 关掉 BlockPublicAccess，恢复 ACL；
B. 改用 bucket policy 给特定 path 开放；
C. 都不公开，统一签 7 天有效期的 signed URL。

最后选了 C：

- 安全策略不用动；
- 每次 export 重新签 URL，自动续期；
- bucket 维持私有，泄露的 URL 7 天后自动失效。

`EVIDENCE_REMOTE_OBJECT_ACL` 改成可选 env，默认空。`EVIDENCE_REMOTE_SIGNED_URL_EXPIRY` 默认 7 天。endpoint 强制 `https://` 前缀，否则 oss2 SDK 会给签出 http URL，submit agent 在 https 页面里 fetch 会被浏览器拒。

### claim.csv 长成了什么样

为了让 submit agent 工作起来无歧义，CSV 一路加列。当前 schema：

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

每一列都有具体作用：

- `mainland_einvoice` = yes/no：让 submit agent 决定走"电子发票"还是"普通发票"的录入路径；
- `check_in` / `check_out`：公司酒店报销表单的必填项；
- `*_size`：让 submit agent 提前判断哪些文件需要分块上传，不用每个 URL 都 HEAD 一次；
- `invoice_url` / `folio_url` 分开：让 submit agent 准确把每个文件传到对应的"附件 slot"，不用看到一堆文件再去猜。

`references/claim-csv-schema.md` 里每一列都有详细描述，是给 submit agent 当合同读的。

## 8. 当 Telegram 成为运维控制台

这个系统真正"活"起来的方式不是 dashboards 也不是 CLI prompt，是 Telegram。

整个迭代循环大概长这样：

1. Gmail intake 跑完，结果通过 Telegram bot 发回来；
2. 看到「1 evidence-incomplete: Shenzhen Four Points」之类的提示；
3. 在 Telegram 里直接告诉 Claude「这个 folio 没附件，去查一下」；
4. Claude 在 SQLite 里挖、找到附件后用 SQL 改派、commit + push；
5. 顺手把这次的修复抽象成新脚本（比如 invoice_number matcher）+ test；
6. 下次 intake 跑出来就没这个 noise 了。

这套机制让一个个零散修复都变成 *系统能力* 的增量：

- 香港地铁的 Octopus 渡轮被识别成 `others` → 一次 SQL 改成 `bus` + 加 `_coerce_public_transit_category` helper + 写到 claim-csv-schema.md；
- 系统误识别两张 IKEA 购物凭证为餐饮 → 删除两条 row + flip gmail-index status 为 `ignored_non_business` 防止下次 intake 重新拉；
- 西贝发票开票日期是 5/10 但消费日期是 4/16 → 加 effective_date 整套机制；
- JW 万豪的 invoice + folio 因为 city 不一致没合并 → 加 claim_grouper。

每个"小问题"最后都沉淀成了一个 commit + 一段文档 + 一个 test。这是这个项目最让我意外的地方：**它一直在变得更稳，不是因为我提前设计周到，而是因为每次踩坑都被沉淀掉了。**

### Audit subcommands：当我没盯着的时候

不在 Telegram 里实时报修的时候，audit 命令承担"反向 lint"角色：

- `reroute_evidence_trip.py --audit`：找网约车 evidence 的 date 落在 trip 窗口外的行；
- `reroute_evidence_trip.py --audit --verify`：用 Gemini 重新提取行程单日期，跟存的对比；
- `reroute_evidence_trip.py --audit-overrides`：列出所有手动改派过 effective_date 的行；
- `export_trip_claim.py --strict`：导出时如果有 error 就非零退出；
- `dedupe_migration_twins.py`：默认 dry-run，加 `--apply` 才真的删；
- `purge_remote_evidence.py --trip <id>`：清掉某个 trip 在 OSS 上的所有对象（试错完之后想干净来过）。

每个都是 5 分钟的"我又没记忆地把生产数据搞坏了"的 reverse gear。

<!-- TODO screenshot: Telegram 里某次对话的截图，展示「报修 → 修复 → 提示完成」的流程 -->

## 9. 如果重来一遍，我会怎么做

按踩坑顺序整理几条：

**1. 第一天就用 SQLite。** 文件系统加 CSV 这种方案，只能撑住一两次出差。一开始就用 SQLite 我能省下 10 个 chunk 的迁移工作。

**2. 每个 parser 出 confidence。** 早期 parser 只输出字段，不输出 confidence。后来 merge 策略想根据 confidence 决定字段方向时，几乎所有 parser 都得改一遍。如果第一天就强制 parser 接口必须返回 confidence，后面会顺很多。

**3. 提前抽 `claim_grouper`。** export 用一套 grouping、intake summary 用另一套、CLI audit 用第三套——同一个 group_id 逻辑在三个地方各写了一份，最后才意识到它们漂移了，又花一次重构合并到一个 module 里。这种"看似不一样实际上一样"的逻辑，第一次写的时候就该提到共享代码。

**4. 不要相信任何一个 parser 字段。** 永远准备一个 fallback identity。强键解不出来就用弱键，弱键找不到就用 (trip, amount, currency) 这种行程层面的事实。任何一个层级失效都不应该让整个 pipeline 罢工。

**5. dry-run 当默认。** 所有破坏性脚本（dedupe、purge、reroute）默认 dry-run，加 `--apply` 才真的写。这条规矩救了我至少 3 次。

**6. Audit 子命令是回报最高的投资。** 写一个 audit 命令大概只比写一个 fix 多花 20% 时间，但它能在你不在的时候自动发现新出现的同类问题。

## 10. 数字 & 结语

到目前的状态：

- **110+** commit on trip-expense-claims；
- **12** 个 parser；
- **3** 次 schema 升级（v1 → v2 → v3）；
- **394** 个单测；
- **8** 个 audit / 运维 CLI；
- **7** 份 reference 文档；
- **0** 张被报销系统驳回的 claim 单（从 evidence-DB 重写之后）。

数字背后真正重要的事情其实只有一件：

> 这个系统能在我把 parser 写错的情况下继续工作，因为重新解析和重新改派都是廉价的。

这个特性才让它真正可用。出错的不是 parser 准确率，是「出错之后能不能修」。文件系统时代每次 parser 改进都要手动重新跑一遍历史邮件、改 CSV、对账；证据库时代一句 `python3 run_gmail_intake.py` 就够。这个量级的差别决定了系统能不能用。

工程上没什么特别"聪明"的设计，全是一些**朴素的、不要相信自己写对了的工程实践**：

- 把派生物从源数据里分离；
- 把每次写入都做成幂等的；
- 让每一步都可以 audit；
- 让破坏性操作默认 dry-run；
- 让 Telegram 当 inbox 也当 outbox。

下次再有"小问题"出现，我估计还是会在 Telegram 里收到一行报告。然后跟着流程走一遍：查、修、抽脚本、写 test、commit、push。这个循环本身已经变成了系统的一部分。

<!-- TODO screenshot: 一张最终的 claim.csv 截图 + 一张某次完整 zip 包目录 -->

---

如果你也在做这类"看着是 AI 问题、骨子里是数据一致性问题"的系统，欢迎在 [GitHub](https://github.com/daxingplay) 或者 Telegram 找我聊。我估计你踩的坑会跟我踩过的差不多。
