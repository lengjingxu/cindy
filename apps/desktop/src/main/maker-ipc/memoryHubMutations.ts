import type { MakerMemoryStore } from '@cindy/maker-core';
import { requireEnum, requireObject, requireString, throwIpcError } from '../utils/ipcValidate.js';

const editableTypes = ['user', 'feedback', 'project', 'reference'] as const;

export async function writeMemoryHubEntry(store: MakerMemoryStore, opts: unknown) {
  const input = requireObject(opts);
  const changes = {
    title: requireString(input.title, 'title'),
    description: requireString(input.description, 'description'),
    body: requireString(input.body, 'body'),
  };
  const mode =
    input.mode === undefined
      ? 'create'
      : requireEnum(input.mode, ['create', 'update', 'append'], 'mode');
  if (mode === 'update') {
    const filename = requireString(input.filename, 'filename');
    const revision = requireString(input.expectedUpdatedAt, 'expectedUpdatedAt');
    const current = await store.read(filename);
    if (current.frontmatter.type === 'digest') {
      throwIpcError('INVALID_PARAMS', 'Internal summaries are read-only');
    }
    const entry = await store.update(filename, revision, changes);
    return { ok: true as const, filename, entry };
  }
  return store.write({
    ...changes,
    mode,
    type: requireEnum(input.type, editableTypes, 'type'),
    name: requireString(input.name, 'name'),
  });
}

export async function deleteMemoryHubEntry(
  store: MakerMemoryStore,
  filename: string,
  revision: unknown,
) {
  const expectedUpdatedAt = requireString(revision, 'expectedUpdatedAt');
  const current = await store.read(filename);
  if (current.frontmatter.type === 'digest') {
    throwIpcError('INVALID_PARAMS', 'Internal summaries are read-only');
  }
  await store.softDelete(filename, expectedUpdatedAt);
  return { ok: true as const };
}

export async function restoreMemoryHubEntry(store: MakerMemoryStore, filename: string) {
  const entry = (await store.listTrash()).find((item) => item.filename === filename);
  if (!entry) throwIpcError('NOT_FOUND', 'memory trash entry no longer exists');
  if (entry.type === 'digest') throwIpcError('INVALID_PARAMS', 'Internal summaries are read-only');
  return store.restore(filename);
}
