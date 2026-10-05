import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, Loader2, Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';
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

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
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

  const resetScopeState = useCallback(() => {
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
    try {
      const res = await window.electronAPI.maker.memoryHubListScopes();
      setScopes(res.scopes);
      const openable =
        res.scopes.find((scope) => scope.kind === 'local' && scopeIsOpenable(scope)) ??
        res.scopes.find((scope) => scopeIsOpenable(scope));
      if (openable) setSelectedDirName(openable.dirName);
    } catch (err) {
      log.warn('memoryHubListScopes failed', err);
      setScopes([]);
      setLoadError(errorMessage(err));
    }
  }, [resetScopeState]);

  useEffect(() => {
    if (open) void loadScopes();
  }, [open, loadScopes]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const selectedScope = scopes?.find((scope) => scope.dirName === selectedDirName) ?? null;
  const openScopeKey = selectedScope && scopeIsOpenable(selectedScope) ? selectedScope.scopeKey : null;

  useEffect(() => {
    if (!openScopeKey) {
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
        log.warn('memoryHubListEntries failed', err);
        if (!cancelled) setLoadError(errorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openScopeKey, resetScopeState]);

  const openDetail = useCallback(
    async (filename: string) => {
      if (!openScopeKey) return;
      setDetailLoading(true);
      setHits(null);
      try {
        const res = await window.electronAPI.maker.memoryHubReadEntry(openScopeKey, filename);
        setDetail(res.entry);
      } catch (err) {
        log.warn('memoryHubReadEntry failed', err);
        setLoadError(errorMessage(err));
      } finally {
        setDetailLoading(false);
      }
    },
    [openScopeKey],
  );

  const runSearch = useCallback(async () => {
    if (!openScopeKey || query.trim() === '') return;
    setSearching(true);
    setDetail(null);
    try {
      const res = await window.electronAPI.maker.memoryHubSearch(openScopeKey, query.trim());
      setHits(res.hits);
    } catch (err) {
      log.warn('memoryHubSearch failed', err);
      setLoadError(errorMessage(err));
    } finally {
      setSearching(false);
    }
  }, [openScopeKey, query]);

  const toggleIndexPreview = useCallback(async () => {
    if (indexPreview !== null) {
      setIndexPreview(null);
      return;
    }
    if (!openScopeKey) return;
    try {
      const res = await window.electronAPI.maker.memoryHubIndexPreview(openScopeKey);
      setIndexPreview(res.index);
    } catch (err) {
      log.warn('memoryHubIndexPreview failed', err);
      setLoadError(errorMessage(err));
    }
  }, [indexPreview, openScopeKey]);

  if (!open) return null;

  const grouped = entries ? splitCuratedAndDigestEntries(entries) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
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
            onClick={onClose}
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
                onChange={(event) => setSelectedDirName(event.target.value || null)}
                className={cn(
                  'min-w-0 flex-1 rounded-lg border border-[var(--settings-theme-card-border)]',
                  'bg-[var(--settings-input-bg)] px-2 py-1.5 text-13 text-[var(--settings-section-title)]',
                )}
              >
                {scopes.length === 0 && <option value="">—</option>}
                {scopes.map((scope) => (
                  <option key={scope.dirName} value={scope.dirName} disabled={!scopeIsOpenable(scope)}>
                    {scopeDisplayName(scope, t('settings.memory.hub.scopeLabel'))}
                    {scope.kind === 'remote' ? ` · ${t('settings.memory.hub.scopeRemoteTag')}` : ''}
                    {!scopeIsOpenable(scope) ? ` · ${t('settings.memory.hub.scopeViewOnly')}` : ''}
                  </option>
                ))}
              </select>
            )}
          </label>

          {loadError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-13 text-red-500">
              {t('settings.memory.hub.loadFailed', { message: loadError })}
            </div>
          )}
        </div>

        {openScopeKey && (
          <div className="flex items-center gap-2 px-5 pb-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--settings-theme-card-border)] bg-[var(--settings-input-bg)] px-3 py-1.5">
              <Search size={14} className="shrink-0 text-[var(--settings-section-desc)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void runSearch();
                }}
                placeholder={t('settings.memory.hub.searchPlaceholder')}
                className="min-w-0 flex-1 bg-transparent text-13 text-[var(--settings-section-title)] outline-none placeholder:text-[var(--settings-section-desc)]"
              />
            </div>
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={searching || query.trim() === ''}
              className="rounded-lg bg-[var(--settings-input-bg)] px-3 py-1.5 text-13 text-[var(--settings-section-title)] disabled:opacity-50"
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : t('settings.memory.hub.searchAction')}
            </button>
            <button
              type="button"
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

          {detailLoading && (
            <div className="flex items-center justify-center py-10 text-[var(--settings-section-desc)]">
              <Loader2 size={18} className="animate-spin" />
            </div>
          )}

          {detail && !detailLoading && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="flex w-fit items-center gap-1.5 text-13 text-[var(--settings-section-desc)] hover:text-[var(--settings-section-title)]"
              >
                <ArrowLeft size={14} />
                {t('settings.memory.hub.back')}
              </button>
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
            </div>
          )}

          {!detail && !detailLoading && grouped && (
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
                      <p className="text-13 font-medium text-[var(--settings-section-title)]">{hit.title}</p>
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
      <p className="text-13 font-medium text-[var(--settings-section-title)]">{entry.frontmatter.title}</p>
      <p className="mt-0.5 text-12 text-[var(--settings-section-desc)]">{entry.frontmatter.description}</p>
      <p className="mt-1 text-12 text-[var(--settings-section-desc)]">{meta}</p>
    </button>
  );
}
