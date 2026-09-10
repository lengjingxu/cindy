import type { AgentIslandSessionActivity } from '../../shared/agentIsland.js';

export const PASSPORT_MAX_TASKS = 8;
const WIDTHS = [40, 80, 16, 192] as const;
const ITEM_BYTES = 328;
const STATES: Record<AgentIslandSessionActivity['phase'], string> = {
  running: 'running', 'needs-interaction': 'waiting', completed: 'done', error: 'failed',
};
export interface PassportTask { id: string; title: string; status: string; message: string }
export function passportTasks(
  activity: readonly AgentIslandSessionActivity[],
  titles: ReadonlyMap<string, string>,
): PassportTask[] {
  const rank = { 'needs-interaction': 0, error: 1, running: 2, completed: 3 };
  return [...activity].filter((a) => titles.has(a.sessionId) && Buffer.byteLength(a.sessionId) < 40)
    .sort((a, b) => rank[a.phase] - rank[b.phase] ||
      (b.lastActivityAtMs ?? 0) - (a.lastActivityAtMs ?? 0) || a.sessionId.localeCompare(b.sessionId))
    .slice(0, PASSPORT_MAX_TASKS)
    .map((a) => ({ id: a.sessionId, title: titles.get(a.sessionId)!, status: STATES[a.phase],
      message: a.currentActionSummary ?? a.compactDetail }));
}
/** Preserve observed terminal states after the activity overlay clears them.
 * The current catalog remains authoritative for archive/delete/owner changes.
 */
export class PassportTaskHistory {
  private terminal = new Map<string, AgentIslandSessionActivity>();
  observe(activity: readonly AgentIslandSessionActivity[]): void {
    for (const item of activity) {
      this.terminal.delete(item.sessionId);
      if (item.phase === 'completed' || item.phase === 'error') this.terminal.set(item.sessionId, item);
    }
    while (this.terminal.size > 100) this.terminal.delete(this.terminal.keys().next().value!);
  }
  tasks(activity: readonly AgentIslandSessionActivity[], titles: ReadonlyMap<string, string>): PassportTask[] {
    for (const id of this.terminal.keys()) if (!titles.has(id)) this.terminal.delete(id);
    const current = new Map(this.terminal);
    for (const item of activity) current.set(item.sessionId, item);
    return passportTasks([...current.values()], titles);
  }
  clear(): void { this.terminal.clear(); }
}

export function encodeSnapshot(tasks: readonly PassportTask[]): Buffer {
  if (tasks.length > PASSPORT_MAX_TASKS) throw new Error('Too many Passport tasks');
  const frame = Buffer.alloc(4 + tasks.length * ITEM_BYTES);
  frame.writeUInt16LE(frame.length - 2, 0); frame[2] = 1; frame[3] = tasks.length;
  const ids = new Set<string>();
  tasks.forEach((task, i) => {
    if (!task.id || task.id.includes('\0') || Buffer.byteLength(task.id) >= 40 || ids.has(task.id))
      throw new Error('Invalid Passport task ID');
    ids.add(task.id);
    let offset = 4 + i * ITEM_BYTES;
    [task.id, task.title, task.status, task.message].forEach((text, field) => {
      let size = 0;
      for (const char of text.replaceAll('\0', '')) {
        const bytes = Buffer.from(char);
        if (size + bytes.length >= WIDTHS[field]) break;
        bytes.copy(frame, offset + size); size += bytes.length;
      }
      offset += WIDTHS[field];
    });
  });
  return frame;
}
export function parseHelperLine(line: string): { kind: 'ready' | 'idle' | 'disconnected' } | { kind: 'open'; id: string } | null {
  try {
    const value: unknown = JSON.parse(line);
    if (!value || typeof value !== 'object' || !('kind' in value)) return null;
    if (value.kind === 'ready' || value.kind === 'idle' || value.kind === 'disconnected') return { kind: value.kind };
    if (value.kind === 'open' && 'id' in value && typeof value.id === 'string' &&
        value.id.length > 0 && Buffer.byteLength(value.id) < 40 && !value.id.includes('\0'))
      return { kind: 'open', id: value.id };
  } catch { /* Invalid child output has no authority. */ }
  return null;
}
