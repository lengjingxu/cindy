import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InputDeviceHost } from '../../input-devices/registry.js';

const mocks = vi.hoisted(() => ({
  register: vi.fn(), ipc: new Map<string, (...args: any[]) => any>(),
  catalog: vi.fn(), asr: vi.fn(), open: vi.fn(), spawn: vi.fn(), guard: vi.fn(),
  owner: 'owner-a',
}));
vi.mock('electron', () => ({ app: { isPackaged: true, getPath: () => '/test/profile' }, ipcMain: {
  handle: (name: string, fn: (...args: any[]) => any) => mocks.ipc.set(name, fn),
} }));
vi.mock('node:child_process', () => ({ spawn: mocks.spawn, execFile: vi.fn() }));
vi.mock('node:fs/promises', () => ({ default: { access: vi.fn().mockResolvedValue(undefined) } }));
vi.mock('../../input-devices/registry.js', () => ({ registerInputDevice: mocks.register }));
vi.mock('../../logger.js', () => ({ createLogger: () => ({ warn: vi.fn(), info: vi.fn() }) }));
vi.mock('../../deepLink.js', () => ({ openMainWindowSession: mocks.open }));
vi.mock('../../worklouder-codex/taskSlots.js', () => ({ listWorkLouderCodexTaskCatalog: mocks.catalog }));
vi.mock('../../voice-input/index.js', () => ({ transcribeVoiceInputAudioFile: mocks.asr }));
vi.mock('../../security/trustedAppRenderer.js', () => ({ assertTrustedAppRendererEvent: mocks.guard }));
vi.mock('../../appSessionState.js', () => ({
  activeOwnerScopeKey: () => mocks.owner,
  getActiveDataOwnerPushStamp: () => ({ dataOwnerId: mocks.owner, ownerGeneration: 1 }),
  ownerScopedUserDataPath: () => '/test/settings',
}));
vi.mock('../../maker-host/override-settings-file.js', () => ({ createOverrideSettingsFile: () => ({
  read: () => ({ enabled: true }),
}) }));

function wire(kind: number, sequence: number, payload = Buffer.alloc(0)): string {
  const p = Buffer.alloc(7 + payload.length); p[0] = kind; p.writeUInt32LE(5, 1);
  p.writeUInt16LE(sequence, 5); payload.copy(p, 7);
  return JSON.stringify({ kind: 'voice', packet: p.toString('base64') }) + '\n';
}
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
describe('Passport host transcription boundary', () => {
  let host: InputDeviceHost, stdout: EventEmitter;
  let resourcesPathDescriptor: PropertyDescriptor | undefined;
  beforeEach(async () => {
    vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers();
    vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin');
    resourcesPathDescriptor = Object.getOwnPropertyDescriptor(process, 'resourcesPath');
    Object.defineProperty(process, 'resourcesPath', { configurable: true, value: '/test/resources' });
    mocks.owner = 'owner-a'; mocks.ipc.clear();
    mocks.catalog.mockResolvedValue({ options: [{ id: 'task', title: '中文任务' }] });
    mocks.asr.mockResolvedValue({ text: '继续这个任务' });
    stdout = Object.assign(new EventEmitter(), { setEncoding: vi.fn() });
    const child = Object.assign(new EventEmitter(), { stdout, stderr: { resume: vi.fn() },
      stdin: Object.assign(new EventEmitter(), { write: vi.fn(), end: vi.fn(), destroyed: false }), kill: vi.fn() });
    mocks.spawn.mockReturnValue(child);
    const { registerPassportInputDevice } = await import('../index.js');
    registerPassportInputDevice(); host = mocks.register.mock.calls[0][0];
    host.start(); await flush();
    host.updateSessionActivity([{ sessionId: 'task', phase: 'completed', compactDetail: 'Done' } as any]);
    await flush(); stdout.emit('data', '{"kind":"ready"}\n');
  });
  afterEach(async () => {
    await host?.dispose(); vi.useRealTimers(); vi.restoreAllMocks();
    if (resourcesPathDescriptor) Object.defineProperty(process, 'resourcesPath', resourcesPathDescriptor);
    else Reflect.deleteProperty(process, 'resourcesPath');
  });
  function record(): void {
    const id = Buffer.alloc(40); id.write('task');
    stdout.emit('data', wire(1, 0, id));
    stdout.emit('data', wire(2, 0, Buffer.alloc(120)));
    stdout.emit('data', wire(3, 1));
  }
  it('uses Cindy batch ASR and retains text until the original task acknowledges it', async () => {
    record(); await flush();
    expect(mocks.asr).toHaveBeenCalledOnce();
    expect(mocks.asr.mock.calls[0][0]).toMatchObject({ mimeType: 'audio/ogg', fileName: 'passport.ogg' });
    expect(mocks.open).toHaveBeenCalledWith('task', { focus: true });
    const read = mocks.ipc.get('passport:dictation')!;
    expect(await read({}, 'another-task')).toBeNull();
    const draft = await read({}, 'task');
    expect(draft).toMatchObject({ sessionId: 'task', text: '继续这个任务', ownerStamp: { dataOwnerId: 'owner-a' } });
    expect(await read({}, 'task')).toEqual(draft);
    mocks.ipc.get('passport:dictation-ack')!({}, draft.token);
    expect(await read({}, 'task')).toBeNull();
  });
  it.each(['owner', 'disconnect', 'archive'])('discards late transcription after %s', async (boundary) => {
    let finish!: (value: { text: string }) => void;
    mocks.asr.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    record(); await flush();
    if (boundary === 'owner') mocks.owner = 'owner-b';
    if (boundary === 'disconnect') stdout.emit('data', '{"kind":"disconnected"}\n');
    if (boundary === 'archive') mocks.catalog.mockResolvedValue({ options: [] });
    finish({ text: 'private words' }); await flush();
    expect(mocks.open).not.toHaveBeenCalled();
    expect(await mocks.ipc.get('passport:dictation')!({}, 'task')).toBeNull();
  });
  it('guards dictation IPC against untrusted renderer requests', async () => {
    mocks.guard.mockImplementation(() => { throw new Error('untrusted'); });
    await expect(mocks.ipc.get('passport:dictation')!({}, 'task')).rejects.toThrow('untrusted');
    expect(mocks.asr).not.toHaveBeenCalled();
  });
});
