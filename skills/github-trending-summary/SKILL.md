---
name: github-trending-summary
description: 自动获取 GitHub 每日热门项目并生成 AI 分析报告，支持按语言筛选和自定义项目数量
version: 2.0.0
tools: []
metadata:
  user-invocable: true
  run: python3 github_trending.py
---

# GitHub 热榜生成 & 小红书发布

自动完成以下完整流程：抓取 GitHub 今日热榜 → AI 总结每个项目 → 生成配图 → 发布小红书。

---

## 完整工作流（按步骤执行）

### Step 1：抓取 GitHub 热榜数据

在 skill 目录下执行：

```bash
python3 github_trending.py
```

输出为 JSON 格式，将结果保存到：

```
github-trending-card/data/data.json
```

数据结构参考：

```json
{
  "date": "2026.02.26",
  "title": "GitHub Trending",
  "subtitle": "今日热榜",
  "topN": 10,
  "projects": [
    {
      "rank": 1,
      "name": "owner/repo",
      "description": "项目一句话描述",
      "language": "Python",
      "todayStars": "+1,656",
      "totalStars": "15.8K",
      "totalForks": "1K",
      "readmeContent": "原始 README 纯文字内容...",
      "imageUrl": "https://opengraph.githubassets.com/1/owner/repo"
    }
  ]
}
```

配置项在 `config.env` 中，可调整语言筛选和抓取数量：

```bash
DEFAULT_LANGUAGE=""   # 留空表示全部语言
DEFAULT_LIMIT=10       # 默认获取项目数量
GITHUB_API_TOKEN=""   # 可选，配置后 API 限速从 60→5000 次/小时
```

---

### Step 2：AI 总结每个项目的 readmeContent

拿到 `data.json` 后，结合每个项目的 `readmeContent`、`description`、`totalStars`、`totalForks`、`todayStars`、`language` 字段，生成一段综合总结，**直接替换原 `readmeContent` 字段内容**。

**总结要求**：
- 用**中文**，**不少于 150 字，不多于 200 字**
- 按四个维度分段落书写，每个维度单独一段，**段落之间不空行**，**每段开头缩进两个空格**
- 段落顺序：① 核心功能与技术亮点 → ② 质量与社区热度 → ③ 相比同类的独特价值 → ④ 适用场景与目标用户
- 有数据时优先引用数据（Star/Fork/今日涨星），禁用空洞形容词

**示例（替换后）**：

```
  Scrapling 是一个用 Python 构建的自适应 Web 爬虫框架，能处理从单次 HTTP 请求到全量分布式爬取的所有场景。核心亮点在于智能元素追踪、开箱即用的反反爬能力（可绕过 Cloudflare Turnstile）以及统一的多会话接口。
  项目拥有 15.8K Star、1K Fork，今日涨星 +1,656，社区热度高，README 覆盖 Quickstart 与 API 参考，文档完整。
  与 Scrapy、Playwright 等工具相比，核心差异在于「自适应」解析器——页面结构变化后自动找回目标元素，无需手动维护选择器，Spider 框架还支持断点续爬和流式输出。
  最适合长期稳定的商业数据采集、高反爬网站抓取及混合爬取场景，目标用户为数据工程师与独立开发者，也可作为 MCP 模块嵌入 AI Agent 工作流。
```

---

### Step 3：生成配图

在 `github-trending-card` 目录下执行：

```bash
node src/index.js
```

该命令读取 `data/data.json`，在 `output/` 目录下生成以下图片：

| 文件名 | 内容 |
|--------|------|
| `0.png` | 主图：所有项目的热榜总览卡片 |
| `1.png` | 项目 rank=1 的详情图（预览图 + AI 总结） |
| `2.png` | 项目 rank=2 的详情图 |
| `N.png` | 以此类推... |

图片风格：深色系（`#0c1524` 底色），各排名使用不同高亮色，包含 Language / 今日涨星 / 总 Star 数三列指标。

---

### Step 4：生成小红书文案

根据 `data.json` 中的所有项目数据，生成一篇整体分析的小红书正文，**不逐个介绍项目，而是从整体视角做趋势分析和数据总结**。

**格式要求**：
- 总字数 600 字以内
- 标题：`GitHub今日热门项目(YYYY-MM-DD)`（必须带当天日期，例如 `GitHub今日热门项目(2026-03-05)`）
- 语言：中文，活泼易读，面向程序员群体
- **多用数据** 增强可信度
- **多用 emoji** 提升视觉层次感

**正文结构**：

```
📊 今日 GitHub 热榜速览

🔥 今日热点
（2-3 句话概括整体技术方向，点出最显著的趋势，数据具体）

💡 今日洞察
（从所有项目中提炼 1-2 个有价值的行业观察，100 字以内。
例如：AI Agent 工具链、某技术方向的集中爆发、某类问题的新解法等）

----------------

（列出所有上榜项目，每行一个，格式如下）
🥇 owner/repo — 一句话描述  ⭐totalStars 📈todayStars
🥈 owner/repo — 一句话描述  ⭐totalStars 📈todayStars
🥉 owner/repo — 一句话描述  ⭐totalStars 📈todayStars
4️⃣ ...

 #GitHub #开源项目 #程序员 #技术分享 #GitHubTrending
```

**写作规范**：
- 重点在「趋势洞察」，而非项目介绍
- 数字具体，避免"很多"、"大量"，直接写数值
- 项目列表只需一行，让读者自己点链接探索
- 禁用空洞形容词（"非常强大"、"极其好用"）

---

### Step 5：通过 XHS MCP 发布小红书

使用 XHS MCP 工具发布内容：

- **标题**：`GitHub今日热门项目(YYYY-MM-DD)`（必须带当天日期，例如 `GitHub今日热门项目(2026-03-05)`）
- **正文**：Step 4 生成的文案
- **图片**：按顺序上传 `output/0.webp`、`output/1.webp`、`output/2.webp`...（主图在前）

---

### Step 6：清理临时文件

发布成功后，清理生成的临时数据和图片：

```bash
# 清理 data 目录（仅删除 data.json，保留目录本身）
rm -f github-trending-card/data/data.json

# 清理 output 目录下所有文件（保留目录本身）
rm -f github-trending-card/output/*.webp
```

> 说明：只删除文件内容，保留 `data/` 和 `output/` 目录结构，供下次运行使用。

---

## 快速调用示例

```
帮我生成今天的 GitHub 热榜并发布到小红书
```

```
抓取今天 Python 方向的 GitHub 热门项目，生成小红书内容
```

```
获取前 5 个 GitHub 热门项目，生成图片和小红书文案
```
