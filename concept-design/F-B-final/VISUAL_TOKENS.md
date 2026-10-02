# VISUAL_TOKENS — 专项训练页（F-B）新增视觉变量

只记录本页新增或确认的变量，不重新定义整个 Design System。
基准单位 px，按 390 宽逻辑屏给出。

## 分组容器 Group

| token | value | 说明 |
|---|---|---|
| specialist.group.radius | 20 | 分组容器圆角 |
| specialist.group.padding | 16 | 容器内边距 |
| specialist.group.gap | 20 | 相邻分组间距 |
| specialist.group.bg.powers | #EAF2FB | 幂与乘方：极浅蓝 |
| specialist.group.bg.products | #FDF3E7 | 乘法与凑整：极浅暖橙 |
| specialist.group.bg.numbers | #E9F6F0 | 数与分数：极浅薄荷绿 |
| specialist.group.accent.powers | #4A8FD9 | 组色点 / 图标色系 |
| specialist.group.accent.products | #F2994A | 同上 |
| specialist.group.accent.numbers | #2FA37C | 同上 |
| specialist.group.title.size | 16 | 组中文名（bold，深墨蓝） |
| specialist.group.entitle.size | 11 | 组英文小标（caps，灰） |
| specialist.group.dot.size | 8 | 组名前色点直径 |

## 主题 Tile

| token | value | 说明 |
|---|---|---|
| specialist.tile.radius | 16 | tile 圆角 |
| specialist.tile.bg | #FFFFFF | tile 底色（白，置于组浅底色上） |
| specialist.tile.shadow | 0 2px 8px rgba(31,58,86,0.06) | 极轻投影 |
| specialist.tile.height | 76 | tile 高度 |
| specialist.tile.gap | 12 | tile 间距（行列同） |
| specialist.tile.columns | 2 | 双列 |
| specialist.icon.size | 56 | 图标显示尺寸（chip 内） |
| specialist.icon.chip.size | 64 | 图标浅色容器边长 |
| specialist.icon.chip.radius | 14 | 容器圆角 |
| specialist.icon.chip.bg.alpha | 0.10 | 组色 10% 透明度底 |
| specialist.title.size | 15 | domain 名称（semibold） |
| specialist.status.size | 12 | 状态文字（弱灰 #8A94A6，无 Badge、无交通灯色） |

## 页头 Header

| token | value | 说明 |
|---|---|---|
| specialist.header.kicker.size | 11 | EXPLORE MATH（caps，灰） |
| specialist.header.title.size | 28 | 探索数学世界（bold） |
| specialist.header.subtitle.size | 13 | 副标题（灰） |
| specialist.header.mascot.height | 80 | 吉祥物高度上限，不抢标题 |
| specialist.header.hint.size | 13 | 「今天想练哪个？」普通小字，无气泡 |
| specialist.tabs.height | 36 | 分段控件高度；选中态青绿 #2FA37C 填充 |

## 色彩边界

- 品牌主色 teal #2FA37C 仅用于：主 CTA、选中 Tab、全局强调。
- 组色仅用于：组底色、组色点、该组图标色系、icon chip 底。禁止跨组混用，避免彩虹化。
