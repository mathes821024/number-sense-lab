import { useState } from "react";
import { View, Text } from "@tarojs/components";
import { loadCoreCatalog } from "../../../src/core/content.js";
import { getActiveLearner } from "../../../src/core/store.js";
import { getStore, navigate, safeArea, motionClass, useScreenLifecycle } from "../../platform/current";
import BottomNav from "../../components/BottomNav";
import Notice from "../../components/Notice";
import Icon from "../../components/icon/Icon";
import DomainTile from "../../components/DomainTile";
import BackButton from "../../components/BackButton";
import SoonButton from "../../components/SoonButton";
import useNotice from "../../components/useNotice";
import { getRecord } from "../record.js";
import { tabHandler } from "../tabs.js";
import { exploreView, focusView, SOON_DIRECTIONS, SOON_EXTRAS } from "../models.js";

const catalog = loadCoreCatalog();

/**
 * 专项练习 (h5/app.js renderExplore + renderFocusConfirm): one card per
 * released domain in DOMAIN_ORDER. A card opens its confirmation; 开始这一小段
 * starts a focused set from that one domain only (core startSession, mode
 * "focused"). The remaining directions answer 敬请期待.
 */
export default function Explore() {
  const record = getRecord(getStore);
  const [state, setState] = useState(() => getActiveLearner(record.read()));
  const [focused, setFocused] = useState(null);
  const [notice, showSoon] = useNotice();
  useScreenLifecycle({ onShow: () => setState(getActiveLearner(record.read())) });

  const focus = focused ? focusView(focused, state, catalog) : null;
  let body;
  if (focus) {
    body = (
      <View className="screen" data-testid="focus-confirm" data-domain={focus.domain}>
        <BackButton label="返回练习" action="explore" onTap={() => setFocused(null)} />
        <View className="card focus-card">
          <DomainTile domain={focus.domain} slot={focus.slot} glyph={focus.glyph} />
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
      <View className="screen" data-testid="explore">
        <Text className="title">探索数学世界</Text>
        <Text className="lede">从一个主题开始，走更远的路</Text>
        <View className="segmented" role="group" aria-label="练习方式">
          <View className="seg is-on" aria-pressed="true">
            <Text>主题训练</Text>
          </View>
          <View className="seg" role="button" aria-pressed="false" data-action="soon" data-soon="知识地图" onClick={() => showSoon("知识地图")}>
            <Text>知识地图</Text>
          </View>
        </View>
        <View className="domains">
          {exploreView(state, catalog).map((d) => (
            <View className="domain" hoverClass="domain-pressed" role="button" key={d.domain} data-action="focus" data-domain={d.domain} onClick={() => setFocused(d.domain)}>
              <DomainTile domain={d.domain} slot={d.slot} glyph={d.glyph} />
              <View className="domain-copy">
                <Text className="domain-name">{d.label}</Text>
                <Text className="domain-sub">{d.summary}</Text>
              </View>
              <Icon name="caret-right" className="chev" />
            </View>
          ))}
        </View>
        <Text className="section-label">更多方向</Text>
        <View className="soon">
          {SOON_DIRECTIONS.map((s) => (
            <SoonButton key={s.name} name={s.name} icon={s.icon} onTap={showSoon} />
          ))}
        </View>
        <View className="soon-row">
          {SOON_EXTRAS.map((s) => (
            <SoonButton key={s.name} name={s.name} icon={s.icon} chip onTap={showSoon} />
          ))}
        </View>
      </View>
    );
  }

  const onTab = tabHandler("explore", showSoon);
  return (
    <View className={`page has-nav ${motionClass}`} style={{ paddingTop: `calc(16px + ${safeArea.top})` }}>
      <View className="stage">{body}</View>
      <Notice text={notice} />
      <BottomNav active="explore" bottomInset={safeArea.bottom} onTap={(id, label) => (id === "explore" ? setFocused(null) : onTab(id, label))} />
    </View>
  );
}
