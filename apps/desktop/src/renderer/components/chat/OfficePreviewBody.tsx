/**
 * OfficePreviewBody — TextLightbox 的 office 正文体(Word HTML / Excel 表格)。
 * overlay、toolbar、加载/错误/超限态由 TextLightbox 负责;这里只渲染解析产物。
 */

import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { ParsedOfficeDocument } from '@/lib/officePreview';

export function OfficePreviewBody({ doc }: { doc: ParsedOfficeDocument }) {
  const [activeSheet, setActiveSheet] = useState(0);

  if (doc.kind === 'word') {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto select-text [scrollbar-gutter:stable_both-edges]">
        <div
          className="office-word-doc mx-auto max-w-4xl px-6 py-5"
          // 两类解析产物都已通过 sanitizeOfficeHtml 的阅读内容白名单。
          dangerouslySetInnerHTML={{ __html: doc.html }}
        />
      </div>
    );
  }

  // 空工作簿(0 表)时给安全占位,不让下标越界炸掉整个弹窗。
  const sheet = doc.sheets[Math.min(activeSheet, doc.sheets.length - 1)] ?? { name: '', html: '' };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {doc.sheets.length > 1 && (
        <div
          className={cn(
            'flex shrink-0 items-center gap-1 overflow-x-auto',
            'border-b border-[var(--msg-tool-card-border)] px-3 py-1.5',
          )}
        >
          {doc.sheets.map((s, i) => (
            <button
              key={s.name}
              type="button"
              aria-label={s.name}
              onClick={() => setActiveSheet(i)}
              className={cn(
                'shrink-0 cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1',
                'text-12 transition-colors',
                i === activeSheet
                  ? 'bg-[var(--msg-code-inline-bg)] font-medium text-[var(--msg-tool-card-text)]'
                  : 'text-[var(--msg-tool-card-chevron)] hover:bg-[var(--msg-code-inline-bg)]',
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div
        className="office-sheet-body min-h-0 flex-1 overflow-auto px-3 py-3 select-text"
        // 同上:只接收经过 sanitizeOfficeHtml 净化的内容。
        dangerouslySetInnerHTML={{ __html: sheet.html }}
      />
    </div>
  );
}
