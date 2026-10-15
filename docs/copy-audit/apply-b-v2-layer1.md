## 实施稿 B（v2）· 按新口径重出，替换旧的三条

口径同 A v2：界面只留操作所需信息与风险，实现细节与背景不进界面。这轮先把最长的 39 条写成可直接用的文案，其余分层处理。

### 第 1 层：可直接改（最长的 39 条）

**1. `settings.remote.keys.agenttrouble.fallbackbody`**  components/settings/SshKeySetupDialog.tsx:1089  （110→56 字）

- 原文：你可以在添加 host 时改用「Identity file」方式，{{appName}} 会把密钥文件直接交给 ssh，每次连接时由你输入密码。完全不依赖 agent。安全权衡：每次连接都要输密码，但内存里也不会留任何密钥缓存，安全自负。
- 改：**改用「Identity file」方式：密钥文件直接交给 ssh，每次连接输入密码，不依赖 ssh-agent。**

**2. `legacymigration.description`**  components/auth/LegacyMigrationDialog.tsx:150  （110→85 字）

- 原文：检测到本机存有旧版本的数据。历史对话和媒体文件将迁移到新的数据位置。若旧版应用正在运行，请先完全退出它；迁移期间请保持 {{appName}} 打开。注意：已授权的第三方密钥与凭证无法随数据迁移，迁移完成后需要在设置中重新授权或重新填写。
- 改：**检测到旧版本数据。历史对话与媒体会迁移到新位置；迁移期间请保持 {{appName}} 打开，并先退出旧版应用。已授权的第三方密钥与凭证不会迁移，完成后再重新授权或填写。**

**3. `providershare.received.detailnote`**  features/provider-share/ProviderShareReceivedRail.tsx:263  （107→69 字）

- 原文：Agent 在 {{name}} 的电脑或 {{name}} 安排的其他电脑上运行，用的是对方的登录和配额。对话内容和 Agent 读取的文件内容会经过 {{name}} 的电脑，并保存在实际运行任务的那台电脑上。新建任务时在模型列表里选择它就能用。
- 改：**Agent 在 {{name}} 的电脑或 {{name}} 安排的其他电脑上运行，用对方的登录和配额。对话内容与读取的文件会经过这些电脑，并保存在实际运行任务的那台机器上。**

**4. `settings.providers.custom.fields.openaiimageshint`**  components/settings/ProviderConnectionDialog.tsx:2621  （105→45 字）

- 原文：使用此连接的地址和 API Key 调用 /images/generations 与 /images/edits。开启后，此连接将作为供应商唯一的图片连接。缺少的模型可手动添加 ID，再到模型详情声明图片能力。
- 改：**用此连接的地址和 API Key 调用图片生成与编辑接口；它将成为该供应商唯一的图片连接。**

**5. `settings.ghosts.market.securitydescription`**  features/plugin/MarketPluginDetailView.tsx:132  （104→52 字）

- 原文：安装包会在主进程中校验大小与 SHA-256，再经 Cindy 插件清单校验后原子安装。安装前会请你确认插件的权限，装好后即自动开启，可随时在插件页停用；更新会保留当前生效状态，新版本权限变多时会先请你确认。
- 改：**安装前会校验安装包并请你确认插件权限；装好后自动开启，可随时停用。更新时若新版本权限变多，会再请你确认。**

**6. `settings.providers.models.advanced.contextlimitlocalmillionhint`**  components/settings/ModelAdvancedDrawer.tsx:755  （96→47 字）

- 原文：原生 256K（262,144 tokens），可选扩展至 1M（1,000,000）。服务运行时需在「管理服务」中重启以应用更改；已停止时，下次使用自动生效。长输入会增加内存占用和等待时间。
- 改：**原生 256K，可扩展至 1M。服务运行时需在「管理服务」重启生效；已停止则下次使用自动生效。**

**7. `settings.connections.claude.apimode.nokeydialog.description`**  未定位  （96→64 字）

- 原文：关闭 API 模式（走订阅）后，非 Claude 模型（gpt / deepseek 等）仍需复用 Cindy AI Key，当前还没有配置。前往「模型供应商」连接 Cindy AI 后即可。
- 改：**关闭 API 模式（走订阅）后，非 Claude 模型仍需 Cindy AI Key，当前未配置。前往「模型供应商」连接后即可。**

**8. `settings.remotecontrol.hook.form.legacydefaultsdescription`**  components/settings/HookConnectionsSection.tsx:277  （96→44 字）

- 原文：这台设备保存过一份旧的官方 bot 默认设置，它仍是没有单独配置过的目录的兜底值（官方 Telegram 与 X 共用同一份）。这些值现在统一在每个目录里设置。恢复默认会一并清掉以下全部内容：
- 改：**这台设备存有旧的默认设置，仍是没有单独配置过的目录的兜底值。恢复默认会一并清掉这些内容：**

