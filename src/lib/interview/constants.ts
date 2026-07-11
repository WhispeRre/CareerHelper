/** Messages that should be hidden from the chat UI */
export const HIDDEN_MESSAGES = new Set([
  '你好，我准备好了，请开始面试。',
]);

/** The trigger message sent to start a round */
export const INIT_TRIGGER = '你好，我准备好了，请开始面试。';

/** Messages triggered by control actions — shown with special tags */
export const HINT_MESSAGE = '这个问题我不太确定方向，能给我一些思路上的引导吗？';
export const SKIP_MESSAGE = '这个问题我暂时没有太好的思路，能换一个问题吗？';
