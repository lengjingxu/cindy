## 实施稿 B（v2）· 第 2 层：仍需逐条定稿（160 条）

都是 41 字以上、但需要结合真实上下文判断的条目。给出该删什么、该留什么，可直接照此改写。

### IM 机器人（19 条）

- `bots.lifecycle.deletedescription`（62 字，features/bots/BotDeleteDialog.tsx:65）——删实现细节与背景，保留风险与恢复边界，分段
  原文：删除 {{name}} 后，伙伴的资料、记忆、工作目录、通道连接与自动化任务将被移除，无法撤销。任务历史与独立 worktree会保留。
- `bots.groupchat.server.settings.toolshint`（62 字，未定位）——删背景与重复，保留动作与结果
  原文：本群成员可以使用伙伴已有的工具与私人资料，结果对全群可见。原有操作审批仍有效；撤回会停止进行中的请求，已执行的操作无法撤销。
- `settings.imbot.defaults.agentunsupportedonchannelmodehint`（62 字，components/settings/ImDefaultSettingsSection.tsx:412）——删实现细节与背景，保留风险与恢复边界，分段
  原文：切换 Agent 后发送 /new，若新的 Agent 仍提示权限模式问题，请再发送 /permission 调整权限模式。
- `settings.discordbot.guide.step4.body`（56 字，components/settings/DiscordBotSection.tsx:86）——删背景与重复，保留动作与结果
  原文：在 Discord 用户设置开启 Developer Mode，右键自己的头像，选择 Copy User ID。
- `settings.wechatbot.intro`（56 字，components/settings/WechatBotSection.tsx:239）——删背景与重复，保留动作与结果
  原文：连接后，你发给该微信连接的私聊消息会进入本机 Cindy。授权网页由腾讯提供，页面中可能显示 OpenClaw。
- `settings.imbot.defaults.permissionmodeunsupportedonchannelhint`（56 字，apps/desktop/src/main/im/feishu/uiText.ts:97 / components/settings/ImDefaultSettingsSection.tsx:418）——删实现细节与背景，保留风险与恢复边界，分段
  原文：当前 Agent 不支持以此权限模式在该渠道运行，消息将无法处理。请发送 /permission 调整权限模式。
- `settings.imbot.defaults.agentunsupportedonchannelhint`（55 字，components/settings/ImDefaultSettingsSection.tsx:406）——删实现细节与背景，保留风险与恢复边界，分段
  原文：{{agent}} Agent 不支持此渠道的逐条权限确认，消息将无法处理。请改用 Claude Code 或 Codex。
- `settings.wechatbot.unbind.description`（54 字，components/settings/WechatBotSection.tsx:103）——删实现细节与背景，保留风险与恢复边界，分段
  原文：解绑会停止收发、删除本机微信凭证并清理未完成的执行。已创建的 Cindy 任务、历史消息和已保存附件会保留。
- `settings.telegrambot.remotedevices.hint`（53 字，components/settings/TelegramRemoteDevices.tsx:193）——删背景与重复，保留动作与结果
  原文：让某台设备下线后，它就不再接收消息。它的 Token 和绑定不会被清除，之后在那台设备上随时能自己再上线。
- `settings.telegrambot.guide.step4.body`（50 字，components/settings/TelegramBotSection.tsx:120）——删背景与重复，保留动作与结果
  原文：把 Token 和用户 ID 填到上面，点连接。桌面端会直连 Telegram，不经 {{appName}} 服务器。
- `bots.capabilities.accesshint`（47 字，features/bots/BotCapabilitySettings.tsx:213）——删背景与重复，保留动作与结果
  原文：逐项选择伙伴可使用的内置工具、MCP 与技能。更改从下一次请求生效，也适用于已授权的群内请求。
- `settings.wecombot.ownerhint`（46 字，components/settings/WecomBotSection.tsx:206）——删背景与重复，保留动作与结果
  原文：连接后，首个向机器人发送单聊消息的成员会绑定为本机 owner；仅该成员可触发 Agent。
- `bots.groupchat.settings.speakingmodeautonote`（46 字，features/bots/BotGroupSettingsDrawer.tsx:543）——删背景与重复，保留动作与结果
  原文：没有 @ 人或 @所有人时，第一圈大家同时想，之后轮流接话；@ 了伙伴就按 @ 的先后轮流。
- `settings.wecombot.setuphint`（44 字，components/settings/WecomBotSection.tsx:162）——删背景与重复，保留动作与结果
  原文：在企业微信管理后台创建智能机器人并启用长连接，然后填入 Bot ID 和 Secret。
- `settings.wechatbot.authorization.rebinddescription`（44 字，components/settings/WechatBotSection.tsx:88）——删背景与重复，保留动作与结果
  原文：当前微信已有连接。继续扫码可能解除该微信原有的 Cindy 或 OpenClaw 连接。
- `settings.wechatbot.errornote`（42 字，components/settings/WechatBotSection.tsx:238）——删实现细节与背景，保留风险与恢复边界，分段
  原文：本次连接未完成。请确认网络正常后重新扫码；Cindy 不会在连接失败时保存明文凭证。
- `bots.sessionloadfaileddescription`（42 字，features/bots/BotSessionView.tsx:226 / features/bots/RemoteBotSessionView.tsx:107）——删背景与重复，保留动作与结果
  原文：任务关联仍然存在，但 Cindy 暂时无法读取伙伴状态。你可以重试，或返回伙伴总览。
- `bots.modelchain.description`（42 字，未定位）——删实现细节与背景，保留风险与恢复边界，分段
  原文：最多设置 5 个模型。当前候选不可用时，伙伴会按顺序自动接替，不需要你切任务或重试。
- `bots.groupchat.settings.replymodenote`（41 字，features/bots/BotGroupSettingsDrawer.tsx:516）——删背景与重复，保留动作与结果
  原文：没什么可补充的伙伴不会说话。每轮最多聊 3 圈、10 条，之后等你点「继续讨论」。

### 模型供应商（17 条）

- `settings.connections.codex.apimode.nokeydialog.description`（59 字，未定位）——删背景与重复，保留动作与结果
  原文：API 模式需要复用 Cindy AI Key，当前还没有配置。前往「模型供应商」连接 Cindy AI 后即可开启。
