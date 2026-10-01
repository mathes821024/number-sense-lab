import { useEffect, useRef, useState } from "react";

/** 「敬请期待」 toast state: shown ~1.8s like h5/app.js showSoon; changes nothing else. */
export default function useNotice() {
  const [text, setText] = useState("");
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (name) => {
    setText(name ? `${name} · 敬请期待` : "敬请期待");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setText(""), 1800);
  };
  return [text, show];
}
