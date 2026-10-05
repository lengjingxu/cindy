import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, Loader2, Search, Trash2, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { extractIpcError } from '@/utils/ipcError';
import { createLogger } from '@/lib/logger';
import {
  CURATED_MEMORY_HUB_TYPES,
  formatMemoryHubSize,
  formatMemoryHubTimestamp,
  scopeDisplayName,
  scopeIsOpenable,
  splitCuratedAndDigestEntries,
  type MemoryHubEntrySummary,
  type MemoryHubScope,
} from '@/lib/memoryHub';

const log = createLogger('MemoryHubDialog');

type MemoryHubEntryType = 'user' | 'feedback' | 'project' | 'reference' | 'digest';

interface MemoryHubSearchHit {
  filename: string;
  type: string;
  title: string;
  snippet: string;
  score: number;
}

interface MemoryHubEntryDetail {
  filename: string;
  slug: string;
  frontmatter: {
    title: string;
    description: string;
    type: MemoryHubEntryType;
    updatedAt: string;
  };
  body: string;
  sizeBytes: number;
}

function SnippetText({ snippet }: { snippet: string }) {
  const segments: Array<{ text: string; mark: boolean }> = [];
  let mark = snippet.startsWith('<mark>');
  let rest = snippet;
  while (rest !== '') {
    const marker = mark ? '</mark>' : '<mark>';
    const index = rest.indexOf(marker);
    if (index === -1) {
      segments.push({ text: rest, mark });
      break;
    }
    segments.push({ text: rest.slice(0, index), mark });
    rest = rest.slice(index + marker.length);
    mark = !mark;
  }
  return (
    <p className="mt-0.5 line-clamp-2 text-12 text-[var(--settings-section-desc)]">
      {segments.map((segment, index) =>
        segment.mark ? (
          <mark key={index} className="rounded-sm bg-yellow-400/40 text-inherit">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </p>
  );
}

export function MemoryHubDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [scopes, setScopes] = useState<MemoryHubScope[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDirName, setSelectedDirName] = useState<string | null>(null);
  const [entries, setEntries] = useState<MemoryHubEntrySummary[] | null>(null);
  const [detail, setDetail] = useState<MemoryHubEntryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<MemoryHubSearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [indexPreview, setIndexPreview] = useState<string | null>(null);
  const [digestOpen, setDigestOpen] = useState(false);
  const [draft, setDraft] = useState<{ title: string; description: string; body: string } | null>(
    null,
  );
  const [trash, setTrash] = useState<
    Awaited<ReturnType<typeof window.electronAPI.maker.memoryHubTrashList>>['entries'] | null
  >(null);
  const [showTrash, setShowTrash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const epoch = useRef(0);
  const detailRequest = useRef(0);
  const locked = busy || draft !== null;

  const operationError = useCallback(
    (err: unknown) => {
      const code = extractIpcError(err)?.code;
      setLoadError(
        t(
          `settings.memory.hub.${code === 'PRECONDITION_FAILED' ? 'versionConflict' : code === 'ALREADY_EXISTS' ? 'nameConflict' : 'operationFailed'}`,
        ),
      );
    },
    [t],
  );
  const close = () => {
    if (!locked) onClose();
  };

  const resetScopeState = useCallback(() => {
    epoch.current += 1;
    detailRequest.current += 1;
    setDraft(null);
    setTrash(null);
    setShowTrash(false);
    setConfirmDelete(false);
    setLoadError(null);
    setEntries(null);
    setDetail(null);
    setDetailLoading(false);
    setQuery('');
    setHits(null);
    setSearching(false);
    setIndexPreview(null);
    setDigestOpen(false);
  }, []);

  const loadScopes = useCallback(async () => {
    setScopes(null);
    setLoadError(null);
    setSelectedDirName(null);
    resetScopeState();
    const current = epoch.current;
    try {
      const res = await window.electronAPI.maker.memoryHubListScopes();
      if (current !== epoch.current) return;
      setScopes(res.scopes);
      const openable =
        res.scopes.find((scope) => scope.kind === 'local' && scopeIsOpenable(scope)) ??
        res.scopes.find((scope) => scopeIsOpenable(scope));
      if (openable) setSelectedDirName(openable.dirName);
    } catch (err) {
      if (current !== epoch.current) return;
      log.warn('memoryHubListScopes failed');
      setScopes([]);
      operationError(err);
    }
  }, [resetScopeState, operationError]);

  useEffect(() => {
    if (open) void loadScopes();
    return () => {
      epoch.current += 1;
    };
  }, [open, loadScopes]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !locked) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, locked]);

  const selectedScope = scopes?.find((scope) => scope.dirName === selectedDirName) ?? null;
  const openScopeKey =
    selectedScope && scopeIsOpenable(selectedScope) ? selectedScope.scopeKey : null;

  useEffect(() => {
    if (!open || !openScopeKey) {
      setEntries(null);
      return;
    }
    let cancelled = false;
    resetScopeState();
    void (async () => {
      try {
        const res = await window.electronAPI.maker.memoryHubListEntries(openScopeKey);
        if (!cancelled) setEntries(res.entries);
      } catch (err) {
        log.warn('memoryHubListEntries failed');
        if (!cancelled) operationError(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, openScopeKey, resetScopeState, operationError]);

  const openDetail = useCallback(
    async (filename: string) => {
      if (!openScopeKey) return;
      const current = epoch.current;
      const request = ++detailRequest.current;
      setLoadError(null);
      setDraft(null);
      setConfirmDelete(false);
      setDetailLoading(true);
      setHits(null);
      try {
        const res = await window.electronAPI.maker.memoryHubReadEntry(openScopeKey, filename);
        if (current === epoch.current && request === detailRequest.current) setDetail(res.entry);
      } catch (err) {
        if (current === epoch.current && request === detailRequest.current) operationError(err);
      } finally {
        if (current === epoch.current && request === detailRequest.current) setDetailLoading(false);
      }
    },
    [openScopeKey, operationError],
  );

  const runSearch = useCallback(async () => {
    if (!openScopeKey || query.trim() === '') return;
    const current = epoch.current;
    detailRequest.current += 1;
    setDetailLoading(false);
    setLoadError(null);
    setSearching(true);
    setDetail(null);
    try {
      const res = await window.electronAPI.maker.memoryHubSearch(openScopeKey, query.trim());
      if (current === epoch.current) setHits(res.hits);
    } catch (err) {
      if (current === epoch.current) operationError(err);
    } finally {
      if (current === epoch.current) setSearching(false);
    }
  }, [openScopeKey, query, operationError]);

  const toggleIndexPreview = useCallback(async () => {
    if (indexPreview !== null) {
      setIndexPreview(null);
      return;
    }
    if (!openScopeKey) return;
    const current = epoch.current;
    try {
      const res = await window.electronAPI.maker.memoryHubIndexPreview(openScopeKey);
      if (current === epoch.current) setIndexPreview(res.index);
    } catch (err) {
      if (current === epoch.current) operationError(err);
    }
  }, [indexPreview, openScopeKey, operationError]);

  const refreshEntries = async () => {
    if (!openScopeKey) return;
    const current = epoch.current;
    const res = await window.electronAPI.maker.memoryHubListEntries(openScopeKey);
    if (current === epoch.current) setEntries(res.entries);
  };

  const saveEntry = async () => {
    if (!openScopeKey || !detail || !draft || busy) return;
    setBusy(true);
    setLoadError(null);
    try {
      await window.electronAPI.maker.memoryHubEntryWrite(openScopeKey, {
        ...draft,
        filename: detail.filename,
        expectedUpdatedAt: detail.frontmatter.updatedAt,
        mode: 'update',
      });
      setDraft(null);
      setIndexPreview(null);
      await openDetail(detail.filename);
      await refreshEntries();
    } catch (err) {
      operationError(err);
    } finally {
      setBusy(false);
    }
  };

  const deleteEntry = async () => {
    if (!openScopeKey || !detail || busy) return;
    setBusy(true);
    setLoadError(null);
    try {
      await window.electronAPI.maker.memoryHubEntryDelete(
        openScopeKey,
        detail.filename,
        detail.frontmatter.updatedAt,
      );
      setDetail(null);
      setConfirmDelete(false);
      setIndexPreview(null);
      await refreshEntries();
    } catch (err) {
      operationError(err);
    } finally {
      setBusy(false);
    }
  };

  const openTrash = async () => {
    if (!openScopeKey || locked) return;
    const current = epoch.current;
    detailRequest.current += 1;
    setShowTrash(true);
    setDetail(null);
    setDetailLoading(false);
    setHits(null);
    setLoadError(null);
    setTrash(null);
    try {
      const res = await window.electronAPI.maker.memoryHubTrashList(openScopeKey);
      if (current === epoch.current) setTrash(res.entries);
    } catch (err) {
      if (current === epoch.current) operationError(err);
    }
  };

  const restoreEntry = async (filename: string) => {
    if (!openScopeKey || busy) return;
    setBusy(true);
    setLoadError(null);
    try {
      await window.electronAPI.maker.memoryHubRestore(openScopeKey, filename);
      setTrash((items) => items?.filter((item) => item.filename !== filename) ?? null);
      setIndexPreview(null);
      await refreshEntries();
    } catch (err) {
      operationError(err);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const grouped = entries ? splitCuratedAndDigestEntries(entries) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        className={cn(
          'flex h-[80vh] w-[760px] max-w-[92vw] flex-col overflow-hidden rounded-xl',
          'bg-[var(--settings-theme-card-bg)] border border-[var(--settings-theme-card-border)]',
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--settings-theme-card-border)] px-5 py-4">
          <h2 className="text-16 font-medium text-[var(--settings-section-title)]">
            {t('settings.memory.hub.title')}
          </h2>
          <button
            type="button"
            onClick={close}
            disabled={locked}
            className="rounded-lg p-1.5 text-[var(--settings-section-desc)] hover:bg-[var(--settings-input-bg)]"
            aria-label={t('settings.memory.hub.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">
          <label className="flex items-center gap-2 text-13 text-[var(--settings-section-desc)]">
            <span className="shrink-0">{t('settings.memory.hub.scopeLabel')}</span>
            {scopes === null ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <select
                value={selectedDirName ?? ''}
                disabled={locked}
                onChange={(event) => {
                  resetScopeState();
                  setSelectedDirName(event.target.value || null);
                }}
                className={cn(
                  'min-w-0 flex-1 rounded-lg border border-[var(--settings-theme-card-border)]',
                  'bg-[var(--settings-input-bg)] px-2 py-1.5 text-13 text-[var(--settings-section-title)]',
                )}
              >
                {scopes.length === 0 && <option value="">—</option>}
                {scopes.map((scope) => (
                  <option
                    key={scope.dirName}
                    value={scope.dirName}
                    disabled={!scopeIsOpenable(scope)}
                  >
                    {scopeDisplayName(scope, t('settings.memory.hub.scopeLabel'))}
                    {scope.kind === 'remote' ? ` · ${t('settings.memory.hub.scopeRemoteTag')}` : ''}
                    {!scopeIsOpenable(scope) ? ` · ${t('settings.memory.hub.scopeViewOnly')}` : ''}
                  </option>
                ))}
              </select>
            )}
          </label>

          {loadError && (
            <div className="rounded-xl border border-[var(--error-border)] bg-[var(--error-bg)] px-3 py-2 text-13 text-[var(--error-fg)]">
              {loadError}
            </div>
          )}
        </div>

        {openScopeKey && !showTrash && (
          <div className="flex items-center gap-2 px-5 pb-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--settings-theme-card-border)] bg-[var(--settings-input-bg)] px-3 py-1.5">
              <Search size={14} className="shrink-0 text-[var(--settings-section-desc)]" />
              <input
                disabled={locked}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !locked && !searching) void runSearch();
                }}
                placeholder={t('settings.memory.hub.searchPlaceholder')}
                className="min-w-0 flex-1 bg-transparent text-13 text-[var(--settings-section-title)] outline-none placeholder:text-[var(--settings-section-desc)]"
              />
            </div>
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={locked || searching || query.trim() === ''}
              className="rounded-lg bg-[var(--settings-input-bg)] px-3 py-1.5 text-13 text-[var(--settings-section-title)] disabled:opacity-50"
            >
              {searching ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                t('settings.memory.hub.searchAction')
              )}
            </button>
            <button
              type="button"
              disabled={locked}
              onClick={() => void toggleIndexPreview()}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-13',
                indexPreview !== null
                  ? 'bg-[var(--settings-section-title)] text-[var(--settings-theme-card-bg)]'
                  : 'bg-[var(--settings-input-bg)] text-[var(--settings-section-title)]',
              )}
            >
              <Eye size={14} />
              {t('settings.memory.hub.preview')}
            </button>
            <Button
              variant="secondary"
              disabled={locked}
              onClick={() => void openTrash()}
              className="gap-1.5 px-3"
            >
              <Trash2 size={14} />
              {t('settings.memory.hub.trash')}
            </Button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {indexPreview !== null && (
            <div className="mb-4 flex flex-col gap-2">
              <p className="text-12 leading-[1.5] text-[var(--settings-section-desc)]">
                {t('settings.memory.hub.previewHint')}
              </p>
              <pre className="whitespace-pre-wrap rounded-lg bg-[var(--settings-input-bg)] p-3 text-12 leading-[1.6] text-[var(--settings-section-title)]">
                {indexPreview}
              </pre>
            </div>
          )}

          {showTrash && (
            <div className="flex flex-col gap-3">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setShowTrash(false);
                  setLoadError(null);
                }}
                className="w-fit gap-1.5 px-3"
              >
                <ArrowLeft size={14} />
                {t('settings.memory.hub.back')}
              </Button>
              <h3 className="text-15 font-medium text-[var(--settings-section-title)]">
                {t('settings.memory.hub.trash')}
              </h3>
              {trash === null && !loadError && <Loader2 size={18} className="animate-spin" />}
              {trash?.length === 0 && (
                <p className="text-13 text-[var(--settings-section-desc)]">
                  {t('settings.memory.hub.trashEmpty')}
                </p>
              )}
              {trash?.map((entry) => (
                <div
                  key={entry.filename}
                  className="flex items-center gap-3 rounded-xl border border-[var(--settings-theme-card-border)] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-13 font-medium text-[var(--settings-section-title)]">
                      {entry.title}
                    </p>
                    <p className="text-13 text-[var(--settings-section-desc)]">
                      {entry.description}
                    </p>
                    <p className="text-12 text-[var(--settings-section-desc)]">{entry.filename}</p>
                  </div>
                  {entry.type !== 'digest' && (
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void restoreEntry(entry.filename)}
                      className="px-3"
                    >
                      {t('settings.memory.hub.restoreAction')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {detailLoading && (
            <div className="flex items-center justify-center py-10 text-[var(--settings-section-desc)]">
              <Loader2 size={18} className="animate-spin" />
            </div>
          )}

          {detail && !detailLoading && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={locked}
                onClick={() => {
                  setDetail(null);
                  setConfirmDelete(false);
                  setLoadError(null);
                }}
                className="flex w-fit items-center gap-1.5 text-13 text-[var(--settings-section-desc)] hover:text-[var(--settings-section-title)]"
              >
                <ArrowLeft size={14} />
                {t('settings.memory.hub.back')}
              </button>
              {detail.frontmatter.type !== 'digest' && !draft && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      setDraft({
                        title: detail.frontmatter.title,
                        description: detail.frontmatter.description,
                        body: detail.body,
                      });
                      setConfirmDelete(false);
                      setLoadError(null);
                    }}
                    className="px-3"
                  >
                    {t('settings.memory.hub.edit')}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => setConfirmDelete(true)}
                    className="px-3"
                  >
                    {t('settings.memory.hub.delete')}
                  </Button>
                </div>
              )}
              {confirmDelete && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--settings-theme-card-border)] p-3">
                  <p className="w-full text-13 text-[var(--settings-section-desc)]">
                    {t('settings.memory.hub.confirmDelete')}
                  </p>
                  <Button loading={busy} onClick={() => void deleteEntry()} className="px-3">
                    {t('settings.memory.hub.delete')}
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => setConfirmDelete(false)}
                    className="px-3"
                  >
                    {t('settings.memory.hub.cancel')}
                  </Button>
                </div>
              )}
              {draft ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveEntry();
                  }}
                  className="flex flex-col gap-3"
                >
                  {(['title', 'description', 'body'] as const).map((field) => (
                    <label
                      key={field}
                      className="flex flex-col gap-1.5 text-13 text-[var(--settings-section-desc)]"
                    >
                      {t(`settings.memory.hub.edit${field[0].toUpperCase()}${field.slice(1)}`)}
                      {field === 'body' ? (
                        <textarea
                          required
                          disabled={busy}
                          rows={12}
                          value={draft.body}
                          onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                          className="resize-y rounded-lg border border-[var(--settings-theme-card-border)] bg-[var(--settings-input-bg)] p-3 text-13 leading-[1.6] text-[var(--settings-section-title)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                        />
                      ) : (
                        <input
                          autoFocus={field === 'title'}
                          required
                          disabled={busy}
                          maxLength={field === 'title' ? 100 : 200}
                          value={draft[field]}
                          onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
                          className="rounded-full border border-[var(--settings-theme-card-border)] bg-[var(--settings-input-bg)] px-3 py-2 text-13 text-[var(--settings-section-title)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                        />
                      )}
                    </label>
                  ))}
                  <p className="text-12 text-[var(--settings-section-desc)]">
                    {t('settings.memory.hub.editHint')}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      loading={busy}
                      disabled={
                        !draft.title.trim() || !draft.description.trim() || !draft.body.trim()
                      }
                      className="px-3"
                    >
                      {t('settings.memory.hub.save')}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => {
                        setDraft(null);
                        setLoadError(null);
                      }}
                      className="px-3"
                    >
                      {t('settings.memory.hub.cancel')}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <h3 className="text-15 font-medium text-[var(--settings-section-title)]">
                      {detail.frontmatter.title}
                    </h3>
                    <p className="mt-0.5 text-13 text-[var(--settings-section-desc)]">
                      {detail.frontmatter.description}
                    </p>
                    <p className="mt-1 text-12 text-[var(--settings-section-desc)]">
                      {detail.filename} ·{' '}
                      {t('settings.memory.hub.entryMeta', {
                        size: formatMemoryHubSize(detail.sizeBytes),
                        time: formatMemoryHubTimestamp(detail.frontmatter.updatedAt),
                      })}
                    </p>
                  </div>
                  <pre className="whitespace-pre-wrap rounded-lg bg-[var(--settings-input-bg)] p-3 text-13 leading-[1.6] text-[var(--settings-section-title)]">
                    {detail.body}
                  </pre>
                </>
              )}
            </div>
          )}

          {!showTrash && !detail && !detailLoading && grouped && (
            <div className="flex flex-col gap-4">
              {entries !== null && (
                <p className="text-12 text-[var(--settings-section-desc)]">
                  {t('settings.memory.hub.count', { count: entries.length })}
                </p>
              )}
              {hits !== null && (
                <div className="flex flex-col gap-2">
                  {hits.length === 0 && (
                    <p className="text-13 text-[var(--settings-section-desc)]">
                      {t('settings.memory.hub.searchEmpty')}
                    </p>
                  )}
                  {hits.map((hit) => (
                    <button
                      key={hit.filename}
                      type="button"
                      onClick={() => void openDetail(hit.filename)}
                      className="rounded-lg border border-[var(--settings-theme-card-border)] px-3 py-2 text-left hover:bg-[var(--settings-input-bg)]"
                    >
                      <p className="text-13 font-medium text-[var(--settings-section-title)]">
                        {hit.title}
                      </p>
                      <SnippetText snippet={hit.snippet} />
                    </button>
                  ))}
                </div>
              )}
              {entries !== null && entries.length === 0 && (
                <p className="py-6 text-center text-13 text-[var(--settings-section-desc)]">
                  {t('settings.memory.hub.empty')}
                </p>
              )}
              {entries !== null &&
                entries.length > 0 &&
                CURATED_MEMORY_HUB_TYPES.map((type) => {
                  const typeEntries = grouped.curated.filter(
                    (entry) => entry.frontmatter.type === type,
                  );
                  if (typeEntries.length === 0) return null;
                  return (
                    <div key={type} className="flex flex-col gap-2">
                      <p className="text-12 font-medium uppercase tracking-wide text-[var(--settings-section-desc)]">
                        {t(`settings.memory.hub.type_${type}`)}
                      </p>
                      {typeEntries.map((entry) => (
                        <EntryRow
                          key={entry.filename}
                          entry={entry}
                          meta={t('settings.memory.hub.entryMeta', {
                            size: formatMemoryHubSize(entry.sizeBytes),
                            time: formatMemoryHubTimestamp(entry.frontmatter.updatedAt),
                          })}
                          onOpen={() => void openDetail(entry.filename)}
                        />
                      ))}
                    </div>
                  );
                })}
              {entries !== null && entries.length > 0 && grouped.digest.length > 0 && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setDigestOpen((prev) => !prev)}
                    className="text-left text-12 font-medium uppercase tracking-wide text-[var(--settings-section-desc)]"
                  >
                    {digestOpen ? '▾ ' : '▸ '}
                    {t('settings.memory.hub.digest')} ({grouped.digest.length})
                  </button>
                  {digestOpen && (
                    <>
                      <p className="text-12 text-[var(--settings-section-desc)]">
                        {t('settings.memory.hub.digestHint')}
                      </p>
                      {grouped.digest.map((entry) => (
                        <EntryRow
                          key={entry.filename}
                          entry={entry}
                          meta={t('settings.memory.hub.entryMeta', {
                            size: formatMemoryHubSize(entry.sizeBytes),
                            time: formatMemoryHubTimestamp(entry.frontmatter.updatedAt),
                          })}
                          onOpen={() => void openDetail(entry.filename)}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  meta,
  onOpen,
}: {
  entry: MemoryHubEntrySummary;
  meta: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-lg border border-[var(--settings-theme-card-border)] px-3 py-2 text-left hover:bg-[var(--settings-input-bg)]"
    >
      <p className="text-13 font-medium text-[var(--settings-section-title)]">
        {entry.frontmatter.title}
      </p>
      <p className="mt-0.5 text-12 text-[var(--settings-section-desc)]">
        {entry.frontmatter.description}
      </p>
      <p className="mt-1 text-12 text-[var(--settings-section-desc)]">{meta}</p>
    </button>
  );
}
