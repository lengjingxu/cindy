/**
 * officePreview — Word(.docx)/Excel(.xlsx/.xls) 内嵌预览解析层。
 * ---------------------------------------------------------------------------
 * 门禁(filePreview.ts 的 shouldOpenTextLightbox*)与渲染 shell(TextLightbox
 * 的 overlay/toolbar)不在这里;这里只负责「字节 → 可渲染数据」:
 *   - .docx       → mammoth 浏览器构建转 HTML,禁用外部文件读取。
 *   - .xlsx/.xls  → SheetJS 逐表 sheet_to_html。
 * 两类输出均视为不可信 HTML,经 DOMPurify 白名单净化后才能进入宿主 DOM。
 * 仅保留阅读排版与内嵌位图;链接显示文字,不触发导航或网络请求。
 *
 * 两个解析库都按需动态 import(Vite 异步 chunk):不预览 office 文件就完全不
 * 加载这部分代码。字节经既有 readFileBytes IPC(路径策略 + 大小上限 + realpath
 * 防交换,见 main/fileReadBytes.ts),上限用 OFFICE_PREVIEW_LIMIT。
 */

import DOMPurify from 'dompurify';

export const OFFICE_PREVIEW_LIMIT_MB = 10;
export const OFFICE_PREVIEW_LIMIT = OFFICE_PREVIEW_LIMIT_MB * 1024 * 1024;
// XLSX 的压缩体积不能约束工作表声明范围;在生成 HTML 前限制迭代量。
const MAX_PREVIEW_CELLS = 100_000;
const MAX_PREVIEW_SHEETS = 100;
const MAX_PREVIEW_MERGE_CHECKS = 5_000_000;

export type OfficePreviewKind = 'word' | 'sheet';

const WORD_PREVIEW_EXTS = new Set(['.docx']);
const SHEET_PREVIEW_EXTS = new Set(['.xlsx', '.xls']);

/** 文件该按哪个 office 分支预览('word' / 'sheet');不支持内嵌时 null。 */
export function officePreviewKind(filePath: string): OfficePreviewKind | null {
  const name = filePath.slice(Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\')) + 1);
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return null;
  const ext = name.slice(dot).toLowerCase();
  if (WORD_PREVIEW_EXTS.has(ext)) return 'word';
  if (SHEET_PREVIEW_EXTS.has(ext)) return 'sheet';
  return null;
}

export function isOfficePreviewSupported(filePath: string): boolean {
  return officePreviewKind(filePath) !== null;
}

export interface OfficeSheet {
  name: string;
  html: string;
}

export type ParsedOfficeDocument =
  | { kind: 'word'; html: string; size: number }
  | { kind: 'sheet'; sheets: OfficeSheet[]; size: number };

/** main 侧 readFileBytes 超限时的稳定错误文案(main/fileReadBytes.ts),
 *  renderer 靠它区分「超限」与「文件损坏/不可读」。 */
export const READ_BYTES_OVERSIZE_MESSAGE = 'file exceeds the preview size limit';

/** Office 解析器不是净化器:链接、富文本 HTML、图片类型均来自不可信文档。 */
export function sanitizeOfficeHtml(html: string): string {
  const fragment = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'br', 'hr',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'img',
    ],
    ALLOWED_ATTR: ['colspan', 'rowspan', 'src', 'alt'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    RETURN_DOM_FRAGMENT: true,
  });
  for (const image of fragment.querySelectorAll('img')) {
    // 禁止远端跟踪图片、本机协议与 SVG 主动内容;只保留文档内嵌位图。
    if (!/^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(image.getAttribute('src') ?? '')) {
      image.remove();
    }
  }
  const container = document.createElement('div');
  container.append(fragment);
  return container.innerHTML;
}

/** 读字节并解析成预览数据。超过上限或路径不可读时 reject。 */
export async function parseOfficeDocument(filePath: string): Promise<ParsedOfficeDocument> {
  const kind = officePreviewKind(filePath);
  if (!kind) throw new Error('unsupported office file: ' + filePath);
  const read = await window.electronAPI.readFileBytes({ filePath, maxSize: OFFICE_PREVIEW_LIMIT });
  if (kind === 'word') {
    const mammoth = (await import('mammoth/mammoth.browser')).default;
    const { value } = await mammoth.convertToHtml(
      { arrayBuffer: read.bytes.slice().buffer as ArrayBuffer },
      { externalFileAccess: false },
    );
    return { kind, html: sanitizeOfficeHtml(value), size: read.size };
  }
  const XLSX = await import('xlsx');
  const wb = XLSX.read(read.bytes, { type: 'array', cellHTML: false });
  if (wb.SheetNames.length > MAX_PREVIEW_SHEETS) {
    throw new Error('Office workbook exceeds preview capacity');
  }
  let totalCells = 0;
  let mergeChecks = 0;
  for (const name of wb.SheetNames) {
    const ref = wb.Sheets[name]['!ref'];
    if (!ref) continue;
    const range = XLSX.utils.decode_range(ref);
    const rows = range.e.r - range.s.r + 1;
    const columns = range.e.c - range.s.c + 1;
    totalCells += rows * columns;
    mergeChecks += rows * columns * Math.max(1, wb.Sheets[name]['!merges']?.length ?? 0);
    if (rows < 1 || columns < 1 || !Number.isSafeInteger(totalCells) || totalCells > MAX_PREVIEW_CELLS) {
      throw new Error('Office worksheet exceeds preview capacity');
    }
    if (!Number.isSafeInteger(mergeChecks) || mergeChecks > MAX_PREVIEW_MERGE_CHECKS) {
      throw new Error('Office worksheet merge complexity exceeds preview capacity');
    }
  }
  return {
    kind,
    sheets: wb.SheetNames.map((name) => ({
      name,
      html: sanitizeOfficeHtml(XLSX.utils.sheet_to_html(wb.Sheets[name], { header: '', footer: '' })),
    })),
    size: read.size,
  };
}
