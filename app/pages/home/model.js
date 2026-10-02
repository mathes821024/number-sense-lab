/**
 * Home copy by mode — the same three modes, words and actions as main's
 * h5/app.js homeMode() / renderHome(). Pure: takes the active learner record.
 */
import { MISTAKE_BOOK_SOURCE } from "../../../src/core/schedule.js";
import { localDay } from "../../../src/adapter/storage-contract.js";

export function homeMode(state, today = localDay()) {
  if (state.activeSession && state.activeSession.answered > 0) return "paused";
  // A voluntary Mistake Book session does not count as today's practice.
  const sessions = state.sessions || [];
  const last =
    [...sessions].reverse().find((s) => s.mode !== MISTAKE_BOOK_SOURCE) ||
    (state.lastResult && state.lastResult.mode !== MISTAKE_BOOK_SOURCE ? state.lastResult : null);
  if (last && last.day === today && last.completed) return "done";
  return "default";
}

/**
 * @returns {{ mode: string, title: string, lede: string,
 *   cta: { label: string, sub: string, action: string },
 *   secondary: null | { label: string, action: string } }}
 */
export function homeView(state, today = localDay()) {
  const mode = homeMode(state, today);
  if (mode === "paused") {
    return {
      mode,
      title: "还有一小段",
      lede: "刚才练到一半，继续就好。",
      cta: { label: "继续刚才的练习", sub: "", action: "resume" },
      // One clear action on the resume hero; 重新开始一小段 lives on the pause screen (先停一下).
      secondary: null,
    };
  }
  if (mode === "done") {
    return {
      mode,
      title: "今天这段练完了",
      lede: "可以停在这里，也可以再看一眼结果。",
      cta: { label: "看看这次", sub: "", action: "see-last" },
      secondary: { label: "再练一小段", action: "start-daily" },
    };
  }
  return {
    mode,
    title: "和数字做朋友",
    lede: "把常会用到的数字关系，练到能直接想起来。",
    cta: { label: "开始今天的练习", sub: "大约 5～10 分钟", action: "start-daily" },
    secondary: null,
  };
}

/** The other three Home cards (03_ui_spec §5 v0.3): 专项练习, 错题本 and 最近练得怎么样. */
export const HOME_ENTRIES = [
  { id: "explore", tone: "explore", icon: "target", label: "专项练习", sub: "按你需要的主题练习" },
  { id: "mistakes", tone: "mistakes", icon: "book-open-text", label: "错题本", sub: "把容易出错的题再练一练" },
  { id: "progress", tone: "progress", icon: "chart-bar", label: "最近练得怎么样", sub: "看看自己的进步" },
];

export const DEVICE_NOTE = "练习记录只保存在当前设备，不会自动同步到其他设备。";
