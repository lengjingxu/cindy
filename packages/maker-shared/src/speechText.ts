/**
 * 语音朗读（伙伴说话）共享逻辑 —— desktop 与 mobile 同源。
 *
 * 伙伴回复是 markdown（代码块、链接、表格、标题符号密集），直接交给 TTS
 * 会读出一堆符号噪音。这里的口径是「读人话」：结构符号剥掉，信息本体保留；
 * 整段全是代码/表格时结果为空串，调用方据此跳过朗读。
 *
 * 零平台依赖：不碰 DOM / RN 原语，两端各自负责实际发音（desktop speechSynthesis
 * + 云端合成，mobile expo-speech）。
 */

export function speechTextFromMarkdown(markdown: string): string {
  if (!markdown) return '';
  let text = markdown;

  // 1. 围栏代码块整体移除（朗读代码没有意义）。
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/~~~[\s\S]*?~~~/g, ' ');

  // 2. 图片 → 移除；链接 → 保留文字。
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // autolink <https://…> 与裸 URL：URL 本身不读。
  text = text.replace(/<https?:\/\/[^>]+>/g, ' ');
  text = text.replace(/https?:\/\/\S+/g, ' ');

  // 3. 行内代码保留内容、去掉反引号。
  text = text.replace(/`([^`]+)`/g, '$1');

  // 4. 标题 / 引用 / 列表 / 分隔线等行首结构符号。
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/^>\s?/gm, '');
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+[.)]\s+/gm, '');
  text = text.replace(/^\s*(?:[-*_]\s*){3,}$/gm, ' ');
  // 表格分隔行与管道符。
  text = text.replace(/^\s*\|?[-:| ]+\|[-:| ]*$/gm, ' ');
  text = text.replace(/\|/g, ' ');

  // 5. 加粗/斜体标记。
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/(^|\W)\*([^*\s][^*]*)\*/g, '$1$2');
  text = text.replace(/(^|\W)_([^_\s][^_]*)_/g, '$1$2');
  text = text.replace(/~~([^~]+)~~/g, '$1');

  // 6. HTML 残留标签。
  text = text.replace(/<[^>]+>/g, ' ');

  // 7. emoji 与杂符号（朗读时多数读不出或读成怪名）——保留中文/字母数字/常用标点。
  text = text.replace(
    /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu,
    ' ',
  );

  return text
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** 朗读长度上限（字符）。超过截断——语音模式要的是「听到结论」，不是朗读全文档。 */
export const SPEECH_TEXT_MAX_CHARS = 1200;

export function clampSpeechText(text: string): string {
  if (text.length <= SPEECH_TEXT_MAX_CHARS) return text;
  return `${text.slice(0, SPEECH_TEXT_MAX_CHARS).trimEnd()}…`;
}
