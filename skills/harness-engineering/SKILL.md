---
name: harness-engineering
description: '初始化项目的 .harness/ 工程化目录结构。创建开发辅助脚本（环境变量、依赖检查、服务启动、镜像构建）、测试脚本目录、临时输出目录，并生成对应的 CLAUDE.md 文档。使用 /harness-engineering init 触发。'
license: MIT
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent
---

# Harness Engineering Init

## 概述

为项目初始化 `.harness/` 工程化目录，提供统一的开发脚本、测试脚本、环境配置和日志管理。

## 触发条件

用户执行 `/harness-engineering init` 或要求初始化项目工程化脚手架时触发。

## 初始化流程

### 1. 分析项目结构

- 扫描项目根目录，识别子项目（Go module、package.json 等）
- 检查已有的 CLAUDE.md、Makefile、Dockerfile、配置文件
- 了解项目的构建方式、技术栈、部署方式

### 2. 创建目录结构

```
.harness/
├── scripts/           # 开发辅助脚本
│   ├── CLAUDE.md      # 脚本说明与生成约束
│   ├── env.sh         # 公共环境变量（代理清除、服务地址、认证信息等）
│   ├── check-deps.sh  # 依赖检查
│   └── ...            # 按需生成的服务启动/构建脚本
├── test/              # 测试用原子脚本
│   └── CLAUDE.md      # 测试脚本说明与使用约束
└── dist/              # 临时输出目录（编译产物、日志）
    ├── .gitkeep
    └── .gitignore     # 忽略 dist 内所有文件
```

### 3. 生成 env.sh 公共环境变量

env.sh 必须包含：

```bash
# 代理清除（避免本地请求走代理失败）
unset https_proxy http_proxy all_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY

# 项目路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
export DIST_DIR="$ROOT_DIR/.harness/dist"

# 服务地址、认证信息等（根据项目实际情况填充）
```

### 4. 生成脚本的约束规则

所有脚本必须遵循以下规则（写入 scripts/CLAUDE.md）：

- **加载环境变量**：所有脚本（含 test/ 中的）必须在开头 `source` env.sh
- **curl 使用 --noproxy**：所有 curl 命令必须带 `--noproxy '*'`
- **单一职责**：每个脚本只做一件事，保持简短
- **新增时更新文档**：新增脚本必须同步更新对应目录的 CLAUDE.md
- **避免复杂逻辑**：脚本只做简单封装，复杂逻辑交给 Makefile
- **统一日志输出**：日志统一输出到 `.harness/dist/`
- **启动类脚本**：start 命令先停掉已有进程再启动新进程

### 5. 测试脚本目录约束

写入 test/CLAUDE.md 的规则：

- **只返回结果**：脚本只调用 API 并输出响应，不做 PASS/FAIL 断言
- **新增前先检查**：先检查是否已有可复用脚本，避免重复
- **执行前先查阅**：先看 CLAUDE.md 确认是否有现成脚本
- **单一职责**：每个脚本只完成一个原子操作
- **支持额外参数**：脚本末尾使用 `"$@"` 透传参数

### 6. 生成 .harness/dist/ 临时目录

```bash
mkdir -p .harness/dist
# .gitignore 内容：
*
!.gitkeep
!.gitignore
```

### 7. 按需生成服务脚本

根据项目分析结果，为每个可独立启动的服务生成脚本：

- **依赖检查脚本** `check-deps.sh`：检查所需工具（go、node、docker、kubectl、helm 等）
- **服务启动脚本**：如 `start-<service>.sh`，只含 start/stop/status 子命令
- **镜像构建脚本**：如 `build-deploy-<service>.sh`，只含 build/status 子命令
- **kubeconfig 文件**：如有 K8s 集群配置，拷贝到 scripts/ 目录

### 8. 更新根目录 CLAUDE.md

在根目录 CLAUDE.md 中添加：
- `.harness/` 目录说明，指向 scripts/CLAUDE.md 和 test/CLAUDE.md
- 集群操作说明（如涉及 K8s）
- API 测试配置（如涉及 REST API）

## 输出确认

完成后使用 AskUserQuestion 工具确认，用户可能提出调整需求。反复迭代直到用户满意。

## 注意事项

- 不要生成冗余脚本，只按实际需要生成
- 脚本要尽量简单，不超过 50 行
- 所有路径使用相对路径或通过 env.sh 中的 ROOT_DIR 计算
- 不在脚本中硬编码敏感信息（密码、token），使用环境变量
