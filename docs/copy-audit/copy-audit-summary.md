## 背景

界面里不少说明文案把「操作过程」和「防御性提示」写进正文，读起来比功能本身复杂。这份 issue 把这类文案按页面整理出来，并附上每页的界面截图，便于逐条决定改不改。

## 筛选口径

同时满足三条才算：

1. 同一组里存在 2–12 字的控件名（title / label / name），功能已被命名；
2. 文案命中防御词（无法、不支持、避免、权限、删除、恢复、暂时、可能…）或过程词（请先、然后、点击、登录后、等待、正在…）；
3. 长度超过 20 字，或含多个分句。

## 方法

截图不是手工点客户端截的：把真实组件源码挂到一个只读预览服务里渲染（复用仓库的 vite.renderer.config.ts），给组件喂空列表 / 未连接状态 / 假数据，再用 Playwright 截图。好处是真实布局与真实文案，代价是画面反映的是指定状态，不是实时数据。

## 结果概览

- 命中总量：601 条（去重后）
- 已渲染截图覆盖：188 条
- 尚未渲染：412 条（多在弹窗、抽屉、向导与需要特定状态的流程里）
- 页面分组：51 个

## 按页面：最长的几条与建议

### 关于（37 条命中）

- **208 字**  settings.about.storage.dbslimmingincludeactiveconfirmdescription
  > 未归档任务即使超过所选时间，也可能仍在运行。清理不会等待任务停止，任务在扫描后继续产生的消息也可能被清除。启用后，超过所选时间的未归档、已归档和软删除任务都会被清理。符合范围的未归档任务历史消息和 Agent 上下文将被清除；普通任务条目也将从列表移除，伙伴主任务仍会保留。数据库备份可以恢复任务和消息数据；不创建备份时，这些数据也无法恢复。用于审查或撤销这些消息所产生文件改动的记录不包含在数据库备份中，无法恢复。
  建议：需人工重写
- **122 字**  settings.about.logupload.scopedescription
  > 上传内容：Cindy 自身的运行记录（启动与退出、崩溃、网络、更新、数据库、登录）和设备环境信息（系统版本、应用版本、设备标识符），登录后还包含你的账号 ID。不上传：对话内容、文件内容、提示词、工作目录路径。凭证与邮箱地址会在上传前自动抹除。
  建议：需人工重写
- **96 字**  settings.about.analyticsdescription
  > 帮助我们了解 Cindy 的启动与留存情况。上报设备型号、系统版本、应用版本、设备标识符等设备与使用环境信息，登录后还包含你的账号 ID；不包含任何对话内容、文件或提示词。关闭后立即停止上报。
  建议：需人工重写
- **76 字**  settings.about.logupload.crashautodescription
  > 开启后，Cindy 崩溃时会自动把崩溃前后的运行记录送到我们的后台，你不用再手动上传。默认关闭，随时可关；关闭后已经排队等待上传的崩溃记录会被立即清除。
  建议：你不用再手动上传

### 插件设置（17 条命中）

- **179 字**  settings.ghosts.market.sources.guide.authbody
  > 认证完全依赖系统的 Git 配置，Cindy 不保存任何 Git 凭证。SSH 方式：本机已配置可用的 key；若组织开启了 SAML SSO，还需在 GitHub 的 SSH key 设置里为该组织点 Configure SSO 授权。HTTPS 方式：使用 Personal Access Token，并由系统 credential helper 保存。
  建议：需人工重写
- **116 字**  settings.ghosts.market.sources.guide.rulesbody
  > 插件 id 全局唯一、先装先得——与已安装插件冲突时会明确提示。id 使用官方保留前缀（{{reservedGhostIdPrefixes}}）的插件，不能通过拖入、选择文件或自定义插件市场装入。插件声明的权限会在详情页展示；点击安装后直接完成安装并自动开启，不再额外弹窗确认权限。
  建议：需人工重写
- **104 字**  settings.ghosts.market.securitydescription
  > 安装包会在主进程中校验大小与 SHA-256，再经 Cindy 插件清单校验后原子安装。安装前会请你确认插件的权限，装好后即自动开启，可随时在插件页停用；更新会保留当前生效状态，新版本权限变多时会先请你确认。
  建议：需人工重写
