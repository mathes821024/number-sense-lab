/**
 * The four bottom entries on ordinary pages (h5/app.js renderNav / navTab):
 * 首页, 练习 (专项练习) and 错题本 are pages; 我的 is not migrated yet and
 * answers 敬请期待, as Home's placeholders do.
 */
import { navigate, safeArea } from "../platform/current";

/**
 * Padding of an ordinary page with the bottom nav: the nav is fixed and grows
 * by the bottom safe-area inset (calc(6px + inset) in BottomNav), so the page
 * reserves the same inset — otherwise the last ~inset px of a long page (34px
 * on an iPhone 12 in the Mini Program) stay under the nav at full scroll.
 */
export function navPageStyle() {
  return { paddingTop: `calc(16px + ${safeArea.top})`, paddingBottom: `calc(92px + ${safeArea.bottom})` };
}

export const TAB_PAGES = Object.freeze({ home: "home", explore: "explore", mistakes: "mistakes" });

/** onTap for BottomNav on a page whose own tab is `active` ("" when none is). */
export function tabHandler(active, showSoon) {
  return (id, label) => {
    if (id === active) return;
    if (TAB_PAGES[id]) navigate.toTab(TAB_PAGES[id]);
    else showSoon(label);
  };
}