**9. `settings.remote.keys.encrypthint`**  components/settings/SshKeySetupDialog.tsx:547  （96→62 字）

- 原文：passphrase 现在输入一次，然后 ssh-add 会把解密后的密钥缓存在系统 ssh-agent 里。macOS 还会把 passphrase 存到 Keychain，重启后自动恢复。
- 改：**passphrase 只需输入一次，由系统 ssh-agent 缓存（macOS 另存 Keychain，重启后自动恢复）。**

**10. `legal.analyticshint`**  未定位  （86→35 字）

- 原文：帮助我们了解 Cindy 的启动与留存情况。上报设备型号、系统版本、应用版本、设备标识符等设备与使用环境信息，登录后还包含你的账号 ID；不包含任何对话内容、文件或提示词。
- 改：**上报设备与使用环境信息（登录后含账号 ID），不含对话、文件或提示词。**

**11. `logic.confirm.remoteccnosourcedescription`**  hooks/useVendorAuthGate.ts:345  （74→68 字）

- 原文：远程设备「{{device}}」尚未连接可用的 Claude 模型来源，无法在这里新建并运行任务。请在该设备上打开 {{appName}}，在「设置 → 模型供应商」连接来源后重试。
- 改：**远程设备「{{device}}」没有可用的 Claude 模型来源，无法在这里新建任务。请到该设备的「设置 → 模型供应商」连接后重试。**

**12. `settings.agentresource.maxconcurrenthint`**  components/settings/AgentResourceSection.tsx:276 / components/settings/AgentResourceSection.settings-search.ts:9  （73→27 字）

- 原文：Claude Code 引擎所有命令的并发上限，超出的排队等待；0 表示不限。Codex 命令在自身沙箱内执行、不经此闸门，由优先级与限核层覆盖。
- 改：**Claude Code 命令的并发上限；0 表示不限。**

**13. `logic.confirm.codexvoiceauthdescription`**  hooks/useVendorAuthGate.ts:88  （73→49 字）

- 原文：语音输入需要使用已连接的 ChatGPT 账号调用 GPT 实时语音识别。当前账号尚未连接或需要更新，是否前往「模型供应商」连接 ChatGPT？
- 改：**语音输入要用已连接的 ChatGPT 账号。当前账号未连接或需要更新，是否前往「模型供应商」连接？**

**14. `settings.remotecontrol.hook.x.guide.riskworkdirbody`**  未定位  （72→58 字）

- 原文：X 任务都落在 X 连接设置里的默认工作目录，Agent 能读写其中文件，而结论会公开回帖 —— 默认目录指到私密仓库时，文件内容可能随之公开。
- 改：**X 任务落在默认工作目录，Agent 能读写其中文件，结论会公开回帖。默认目录指到私密仓库时，文件内容可能随之公开。**

**15. `settings.memory.description`**  components/settings/MemorySection.tsx:287  （72→43 字）

- 原文：用于帮助用户实现基于工作区的记忆，改变设置之后理论上需要新建 Agent 会话才会生效，如果觉得记忆系统出现问题可以点击 Reset 或者关闭。
- 改：**基于工作区的记忆。改设置后需新建 Agent 会话生效；异常时可 Reset 或关闭。**

**16. `settings.providers.wizard.mimotokenplannote`**  components/settings/AddProviderWizard.tsx:1983  （71→60 字）

- 原文：请使用 MiMo Token Plan 页面提供的专属 API Key (tp-…)。调用消耗订阅配额，不能与按量付费 API Key 混用。
- 改：**请用 MiMo Token Plan 的专属 API Key（tp-…）；它消耗订阅配额，不能与按量付费 Key 混用。**

**17. `settings.sessionimport.description`**  components/settings/SessionImportSection.tsx:178  （71→42 字）

- 原文：只读扫描本机 Claude Code 与 Codex 历史。只有列表里勾选的任务会被导入；已跳过的内部 Agent 会话不会展示，也不会导入。
- 改：**只读扫描本机 Claude Code 与 Codex 历史；只有勾选的任务会被导入。**

**18. `settings.providers.local.onboardingbody`**  components/settings/LocalOllamaInstall.tsx:118  （70→48 字）

- 原文：安装 Ollama 后，即可在 Cindy 中下载和使用本机模型，无需打开 Ollama App。Ollama 是免费开源的第三方运行环境。
- 改：**安装 Ollama 后即可在 Cindy 里下载和使用本机模型，无需打开 Ollama App。**

**19. `update.linuxinstallation.description`**  components/sidebar/UpdateBanner.tsx:343  （70→39 字）

