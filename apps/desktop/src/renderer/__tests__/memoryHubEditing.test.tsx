// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryHubDialog } from '@/components/settings/MemoryHubDialog';

vi.mock('react-i18next', () => {
  const t = (key: string) => key;
  return { useTranslation: () => ({ t }) };
});
vi.mock('@/lib/logger', () => ({ createLogger: () => ({ warn: vi.fn() }) }));
const key = (name: string) => `settings.memory.hub.${name}`;
const entry = {
  filename: 'user_preference.md',
  slug: 'preference',
  frontmatter: {
    title: 'Preference',
    description: 'Remember style',
    type: 'user' as const,
    updatedAt: '2026-10-05T00:00:00.000Z',
  },
  body: 'Old body',
  sizeBytes: 100,
};
const digest = {
  ...entry,
  filename: 'digest_internal.md',
  frontmatter: { ...entry.frontmatter, title: 'Internal summary', type: 'digest' as const },
};
let api: Record<string, ReturnType<typeof vi.fn>>;
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
beforeEach(() => {
  api = {
    memoryHubListScopes: vi.fn().mockResolvedValue({
      scopes: [
        { dirName: 'a', kind: 'local', scopeKey: '/project/a', displayPath: 'Project A' },
        { dirName: 'b', kind: 'local', scopeKey: '/project/b', displayPath: 'Project B' },
      ],
    }),
    memoryHubListEntries: vi.fn().mockResolvedValue({ entries: [entry, digest] }),
    memoryHubReadEntry: vi.fn().mockResolvedValue({ entry }),
    memoryHubEntryWrite: vi.fn().mockResolvedValue({ ok: true, filename: entry.filename }),
    memoryHubEntryDelete: vi.fn().mockResolvedValue({ ok: true }),
    memoryHubTrashList: vi
      .fn()
      .mockResolvedValue({
        entries: [
          {
            ...entry.frontmatter,
            filename: entry.filename,
            deletedAt: entry.frontmatter.updatedAt,
            sizeBytes: 100,
          },
        ],
      }),
    memoryHubRestore: vi.fn().mockResolvedValue({ ok: true, filename: entry.filename }),
    memoryHubSearch: vi.fn().mockResolvedValue({ hits: [] }),
  };
  Object.defineProperty(window, 'electronAPI', { configurable: true, value: { maker: api } });
});
afterEach(cleanup);
async function openEntry() {
  fireEvent.click(await screen.findByRole('button', { name: /Preference/ }));
  await screen.findByRole('heading', { name: 'Preference' });
}

it('preserves the draft after a version conflict and prevents dismissal or scope changes during editing', async () => {
  const close = vi.fn();
  render(<MemoryHubDialog open onClose={close} />);
  await openEntry();
  fireEvent.click(screen.getByRole('button', { name: key('edit') }));
  fireEvent.change(screen.getByLabelText(key('editBody')), { target: { value: 'My draft' } });
  api.memoryHubEntryWrite.mockRejectedValue(new Error('[PRECONDITION_FAILED] changed'));
  fireEvent.click(screen.getByRole('button', { name: key('save') }));
  await screen.findByText(key('versionConflict'));
  expect((screen.getByLabelText(key('editBody')) as HTMLTextAreaElement).value).toBe('My draft');
  expect(api.memoryHubEntryWrite).toHaveBeenCalledWith(
    '/project/a',
    expect.objectContaining({
      filename: entry.filename,
      expectedUpdatedAt: entry.frontmatter.updatedAt,
      body: 'My draft',
      mode: 'update',
    }),
  );
  expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: key('close') }));
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: key('cancel') }));
  fireEvent.click(screen.getByRole('button', { name: key('close') }));
  expect(close).toHaveBeenCalledOnce();
});

it('waits for save settlement before allowing another write or dismissal', async () => {
  const gate = deferred<{ ok: true; filename: string }>();
  api.memoryHubEntryWrite.mockReturnValue(gate.promise);
  const close = vi.fn();
  render(<MemoryHubDialog open onClose={close} />);
  await openEntry();
  fireEvent.click(screen.getByRole('button', { name: key('edit') }));
  fireEvent.click(screen.getByRole('button', { name: key('save') }));
  fireEvent.click(screen.getByRole('button', { name: key('save') }));
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(api.memoryHubEntryWrite).toHaveBeenCalledOnce();
  expect(close).not.toHaveBeenCalled();
  await act(async () => gate.resolve({ ok: true, filename: entry.filename }));
  await waitFor(() => expect(screen.queryByLabelText(key('editBody'))).toBeNull());
});

it('requires deletion confirmation and exposes restoration from Trash', async () => {
  render(<MemoryHubDialog open onClose={vi.fn()} />);
  await openEntry();
  fireEvent.click(screen.getByRole('button', { name: key('delete') }));
  expect(api.memoryHubEntryDelete).not.toHaveBeenCalled();
  fireEvent.click(screen.getAllByRole('button', { name: key('delete') })[1]);
  await waitFor(() =>
    expect(api.memoryHubEntryDelete).toHaveBeenCalledWith(
      '/project/a',
      entry.filename,
      entry.frontmatter.updatedAt,
    ),
  );
  await screen.findByRole('button', { name: /Preference/ });
  fireEvent.click(screen.getByRole('button', { name: key('trash') }));
  fireEvent.click(await screen.findByRole('button', { name: key('restoreAction') }));
  await screen.findByText(key('trashEmpty'));
  expect(api.memoryHubRestore).toHaveBeenCalledWith('/project/a', entry.filename);
});

it('does not expose edits or deletion for an internal summary', async () => {
  api.memoryHubReadEntry.mockResolvedValue({ entry: digest });
  render(<MemoryHubDialog open onClose={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: /settings.memory.hub.digest/ }));
  fireEvent.click(screen.getByRole('button', { name: /Internal summary/ }));
  await screen.findByRole('heading', { name: 'Internal summary' });
  expect(screen.queryByRole('button', { name: key('edit') })).toBeNull();
  expect(screen.queryByRole('button', { name: key('delete') })).toBeNull();
});

it('ignores a previous scope detail that returns after switching projects', async () => {
  const gate = deferred<{ entry: typeof entry }>();
  api.memoryHubReadEntry.mockReturnValue(gate.promise);
  render(<MemoryHubDialog open onClose={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: /Preference/ }));
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } });
  await waitFor(() => expect(api.memoryHubListEntries).toHaveBeenCalledWith('/project/b'));
  await act(async () => gate.resolve({ entry }));
  expect(screen.queryByRole('heading', { name: 'Preference' })).toBeNull();
});
