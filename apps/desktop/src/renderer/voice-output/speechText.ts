/**
 * 语音朗读文本剥离 —— 实现在 @cindy/maker-shared（desktop + mobile 同源），
 * 这里只做 re-export，保持 renderer 内既有 import 路径稳定。
 */

export {
  clampSpeechText,
  speechTextFromMarkdown,
  SPEECH_TEXT_MAX_CHARS,
} from '@cindy/maker-shared/speech-text';
