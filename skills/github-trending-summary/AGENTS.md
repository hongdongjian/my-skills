# 仓库贡献指南

## 项目结构与模块组织
- `github_trending.py`：Python 入口脚本，抓取 GitHub Trending，调用 GitHub API 补充仓库信息，并输出结构化 JSON。
- `github-trending-card/src/`：Node.js 配图生成模块。
- `github-trending-card/src/canvas/`：主图与详情图的绘制逻辑。
- `github-trending-card/src/config/`：主题常量与 JSON Schema 校验。
- `github-trending-card/src/utils/`：颜色映射、数据格式化等工具函数。
- `github-trending-card/data/`：运行时输入数据（生成产物）。
- `github-trending-card/output/`：生成的 `.webp` 图片。
- `SKILL.md`、`README.md`、`CHANGELOG.md`：工作流说明、使用文档和变更记录。

## 构建、测试与开发命令
- `python3 -m pip install requests beautifulsoup4`：安装 Python 依赖。
- `python3 github_trending.py [language] [limit] > github-trending-card/data/data.json`：抓取热榜并写入数据文件。
- `cd github-trending-card && npm install`：安装 Node 依赖（要求 `Node.js >= 18`）。
- `cd github-trending-card && npm run generate`：根据 `data/data.json` 生成主图与详情图到 `output/`。
- `cd github-trending-card && node src/index.js --input data/data.json --output output`：指定自定义输入和输出路径。

## 代码风格与命名规范
- Python 遵循 PEP 8，使用 4 空格缩进；函数和变量用 `snake_case`，类名用 `PascalCase`。
- JavaScript 使用 CommonJS、2 空格缩进；函数和变量用 `camelCase`，常量用全大写命名。
- 模块按领域拆分（`canvas`、`config`、`utils`），异常处理优先明确报错并尽早失败。