- `settings.providers.custom.authmode.nonehelp`（56 字，components/settings/ProviderConnectionDialog.tsx:2202）——删实现细节与背景，保留风险与恢复边界，分段
  原文：适用于本机或受信任的自托管 Proxy。Cindy 会移除 CLI 自带的订阅凭证和账号头，再把请求发往该端点。
- `settings.providers.custom.authmode.oauthhelp`（54 字，components/settings/ProviderConnectionDialog.tsx:2149）——删实现细节与背景，保留风险与恢复边界，分段
  原文：适用于支持 OAuth 登录的供应商。可选择浏览器或设备码登录，保存后从供应商列表发起登录。凭证保存在本机。
- `settings.providers.xd.disconnectconfirm.description`（53 字，components/settings/ProvidersSection.tsx:1751）——删背景与重复，保留动作与结果
  原文：断开后将清除本地保存的 Cindy AI Key，需要重新连接才能继续使用 Cindy AI 提供的模型。
- `settings.providers.custom.runtimefill.independentnote`（52 字，components/settings/CustomProviderRuntimeFillOverlay.tsx:419）——删实现细节与背景，保留风险与恢复边界，分段
  原文：这是一次性填充；之后各 runtime 不会同步。API 密钥仍使用独立 safeStorage 记录。
- `settings.providers.custom.fields.modelsupportsreasoninghelp`（51 字，未定位）——删背景与重复，保留动作与结果
  原文：仅在该模型接受推理强度时开启，并勾选它实际支持的所有档位。保存后，下一个 Pi Agent 会话生效。
- `settings.providers.wizard.modelshint`（48 字，components/settings/AddProviderWizard.tsx:2175）——删背景与重复，保留动作与结果
  原文：勾选的模型将出现在对话的模型选择器中，对可用的 CLI 同时生效；之后可在供应商详情里随时调整。
- `settings.providers.builtinapikey.disconnectconfirm.description`（47 字，components/settings/ProvidersSection.tsx:1590）——删背景与重复，保留动作与结果
  原文：断开会清除这份连接保存的 API key。供应商会保留，重新填写 API key 后即可使用。
- `codexresets.confirmbody`（47 字，hooks/useCodexRateLimitReset.ts:56）——删实现细节与背景，保留风险与恢复边界，分段
  原文：将为 {{account}} 消耗 1 次重置，优先使用最早到期的一次。可重置的用量额度将恢复，此操作无法撤销。
- `settings.providers.custom.runtimefill.endpointbundlenote`（44 字，components/settings/CustomProviderRuntimeFillOverlay.tsx:409）——删背景与重复，保留动作与结果
  原文：向 {{target}} 填充时，基础 URL、请求路径和 API 协议会成组复制，避免端点组合不匹配。
- `settings.providers.local.deleteconfirmbody`（44 字，components/settings/ProvidersSection.tsx:2857）——删背景与重复，保留动作与结果
  原文：只会移除 Cindy 中的连接。Ollama 里已下载的模型仍在磁盘上，服务也不会停止。
- `settings.providers.import.busywarning`（42 字，components/settings/ProviderImportDialog.tsx:289）——删实现细节与背景，保留风险与恢复边界，分段
  原文：此次变更需要重载本机 Codex 服务，可能中断 {{count}} 个正在运行的任务。是否继续？
- `settings.auxiliarymodels.signinhint`（42 字，components/settings/AuxiliaryModelSection.tsx:301 / components/settings/AuxiliaryModelSection.tsx:314）——删背景与重复，保留动作与结果
  原文：登录 Cindy 后可使用自动推荐；未登录时请在自定义中选择已配置的其他供应商模型。
- `settings.providers.models.advanced.imagecapability.hint`（41 字，components/settings/ModelAdvancedDrawer.tsx:897）——删背景与重复，保留动作与结果
  原文：应用于 {{agent}} 的图片连接。仅声明接口实际支持的能力，保存后重新打开 Art 详情。
- `settings.providers.llamacpp.restarthint`（41 字，components/settings/LlamaCppProviderDetail.tsx:278）——删实现细节与背景，保留风险与恢复边界，分段
  原文：下载模型或修改上下文后，在「管理服务」中重启以应用更改。重启会中断正在进行的生成。
- `settings.providers.local.deletemodelconfirmbody`（41 字，components/settings/UnifiedModelList.tsx:667）——删实现细节与背景，保留风险与恢复边界，分段
  原文：会从这台电脑删除已下载的模型文件，Cindy 里也会一并移除。需要时可以重新下载。
- `settings.providers.openai.accountsourcesdescription`（41 字，components/settings/AddProviderWizard.tsx:1811）——删背景与重复，保留动作与结果
  原文：使用已有的本机 Codex 连接，或登录一个独立保存的账号。两种方式支持相同功能。

### 远程连接（16 条）

- `settings.remotecontrol.hook.x.guide.riskpublicbody`（61 字，未定位）——删实现细节与背景，保留风险与恢复边界，分段
  原文：我们的回复是一条公开推文，任何人都能看到。这个功能适合公开地找答案、解决问题，不适合处理私事 —— 那会有隐私暴露的风险。
- `settings.remote.startsession.hint`（60 字，components/settings/RemoteHostDetail.tsx:477）——删背景与重复，保留动作与结果
  原文：新建一个绑定到这台机器的 Maker。Codex 跑在远端，你在这里和它聊。工作目录支持 ~ 展开，不存在会确认后创建。
- `settings.remotecontrol.revokeconfirm.description`（58 字，apps/desktop/src/main/remote-desktop/controlledOverlay.ts:241 / features/remote-device/ControlledBanner.tsx:214）——删实现细节与背景，保留风险与恢复边界，分段
  原文：撤销后，该设备会立即断开，并且无法再远程连接本机。之后需在「设置 → 远程连接」中恢复其访问权限，对方才能重新连接。
- `settings.remotecontrol.hook.multi.removeconfirmdescription`（50 字，components/settings/HookConnectionsSection.tsx:955）——删背景与重复，保留动作与结果
  原文：解绑后 Slack workspace「{{team}}」将无法再向这台设备派发任务；需要时可随时重新授权绑定。
