import { useState } from "react";
import { View, Text, Image } from "@tarojs/components";
import { loadCoreCatalog } from "../../../src/core/content.js";
import { getActiveLearner } from "../../../src/core/store.js";
import { getStore, navigate, safeArea, motionClass, useScreenLifecycle } from "../../platform/current";
import BottomNav from "../../components/BottomNav";
import Notice from "../../components/Notice";
import DomainTile from "../../components/DomainTile";
import BackButton from "../../components/BackButton";
import useNotice from "../../components/useNotice";
import { getRecord } from "../record.js";
import { tabHandler, navPageStyle } from "../tabs.js";
import { exploreView, focusView } from "../models.js";
import { isLongLabel } from "../../../src/core/practice-groups.js";
import { assetFor } from "../../theme/index.js";

const catalog = loadCoreCatalog();

/**
 * 专项练习 (h5/app.js renderExplore + renderFocusConfirm), 主题训练 as the
 * grouped two-column grid (docs/ux/05_specialist_grouped_grid.md) drawn as F-B,
 * the warm branded learning panel (docs/ui/08_fb_specialist_visual.md): a header
 * with the existing welcome mascot at one side, then three navigation groups,
 * each a light colour zone with two-column white tiles (F-B icon, name, one weak
 * status line). The whole tile is the button; a released card opens its confirmation, and
 * 开始这一小段 starts a focused set from that one domain only (core
 * startSession, mode "focused"). A card without released content only answers
 * 敬请期待. 知识地图 is the other entry and, this round, only says 敬请期待;
 * 概念 / 例题 / 动画 / 规律探索 belong to it and are not cards here.
 */
export default function Explore() {
  const record = getRecord(getStore);
  const [state, setState] = useState(() => getActiveLearner(record.read()));
  const [focused, setFocused] = useState(null);
  const [notice, showSoon] = useNotice();
  useScreenLifecycle({ onShow: () => setState(getActiveLearner(record.read())) });

  const focus = focused ? focusView(focused, state, catalog) : null;
  const mascotSrc = assetFor("specialist.mascot");
  const [mascotOk, setMascotOk] = useState(true);
  let body;
  if (focus) {
    body = (
      <View className="screen" data-testid="focus-confirm" data-domain={focus.domain}>
        <BackButton label="返回练习" action="explore" onTap={() => setFocused(null)} />
        <View className="card focus-card">
          <DomainTile domain={focus.domain} slot={focus.slot} glyph={focus.glyph} tone={focus.tone} />
          <Text className="title">{focus.label}</Text>
          <Text className="lede">{focus.lede}</Text>
          <Text className="body focus-summary">{focus.summary}</Text>
        </View>
        <View
          className="cta"
          hoverClass="cta-pressed"
          role="button"
          data-action="start-focus"
          onClick={() => navigate.toTraining("start-focus", { domain: focus.domain })}
        >
          <Text>开始这一小段</Text>
        </View>
      </View>
    );
  } else {
    body = (
      <View className="screen screen-explore" data-testid="explore">
        <View className="fb-head">
          <View className="fb-head-text">
            <Text className="fb-kicker">EXPLORE MATH</Text>
            <Text className="title">探索数学世界</Text>
            <Text className="lede">从一个主题开始，走更远的路</Text>
          </View>
          {mascotSrc && mascotOk ? (
            <View className="fb-mascot" aria-hidden="true" data-slot="specialist.mascot">
              <View className="fb-spark fb-spark-1" />
              <View className="fb-spark fb-spark-2" />
              <Image className="fb-mascot-img" src={mascotSrc} mode="aspectFit" onError={() => setMascotOk(false)} />
            </View>
          ) : null}
        </View>
        <View className="segmented" role="group" aria-label="练习方式">
          <View className="seg is-on" aria-pressed="true">
            <Text>主题训练</Text>
          </View>
          <View className="seg" role="button" aria-pressed="false" data-action="soon" data-soon="知识地图" onClick={() => showSoon("知识地图")}>
            <Text>知识地图</Text>
          </View>
        </View>
        <Text className="fb-hint">今天想练哪个？</Text>
        <View className="practice-groups">
          {exploreView(state, catalog).map((g) => (
            <View className={`practice-group tone-${g.tone}`} key={g.id} data-group={g.id}>
              <View className="practice-group-head">
                <View className="practice-group-dot" aria-hidden="true" />
                <Text className="practice-group-title" role="heading" aria-level="2">
                  {g.label}
                </Text>
                <Text className="practice-group-en" aria-hidden="true">
                  {g.en}
                </Text>
              </View>
              <View className="practice-grid">
                {g.cards.map((c) => (
                  <View
                    className={`practice-card${c.released ? "" : " is-soon"}`}
                    hoverClass="practice-card-pressed"
                    role="button"
                    aria-label={c.aria}
                    key={c.domain}
                    data-action={c.released ? "focus" : "soon"}
                    data-domain={c.domain}
                    data-soon={c.released ? undefined : c.label}
                    onClick={() => (c.released ? setFocused(c.domain) : showSoon(c.label))}
                  >
                    <DomainTile domain={c.domain} slot={c.slot} glyph={c.glyph} tone={c.tone} />
                    <View className="practice-text">
                      <Text className={`practice-name${isLongLabel(c.label) ? " is-long" : ""}`}>{c.label}</Text>
                      <Text className="practice-status">{c.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const onTab = tabHandler("explore", showSoon);
  return (
    <View className={`page has-nav ${motionClass}`} style={navPageStyle()}>
      <View className="stage">{body}</View>
      <Notice text={notice} />
      <BottomNav active="explore" bottomInset={safeArea.bottom} onTap={(id, label) => (id === "explore" ? setFocused(null) : onTab(id, label))} />
    </View>
  );
}