- 原文：请使用对应的包管理器，或参考 Linux 用户目录安装指南。受管理的安装可能需要补齐工具或恢复写入权限。Cindy 和已下载的更新均已保留。
- 改：**请用对应的包管理器，或参考 Linux 用户目录安装指南。已下载的更新会保留。**

**20. `providershare.apply.waitdescription`**  features/provider-share/ProviderShareApplyDialog.tsx:230  （69→49 字）

- 原文：{{name}} 可能会问你看到的配对码，告诉对方这 4 位数字即可。对方的电脑不在线时，会在上线后看到你的申请；申请 24 小时内未处理会自动失效。
- 改：**对方可能问你看到的配对码，念给对方即可。对方不在线时，上线后会看到申请；24 小时未处理自动失效。**

**21. `settings.providers.models.advanced.contextlimitgpthint`**  components/settings/ModelAdvancedDrawer.tsx:756  （69→35 字）

- 原文：GPT 默认最多使用 272K；可在此自定义到 1M。Codex 会同步应用窗口与自动压缩阈值，保留 5% 余量；实际容量受模型服务限制。
- 改：**GPT 默认最多 272K，可自定义到 1M；实际容量受模型服务限制。**

**22. `cindymake.history.stopconfirm.description`**  apps/desktop/src/main/cindy-make/remoteProjection.ts:204 / components/cindy-make/useCindyMakeBuildStop.ts:39  （69→55 字）

- 原文：会同时停止本次处理冲突的任务，丢弃临时冲突修改，清理临时文件，并撤回尚未生成成功版本的合入。原制作任务的修改、交流记录和已生成版本会保留。
- 改：**会停止本次处理冲突的任务、丢弃临时修改并清理临时文件、撤回未成功合入的版本。原制作任务的修改与已生成版本保留。**

**23. `settings.voiceinput.fastactivation.hint`**  voice-input/WebMicAudioEngine.ts:186 / components/settings/VoiceInputSection.settings-search.ts:18  （68→37 字）

- 原文：用完后让麦克风短暂待命，缩短按下快捷键或按钮到开始录音的等待；通常可快约 100 毫秒。若 30 分钟内没有再次使用，会自动释放麦克风。
- 改：**用完后麦克风短暂待命，按下快捷键更快开始录音；30 分钟未使用会自动释放。**

**24. `scheduler.list.removeproject.confirmdescription`**  features/scheduler/SchedulerPage.tsx:508  （68→30 字）

- 原文：将从 .cindy/automations/schedules.json 中删除 "{{name}}"，此操作会影响所有协作者（commit 后）。
- 改：**将删除定时任务「{{name}}」，此改动会影响所有协作者。**

**25. `settings.computeruse.realprofile.readdenieddescription`**  components/settings/realProfilePermissionGuide.ts:88 / components/settings/ComputerUseSection.tsx:1154  （67→58 字）

- 原文：读取 Chrome 登录文件需要系统允许 Cindy。请在「隐私与安全性 → 完全磁盘访问权限」中打开 Cindy，然后回到这里再试。
- 改：**读取 Chrome 登录文件需要授权。请在「隐私与安全性 → 完全磁盘访问权限」中打开 Cindy，再回到这里重试。**

**26. `settings.cindymake.forcemanaged.enabledhint`**  components/settings/CindyMakeSection.tsx:332  （67→45 字）

- 原文：下方卡片可以测试 Windows 工具的下载与安装，已安装的 Cindy 工具会复用。开关立即生效，刷新或重启后关闭，不改动系统工具。
- 改：**下方卡片可以测试 Windows 工具的下载与安装；刷新或重启后自动关闭，不改动系统工具。**

**27. `chat.messageactionbar.deleteconfirmdescription`**  components/chat/useDeleteMessage.ts:47  （66→33 字）

- 原文：用户消息只删除本条；AI 消息会删除上一次用户输入之后产生的整轮输出。之后的消息继续保留。下次发送时，AI 上下文会从剩余记录重建。
- 改：**用户消息只删本条；AI 消息会删掉这条消息所属用户轮的全部输出。之后的消息保留。**

**28. `screen.deletemessagebody`**  未定位  （66→33 字）

- 原文：用户消息只删除本条；AI 消息会删除上一次用户输入之后产生的整轮输出。之后的消息继续保留。下次发送时，AI 上下文会从剩余记录重建。
- 改：**用户消息只删本条；AI 消息会删掉这条消息所属用户轮的全部输出。之后的消息保留。**

**29. `settings.tina.chat.description`**  components/settings/HookConnectionsSection.tsx:1290  （65→52 字）