- **77 字**  settings.ghosts.market.customsecuritydescription
  > 该插件来自你添加的自定义市场，未经 Cindy 服务端完整性校验。安装前会在主进程校验插件清单并请你确认插件的权限；装好后即自动开启，可随时在插件页停用。
  建议：需人工重写

### 自动操作（18 条命中）

- **176 字**  settings.computeruse.browser.openforloginhint
  > 这是 Agent 专用的独立浏览器：基于你本机的 Chrome，但用一份独立配置（右上角显示为 Cindy），不会动你日常 Chrome 的标签页、书签和登录态。Agent 会在这里替你打开网页、阅读内容、点击和截图。需要登录的网站，点上面「打开 Agent 专用浏览器」手动登录一次即可——登录态会长期保留，之后 Agent 就能以你的身份继续操作。
  建议：这是 Agent 专用的独立浏览器
- **175 字**  settings.computeruse.directcontrol.permissionintro.macosdescription
  > 接下来 {{appName}} 会安装或打开 Cua Driver 的授权流程，并可能跳转到 macOS 系统设置。请先为 CuaDriver 授予「辅助功能」和「屏幕录制」核心权限；之后在使用过程中，macOS 可能还会按目标 App 或具体动作弹出额外确认。只有在你主动发起 Computer Use 任务时才应确认这些请求。完成后回到 {{appName}}，它会自动检查并启用。
  建议：需人工重写
- **74 字**  settings.computeruse.description
  > 让 Agent 使用电脑和已连接设备替你完成任务。浏览器自动化使用独立浏览器；Android 自动化使用 ADB；电脑自动化依赖本机 driver。
  建议：需人工重写
- **67 字**  settings.computeruse.realprofile.readdenieddescription
  > 读取 Chrome 登录文件需要系统允许 Cindy。请在「隐私与安全性 → 完全磁盘访问权限」中打开 Cindy，然后回到这里再试。
  建议：需人工重写

### 工具设置（13 条命中）

- **156 字**  settings.agentresource.description
  > 限制 Agent 命令行任务的系统资源占用，避免并行测试、构建把机器拖卡。默认全速（不干预）。并发上限即刻生效；优先级降档对已在跑的 Agent 进程约 15 秒内生效；把优先级调回正常和工具链限核只对新启动的 Agent 进程生效。仅作用于本机 Agent；远端（SSH）机器上的 Agent 不受本设置约束。
  建议：需人工重写
- **76 字**  settings.agentresource.capthreadshint
  > 注入 VITEST_MAX_FORKS、MAKEFLAGS 等环境变量，防止单条测试或构建命令占满全部 CPU 核心；你自己设置过的同名变量不会被覆盖。
  建议：需人工重写
- **73 字**  settings.agentresource.maxconcurrenthint
  > Claude Code 引擎所有命令的并发上限，超出的排队等待；0 表示不限。Codex 命令在自身沙箱内执行、不经此闸门，由优先级与限核层覆盖。
  建议：需人工重写
- **59 字**  settings.pipackages.inspectionhint
  > Pi 包由 Pi 原生包系统安装和加载。Cindy 只展示建议性兼容详情；未知、不支持或分析失败都不会阻止安装和启用。
  建议：需人工重写

### 远程连接（40 条命中）

- **151 字**  settings.remote.add.agentproxyhint
  > 远端 127.0.0.1 的固定端口经 Cindy 维护的独立 SSH 隧道转回本机 Proxy（如 Clash 的 7890）。{{appName}} 不提供 Proxy，只建隧道；远端 agent 的 HTTPS_PROXY 写死这个固定端口，重连不漂移。修改配置后远端 codex daemon 会重启一次以生效。
  建议：需人工重写
- **131 字**  settings.remotecontrol.hook.form.defaultworkspacerowhint
  > 选中的目录是默认工作目录：Telegram 私聊、群和话题里，凡是没有单独选过项目的，任务都落在它里面（用 /workspace 单独选过的，仍按那个走）。请留意所选目录这一行的权限模式：设成「完全访问」时，任何群里 @ bot 都会以完全访问在这个仓库里执行。
  建议：需人工重写
