# PT0 Prototype

This is a PT0 human validation prototype.

It is not production code.

It is not the Mini Program implementation.

It does not define architecture.

Sample questions are prototype-only.

Product / UX / UI docs remain the contract source.

## 怎么打开

在仓库根目录执行：

```bash
python3 -m http.server 8765
```

然后打开 `http://127.0.0.1:8765/prototype/`。

只为了本地体验。页面没有后端，也不需要登录。

也可以直接打开 `prototype/index.html`。如果浏览器拦住了脚本，就用上面的本地服务器。

## 体验时可以换的原型参数

这些参数只给复核用，不是正式界面。

- `?correctDelay=400`、`550` 或 `700`：答对后停留多久
- `?wrongShow=A`：不显示刚才写的答案
- `?wrongShow=B`：弱化显示「你刚才写：…」
- `?revisit=A`：错题再出现时和普通题一样
- `?revisit=B`：错题再出现时写「再试一次」
- `?home=first`、`done` 或 `paused`：首页三种状态
- `?printEmpty=1`：现在没有需要印的题
- `?fresh=1`：进度页显示还没有练习

关闭页面后，练习记录可以留在这台设备的本地存储里。这是 Prototype-only implementation，不是最终架构决定。
