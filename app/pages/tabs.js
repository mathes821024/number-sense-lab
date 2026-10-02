/**
 * The four bottom entries on ordinary pages (h5/app.js renderNav / navTab):
 * 首页, 练习 (专项练习) and 错题本 are pages; 我的 is not migrated yet and
 * answers 敬请期待, as Home's placeholders do.
 */
import { navigate } from "../platform/current";

export const TAB_PAGES = Object.freeze({ home: "home", explore: "explore", mistakes: "mistakes" });

/** onTap for BottomNav on a page whose own tab is `active` ("" when none is). */
export function tabHandler(active, showSoon) {
  return (id, label) => {
    if (id === active) return;
    if (TAB_PAGES[id]) navigate.toTab(TAB_PAGES[id]);
    else showSoon(label);
  };
}