- **110 字**  settings.remote.keys.agenttrouble.fallbackbody
  > 你可以在添加 host 时改用「Identity file」方式，{{appName}} 会把密钥文件直接交给 ssh，每次连接时由你输入密码。完全不依赖 agent。安全权衡：每次连接都要输密码，但内存里也不会留任何密钥缓存，安全自负。
  建议：需人工重写
- **96 字**  settings.remote.keys.encrypthint
  > passphrase 现在输入一次，然后 ssh-add 会把解密后的密钥缓存在系统 ssh-agent 里。macOS 还会把 passphrase 存到 Keychain，重启后自动恢复。
  建议：需人工重写

### 通用设置（28 条命中）

- **149 字**  settings.contacts.description
  > 为 Agent 建立的人物与组织档案库：跨平台身份反查(邮箱 / 飞书 / Slack / GitHub id → 这是谁)、关系背景与带日期的事件记录。Agent 在工作中自动沉淀，低置信条目进入待确认队列由你裁决。数据默认只保存在本机，也可由你开启设备间同步；查询与整理会经由你自己的模型处理。
  建议：为 Agent 建立的人物与组织档案库
- **80 字**  settings.visionbridge.enablehint
  > 关闭时所有模型行为与之前完全一致。开启后，下方勾选的模型会把图片经视觉后端转成文字描述。启用后，发送给这些模型的图片以及同消息文字提示会发送给你选择的视觉后端。
  建议：关闭时所有模型行为与之前完全一致
- **79 字**  settings.contacts.sync.description
  > 在需要参与的每台桌面设备上开启一次。设备在线时自动同步；同一局域网优先直连，否则发送端到端加密的中转数据。纯程序比对，不调用模型，也不产生 token 消耗。
  建议：在需要参与的每台桌面设备上开启一次
- **78 字**  settings.sessionruntimefallback.cell.description
  > 连接或容量故障连续发生时，先切换到同名模型的其他已连接来源，再尝试当前 Agent 明确推荐的模型；不会切换 Agent，也不会改掉你保存的选择。默认关闭。
  建议：连接或容量故障连续发生时

### IM 机器人（54 条命中）

- **146 字**  settings.imbot.defaults.grouppermissiondescription
  > 群里新建任务时统一使用的权限档（@bot 开话题、/new、/ctr 都算），默认「自动审批」；上面那个权限档只管私聊。群上下文里有成员可控的内容，设成「完全访问」后将直接执行、不再逐条确认，请确认群里的人都可信。改动只影响之后新建的任务，已有任务在群里用 /permission 单独切换。
  建议：需人工重写
- **137 字**  settings.discordbot.guide.step3.body
  > 在 OAuth2 URL Generator 勾选 scope bot，并授予 Send Messages、Read Message History、Attach Files 权限，把 Bot 邀请到任一你所在的 server；DM 需要你和 Bot 有共同 server。
  建议：需人工重写
- **82 字**  settings.feishubot.clearconfirm.description
  > 解绑后将断开 WebSocket 连接，并删除本机保存的 App ID / App Secret / 主人 openId。如需重新使用，需要重新创建或重新填写凭证。
  建议：需人工重写
- **74 字**  bots.groupchat.settings.projectdirnote
  > 分工做事时，伙伴们在这里干活。不选也行，会用这个群自己的文件夹；选了 git 项目，每次分工会新开一个 worktree 和分支，不动你手上的代码。
  建议：分工做事时，伙伴们在这里干活

### 语音输入（16 条命中）

- **124 字**  settings.voiceinput.permissions.inputmonitoring.tooltip
  > 用于监听 Fn、单独 Command / Option / Control、带 Fn 的快捷键，以及 F1-F24 单键按住说话的松键事件。普通组合键不需要。已授权表示当前运行中的 App 可以监听快捷键；开发版可能由 Terminal 承载授权。
  建议：需人工重写