- 原文：不落任何仓库的纯对话；在 Slack、Telegram 或 X 里选择 chat 即可使用，每条对话 lane 独立对应一个任务。
- 改：**不落仓库的纯对话；在 Slack、Telegram 或 X 里选 chat 使用，每条对话对应一个任务。**

**30. `settings.computeruse.android.connectionguide.unauthorized.body`**  未定位  （65→51 字）

- 原文：请在手机弹出的「允许 USB 调试」窗口中点击「允许」，建议勾选「始终允许使用这台电脑」，然后回到 Cindy 点击「重新检查」。
- 改：**在手机弹出的「允许 USB 调试」中点「允许」（建议勾选始终允许），回到 Cindy 点「重新检查」。**

**31. `settings.cindymake.forcemanaged.description`**  components/settings/CindyMakeSection.tsx:314  （65→24 字）

- 原文：仅开发版可用。便携工具只检查 Cindy 管理的副本，并模拟 Windows 原生编译工具缺失。切换开关只重新检查，不会开始安装。
- 改：**仅开发版可用。切换开关只重新检查，不会开始安装。**

**32. `usagedashboard.last30dtooltip`**  components/new-chat/HomeUsageDashboard.tsx:264  （64→72 字）

- 原文：显示总额 {{total}} = API 实际计费 {{api}} + 订阅 token 价值估算 {{subscription}}。订阅价值用于衡量套餐用量价值，不代表真实账单。
- 改：**显示总额 {{total}} = API 计费 {{api}} + 订阅用量价值估算 {{subscription}}；订阅价值不代表真实账单。**

**33. `issuetracker.mine.enhancementfailedhint`**  features/issue-tracker/lib/myIssuesNotices.ts:95  （64→53 字）

- 原文：暂时没能读取你 GitHub 账号名下的 Issue。可能是 Cindy GitHub 插件的访问令牌权限不足，可到插件页检查。
- 改：**读不到你 GitHub 账号名下的 Issue。可能是 GitHub 插件的令牌权限不足，可到插件页检查。**

**34. `scheduler.chips.schedulefield.minuteintervalhint`**  features/scheduler/components/ScheduleChips.tsx:541  （63→60 字）

- 原文：仅支持能整除 60 的分钟间隔：1、2、3、4、5、6、10、12、15、20、30 分钟；60 分钟请选择“每 1 小时”。
- 改：**仅支持能整除 60 的分钟间隔（1、2、3、4、5、6、10、12、15、20、30）；60 分钟请选「每 1 小时」。**

**35. `rightsidebar.resourceusage.terminateconfirmdescription`**  features/right-sidebar/plugins/resource-usage/ResourceUsageBody.tsx:417  （63→43 字）

- 原文：将强制终止该 Agent 进程，使用该进程的所有任务都会中断；之后在任一受影响任务里继续发消息，即可按需重新启动 Agent。
- 改：**会强制终止该 Agent 进程，涉及的任务中断；之后在受影响任务里发消息即可重新启动。**

**36. `sessionshare.import.riskwarning`**  components/settings/SessionShareImportWizard.tsx:349  （62→58 字）

- 原文：该文件来自外部分享，请确认来源可信。导入的历史内容可能影响 AI 的后续行为；继续对话时，AI 仍可读写本机文件、执行命令。
- 改：**该文件来自外部分享，请确认来源可信。导入的历史会影响 AI 后续行为；继续对话时 AI 仍可读写本机文件、执行命令。**

**37. `settings.remote.keys.unlockhint`**  components/settings/SshKeySetupDialog.tsx:664  （62→37 字）

- 原文：输入 passphrase 把这把密钥加载到 ssh-agent。我们把它直接喂给 `ssh-add` 后立刻丢弃，不保存。
- 改：**输入 passphrase 把密钥载入 ssh-agent；我们不保存它。**

**38. `settings.computeruse.directcontrol.permissionintro.description`**  未定位  （62→50 字）

- 原文：{{appName}} 将在本机安装或启动 Cua Driver，用于读取屏幕并执行点击、输入等操作。请仅在你主动发起自动操作电脑任务时启用。
- 改：**将在本机安装或启动 Cua Driver，用于读取屏幕并执行点击、输入。请仅在你主动发起任务时启用。**

**39. `settings.ghosts.library.relocateconfirmdescription`**  features/plugin/GhostLibrarySection.tsx:89 / features/plugin/GhostLibrarySection.tsx:112  （62→42 字）

- 原文：将把全部作品数据复制到新位置并逐项校验；原目录保留 14 天作为回滚余地。数据量大时可能需要几分钟，期间请尽量不使用该插件。
- 改：**会把作品数据复制到新位置并逐项校验；原目录保留 14 天。过程中请尽量不使用该插件。**

