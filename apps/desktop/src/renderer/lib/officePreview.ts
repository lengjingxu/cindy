/**
 * officePreview — Word(.docx)/Excel(.xlsx/.xls) 内嵌预览解析层。
 * ---------------------------------------------------------------------------
 * 门禁(filePreview.ts 的 shouldOpenTextLightbox*)与渲染 shell(TextLightbox
 * 的 overlay/toolbar)不在这里;这里只负责「字节 → 可渲染数据」:
 *   - .docx       → mammoth 转 HTML。mammoth 只输出由文档结构派生的 HTML
 *     (文本/属性一律转义,无原文 HTML 直通),图片内联为 data:,CSP img-src 已放行。
 *   - .xlsx/.xls  → SheetJS 逐表 sheet_to_html(单元格文本转义)。
 *   - 旧版 .doc 是二进制 OLE 复合格式,无纯 JS 解析方案,不进内嵌集合。
 *
 * 两个解析库都按需动态 import(Vite 异步 chunk):不预览 office 文件就完全不
 * 加载这部分代码。字节经既有 readFileBytes IPC(路径策略 + 大小上限 + realpath
 * 防交换,见 main/fileReadBytes.ts),上限用 OFFICE_PREVIEW_LIMIT。
 */

export const OFFICE_PREVIEW_LIMIT_MB = 10;
export const OFFICE_PREVIEW_LIMIT = OFFICE_PREVIEW_LIMIT_MB * 1024 * 1024;

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

/** 读字节并解析成预览数据。超过上限或路径不可读时 reject。 */
export async function parseOfficeDocument(filePath: string): Promise<ParsedOfficeDocument> {
  const kind = officePreviewKind(filePath);
  if (!kind) throw new Error('unsupported office file: ' + filePath);
  const read = await window.electronAPI.readFileBytes({ filePath, maxSize: OFFICE_PREVIEW_LIMIT });
  if (kind === 'word') {
    const mammoth = (await import('mammoth')).default;
    // mammoth 双构建入口不同:浏览器构建只认 arrayBuffer(browser/unzip.js),
    // node 构建(vitest)只认 buffer(lib/unzip.js)。renderer 没有 Buffer 全局,
    // 生产恒走 arrayBuffer;slice 一步得到独立副本(as ArrayBuffer 收窄
    // TS 5.9 的 ArrayBuffer | SharedArrayBuffer 联合)。
    const { value } = await mammoth.convertToHtml(
      typeof Buffer === 'undefined'
        ? { arrayBuffer: read.bytes.slice().buffer as ArrayBuffer }
        : { buffer: Buffer.from(read.bytes) },
    );
    return { kind, html: value, size: read.size };
  }
  const XLSX = await import('xlsx');
  const wb = XLSX.read(read.bytes, { type: 'array' });
  return {
    kind,
    sheets: wb.SheetNames.map((name) => ({
      name,
      html: XLSX.utils.sheet_to_html(wb.Sheets[name], { header: '', footer: '' }),
    })),
    size: read.size,
  };
}