- `remotedesktop.screenrecordinghelp`（50 字，未定位）——删背景与重复，保留动作与结果
  原文：打开系统设置，为当前 Cindy 开启屏幕录制。若系统要求重新启动，请重新打开 Cindy 后连接。
- `settings.devices.allowcontrolhint`（48 字，components/settings/MyDevicesPanel.tsx:376）——删背景与重复，保留动作与结果
  原文：开启后，使用同一账号登录的其它设备无需逐次确认即可控制本机；本机会显示远程控制提示，可随时断开。
- `settings.remote.add.auth.keyhint`（47 字，components/settings/RemoteSection.tsx:542）——删实现细节与背景，保留风险与恢复边界，分段
  原文：直接读私钥文件。为了不存密码，不支持加密的密钥 —— 仅在 ssh-agent 不可用时使用。
- `settings.devices.description`（47 字，未定位）——删背景与重复，保留动作与结果
  原文：同一飞书账号登录的设备可以互相发现；开启「允许控制」后，你的其它设备可以远程连接本机的 {{appName}}。
- `settings.remotecontrol.hook.telegram.unlinkconfirmdescription`（46 字，未定位）——删背景与重复，保留动作与结果
  原文：解绑后 Telegram 将不能再向这台设备派发消息；本地项目和 Slack 连接不受影响。
- `settings.remote.configwarning`（46 字，components/settings/RemoteSection.tsx:1335）——删背景与重复，保留动作与结果
  原文：部分 SSH 配置规则 Cindy 无法解析，主机列表或连接信息可能与终端 SSH 不一致。
- `remotedesktop.permissionsintro`（45 字，apps/mobile/src/remote-desktop/PermissionGuide.tsx:90 / components/settings/RemoteDesktopPermissions.tsx:71）——删实现细节与背景，保留风险与恢复边界，分段
  原文：查看桌面需要屏幕录制权限；操作桌面还需要辅助功能权限。请在电脑上完成授权，结果会自动更新。
- `settings.remote.keys.passstoragenote`（44 字，components/settings/SshKeySetupDialog.tsx:577 / components/settings/SshKeySetupDialog.tsx:682）——删背景与重复，保留动作与结果
  原文：{{appName}} 不存任何 passphrase。仅在调用 ssh-add 时使用，完成后立即丢弃。
- `remotedevice.controlledtooltip`（44 字，features/remote-device/ControlledBanner.tsx:238）——删实现细节与背景，保留风险与恢复边界，分段
  原文：这些设备连接了 Cindy 的任务，不代表正在控制桌面鼠标和键盘。你可以撤销其访问权限。
- `settings.remote.startsession.confirmcreatedescription`（42 字，components/settings/RemoteHostDetail.tsx:412）——删背景与重复，保留动作与结果
  原文：{{path}} 在 {{hostId}} 上不存在。点确认会在远端跑 mkdir -p 创建它，然后进入任务。
- `remotedesktop.accessibilityhelp`（41 字，未定位）——删实现细节与背景，保留风险与恢复边界，分段
  原文：点击打开设置后，为系统授权提示中的应用开启辅助功能。返回后会自动检测实际输入权限。
- `settings.remote.footnote`（41 字，未定位）——删背景与重复，保留动作与结果
  原文：第一版仅支持 SSH 连接管理。在远端运行 Agent 的能力将在后续版本中加入。

### 主界面（16 条）

- `ccagent.sidebar.bulkselection.confirmarchive.dirtyworktreewarning`（56 字，features/cc-agent/CCAgentSidebarUpper.tsx:3331 / features/cc-agent/CCAgentSidebarUpper.tsx:3519）——删实现细节与背景，保留风险与恢复边界，分段
  原文：其中 {{count}} 个任务的 worktree 有未提交更改，归档前会自动保存为 git 快照，之后可在任务内一键恢复。
- `ccagent.sidebar.confirmdelete.dirtyworktreewarning`（55 字，features/cc-agent/CCAgentSidebarUpper.tsx:3971 / features/cc-agent/SessionContentHeader.tsx:547）——删实现细节与背景，保留风险与恢复边界，分段
  原文：该任务的 worktree 有未提交的更改；删除前会自动保存为 git 快照（分支保留，可用 git 找回）。
- `newchat.permissionselector.modes.codex.auto.description`（55 字，未定位）——删背景与重复，保留动作与结果
  原文：在受保护的工作区沙箱内自动执行命令；需要越过沙箱边界的操作交给自动审查器判断，高风险操作可能被拒绝或要求确认。
- `ccagent.sidebar.confirmarchive.dirtyworktreewarning`（51 字，features/cc-agent/CCAgentSidebarUpper.tsx:3972 / features/cc-agent/lib/sessionHardwareTaskActions.ts:89）——删实现细节与背景，保留风险与恢复边界，分段
  原文：该任务的 worktree 有未提交的更改；归档前会自动保存为 git 快照，之后可在任务内一键恢复。
- `newchat.sourcedisconnected.description`（50 字，components/new-chat/ChatInput.tsx:5488）——删背景与重复，保留动作与结果
  原文：此任务选择的来源已断开连接，暂时无法发送消息。请在模型选择器里换一个已连接的来源，或去设置重新连接。
- `newchat.permissionselector.modes.claude-code.auto.description`（50 字，未定位）——删背景与重复，保留动作与结果
  原文：允许在工作区内读写，并自动审批提权请求；高风险操作可能被拒绝或要求确认。能减少打断，但存在误判风险。
- `taskmigration.estimatenote`（48 字，features/cc-agent/sidebar/TaskMigrationDialog.tsx:442）——删背景与重复，保留动作与结果
  原文：复制前估算，含隐藏文件；不含另行复制的 Git 历史、任务对话及附件。文件变化可能影响最终大小。
- `newchat.addremoteproject.empty`（46 字，components/new-chat/AddRemoteProjectDialog.tsx:448 / components/new-chat/AddRemoteProjectDialog.tsx:449）——删背景与重复，保留动作与结果
  原文：请先在「设置 → 远程连接」连接一台远程设备，或在「设置 → 远端机器」添加 SSH 主机。
