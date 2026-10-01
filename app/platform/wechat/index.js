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

/** Page switching: go to training, back home. */
export const navigate = {
  toTraining(intent = "start-daily") {
    Taro.navigateTo({ url: `/pages/train/index?intent=${intent}` });
  },
  toHome() {
    Taro.reLaunch({ url: "/pages/home/index" });
  },
};

export function useRouteParams() {
  return useRouter().params || {};
}
