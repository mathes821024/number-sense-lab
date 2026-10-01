/** Home copy by mode, the same three modes as main's h5/app.js renderHome. */
import { isoDay } from "../train/flow.js";

export function homeMode(state, today = isoDay()) {
  if (state.activeSession && state.activeSession.answered > 0) return "paused";
  const last = state.lastResult;
  if (last && last.day === today && last.completed) return "done";
  return "default";
}

export function homeView(state, today = isoDay()) {
  const mode = homeMode(state, today);
  if (mode === "paused") {
    return { mode, title: "还有一小段", lede: "刚才做到一半。已经做的会留下。", cta: "继续刚才的练习", sub: "", action: "resume", secondary: { label: "重新开始一小段", action: "restart" } };
  }
  if (mode === "done") {
    return { mode, title: "今天这段练完了", lede: "可以停在这里，也可以再看一眼结果。", cta: "再练一小段", sub: "大约 5～10 分钟", action: "start", secondary: null };
  }
  return { mode, title: "把关系练成直觉。", lede: "把常会用到的数字关系，练到能直接想起来。", cta: "开始今天的练习", sub: "大约 5～10 分钟", action: "start", secondary: null };
}

export const DEVICE_NOTE = "练习记录只保存在当前设备，不会自动同步到其他设备。";
