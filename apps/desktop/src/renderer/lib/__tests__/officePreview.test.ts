import { afterEach, describe, expect, it, vi } from "vitest";
import JSZip from "jszip";
import * as XLSX from "xlsx";

import {
  OFFICE_PREVIEW_LIMIT,
  isOfficePreviewSupported,
  officePreviewKind,
  parseOfficeDocument,
} from '../officePreview';
import { shouldOpenTextLightbox } from '../filePreview';

type ReadBytesStub = (params: { filePath: string; maxSize?: number }) => Promise<{ bytes: Uint8Array; size: number }>;

function stubReadFileBytes(stub: ReadBytesStub): void {
  vi.stubGlobal('window', { electronAPI: { readFileBytes: stub } });
}

/** 最小可用 docx(ZIP 包:content types + rels + styles + document)。 */
/** 文本入参按 XML 语义写(&lt; 已转义),mammoth 解出后应保持 HTML 转义。 */
async function buildDocx(xmlEscapedText: string): Promise<Uint8Array> {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
      '</Types>',
  );
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>',
  );
  zip.file(
    'word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
  );
  zip.file(
    'word/styles.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>',
  );
  zip.file(
    'word/document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      "<w:body><w:p><w:r><w:t>" + xmlEscapedText + "</w:t></w:r></w:p></w:body>" +
      '</w:document>',
  );
  const arrayBuffer = await zip.generateAsync({ type: "arraybuffer" });
  return new Uint8Array(arrayBuffer);
}

function buildXlsx(): Uint8Array {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['名称', '数量'], ['扳手', 3]]), '汇总');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['<b>bold</b>']]), 'Esc');
  const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return out instanceof Uint8Array ? out : new Uint8Array(out as ArrayBuffer);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('officePreviewKind / isOfficePreviewSupported', () => {
  it("routes by extension, case-insensitive, across path separators", () => {
    expect(officePreviewKind('/tmp/report.docx')).toBe('word');
    expect(officePreviewKind('C:\\docs\\表.DOCX')).toBe('word');
    expect(officePreviewKind('/tmp/data.xlsx')).toBe('sheet');
    expect(officePreviewKind('/tmp/old.xls')).toBe('sheet');
    expect(isOfficePreviewSupported('/tmp/report.docx')).toBe(true);
    expect(isOfficePreviewSupported('/tmp/legacy.doc')).toBe(false);
    expect(isOfficePreviewSupported('/tmp/deck.pptx')).toBe(false);
    expect(isOfficePreviewSupported('/tmp/notes.txt')).toBe(false);
    expect(isOfficePreviewSupported('/tmp/noext')).toBe(false);
    expect(isOfficePreviewSupported('/tmp/.docx')).toBe(false);
  });
});

describe('parseOfficeDocument', () => {
  it("rejects unsupported office extensions", async () => {
    await expect(parseOfficeDocument('/tmp/deck.pptx')).rejects.toThrow('unsupported office file');
  });

  it("passes the preview size cap to readFileBytes", async () => {
    const seen: Array<number | undefined> = [];
    const bytes = buildXlsx();
    stubReadFileBytes(async (params) => {
      seen.push(params.maxSize);
      return { bytes, size: bytes.byteLength };
    });
    await parseOfficeDocument('/tmp/a.xlsx');
    expect(seen[0]).toBe(OFFICE_PREVIEW_LIMIT);
  });

  it("parses xlsx into named sheet tables and escapes cell text", async () => {
    const bytes = buildXlsx();
    stubReadFileBytes(async () => ({ bytes, size: bytes.byteLength }));
    const doc = await parseOfficeDocument('/tmp/inventory.xlsx');
    expect(doc.kind).toBe('sheet');
    if (doc.kind !== 'sheet') return;
    expect(doc.sheets.map((s) => s.name)).toEqual(['汇总', 'Esc']);
    expect(doc.sheets[0].html).toContain("扳手");
    expect(doc.sheets[1].html).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(doc.sheets[1].html).not.toContain('<b>bold</b>');
  });

  it("parses docx via mammoth and keeps text escaped", async () => {
    const bytes = await buildDocx("Hello &lt;b&gt;Office&lt;/b&gt;");
    stubReadFileBytes(async () => ({ bytes, size: bytes.byteLength }));
    const doc = await parseOfficeDocument('/tmp/报告.docx');
    expect(doc.kind).toBe('word');
    if (doc.kind !== 'word') return;
    expect(doc.html).toContain('Hello');
    expect(doc.html).toContain('&lt;b&gt;Office&lt;/b&gt;');
    expect(doc.html).not.toContain('<b>Office</b>');
  });
});

describe('shouldOpenTextLightbox gate', () => {
  it("routes office docs to TextLightbox without external open", async () => {
    const openPath = vi.fn(async () => ({ success: true }));
    vi.stubGlobal('window', { electronAPI: { openPath } });
    await expect(shouldOpenTextLightbox('/tmp/report.docx')).resolves.toBe(true);
    expect(openPath).not.toHaveBeenCalled();
  });
});
