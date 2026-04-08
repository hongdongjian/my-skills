---
name: git-commit
description: 'Execute git commit with conventional commit analysis, intelligent staging, and Chinese commit message generation. Use when user asks to commit changes, create a git commit, or mentions "/commit". Supports: (1) Auto-detecting type and scope from changes, (2) Generating Simplified Chinese conventional commit messages from diff, (3) Interactive commit with optional type/scope/description overrides, (4) Intelligent file staging for logical grouping, (5) Skipping standalone sensitive-information checks unless the user explicitly asks for them'
license: MIT
allowed-tools: Bash
---

# Git Commit with Chinese Conventional Commits

## Overview

Create standardized, semantic git commits using the Conventional Commits specification. Keep the `type` and optional `scope` in standard conventional-commit form, but write the description, body, and footer text in Simplified Chinese. Analyze the actual diff to determine appropriate type, scope, and message.

## Conventional Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

| Type       | Purpose                        |
| ---------- | ------------------------------ |
| `feat`     | New feature                    |
| `fix`      | Bug fix                        |
| `docs`     | Documentation only             |
| `style`    | Formatting/style (no logic)    |
| `refactor` | Code refactor (no feature/fix) |
| `perf`     | Performance improvement        |
| `test`     | Add/update tests               |
| `build`    | Build system/dependencies      |
| `ci`       | CI/config changes              |
| `chore`    | Maintenance/misc               |
| `revert`   | Revert commit                  |

## Breaking Changes

```
# Exclamation mark after type/scope
feat!: remove deprecated endpoint

# BREAKING CHANGE footer
feat: allow config to extend other configs

BREAKING CHANGE: `extends` key behavior changed
```

## Workflow

### 1. Analyze Diff

```bash
# If files are staged, use staged diff
git diff --staged

# If nothing staged, use working tree diff
git diff

# Also check status
git status --porcelain
```

### 2. Stage Files (if needed)

If nothing is staged or you want to group changes differently:

```bash
# Stage specific files
git add path/to/file1 path/to/file2

# Stage by pattern
git add *.test.*
git add src/components/*

# Interactive staging
git add -p
```

**Do not run a separate sensitive-information check or block a commit based on heuristic secret scanning unless the user explicitly asks for that review.**

### 3. Generate Commit Message

Analyze the diff to determine:

- **Type**: What kind of change is this?
- **Scope**: What area/module is affected?
- **Language**: Write the description, optional body, and optional footer in Simplified Chinese
- **Description**: One-line summary of what changed (present tense, imperative mood, concise and preferably <72 chars)

### 4. Execute Commit

```bash
# Single line
git commit -m "<type>[scope]: 中文摘要"

# Multi-line with body/footer
git commit -m "$(cat <<'EOF'
<type>[scope]: 中文摘要

<可选正文>

<可选页脚>
EOF
)"
```

## Best Practices

- One logical change per commit
- Keep the conventional-commit `type` and optional `scope` in English
- Write the description, body, and footer in Simplified Chinese
- Use present tense and imperative mood
- Reference issues: `Closes #123`, `Refs #456`
- Keep the description concise and preferably under 72 characters

## Git Safety Protocol

- NEVER update git config
- NEVER run destructive commands (--force, hard reset) without explicit request
- NEVER skip hooks (--no-verify) unless user asks
- NEVER force push to main/master
- If commit fails due to hooks, fix and create NEW commit (don't amend)
