# app/ — shared Taro 4 + React client (vertical slice)

One page set for H5 and the WeChat Mini Program. Scope of this slice: Home,
Training, Correct feedback, Wrong feedback. Architecture:
`docs/architecture/02_cross_platform_frontend_architecture.md`.

```text
app/pages/        home, train (Training + Correct + Wrong screens of one set)
app/components/   Button, Keypad, SetProgress, MathText (+ pure tokens), feedback, BottomNav
app/theme/        math-lab tokens (tokens.css) and semantic asset slots
app/platform/     the only platform code: h5/ and wechat/ (storage, audio,
                  lifecycle, keyboard, safe area, navigation); current.<env>.js picks one
```

`src/core/` is imported as is. `src/adapter/storage-contract.js` is the
storage contract; `app/platform/h5/browser-store.js` and
`app/platform/wechat/wx-store.js` implement it.

## Build

```bash
npm install
npm run build:h5      # → dist/h5 (static; open index.html through any static server)
npm run build:weapp   # → dist/weapp
npm test              # core + contract + leak check + slice logic
npm run smoke:weapp   # runs dist/weapp in Node under a mocked App/Page/wx host
                      # (not the WeChat runtime; DevTools is still the real check)
```

## Open in WeChat DevTools

1. `npm run build:weapp`
2. WeChat DevTools → 导入项目 → directory `dist/weapp` (or the repo root;
   `project.config.json` points at `dist/weapp/`).
3. AppID: `touristappid` (测试号) is enough for the simulator.
4. In the simulator: 首页 → 开始今天的练习 → answer one right (short pause,
   then 2 / 10) and one wrong (relation stays, press 下一题).