- `chat.messageactionbar.forkconfirmdescription`（44 字，components/chat/useForkAtMessage.ts:92）——删背景与重复，保留动作与结果
  原文：系统会根据这里的对话上下文创建一个独立的新任务。原任务不会改变，之后两边的消息互不影响。
- `apperror.description`（44 字，components/error/AppCrashScreen.tsx:66）——删背景与重复，保留动作与结果
  原文：渲染这个界面时遇到了问题。你可以重新加载试试；如果反复出现，请把错误详情反馈给开发团队。
- `ccagent.sidebar.bulkselection.confirmdelete.dirtyworktreewarning`（44 字，features/cc-agent/CCAgentSidebarUpper.tsx:3188）——删实现细节与背景，保留风险与恢复边界，分段
  原文：其中 {{count}} 个任务的 worktree 有未提交更改，删除前会自动保存为 git 快照。
- `ccagent.sidebar.projectaction.removefromsidebarconfirmdescription`（44 字，features/cc-agent/CCAgentSidebarUpper.tsx:2779）——删实现细节与背景，保留风险与恢复边界，分段
  原文：这会从侧栏移除该项目。电脑上的文件不会被删除。现有任务会移到“对话”分组，仍可正常使用。
- `ccagent.sidebar.unarchiveall.description`（43 字，features/cc-agent/CCAgentSidebarUpper.tsx:3445）——删实现细节与背景，保留风险与恢复边界，分段
  原文：将恢复该项目下 {{count}} 个已归档任务。恢复后将从“已归档”列表移除，并回到“活跃”列表。
- `newchat.pluginsetup.remoteoauthhint`（41 字，components/new-chat/PluginSetupPrompt.tsx:524）——删背景与重复，保留动作与结果
  原文：在这台电脑的浏览器中授权，账号将连接到当前远程设备。其他设置仍需在远程设备上完成。
- `newchat.chatinput.voiceinput.permissiondialog.description`（41 字，components/new-chat/ChatInput.tsx:3160）——删实现细节与背景，保留风险与恢复边界，分段
  原文：App 需要麦克风权限才能在输入框里使用语音输入。授权后，请再次点击语音输入按钮。
- `newchat.permissionselector.modes.claude-code.acceptedits.description`（41 字，未定位）——删实现细节与背景，保留风险与恢复边界，分段
  原文：自动接受文件编辑请求，减少反复确认；涉及更高风险的命令或权限仍按底层权限策略处理。

### 关于（11 条）

- `settings.about.storage.cleanupdescription`（59 字，components/settings/StorageManagementCard.tsx:431）——删实现细节与背景，保留风险与恢复边界，分段
  原文：扫描没有被任何任务引用的媒体文件、超限缓存与废弃目录。先报数，确认后才删除；输入框草稿和排队消息里的图片会被自动保护。
- `settings.about.pikernel.updatedescription`（59 字，未定位）——删实现细节与背景，保留风险与恢复边界，分段
  原文：此版本由 Pi 上游发布，可能存在 Cindy 兼容性问题，可随时恢复 Cindy 正式版。已有任务继续使用当前版本。
- `settings.about.linuxupdatedescription`（57 字，components/settings/AboutSection.tsx:521）——删实现细节与背景，保留风险与恢复边界，分段
  原文：更新在你选择重启时生效。系统 .deb 安装需要系统密码，用户目录安装不需要。其他安装方式请通过对应包管理器更新。
- `settings.about.storage.chatattachmentsdescription`（54 字，components/settings/StorageManagementCard.tsx:373）——删实现细节与背景，保留风险与恢复边界，分段
  原文：发送的部分附件会保存在这里。Cindy 不会自动扫描或清理此目录；删除文件后，历史消息中的附件可能无法打开。
- `settings.about.storage.chatattachmentsclearconfirmdescription`（54 字，apps/desktop/src/main/bootstrap-electron.ts:8348）——删实现细节与背景，保留风险与恢复边界，分段
  原文：只会删除消息附件缓存目录中的文件，不会读取消息数据库。清理后，历史消息中的部分附件可能无法打开，且无法恢复。
- `update.agentautoupdate.enabledescription`（51 字，apps/desktop/src/main/agent-app-update/agentAppUpdateService.ts:492）——删背景与重复，保留动作与结果
  原文：开启后，更新下载完成时，如果这台电脑已空闲 10 分钟且没有正在运行的任务，{{appName}} 会自动重启完成安装。
- `localdbfatal.updateready.description`（51 字，components/error/LocalDbFatalScreen.tsx:52）——删实现细节与背景，保留风险与恢复边界，分段
  原文：本地数据已由更新版本的 Cindy 升级，当前版本无法打开。新版本已下载就绪，重启安装后即可恢复使用。
- `localdbfatal.noupdate.description`（50 字，components/error/LocalDbFatalScreen.tsx:55）——删实现细节与背景，保留风险与恢复边界，分段
  原文：本地数据版本与当前应用不匹配（通常是被更新版本升级过）。请重新检查更新；若持续出现，请联系开发团队。
- `settings.about.storage.legacyimagesclearconfirmdescription`（50 字，apps/desktop/src/main/bootstrap-electron.ts:8330）——删实现细节与背景，保留风险与恢复边界，分段
  原文：只会删除图片缓存目录中的文件，不会读取消息数据库。清理后，历史消息中的图片可能无法显示，且无法恢复。
- `settings.about.storage.legacyimagesdescription`（49 字，components/settings/StorageManagementCard.tsx:349）——删实现细节与背景，保留风险与恢复边界，分段
  原文：Cindy 不会自动扫描或清理此目录。删除文件后，历史消息中的图片可能无法显示，请自行确认后操作。
- `settings.about.autoupdatedescription`（42 字，components/settings/AboutSection.tsx:566）——删背景与重复，保留动作与结果
  原文：更新下载完成后，当这台电脑 10 分钟无操作且没有任务运行时，自动重启应用完成安装。

### 工具设置（6 条）

- `settings.pipackages.inspectionhint`（59 字，components/settings/PiPackagesSection.tsx:358）——删背景与重复，保留动作与结果
  原文：Pi 包由 Pi 原生包系统安装和加载。Cindy 只展示建议性兼容详情；未知、不支持或分析失败都不会阻止安装和启用。
