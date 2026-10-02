/**
 * WeChat Mini Program platform implementation. Everything wx-specific for
 * the shared pages lives here (docs/architecture/02 §平台实现只放一处).
 */
import { useRef } from "react";
import Taro, { useDidHide, useDidShow, useUnload, useRouter } from "@tarojs/taro";
import { createWechatStore } from "./wx-store.js";
import { createToneCue } from "../tones.js";

export { themeAssets } from "./theme-assets.js";

export const platformName = "weapp";

let store = null;
/** Storage: wx.*StorageSync behind the shared contract. */
export function getStore() {
  if (!store) store = createWechatStore(wx);
  return store;
}

/** Audio: WebAudioContext (base library 2.19+). Missing → silent. */
export function createCue(isEnabled) {
  let ctx = null;
  return createToneCue(() => {
    if (typeof wx.createWebAudioContext !== "function") return null;
    if (!ctx) ctx = wx.createWebAudioContext();
    return ctx;
  }, isEnabled);
}

/** Answer timing clock. The app service has Date.now; that is enough for elapsedMs. */
export function monotonicNow() {
  return Date.now();
}

/** Lifecycle: onShow / onHide / onUnload of the page (also fired when the app goes to the background). */
export function useScreenLifecycle({ onShow, onHide, onUnload }) {
  const latest = useRef({ onShow, onHide, onUnload });
  latest.current = { onShow, onHide, onUnload };
  useDidShow(() => latest.current.onShow?.());
  useDidHide(() => latest.current.onHide?.());
  useUnload(() => latest.current.onUnload?.());
}

/** No physical keyboard in the Mini Program (tier C): the keypad is the complete input. */
export function useHardwareKeys() {}

function windowInfo() {
  try {
    return typeof wx.getWindowInfo === "function" ? wx.getWindowInfo() : wx.getSystemInfoSync();
  } catch {
    return null;
  }
}

/** Safe area: insets from the window info, in px. */
export const safeArea = (() => {
  const info = windowInfo();
  const bottom = info && info.safeArea ? Math.max(0, info.screenHeight - info.safeArea.bottom) : 0;
  return { top: "0px", bottom: `${bottom}px` };
})();

/**
 * Reduced motion: no reliable system signal is verified for the Mini Program
 * (capability matrix 「待核」), so it uses the stated fallback — low motion,
 * things simply appear.
 */
export const motionClass = "motion-low";

function query(params = {}) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

/**
 * Page switching. Ordinary pages reached from the bottom entries (首页 / 练习 /
 * 错题本) replace the page stack (reLaunch), so the stack stays short; other
 * pages (training, progress, print) are pushed and can go back.
 */
export const navigate = {
  toTraining(intent = "start-daily", params = {}) {
    Taro.navigateTo({ url: `/pages/train/index${query({ intent, ...params })}` });
  },
  toHome() {
    Taro.reLaunch({ url: "/pages/home/index" });
  },
  toTab(name) {
    Taro.reLaunch({ url: `/pages/${name}/index` });
  },
  toPage(name, params = {}) {
    Taro.navigateTo({ url: `/pages/${name}/index${query(params)}` });
  },
  /** Back one page; when nothing is underneath (opened directly), go to the named page instead. */
  back(fallback = "home") {
    if (Taro.getCurrentPages().length > 1) Taro.navigateBack({ delta: 1 });
    else Taro.reLaunch({ url: `/pages/${fallback}/index` });
  },
};

export function useRouteParams() {
  return useRouter().params || {};
}

/**
 * Paper: a Mini Program has no print API, so the A4 page is a preview only;
 * the shared page shows a short note instead of the print button.
 */
export const printing = {
  available: false,
  print() {},
};
