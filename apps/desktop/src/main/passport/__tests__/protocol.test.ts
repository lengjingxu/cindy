import { describe, expect, it } from 'vitest';
import type { AgentIslandSessionActivity } from '../../../shared/agentIsland.js';
import { encodeSnapshot, parseHelperLine, passportTasks, PassportTaskHistory } from '../protocol.js';
import { PassportController } from '../controller.js';

const task = { id: 'session-1', title: 'Task title', status: 'waiting', message: 'Needs your input' };
const activity = (id: string, phase: AgentIslandSessionActivity['phase']): AgentIslandSessionActivity => ({
  sessionId: id, phase, startedAtMs: null, lastActivityAtMs: 0, currentActionSummary: 'Hello',
  compactDetail: 'Hello', attention: false, workflow: null, turnGeneration: null,
  gracefulStopState: 'none', source: 'live',
});
describe('Passport BLE protocol', () => {
  it('matches the firmware fixed-width v1 frame', () => {
    const bytes = encodeSnapshot([task]);
    expect(bytes.length).toBe(332);
    expect([...bytes.subarray(0, 4)]).toEqual([74, 1, 1, 1]);
    expect(bytes.subarray(4, 13).toString()).toBe('session-1');
    expect(bytes.subarray(124, 131).toString()).toBe('waiting');
    expect(bytes.subarray(140, 156).toString()).toBe('Needs your input');
    expect([...encodeSnapshot([])]).toEqual([2, 0, 1, 0]);
  });
  it('bounds UTF-8 fields without splitting characters or truncating IDs', () => {
    const bytes = encodeSnapshot([{ ...task, title: '你'.repeat(40) }]);
    expect(bytes.subarray(44, 122).toString()).toBe('你'.repeat(26));
    expect(bytes[122]).toBe(0);
    expect(() => encodeSnapshot([{ ...task, id: 'a'.repeat(40) }])).toThrow();
    expect(() => encodeSnapshot([task, task])).toThrow();
    expect(() => encodeSnapshot(Array(9).fill(task))).toThrow();
  });
  it('uses Cindy states and the canonical catalog, with waiting first', () => {
    expect(passportTasks([activity('done', 'completed'), activity('wait', 'needs-interaction'),
      activity('hidden', 'running')], new Map([['done', 'Done'], ['wait', 'Waiting']]))
      .map((t) => [t.id, t.status])).toEqual([['wait', 'waiting'], ['done', 'done']]);
  });
  it('rejects malformed or unauthorized helper actions', () => {
    expect(parseHelperLine('{')).toBeNull();
    expect(parseHelperLine('{"kind":"open","id":42}')).toBeNull();
    expect(parseHelperLine('{"kind":"approve","id":"session-1"}')).toBeNull();
    const opened: string[] = [];
    const c = new PassportController(() => {}, (id) => opened.push(id));
    c.update([task]); c.handle('{"kind":"open","id":"session-1"}');
    expect(opened).toEqual([]);
    c.handle('{"kind":"ready"}'); c.handle('{"kind":"open","id":"unknown"}');
    c.handle('{"kind":"open","id":"session-1"}');
    expect(opened).toEqual(['session-1']);
    c.update([]); c.handle('{"kind":"open","id":"session-1"}');
    expect(opened).toEqual(['session-1']);
  });
  it('invalidates pending task opens across disconnect and reconnect', () => {
    const c = new PassportController(() => {}, () => {});
    c.update([task]); c.handle('{"kind":"ready"}');
    const version = c.connectionVersion;
    expect(c.canOpen(task.id)).toBe(true);
    c.handle('{"kind":"disconnected"}');
    expect(c.canOpen(task.id)).toBe(false);
    c.handle('{"kind":"ready"}');
    expect(c.connectionVersion).not.toBe(version);
  });
  it('coalesces snapshots under backpressure and resends after reconnect', () => {
    const writes: string[] = [];
    const c = new PassportController((line) => writes.push(line), () => {});
    c.update([task]); expect(writes).toHaveLength(0);
    c.handle('{"kind":"ready"}'); expect(writes).toHaveLength(1);
    c.update([{ ...task, title: 'Intermediate' }]); c.update([{ ...task, title: 'Latest' }]);
    expect(writes).toHaveLength(1);
    c.handle('{"kind":"idle"}'); expect(writes).toHaveLength(2);
    expect(Buffer.from(writes[1].trim(), 'base64').subarray(44, 50).toString()).toBe('Latest');
    c.handle('{"kind":"idle"}'); expect(writes).toHaveLength(2);
    c.handle('{"kind":"disconnected"}'); c.handle('{"kind":"ready"}');
    expect(writes).toHaveLength(3);
    c.handle('{"kind":"idle"}'); c.heartbeat();
    expect(writes).toHaveLength(4);
  });
});

describe('Passport completed tasks', () => {
  it('retains completed tasks after overlay expiry, then replaces them when work resumes', () => {
    const history = new PassportTaskHistory();
    const titles = new Map([['s1', '中文任务']]);
    history.observe([activity('s1', 'completed')]);
    expect(history.tasks([], titles)[0]).toMatchObject({ id: 's1', status: 'done', title: '中文任务' });
    history.observe([activity('s1', 'running')]);
    expect(history.tasks([activity('s1', 'running')], titles)[0].status).toBe('running');
    expect(history.tasks([], titles)).toEqual([]);
  });
  it('removes archived tasks and clears records at the owner lifecycle boundary', () => {
    const history = new PassportTaskHistory();
    history.observe([activity('s1', 'completed')]);
    expect(history.tasks([], new Map())).toEqual([]);
    expect(history.tasks([], new Map([['s1', 'Restored']]))).toEqual([]);
    history.observe([activity('s1', 'completed')]); history.clear();
    expect(history.tasks([], new Map([['s1', 'Other owner']]))).toEqual([]);
  });
});
