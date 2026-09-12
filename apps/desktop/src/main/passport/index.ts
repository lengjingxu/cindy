import { spawn, execFile, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { app, ipcMain } from 'electron';
import type { AgentIslandSessionActivity } from '../../shared/agentIsland.js';
import { registerInputDevice } from '../input-devices/registry.js';
import { createLogger } from '../logger.js';
import { openMainWindowSession } from '../deepLink.js';
import { listWorkLouderCodexTaskCatalog } from '../worklouder-codex/taskSlots.js';
import { PassportController } from './controller.js';
import { PassportTaskHistory } from './protocol.js';
import { PassportVoice } from './voice.js';
import type { PassportDictation, PassportState } from '../../shared/passport.js';
import { activeOwnerScopeKey, getActiveDataOwnerPushStamp, ownerScopedUserDataPath } from '../appSessionState.js';
import { assertTrustedAppRendererEvent } from '../security/trustedAppRenderer.js';
import { requireString, requireBoolean, throwIpcError } from '../utils/ipcValidate.js';
import { createOverrideSettingsFile } from '../maker-host/override-settings-file.js';
import { transcribeVoiceInputAudioFile } from '../voice-input/index.js';

const log = createLogger('passport');
let registered = false;

export function registerPassportInputDevice(): void {
  // Explicit opt-in development feature; does not prompt every Mac for Bluetooth.
  if (registered) return;
  registered = true;
  const settings = createOverrideSettingsFile({
    filePath: () => ownerScopedUserDataPath('passport-settings.json'),
    defaults: { enabled: process.env.CINDY_PASSPORT_BLE === '1' },
    normalize: (raw) => ({ enabled: !!raw && typeof raw === 'object' && 'enabled' in raw && typeof raw.enabled === 'boolean'
      ? raw.enabled : process.env.CINDY_PASSPORT_BLE === '1' }),
    mergeOverrides: ({ patch, overrides }) => ({ ...overrides, ...patch }),
    log, label: 'Passport', scopeKey: activeOwnerScopeKey, maxBytes: 1024, preserveUnreadableFile: true,
  });
  const isEnabled = (): boolean => process.platform === 'darwin' && settings.read().enabled;
  let devices: string[] = [], bluetooth = 0;
  let voiceState: PassportState['voice'] = 'idle';
  let pending: (PassportDictation & { owner: string }) | null = null;
  let voiceOwner = '';
  let voiceTaskId = '';
  const voice = new PassportVoice();
  let child: ChildProcessWithoutNullStreams | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let wanted = false;
  let starting = false;
  let generation = 0;
  let refreshing = false;
  let heartbeatAt = 0;
  const history = new PassportTaskHistory();
  let activity: readonly AgentIslandSessionActivity[] = [];
  const controller = new PassportController((line) => {
    if (child && !child.stdin.destroyed) child.stdin.write(line);
  }, (id) => {
    const version = controller.connectionVersion;
    // Recheck the current canonical catalog before routing a device-supplied ID.
    void listWorkLouderCodexTaskCatalog().then((catalog) => {
      if (wanted && version === controller.connectionVersion && controller.canOpen(id) &&
          catalog.options.some((task) => task.id === id))
        openMainWindowSession(id, { focus: true });
    }).catch(() => log.warn('Passport task selection failed'));
  });
  ipcMain.handle('passport:state', (event): PassportState => {
    assertTrustedAppRendererEvent(event);
    return { enabled: isEnabled(), supported: process.platform === 'darwin', connected: controller.isReady, voice: voiceState, devices, bluetooth };
  });
  ipcMain.handle('passport:dictation', async (event, value: unknown): Promise<PassportDictation | null> => {
    assertTrustedAppRendererEvent(event);
    const id = requireString(value, 'sessionId');
    if (id.length >= 40 || !pending || pending.sessionId !== id) return null;
    const current = pending;
    const catalog = await listWorkLouderCodexTaskCatalog();
    if (pending !== current || current.owner !== activeOwnerScopeKey() || !catalog.options.some((task) => task.id === id)) return null;
    const { owner: _owner, ...result } = current;
    return result;
  });
  ipcMain.handle('passport:dictation-ack', (event, value: unknown) => {
    assertTrustedAppRendererEvent(event);
    const token = requireString(value, 'token');
    if (pending?.token === token && pending.owner === activeOwnerScopeKey()) { pending = null; voiceState = 'idle'; }
  });
  const handleVoice = (line: string): void => {
    let event: unknown;
    try { event = JSON.parse(line); } catch { return; }
    if (!event || typeof event !== 'object' || !('kind' in event) || event.kind !== 'voice') return;
    try {
      if (!('packet' in event) || typeof event.packet !== 'string' || event.packet.length > 272) throw new Error('Invalid voice frame');
      const packet = Buffer.from(event.packet, 'base64');
      if (packet.toString('base64') !== event.packet) throw new Error('Invalid voice encoding');
      if (packet[0] === 1) {
        if (voiceState === 'transcribing' || pending) throw new Error('Previous dictation is pending');
        voiceOwner = activeOwnerScopeKey();
      }
      const result = voice.accept(packet, (id) => voiceOwner === activeOwnerScopeKey() && controller.canOpen(id));
      if (packet[0] === 1) voiceTaskId = packet.subarray(7, packet.indexOf(0, 7)).toString('utf8');
      voiceState = packet[0] === 4 ? 'idle' : 'recording';
      if (!result) return;
      voiceState = 'transcribing';
      const owner = voiceOwner, version = controller.connectionVersion;
      const current = (): boolean => wanted && owner === activeOwnerScopeKey() && version === controller.connectionVersion;
      void (async () => {
        try {
          const catalog = await listWorkLouderCodexTaskCatalog();
          if (!current() || !catalog.options.some((task) => task.id === result.id)) return;
          const transcription = await transcribeVoiceInputAudioFile({ bytes: result.audio, mimeType: 'audio/ogg', fileName: 'passport.ogg' });
          const latest = await listWorkLouderCodexTaskCatalog();
          if (!current() || !latest.options.some((task) => task.id === result.id)) return;
          if (!transcription.text.trim()) throw new Error('Empty dictation');
          pending = { token: randomUUID(), sessionId: result.id, text: transcription.text, owner, ownerStamp: getActiveDataOwnerPushStamp() };
          voiceState = 'draft'; openMainWindowSession(result.id, { focus: true });
        } catch { if (current()) { voiceState = 'error'; log.warn('Passport transcription failed'); } }
      })();
    } catch { voice.reset(); if (!pending && voiceState !== 'transcribing') voiceState = 'error'; log.warn('Passport recording rejected'); }
  };
  const refresh = async (): Promise<void> => {
    if (!wanted || refreshing) return;
    refreshing = true;
    const epoch = generation;
    try {
      const catalog = await listWorkLouderCodexTaskCatalog();
      if (wanted && epoch === generation) {
        const feedback: Record<PassportState['voice'], string> = {
          idle: '', recording: 'Receiving recording', transcribing: 'Cindy is transcribing',
          draft: 'Review the text in Cindy before sending', error: 'Recording or transcription failed. Record again.',
        };
        controller.update(history.tasks(activity, new Map(catalog.options.map((task) => [task.id, task.title ?? ''])))
          .map((task) => task.id === voiceTaskId && feedback[voiceState] ? { ...task, message: feedback[voiceState] } : task));
      }
      if (wanted && epoch === generation && Date.now() - heartbeatAt >= 5000) {
        heartbeatAt = Date.now(); controller.heartbeat();
      }
    } catch { if (wanted && epoch === generation) { log.warn('Passport task catalog unavailable'); controller.update([]); } }
    finally { refreshing = false; }
  };
  const stop = (): void => {
    wanted = false; generation++;
    if (timer) clearInterval(timer); timer = null;
    controller.reset(); history.clear(); activity = []; voice.reset(); pending = null; voiceState = 'idle'; devices = []; bluetooth = 0;
    const current = child; child = null;
    current?.stdin.end(); current?.kill();
  };
  const start = async (): Promise<void> => {
    if (!isEnabled() || wanted || starting) return;
    wanted = true; starting = true;
    const epoch = ++generation;
    try {
      let executable: string;
      if (app.isPackaged) {
        executable = path.join(process.resourcesPath, 'tools', 'passport', 'cindy-passport');
        await fs.access(executable);
      } else {
        const source = path.join(app.getAppPath(), 'native', 'passport', 'passport.swift');
        const dir = path.join(app.getPath('userData'), 'passport');
        await fs.mkdir(dir, { recursive: true });
        executable = path.join(dir, 'cindy-passport');
        await promisify(execFile)('xcrun', ['swiftc', source, '-O', '-framework', 'AppKit', '-framework', 'CoreBluetooth',
          '-Xlinker', '-sectcreate', '-Xlinker', '__TEXT', '-Xlinker', '__info_plist',
          '-Xlinker', path.join(path.dirname(source), 'Info.plist'), '-o', executable]);
      }
      if (!wanted || epoch !== generation) return;
      const profile = createHash('sha256').update(app.getPath('userData') + ':' + getActiveDataOwnerPushStamp().dataOwnerId).digest('hex').slice(0, 16);
      const next = spawn(executable, [profile], { stdio: ['pipe', 'pipe', 'pipe'] });
      child = next;
      let buffer = '';
      next.stdout.setEncoding('utf8');
      next.stdout.on('data', (data: string) => {
        if (child !== next) return;
        buffer += data;
        if (buffer.length > 8192) { stop(); log.warn('Passport helper output exceeded limit'); return; }
        let index: number;
        while ((index = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, index); buffer = buffer.slice(index + 1);
          try {
            const event = JSON.parse(line);
            if (event.kind === 'devices' && Array.isArray(event.devices) && event.devices.length <= 64 &&
                event.devices.every((id: unknown) => typeof id === 'string' && /^[0-9A-F-]{36}$/i.test(id)) &&
                Number.isInteger(event.bluetooth) && event.bluetooth >= 0 && event.bluetooth <= 5) {
              devices = event.devices; bluetooth = event.bluetooth;
            }
          } catch { /* Invalid helper events have no authority. */ }
          const previousVersion = controller.connectionVersion;
          controller.handle(line);
          if (previousVersion !== controller.connectionVersion) { voice.reset(); voiceState = pending ? 'draft' : 'idle'; }
          handleVoice(line);
        }
      });
      next.stderr.resume();
      next.stdin.on('error', () => { if (child === next) stop(); });
      next.on('error', () => { if (child === next) { stop(); log.warn('Passport helper failed'); } });
      next.on('exit', () => { if (child === next) { stop(); log.warn('Passport helper exited'); } });
      timer = setInterval(() => { void refresh(); }, 1000);
      timer.unref(); void refresh();
    } catch { stop(); log.warn('Passport helper could not start'); }
    finally { starting = false; }
  };
  ipcMain.handle('passport:enabled', async (event, value: unknown) => {
    assertTrustedAppRendererEvent(event);
    if (process.platform !== 'darwin') throwIpcError('INVALID_PARAMS', 'Passport requires macOS');
    try {
      if (value === null) await settings.resetAtomic();
      else await settings.writePatchAtomic({ enabled: requireBoolean(value, 'enabled') });
      if (isEnabled()) await start(); else stop();
    } catch { throwIpcError('INTERNAL', 'Passport settings could not be saved'); }
  });
  ipcMain.handle('passport:connect', (event, value: unknown) => {
    assertTrustedAppRendererEvent(event);
    const id = requireString(value, 'device');
    if (!isEnabled() || !devices.includes(id) || !child) throwIpcError('INVALID_PARAMS', 'Passport device unavailable');
    child.stdin.write(JSON.stringify({ kind: 'connect', id }) + '\n');
  });
  ipcMain.handle('passport:disconnect', (event) => {
    assertTrustedAppRendererEvent(event);
    child?.stdin.write(JSON.stringify({ kind: 'forget' }) + '\n');
  });
  registerInputDevice({
    descriptor: { id: 'cindy-passport', label: 'Cindy Passport', capabilities: [{ kind: 'task-slots', count: 8 }] },
    start: () => { void start(); },
    updateSessionActivity: (next) => { activity = next; history.observe(next); void refresh(); },
    resumeTaskSlots: start,
    suspendTaskSlots: stop,
    dispose: async () => { stop(); },
  });
}
