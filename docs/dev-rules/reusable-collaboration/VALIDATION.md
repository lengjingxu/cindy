# 验证说明

本文说明修改 reusable-collaboration/README.md 时需要验证什么，以及每项检查
防止哪类问题进入仓库。

## 检查项

- git diff --check：发现空白错误、冲突标记和补丁格式问题。
- pnpm check:dev-docs：校验开发者文档链接可解析、引用的 pnpm 命令存在，且 AGENTS 与 CONTRIBUTING 仍指向权威文档。
- pnpm test:unit:related：仓库提交前门禁。即使本次只改文档，相关测试选择器也可能因为当前分支相对默认分支的既有改动而选中 Desktop 测试。
- pnpm --filter desktop typecheck：覆盖相关测试选中的 Desktop 源码与类型契约。
- pnpm check:i18n、pnpm check:i18n-glossary、pnpm check:brand-terminology：相关测试包含多语言文案时，同步校验语言结构、术语和品牌词。
- pnpm check:dco：提交后确认范围内每个 commit 的 DCO 签名满足本地严格口径。

## 当前结果记录

- 2026-08-22：安装 worktree 依赖后，git diff --check、pnpm check:dev-docs、
  pnpm test:unit:related、pnpm --filter desktop typecheck、pnpm check:i18n、
  pnpm check:i18n-glossary 与 pnpm check:brand-terminology 全部通过。i18n 与术语表
  仅报告存量警告，不阻塞。pnpm check:dco 待 commit 创建后执行。
