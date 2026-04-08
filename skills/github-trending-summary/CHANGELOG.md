# Changelog

All notable changes to the GitHub Trending Summary skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-05

### Added
- 🎉 **小红书发布规范支持**
  - TOP 3 项目精选模式（符合 1000 字限制）
  - 标准化的小红书笔记格式模板
  - 固定标签：#GitHub #开源项目 #程序员 #技术分享 #GitHubTrending
  - 完整的格式示例和写作建议
  - 新增使用方法：`生成今日 GitHub 热门项目的小红书笔记`

### Changed
- 📝 简化分析报告内容，移除未来预测和趋势总结
- 📝 分析维度调整：项目基本信息、质量指标、创新性评估、实用性分析
- 📝 更新 SKILL.md 和 README.md 文档

### Removed
- ❌ 移除"技术趋势分析"和"预测未来技术发展趋势"相关内容
- ❌ 移除"发展趋势"相关描述，让分析更聚焦于项目本身

## [1.0.0] - 2026-02-05

### Added
- 初始版本发布
- 自动从 GitHub Trending 页面抓取热门项目
- 使用 10 线程并发获取项目详细信息和 README 内容
- 支持按编程语言筛选项目
- 支持自定义项目数量（1-25 个）
- 集成 Claude AI 进行智能深度分析
- 结构化 JSON 格式输出
- 详细的错误日志记录
- 完整的配置文件支持
- 符合 Claude Skill 规范的文件组织结构

### Security
- 移除硬编码的 GitHub API Token
- 添加 .gitignore 文件防止敏感信息泄露
- 创建 config.env.example 作为配置模板

### Documentation
- 完整的中文 SKILL.md 文档
- README.md 快速入门指南
- LICENSE 许可证文件
- CHANGELOG.md 变更日志

### Performance
- 并行 README 获取（10 线程）
- 并行 API 调用优化（10 线程）
- Session 复用提升请求效率
- README 内容截断（3000 字符）避免数据过大

## [Unreleased]

### Planned
- 支持更多数据源（GitLab、Gitee 等）
- 添加项目对比功能
- 支持历史趋势分析
- 添加邮件通知功能
- 支持导出为 Markdown/PDF 格式
- 添加数据可视化功能