- **68 字**  settings.voiceinput.fastactivation.hint
  > 用完后让麦克风短暂待命，缩短按下快捷键或按钮到开始录音的等待；通常可快约 100 毫秒。若 30 分钟内没有再次使用，会自动释放麦克风。
  建议：用完后让麦克风短暂待命
- **58 字**  settings.voiceinput.servicesource.customasr.notice
  > 请填写 ASR 服务提供的完整 WebSocket 地址。Cindy 不会复用对话模型地址，也不会自动拼接语音路径。
  建议：需人工重写
- **55 字**  settings.voiceinput.permissions.accessibility.tooltip
  > 辅助功能权限用于在其他 App 中自动输入语音结果、读取光标附近文本作为润色上下文，并识别外部修改以改进词典。
  建议：需人工重写

### legacyMigration（2 条命中）

- **110 字**  legacymigration.description
  > 检测到本机存有旧版本的数据。历史对话和媒体文件将迁移到新的数据位置。若旧版应用正在运行，请先完全退出它；迁移期间请保持 {{appName}} 打开。注意：已授权的第三方密钥与凭证无法随数据迁移，迁移完成后需要在设置中重新授权或重新填写。
  建议：需人工重写
- **33 字**  legacymigration.faileddescription
  > 本次数据迁移未能完成。你可以继续使用 {{appName}}，下次登录时会自动重试。
  建议：需人工重写

### 伙伴页（12 条命中）

- **107 字**  providershare.received.detailnote
  > Agent 在 {{name}} 的电脑或 {{name}} 安排的其他电脑上运行，用的是对方的登录和配额。对话内容和 Agent 读取的文件内容会经过 {{name}} 的电脑，并保存在实际运行任务的那台电脑上。新建任务时在模型列表里选择它就能用。
  建议：用的是对方的登录和配额
- **69 字**  providershare.apply.waitdescription
  > {{name}} 可能会问你看到的配对码，告诉对方这 4 位数字即可。对方的电脑不在线时，会在上线后看到你的申请；申请 24 小时内未处理会自动失效。
  建议：需人工重写
- **51 字**  providershare.link.description
  > 把链接发给你想分享的人。对方打开后会先看到说明，确认后向你发送申请，你在这台电脑上同意后分享才会生效。
  建议：把链接发给你想分享的人
- **49 字**  providershare.manage.removeconfirm.description
  > {{name}} 将立即无法使用 {{provider}}，正在运行的任务会停止。之后要再分享，需要重新生成链接。用量记录会保留。
  建议：需人工重写

### 模型供应商（52 条命中）

- **105 字**  settings.providers.custom.fields.openaiimageshint
  > 使用此连接的地址和 API Key 调用 /images/generations 与 /images/edits。开启后，此连接将作为供应商唯一的图片连接。缺少的模型可手动添加 ID，再到模型详情声明图片能力。
  建议：需人工重写
- **96 字**  settings.providers.models.advanced.contextlimitlocalmillionhint
  > 原生 256K（262,144 tokens），可选扩展至 1M（1,000,000）。服务运行时需在「管理服务」中重启以应用更改；已停止时，下次使用自动生效。长输入会增加内存占用和等待时间。
  建议：可选扩展至 1M（1,000,000）
- **96 字**  settings.connections.claude.apimode.nokeydialog.description
  > 关闭 API 模式（走订阅）后，非 Claude 模型（gpt / deepseek 等）仍需复用 Cindy AI Key，当前还没有配置。前往「模型供应商」连接 Cindy AI 后即可。
  建议：关闭 API 模式（走订阅）后
- **89 字**  settings.providers.models.advanced.contextlimithint
  > 用于此模型的所有可用引擎。以整数 K 编辑（1 K = 1,000 tokens）；未编辑时保留精确值。保存后用于后续运行，正在生成的内容不受影响。实际可用长度仍受模型服务限制。
  建议：用于此模型的所有可用引擎

### logic（9 条命中）

