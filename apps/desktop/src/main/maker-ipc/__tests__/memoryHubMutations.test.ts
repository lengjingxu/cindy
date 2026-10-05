import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { MakerMemoryStore, type Logger } from '@cindy/maker-core';
import {
  deleteMemoryHubEntry,
  restoreMemoryHubEntry,
  writeMemoryHubEntry,
} from '../memoryHubMutations.js';

let dir: string;
let db: Database.Database;
let store: MakerMemoryStore;
const seed = {
  type: 'user' as const,
  name: 'preference',
  title: 'Original',
  description: 'Original',
  body: 'Original',
};
const filename = 'user_preference.md';
const logger: Logger = {
  trace() {},
  debug() {},
  info() {},
  warn() {},
  error() {},
  fatal() {},
  child() {
    return logger;
  },
};
beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'cindy-memory-hub-'));
  db = new Database(':memory:');
  store = new MakerMemoryStore({ storageDir: dir, absWorkdir: dir, db, logger });
  await store.write(seed);
});
afterEach(async () => {
  db.close();
  await fs.rm(dir, { recursive: true, force: true });
});

it('rejects missing revisions and stale edits without replacing the current memory', async () => {
  const opened = await store.read(filename);
  await expect(
    writeMemoryHubEntry(store, { ...seed, filename, mode: 'update' }),
  ).rejects.toMatchObject({ code: 'INVALID_PARAMS' });
  await expect(deleteMemoryHubEntry(store, filename, undefined)).rejects.toMatchObject({
    code: 'INVALID_PARAMS',
  });
  await store.write({ ...seed, mode: 'update', body: 'Agent update' });
  await expect(
    writeMemoryHubEntry(store, {
      ...seed,
      filename,
      mode: 'update',
      expectedUpdatedAt: opened.frontmatter.updatedAt,
    }),
  ).rejects.toMatchObject({ code: 'version-conflict' });
  await expect(
    deleteMemoryHubEntry(store, filename, opened.frontmatter.updatedAt),
  ).rejects.toMatchObject({ code: 'version-conflict' });
  expect((await store.read(filename)).body).toBe('Agent update');
});

it('edits the exact legacy filename and preserves body whitespace, then deletes recoverably', async () => {
  const legacy = 'user_user_preference.md';
  await fs.copyFile(path.join(dir, filename), path.join(dir, legacy));
  const opened = await store.read(legacy);
  const body = '\n  Updated body\n\n';
  const result = await writeMemoryHubEntry(store, {
    ...seed,
    filename: legacy,
    mode: 'update',
    expectedUpdatedAt: opened.frontmatter.updatedAt,
    body,
  });
  expect(result.filename).toBe(legacy);
  const saved = await store.read(legacy);
  expect(saved.body).toBe(body);
  await deleteMemoryHubEntry(store, legacy, saved.frontmatter.updatedAt);
  await expect(store.read(legacy)).rejects.toMatchObject({ code: 'not-found' });
  expect(await store.listTrash()).toEqual([expect.objectContaining({ filename: legacy })]);
  await restoreMemoryHubEntry(store, legacy);
  expect((await store.read(legacy)).body).toBe(body);
  expect((await store.read(filename)).body).toBe(seed.body);
});

it('keeps internal summaries read-only even when a renderer supplies a curated type', async () => {
  const digest = 'digest_internal.md';
  await fs.writeFile(
    path.join(dir, digest),
    '---\ntitle: Internal\ndescription: Internal\ntype: digest\nupdatedAt: 2026-10-05T00:00:00.000Z\n---\nInternal body',
  );
  await expect(
    writeMemoryHubEntry(store, {
      ...seed,
      filename: digest,
      mode: 'update',
      expectedUpdatedAt: '2026-10-05T00:00:00.000Z',
    }),
  ).rejects.toMatchObject({ code: 'INVALID_PARAMS' });
  await expect(
    deleteMemoryHubEntry(store, digest, '2026-10-05T00:00:00.000Z'),
  ).rejects.toMatchObject({ code: 'INVALID_PARAMS' });
  expect((await store.read(digest)).body).toBe('Internal body');
  await fs.mkdir(path.join(dir, '.trash'));
  await fs.rename(path.join(dir, digest), path.join(dir, '.trash', digest));
  await expect(restoreMemoryHubEntry(store, digest)).rejects.toMatchObject({
    code: 'INVALID_PARAMS',
  });
  expect(await fs.readFile(path.join(dir, '.trash', digest), 'utf8')).toContain('Internal body');
});