- `settings.builtintools.plugins.google.description`（54 字，未定位）——删背景与重复，保留动作与结果
  原文：Google 集成 —— Sheets(只读)与 Gmail(搜索 / 读取 / 发送 / 草稿 / 标签)
- `settings.pipackages.installsectiondescription`（44 字，components/settings/PiPackagesSection.tsx:323）——删背景与重复，保留动作与结果
  原文：粘贴 pi.dev 页面上的安装来源，或输入 npm 包名、Git 地址、本地绝对路径。
- `settings.builtintools.plugins.collab.description`（43 字，未定位）——删背景与重复，保留动作与结果
  原文：关闭后仅影响后续新建的任务，不会中止当前 Worker；用于多 Worker 团队编排
- `settings.pipackages.uninstalldescription`（42 字，未定位）——删背景与重复，保留动作与结果
  原文：将从这台设备移除 {{name}}。当前已打开的 Pi 任务仍会保留旧扩展，关闭后才会彻底卸载。
- `settings.builtintools.togglehint`（41 字，components/settings/BuiltinToolsSection.tsx:246）——删背景与重复，保留动作与结果
  原文：变更仅对新建或重启的 Agent 会话生效，正在运行的 Agent 会话不受影响。

### 插件设置（6 条）

- `settings.ghosts.library.deleteconfirmdescription`（57 字，apps/desktop/src/main/cindy-brain/index.ts:9231）——删实现细节与背景，保留风险与恢复边界，分段
  原文：这与卸载插件是两个独立操作。删除后数据移入回收站保留 30 天，期满后彻底清除；卸载或重装插件都不会影响这些数据。
- `settings.ghosts.library.unbindconfirmdescription`（56 字，features/plugin/GhostLibrarySection.tsx:132）——删实现细节与背景，保留风险与恢复边界，分段
  原文：将回到 Cindy 管理的默认位置。原自定义目录中的数据不会被删除，也不会自动迁移；如需找回，请手动迁移该目录。
- `settings.ghosts.market.replacedescription`（54 字，features/plugin/GhostPluginPage.tsx:2160 / features/plugin/MarketPluginDetailView.tsx:48）——删实现细节与背景，保留风险与恢复边界，分段
  原文：已安装相同标识的插件；继续安装会切换来源。原来源的数据将隔离保留，新来源不会继承原账号和密钥，需要重新连接。
- `settings.ghosts.market.sources.guide.structurebody`（54 字，features/plugin/MarketplaceGuideDialog.tsx:165）——删背景与重复，保留动作与结果
  原文：市场仓库需要一份清单文件，以及若干插件目录。每个插件目录必须包含合法的 ghost.json（插件身份卡）。
- `settings.ghosts.updateall.description`（52 字，features/plugin/UpdateAllDialog.tsx:94）——删实现细节与背景，保留风险与恢复边界，分段
  原文：权限没变多的更新通常会静默完成；新版本权限变多时会逐个请你确认。这里也可重试因忙碌跳过或执行失败的更新。
- `settings.ghosts.retirement.embeddedsimulator.datanotice`（49 字，未定位）——删实现细节与背景，保留风险与恢复边界，分段
  原文：原模拟器的设备和应用数据不会被删除。安装 Baguette 不会自动迁移设备、App 或登录状态。

### 自动操作（6 条）

- `settings.computeruse.directcontrol.permissions.macoshint`（55 字，components/settings/ComputerUseSection.tsx:1730）——删背景与重复，保留动作与结果
  原文：电脑使用需要「辅助功能」和「屏幕录制」。实际使用时，macOS 仍可能按目标 App 或具体动作弹出额外确认。
- `settings.computeruse.realprofile.confirmdescription`（48 字，components/settings/realProfilePermissionGuide.ts:8 / components/settings/realProfilePermissionGuide.ts:10）——删实现细节与背景，保留风险与恢复边界，分段
  原文：Agent 将能以你已登录的身份打开网页，包括邮箱、网盘和公司后台。可以随时关掉，拷贝会被删除。
- `settings.computeruse.directcontrol.driverinfo`（48 字，components/settings/ComputerUseSection.tsx:1724）——删背景与重复，保留动作与结果
  原文：自动操作电脑由开源 CUA Driver 提供，运行在本机，用于读取屏幕并执行点击、输入等操作。
- `settings.computeruse.directcontrol.permissions.linuxhint`（47 字，未定位）——删背景与重复，保留动作与结果
  原文：Linux 不需要 macOS 的 TCC 授权；请确保当前桌面会话允许窗口读取和输入自动化。
- `settings.computeruse.android.togglehint`（44 字，components/settings/ComputerUseSection.tsx:1986）——删背景与重复，保留动作与结果
  原文：这个全局开关只对之后新建的 Agent 会话生效；已在运行的 Agent 会话不受影响。
- `settings.computeruse.browser.togglehint`（42 字，components/settings/ComputerUseSection.tsx:1456）——删背景与重复，保留动作与结果
  原文：这个开关只对之后新建的 Agent 会话生效；已在运行的 Agent 会话不受影响。

### logic（5 条）

- `logic.confirm.voiceapikeyauthdescription`（62 字，hooks/useVendorAuthGate.ts:73）——删背景与重复，保留动作与结果
  原文：语音输入当前使用 Cindy AI 语音识别服务。尚未连接 Cindy AI，无法开始语音输入。是否前往「模型供应商」连接？
- `logic.confirm.codexbinarymissingdescription`（55 字，hooks/useVendorAuthGate.ts:95）——删背景与重复，保留动作与结果
  原文：Codex 组件尚未准备好，暂时无法使用这个功能。请稍后重试，或前往「模型供应商」检查 Codex 连接状态。
- `logic.confirm.pibinarymissingdescription`（49 字，hooks/useVendorAuthGate.ts:102）——删背景与重复，保留动作与结果
  原文：Pi 组件尚未准备好，暂时无法使用这个功能。请稍后重试，或前往「模型供应商」检查 Pi 连接状态。
- `logic.confirm.voicedirectapikeyauthdescription`（47 字，hooks/useVendorAuthGate.ts:80）——删背景与重复，保留动作与结果
  原文：语音输入当前使用直连供应商，需要先配置对应 API Key。是否前往「API Keys」添加？