- **86 字**  logic.confirm.remotecodexnosourcedescription
  > 远程设备「{{device}}」尚未连接 Codex 可用的模型来源，无法在这里新建并运行任务。请在该设备上打开 {{appName}}，在「设置 → 模型供应商」登录 OpenAI 或连接其他来源后重试。
  建议：需人工重写
- **74 字**  logic.confirm.remoteccnosourcedescription
  > 远程设备「{{device}}」尚未连接可用的 Claude 模型来源，无法在这里新建并运行任务。请在该设备上打开 {{appName}}，在「设置 → 模型供应商」连接来源后重试。
  建议：需人工重写
- **73 字**  logic.confirm.codexvoiceauthdescription
  > 语音输入需要使用已连接的 ChatGPT 账号调用 GPT 实时语音识别。当前账号尚未连接或需要更新，是否前往「模型供应商」连接 ChatGPT？
  建议：需人工重写
- **62 字**  logic.confirm.voiceapikeyauthdescription
  > 语音输入当前使用 Cindy AI 语音识别服务。尚未连接 Cindy AI，无法开始语音输入。是否前往「模型供应商」连接？
  建议：需人工重写

## 典型的几类问题

1. **同一屏重复讲一件事**：远程插件设置卡片同时出现组件内建的「在本机浏览器中授权…」与步骤描述「在这台电脑的浏览器中授权…」。
2. **一句话塞四件事**：settings.computerUse.browser.openForLoginHint（176 字）把「是什么 / 不影响日常浏览器 / 如何登录一次 / 登录态长期保留」压在一句里。
3. **同一动作两套措辞**：共享任务的「取消全部共享」在设置页写「任务记录保留」，确认框写「原邀请链接将失效」。
4. **条件性结论堆叠**：分享导入完成页把「可继续对话，但回溯可能失败」与「Codex 环境未初始化」并列，实际只命中一条。

## 尚未覆盖的页面与原因

远程连接、IM 机器人各渠道分区、内置工具、语音输入这几页，挂载后页面主线程被阻塞（DOM 就绪后 evaluate 不再返回），用网页桩渲染会卡死：它们都订阅模块级 store，在没有主进程推送的环境下自触发。这几页需要改走真实 dev 实例截图。

## 截图

**设置 · 模型供应商（空列表）**

![设置 · 模型供应商（空列表）](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/providers.jpg)

**设置 · 关于**

![设置 · 关于](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/about.jpg)

**设置 · 键盘快捷键**

![设置 · 键盘快捷键](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/shortcuts.jpg)

**设置 · 电脑操作**

![设置 · 电脑操作](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/computer-use.jpg)

**设置 · Agent 资源**

![设置 · Agent 资源](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/agent-resource.jpg)

**插件市场 · 添加市场指南**

![插件市场 · 添加市场指南](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/plugin-market-guide.jpg)

**插件详情 · 同标识已安装**

![插件详情 · 同标识已安装](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/plugin-detail.jpg)

**IM 官方渠道 · X 用法与风险**

![IM 官方渠道 · X 用法与风险](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/remote-x-guide.jpg)

**设置 · 联系人**

![设置 · 联系人](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/contacts.jpg)

**设置 · 远程桌面权限**

![设置 · 远程桌面权限](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/remote-perms.jpg)

**SSH 密钥 · 生成表单**

![SSH 密钥 · 生成表单](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/ssh-key.jpg)

**共享任务 · 共享管理**

![共享任务 · 共享管理](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/shared-manage.jpg)

**导出任务弹窗**

![导出任务弹窗](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/share-export.jpg)

**导入分享包 · 预览**

![导入分享包 · 预览](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/share-import.jpg)

**确认框 · 远程无可用来源**

![确认框 · 远程无可用来源](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/confirm-remote.jpg)

**远程插件设置卡片等**

![远程插件设置卡片等](https://raw.githubusercontent.com/lengjingxu/cindy/docs/copy-audit-assets/docs/copy-audit/plugin-setup.jpg)

## 说明

这是一份文案审阅清单，不是缺陷报告：每条「可精简」只说明控件名已能承接说明、正文落在防御或过程描述上，是否删改仍需按真实风险核对（涉及权限、隐私、数据删除与恢复路径的尤其如此）。
