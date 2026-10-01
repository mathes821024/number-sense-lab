/**
 * H5 platform implementation. Everything browser-specific for the shared
 * pages lives here (docs/architecture/02 §平台实现只放一处): storage, audio,
 * lifecycle, safe area, page switching, the physical keyboard (tier C) and
 * which theme files this client loads.
 */
import { useEffect, useRef } from "react";
import Taro, { useDidHide, useDidShow, useUnload, useRouter } from "@tarojs/taro";
import { createBrowserStore } from "./browser-store.js";
import { createToneCue } from "../tones.js";
import "./page-shell.css";

export { themeAssets } from "./theme-assets.js";

export const platformName = "h5";

let store = null;
/** Storage: localStorage behind the shared contract (one store per page load, like h5/app.js). */
export function getStore() {
  if (!store) store = createBrowserStore(globalThis.localStorage);
  return store;
}

/** Audio: Web Audio, created on first use (after a tap). Same notes as h5/sound.js. */
export function createCue(isEnabled) {
  let ctx = null;
  return createToneCue(() => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!ctx) ctx = new Ctx();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }, isEnabled);
}

/** Monotonic clock for answer timing (h5/app.js uses performance.now). */
export function monotonicNow() {
  return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
}

/**
 * Lifecycle: page show / hide / unload. Taro's page hooks cover route
 * changes; the tab going to the background is the page-visibility event.
 */
export function useScreenLifecycle({ onShow, onHide, onUnload }) {
  const latest = useRef({ onShow, onHide, onUnload });
  latest.current = { onShow, onHide, onUnload };
  useDidShow(() => latest.current.onShow?.());
  useDidHide(() => latest.current.onHide?.());
  useUnload(() => latest.current.onUnload?.());
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") latest.current.onHide?.();
      else latest.current.onShow?.();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
}

/**
 * Physical keyboard (capability tier C, H5 only), the keys h5/app.js reads:
 * digits, 「.」, 「/」, Backspace, Enter. Training never depends on it.
 */
export function useHardwareKeys(onKey) {
  const latest = useRef(onKey);
  latest.current = onKey;
  useEffect(() => {
    const handler = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      let key = null;
      if (/^\d$/.test(event.key)) key = event.key;
      else if (event.key === "." || event.key === "Decimal") key = ".";
      else if (event.key === "/" || event.key === "Divide") key = "/";
      else if (event.key === "Backspace") key = "backspace";
      else if (event.key === "Enter") key = "enter";
      if (!key) return;
      if (latest.current(key) !== false) event.preventDefault();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
}

/** Safe area: the browser reports it through CSS env(); components only leave room. */
export const safeArea = {
  top: "env(safe-area-inset-top)",
  bottom: "env(safe-area-inset-bottom)",
};

/** Reduced motion: H5 reads prefers-reduced-motion in CSS, so no extra class. */
export const motionClass = "";

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
