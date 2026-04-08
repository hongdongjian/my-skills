# GitHub Trending Summary

自动完成 **GitHub 热榜抓取 → AI 项目总结 → 配图生成 → 小红书发布** 的完整流程。

---

## 功能介绍

| 功能 | 说明 |
|------|------|
| 📡 热榜抓取 | 从 GitHub Trending 页面爬取今日热门项目，并发调用 GitHub API 获取详细数据和 README |
| 🤖 AI 总结 | 对每个项目的 README 内容进行 AI 中文总结，覆盖功能、热度、差异、场景四个维度 |
| 🎨 配图生成 | 生成热榜总览主图（`0.webp`）和每个项目的详情图（`1.webp`、`2.webp`…） |
| 📝 文案生成 | 生成小红书格式的整体趋势分析文案，数据驱动，emoji 丰富 |
| 🚀 自动发布 | 通过 XHS MCP 将文案和图片一键发布到小红书 |

---

## 实现原理

```
github_trending.py
    ├── 爬取 GitHub Trending 页面（HTML 解析）
    ├── 并发调用 GitHub API（10 线程）获取详情 + README
    ├── 清洗 README（去除 Markdown 标记、图片链接、HTML 实体等）
    └── 输出结构化 JSON → github-trending-card/data/data.json

Claude AI
    └── 读取 data.json，对每个项目 readmeContent 生成中文总结并替换

github-trending-card/src/index.js
    ├── 读取 data.json
    ├── 生成主图 0.webp（@napi-rs/canvas 绘制热榜总览卡片）
    └── 并发生成详情图 1.webp、2.webp…
            ├── 拉取 imageUrl OG 预览图（带重试，最多 3 次）
            ├── 绘制 meta 条（项目名 + 今日涨星）
            └── 渲染 AI 总结文字（中英文混排自动换行）

XHS MCP
    └── 上传图片 + 发布文案到小红书
```

---

## 目录结构

```
github-trending-summary/
├── github_trending.py          # 数据抓取脚本
├── config.env                  # 本地配置（不提交）
├── config.env.example          # 配置模板
├── SKILL.md                    # Claude Skill 定义
├── README.md                   # 本文件
└── github-trending-card/       # 配图生成模块
    ├── src/
    │   ├── index.js            # 入口：生成所有图片
    │   ├── canvas/
    │   │   ├── detail-card.js  # 项目详情图生成
    │   │   ├── project-card.js # 主图项目卡片
    │   │   ├── header.js       # 主图头部
    │   │   ├── setup.js        # Canvas 初始化
    │   │   └── primitives.js   # 基础绘图工具
    │   ├── config/
    │   │   ├── theme.js        # 颜色、字体、尺寸常量
    │   │   └── schema.js       # 数据结构校验
    │   └── utils/
    │       ├── colors.js       # rank 颜色映射
    │       └── format.js       # 数字格式化
    ├── data/
    │   └── data.json           # 抓取后的热榜数据
    ├── output/                 # 生成的图片输出目录
    ├── fonts/                  # 字体文件
    └── package.json
```

---

## 依赖安装

### Python 依赖

```bash
pip install requests beautifulsoup4
```

### Node.js 依赖

```bash
cd github-trending-card
npm install
```

> Node.js 版本要求：>= 18

### 中文字体

配图模块现在会自动探测 macOS 上可用的中文字体，优先使用：

```bash
/System/Library/Fonts/Hiragino Sans GB.ttc
/System/Library/Fonts/STHeiti Medium.ttc
/System/Library/Fonts/STHeiti Light.ttc
```

如果当前机器字体路径不同，可以显式指定：

```bash
GITHUB_TRENDING_FONT_PATH="/path/to/your/font.ttc" node src/index.js
```

---

## 配置

复制配置模板并填写：

```bash
cp config.env.example config.env
```

编辑 `config.env`：

```bash
# GitHub API Token（可选，配置后限速从 60 → 5000 次/小时）
GITHUB_API_TOKEN="ghp_xxxxxxxxxxxx"

# 默认语言筛选（留空表示全部语言）
# 支持：python、javascript、typescript、go、rust、java 等
DEFAULT_LANGUAGE=""

# 默认抓取项目数量（1~25）
DEFAULT_LIMIT=10
```

---

## 使用说明

### 方式一：通过 Claude Skill 自动执行（推荐）

在 Claude Code 中直接输入：

```
帮我生成今天的 GitHub 热榜并发布到小红书
```

Claude 会自动按顺序执行全部步骤。

也支持指定语言和数量：

```
抓取今天 Python 方向的 GitHub 热门项目，生成小红书内容
获取前 5 个 GitHub 热门项目，生成图片和小红书文案
```

### 方式二：手动分步执行

**Step 1：抓取数据**

```bash
# 使用 config.env 中的默认配置
python3 github_trending.py

# 指定语言
python3 github_trending.py python

# 指定语言和数量
python3 github_trending.py go 5
```

输出保存至 `github-trending-card/data/data.json`。

**Step 2：生成图片**

```bash
cd github-trending-card
node src/index.js
```

输出图片保存至 `github-trending-card/output/`：

| 文件 | 内容 |
|------|------|
| `0.webp` | 热榜总览主图 |
| `1.webp` | rank 1 项目详情图 |
| `2.webp` | rank 2 项目详情图 |
| `N.webp` | 以此类推 |

也可指定自定义输入/输出路径：

```bash
node src/index.js --input /path/to/data.json --output /path/to/output/
```

**Step 3：清理临时文件**

```bash
rm -f github-trending-card/data/data.json
rm -f github-trending-card/output/*.webp
```

---

## 图片风格

- **背景**：深色系（`#0c1524`）
- **主图**：每个项目一行卡片，包含排名、项目名、描述、语言、Star 数、今日涨幅
- **详情图**：上方 OG 预览图 + meta 条（项目名 / 今日涨星）+ AI 中文总结
- **排名配色**：各名次使用不同高亮色区分（金/绿/紫/橙…）
- **输出格式**：WebP quality=85，体积比 PNG 减少约 65%