- `logic.confirm.remoteauthdescription`（43 字，hooks/useVendorAuthGate.ts:339）——删背景与重复，保留动作与结果
  原文：需要在远程设备「{{device}}」上完成配置后，才能在这里新建并运行任务。请在该设备上配置后重试。

### issueTracker（4 条）

- `issuetracker.mine.platformunavailablehint`（61 字，未定位）——删背景与重复，保留动作与结果
  原文：当前只显示本机记录的提交。在其它设备上提交过的 Issue、以及它们在 GitHub 上的最新状态，暂时无法在应用内查看。
- `issuetracker.mine.enhancementfailedgenerichint`（59 字，features/issue-tracker/lib/myIssuesNotices.ts:96）——删背景与重复，保留动作与结果
  原文：暂时没能读取你 GitHub 账号名下的 Issue，可能是网络问题或 GitHub 接口限流，稍后可以点右上角重试。
- `issuetracker.visibility.dialog.privatetopublicbody`（54 字，未定位）——删背景与重复，保留动作与结果
  原文：所有团队成员将能看到这条 Issue 的全部内容（标题、详情、版本号、作者）。你之后仍然可以将它切换回私有。
- `issuetracker.visibility.dialog.publictoprivatebody`（43 字，未定位）——删背景与重复，保留动作与结果
  原文：此 Issue 将仅你本人可见。其他团队成员将无法在 Issue 列表与搜索中看到它。

### 语音输入（4 条）

- `settings.voiceinput.servicesource.customasr.notice`（58 字，components/settings/VoiceInputSection.tsx:672）——删背景与重复，保留动作与结果
  原文：请填写 ASR 服务提供的完整 WebSocket 地址。Cindy 不会复用对话模型地址，也不会自动拼接语音路径。
- `settings.voiceinput.permissions.accessibility.tooltip`（55 字，components/settings/VoiceInputSection.tsx:2107）——删实现细节与背景，保留风险与恢复边界，分段
  原文：辅助功能权限用于在其他 App 中自动输入语音结果、读取光标附近文本作为润色上下文，并识别外部修改以改进词典。
- `settings.voiceinput.servicesource.hint`（45 字，components/settings/VoiceInputSection.tsx:600）——删实现细节与背景，保留风险与恢复边界，分段
  原文：默认使用 Cindy 语音服务；也可以连接支持实时 ASR 的服务，并使用独立的语音凭证。
- `settings.voiceinput.servicesource.localhint`（45 字，components/settings/VoiceInputSection.tsx:599）——删实现细节与背景，保留风险与恢复边界，分段
  原文：未登录状态不使用 Cindy 账号服务；请连接支持实时 ASR 的服务并配置独立语音凭证。

### 插件页（4 条）

- `skillhub.detail.uninstalldialog.description`（57 字，未定位）——删实现细节与背景，保留风险与恢复边界，分段
  原文：本地文件及修改将移入回收站，可恢复。  共用此技能的其他 Agent 也会受影响。云端发布和其他安装位置不受影响。
- `skillhub.diffpanel.cleanhint`（47 字，features/skillhub/SkillhubDiffPanel.tsx:195）——删背景与重复，保留动作与结果
  原文：本地文件跟上次发布完全一致。如果状态仍显示 dirty，可能是行尾差异导致的 hash 偏移。
- `skillhub.detail.usageversioncomparabletooltip`（47 字，features/skillhub/SkillhubDetailView.tsx:394）——删背景与重复，保留动作与结果
  原文：上版本指最近一个历史文档版本。该对比只反映近 30 天窗口内的过程指标变化，不代表任务成功率。
- `skillhub.detail.usagereadobservationtooltip`（43 字，features/skillhub/SkillhubDetailView.tsx:346）——删背景与重复，保留动作与结果
  原文：统计 30 分钟内读取 3 次及以上的任务占比。它只是注意信号，不直接代表文档有问题。

### Cindy Make（4 条）

- `settings.cindymake.source.resetconfirm.description`（55 字，components/settings/CindyMakeSection.tsx:461）——删实现细节与背景，保留风险与恢复边界，分段
  原文：这会删除 Cindy 管理的源码目录，包括个人版分支和所有尚未打包的修改。清理后如需使用，请再次点击准备源码。
- `settings.cindymake.create.description`（51 字，components/cindy-make/CindyMakeCreateDialog.tsx:101）——删背景与重复，保留动作与结果
  原文：说说你想让 Cindy 做哪些改变。接下来会打开制作任务，使用统一流程检查环境、准备源码，再继续制作。
- `settings.cindymake.syncbeforebuild.description`（44 字，components/settings/CindyMakeSection.settings-search.ts:10 / components/settings/CindyMakeSection.tsx:394）——删背景与重复，保留动作与结果
  原文：开启后，每次生成或重新生成个人版前，会先把当前渠道的最新官方源码同步到个人版。默认关闭。
- `cindymake.merge.conflictconfirm.description`（44 字，components/cindy-make/useCindyMakeMergeResolution.ts:45）——删背景与重复，保留动作与结果
  原文：确认后会创建独立任务，由 Agent 自动处理冲突。取消将放弃本次合入，保留现有个人版。

### 通用设置（4 条）

- `settings.messagenavrail.cell.description`（52 字，components/settings/MessageNavRailCell.tsx:36）——删背景与重复，保留动作与结果
  原文：在对话正文左侧显示一列提问刻度：悬停预览提问和回答开头，点击跳回那一轮。仅在提问较多且窗口足够宽时出现。
- `settings.dingtalkbot.disconnectconfirm.description`（48 字，components/settings/DingTalkBotSection.tsx:51）——删背景与重复，保留动作与结果
  原文：解绑后会断开连接，并清除本机保存的 Client ID、Client Secret 和主人绑定。
- `settings.composer.sendshortcut.hint`（46 字，components/settings/ComposerSendShortcutSection.tsx:37 / components/settings/PersonalizationDetails.settings-search.ts:8）——删背景与重复，保留动作与结果
  原文：开启后按 {{shortcut}} 发送消息；关闭后按 Enter 发送消息，按 Shift+Enter 换行。
