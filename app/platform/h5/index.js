/**
 * H5 platform implementation. Everything browser-specific for the shared
 * pages lives here (docs/architecture/02 §平台实现只放一处).
 */
import { useEffect, useRef } from "react";
import Taro, { useDidHide, useDidShow, useUnload, useRouter } from "@tarojs/taro";
import { createBrowserStore } from "./browser-store.js";
import { createToneCue } from "../tones.js";

export const platformName = "h5";

let store = null;
/** Storage: localStorage behind the shared contract (one store per page load). */
export function getStore() {
  if (!store) store = createBrowserStore(globalThis.localStorage);
  return store;
}

/** Audio: Web Audio, created on first use (after a tap). */
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
 * Physical keyboard (capability tier C, H5 only). Digits, ".", Backspace,
 * Enter. Training never depends on it; the on-screen keypad is complete.
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
      else if (event.key === "Backspace") key = "backspace";
      else if (event.key === "Enter") key = "enter";
      if (!key) return;
      if (latest.current(key) !== false) event.preventDefault();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
}

/** Safe area: the browser reports it through CSS env(). */
export function safeAreaStyle() {
  return { paddingBottom: "env(safe-area-inset-bottom)" };
}

/** Page switching: go to training, back home. */
export const navigate = {
  toTraining(intent = "start") {
    Taro.navigateTo({ url: `/pages/train/index?intent=${intent}` });
  },
  toHome() {
    Taro.reLaunch({ url: "/pages/home/index" });
  },
};

export function useRouteParams() {
  return useRouter().params || {};
}
