import { describe, expect, it } from 'vitest';

import { clampSpeechText, speechTextFromMarkdown, SPEECH_TEXT_MAX_CHARS } from '../speechText';

describe('speechTextFromMarkdown', () => {
  it('保留纯文本', () => {
    expect(speechTextFromMarkdown('你好，世界')).toBe('你好，世界');
  });

  it('剥离围栏代码块', () => {
    const text = speechTextFromMarkdown('结论如下\n```bash\nrm -rf /\necho done\n```\n完成');
    expect(text).toBe('结论如下 完成');
    expect(text).not.toContain('rm -rf');
  });

  it('剥离行内代码标记但保留内容', () => {
    expect(speechTextFromMarkdown('运行 `pnpm test` 即可')).toBe('运行 pnpm test 即可');
  });

  it('链接保留文字、图片与裸 URL 移除', () => {
    const text = speechTextFromMarkdown(
      '看[文档](https://example.com/a)和![图](https://x/y.png)以及 https://raw.example/path',
    );
    expect(text).toContain('文档');
    expect(text).not.toContain('https://');
    expect(text).not.toContain('图');
  });

  it('剥离标题、列表、引用与表格符号', () => {
    const text = speechTextFromMarkdown('## 标题\n- 第一项\n> 引言\n| a | b |\n|---|---|\n| 1 | 2 |');
    expect(text).toContain('标题');
    expect(text).toContain('第一项');
    expect(text).toContain('引言');
    expect(text).toContain('1 2');
    expect(text).not.toContain('#');
    expect(text).not.toContain('|');
  });

  it('剥离加粗与删除线标记', () => {
    expect(speechTextFromMarkdown('**重点**和~~旧方案~~')).toBe('重点和旧方案');
  });

  it('纯代码内容产出空串（调用方跳过朗读）', () => {
    expect(speechTextFromMarkdown('```\nconst a = 1;\n```')).toBe('');
  });

  it('移除 emoji', () => {
    expect(speechTextFromMarkdown('完成 ✅ 请查看 🎉')).toBe('完成 请查看');
  });
});

describe('clampSpeechText', () => {
  it('短文本原样返回', () => {
    expect(clampSpeechText('短')).toBe('短');
  });

  it('超长文本截断并加省略号', () => {
    const out = clampSpeechText('啊'.repeat(SPEECH_TEXT_MAX_CHARS + 100));
    expect(out.length).toBeLessThanOrEqual(SPEECH_TEXT_MAX_CHARS + 1);
    expect(out.endsWith('…')).toBe(true);
  });
});