- `settings.gitsafety.description`（41 字，components/settings/GitSafetySection.tsx:57）——删实现细节与背景，保留风险与恢复边界，分段
  原文：选择 Cindy 记录隐藏文件恢复点的范围。这只影响文件恢复成本，不影响对话回退。

### 插件（3 条）

- `identitychangedhint`（57 字，apps/mobile/src/plugins/PluginSetupNativeForm.tsx:259）——删背景与重复，保留动作与结果
  原文：这台电脑的授权身份与上次不同，已停止配置。请先核实电脑并重新登记设备身份，再连接；这里不能确认或替换已登记的身份。
- `taskhint`（43 字，components/settings/WorkLouderCodexSettings.tsx:346）——删实现细节与背景，保留风险与恢复边界，分段
  原文：在任务中说明你的需求，Cindy 会调用适合的插件。已有任务继续使用原来的模型和权限。
- `computerauthorizationhint`（43 字，apps/mobile/src/plugins/PluginSetupNativeForm.tsx:261）——删背景与重复，保留动作与结果
  原文：此账号连接方式使用电脑本地回调。请使用此卡片的电脑入口完成连接，然后回到这里查看状态。

### 设置（3 条）

- `locallogs.hint`（57 字，未定位）——删实现细节与背景，保留风险与恢复边界，分段
  原文：记录手机上的连接、恢复、文件预览与播放、滚动、键盘与性能细节。默认关闭，最多保留 7 天、8 MB，不会自动上传。
- `appearance.userbubble.customhint`（44 字，未定位）——删背景与重复，保留动作与结果
  原文：左右拖动色带选择颜色。颜色会按浅色和深色模式自动调整明暗，保证文字清晰。仅保存在此设备。
- `voicedictionary.hint`（41 字，未定位）——删实现细节与背景，保留风险与恢复边界，分段
  原文：词典保存在电脑上，并在你的电脑之间自动同步；手机只能查看，添加和删除请回电脑操作。

### 共享任务（3 条）

- `sessionshare.import.conflictbody`（53 字，components/settings/SessionShareImportWizard.tsx:415）——删背景与重复，保留动作与结果
  原文：本机已存在相同标识的任务（此前导入过，或原任务就在本机）。重新导入将覆盖已有任务，替换为此分享包中的内容。
- `sessionshare.export.sensitivewarning`（50 字，features/cc-agent/sidebar/SessionShareExportDialog.tsx:153）——删背景与重复，保留动作与结果
  原文：导出文件包含此任务的完整对话记录与工具输出（可能含文件内容、命令结果等敏感信息），请确认接收方可信。
- `sessionshare.export.oversizehint`（44 字，features/cc-agent/sidebar/SessionShareExportDialog.tsx:158）——删背景与重复，保留动作与结果
  原文：内容超出体积上限，其中媒体文件约 {{mediaMb}} MB。可排除媒体后重新导出（保留文字与上下文）。

### 伙伴页（3 条）

- `providershare.link.description`（51 字，features/provider-share/ProviderShareLinkDialog.tsx:105）——删背景与重复，保留动作与结果
  原文：把链接发给你想分享的人。对方打开后会先看到说明，确认后向你发送申请，你在这台电脑上同意后分享才会生效。
- `providershare.manage.removeconfirm.description`（49 字，features/provider-share/ProviderShareManagePage.tsx:175）——删背景与重复，保留动作与结果
  原文：{{name}} 将立即无法使用 {{provider}}，正在运行的任务会停止。之后要再分享，需要重新生成链接。用量记录会保留。
- `providershare.apply.useddescription`（49 字，features/provider-share/ProviderShareApplyDialog.tsx:275）——删背景与重复，保留动作与结果
  原文：链接只能使用一次，并且生成后 5 分钟内有效。它已经被使用或已经过期，请联系 {{name}} 重新生成链接。

### 远程桌面（3 条）

- `screenrecordinghelp`（50 字，未定位）——删背景与重复，保留动作与结果
  原文：打开系统设置，为当前 Cindy 开启屏幕录制。若系统要求重新启动，请重新打开 Cindy 后连接。
- `permissionsintro`（45 字，apps/mobile/src/remote-desktop/PermissionGuide.tsx:90 / components/settings/RemoteDesktopPermissions.tsx:71）——删实现细节与背景，保留风险与恢复边界，分段
  原文：查看桌面需要屏幕录制权限；操作桌面还需要辅助功能权限。请在电脑上完成授权，结果会自动更新。
- `accessibilityhelp`（41 字，未定位）——删实现细节与背景，保留风险与恢复边界，分段
  原文：点击打开设置后，为系统授权提示中的应用开启辅助功能。返回后会自动检测实际输入权限。

### 用量历史（2 条）

- `billing.settings.subscriptioncard.cancelconfirmdescription`（58 字，features/billing/BillingPage.tsx:808 / features/billing/BillingPage.tsx:811）——删背景与重复，保留动作与结果
  原文：本次操作不会退款，也不会立即调整余额。当前套餐权益可继续使用至 {{date}}，之后不再续费。本计费周期结束前无法购买新套餐。
- `billing.orders.invoice.gmailfallbackdescription`（43 字，features/billing/BillingPage.tsx:2007）——删背景与重复，保留动作与结果
  原文：开票申请中包含订单信息。打开 Gmail 会将这些信息分享给 Google，是否继续？

### issueAgent（2 条）

- `issueagent.confirm.privacyhint`（54 字，features/cc-agent/IssueConfirmCard.tsx:262）——删实现细节与背景，保留风险与恢复边界，分段
  原文：Issue 的标题和正文将公开显示，并可能被搜索或缓存。系统只能隐藏部分常见敏感信息，无法识别所有语义隐私。
- `issueagent.confirm.identityplatformhint`（44 字，features/cc-agent/IssueConfirmCard.tsx:308）——删背景与重复，保留动作与结果
  原文：无需配置 GitHub 账号；Issue 由官方 Bot 创建，你可在正文中选择公开署名

### accountDeletion（2 条）

- `accountdeletion.graceperiodnotice`（52 字，components/settings/AccountDeletionSection.tsx:214）——删实现细节与背景，保留风险与恢复边界，分段
  原文：确认后，账号将进入 30 天等待期。等待期内重新登录可取消注销；到期后 Cindy 登录账号将永久删除。
- `accountdeletion.applerevocationnotice`（50 字，components/settings/AccountDeletionSection.tsx:225）——删实现细节与背景，保留风险与恢复边界，分段
  原文：如果你曾使用 Apple 登录，还需要在 Apple ID 设置中手动撤销 Cindy 的访问权限。

### 群聊（2 条）

- `settings.speakingmodeautonote`（46 字，apps/mobile/src/session/BotGroupSettingsSheet.tsx:321 / features/bots/BotGroupSettingsDrawer.tsx:543）——删背景与重复，保留动作与结果
  原文：没有 @ 人或 @所有人时，第一圈大家同时想，之后轮流接话；@ 了伙伴就按 @ 的先后轮流。
- `settings.replymodenote`（41 字，apps/mobile/src/session/BotGroupSettingsSheet.tsx:309 / features/bots/BotGroupSettingsDrawer.tsx:516）——删背景与重复，保留动作与结果
  原文：没什么可补充的伙伴不会说话。每轮最多聊 3 圈、10 条，之后等你点「继续讨论」。

### rightSidebar（2 条）

- `rightsidebar.browser.commentmodehint`（45 字，features/right-sidebar/plugins/web-browser/BrowserTabBody.tsx:566）——删背景与重复，保留动作与结果
  原文：点击元素或 Shift 拖拽框选区域 · Cmd/Ctrl+点击直接添加 · Esc 退出
- `rightsidebar.review.turn.partialnotice`（44 字，features/right-sidebar/plugins/review/ReviewTabBody.tsx:1447）——删背景与重复，保留动作与结果
  原文：本条消息包含无法精确追踪的命令或工具写入；以下仅展示已精确捕获的部分，不能视为完整补丁。

### 登录与欢迎页（1 条）

- `login.consentdialog.body`（65 字，components/login/LoginPage.tsx:1483）——删实现细节与背景，保留风险与恢复边界，分段
  原文：请阅读并同意 Cindy 的以下协议后继续：<terms>服务条款</terms>、<privacy>隐私协议</privacy>

### 键盘快捷键（1 条）

- `settings.shortcuts.workloudercodex.agentkeys.singletap.description`（61 字，components/settings/WorkLouderCodexSettings.tsx:688）——删背景与重复，保留动作与结果
  原文：开启后按一下就打开任务并激活 Cindy。关闭后按一下仍会在后台切换任务；350 毫秒内再按同一个键才会激活 Cindy。

### 模型（1 条）

- `contextwindowswitch.remotedescription`（61 字，apps/mobile/src/session/modelWindowSwitchConfirmation.ts:65）——删背景与重复，保留动作与结果
  原文：当前远程任务的上下文已用 {{used}} / {{total}}（约 {{pct}}%），无法安全切换到这个小窗口模型。请保留当前模型，或新建任务后再选择。

### goal（1 条）

- `goal.newgoaldialog.description`（60 字，components/new-chat/NewGoalDialog.tsx:105）——删背景与重复，保留动作与结果
  原文：Agent 会自主朝这个目标持续推进，直到达成、受阻或你停止；这可能消耗大量 token，可在「高级设置」里设预算上限。

### 个性化设置（1 条）

- `settings.memory.maker.resetconfirm.description`（58 字，components/settings/MemorySection.tsx:216）——删实现细节与背景，保留风险与恢复边界，分段
  原文：将永久删除所有项目下的 Cindy 记忆（存放在 user-data 目录下，不在你的代码仓库里）。此操作不可撤销。

### extraDirs（1 条）

- `extradirs.writableparentconfirmdescription`（56 字，components/new-chat/ChatInput.tsx:4643）——删实现细节与背景，保留风险与恢复边界，分段
  原文：选中的目录是当前工作目录的父级或祖先。Agent 将能读取、创建、修改和删除其中的文件。  仍要允许吗？  {{path}}

### makerExperimental（1 条）

- `makerexperimental.notreadybody`（52 字，features/maker-experimental/MakerExperimentalView.tsx:75）——删实现细节与背景，保留风险与恢复边界，分段
  原文：window.electronAPI.maker 不可用。请重启应用并检查控制台中的 IPC 注册错误。

### 设备（1 条）

- `list.revoked.body`（48 字，apps/mobile/src/session/HomeSurface.tsx:3606）——删实现细节与背景，保留风险与恢复边界，分段
  原文：「{{deviceName}}」撤销了本机的远程访问权限。请在该电脑的 {{appName}} 设置里重新授权本设备，然后点「重试访问」。

### 设备连接（1 条）

- `unstablehint`（46 字，apps/mobile/src/components/ConnectionBanner.tsx:118 / apps/mobile/src/device-link/remoteStatus.ts:30）——删背景与重复，保留动作与结果
  原文：本机连接反复断开又重连，远程操作可能一直超时。请检查网络；若持续如此，重启 App 后重试。

### credentialStore（1 条）

- `credentialstore.dialog.intro`（45 字，components/auth/CredentialStoreHelpDialog.tsx:52）——删背景与重复，保留动作与结果
  原文：Cindy 无法读取或保存这台电脑上的登录信息。这是本机存储问题，重新获取验证码无法解决。

### 灵动岛（1 条）

- `settings.agentisland.enablehint`（44 字，components/settings/AgentIslandSection.tsx:280 / components/settings/AgentIslandSection.settings-search.ts:9）——删背景与重复，保留动作与结果
  原文：在屏幕顶部显示正在运行、待交互和未读完成的任务。启用后会抑制同类系统通知，避免重复打扰。

### 任务页（1 条）

- `screen.forkconfirmdescription`（44 字，未定位）——删背景与重复，保留动作与结果
  原文：系统会根据这里的对话上下文创建一个独立的新任务。原任务不会改变，之后两边的消息互不影响。

### 更新（1 条）

- `installhintbody`（43 字，apps/mobile/src/update/useBundleUpdatePrompt.ts:52）——删背景与重复，保留动作与结果
  原文：在系统弹框中点击「安装」后，请回到桌面查看安装进度；下载完成后系统会自动替换当前版本。

### 第 3 层：不用改（369 条）

40 字以内，多数是标签、状态或一句结果，控件名已经说明功能，保持原样即可。
