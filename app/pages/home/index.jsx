import { useState } from "react";
import { View, Text } from "@tarojs/components";
import { getActiveLearner } from "../../../src/core/store.js";
import { getStore, navigate, safeArea, motionClass, useScreenLifecycle } from "../../platform/current";
import ThemeImage, { Mascot } from "../../components/ThemeImage";
import HomeDecor from "../../components/HomeDecor";
import BottomNav from "../../components/BottomNav";
import Icon from "../../components/icon/Icon";
import { homeView, HOME_ENTRIES } from "./model.js";
import { getRecord } from "../record.js";
import { tabHandler, navPageStyle } from "../tabs.js";

function readLearner(record) {
  return getActiveLearner(record.read());
}

/** Home: one main action, then three quiet next steps. */
export default function Home() {
  const record = getRecord(getStore);
  const [state, setState] = useState(() => readLearner(record));
  useScreenLifecycle({ onShow: () => setState(readLearner(record)) });

  const view = homeView(state);
  const entry = ({ id, tone, icon, label, sub, extra = "", onTap }) => (
    <View
      className={`entry entry-${tone}${extra}`}
      hoverClass="entry-pressed"
      role="button"
      key={id}
      data-action={id}
      onClick={onTap}
    >
      <View className="entry-tile" aria-hidden="true">
        <Icon name={icon} />
      </View>
      <View className="entry-copy">
        <Text className="entry-name">{label}</Text>
        {sub ? <Text className="entry-sub">{sub}</Text> : null}
      </View>
      <Icon name="caret-right" className="chev" />
    </View>
  );

  return (
    <View className={`page has-nav ${motionClass}`} style={navPageStyle()}>
      <View className="stage">
        <View className="screen home" data-testid="home">
          <HomeDecor />
          <View className="home-bar">
            <View className="home-kicker">
              <ThemeImage slot="logo.mark" className="logo" />
              <View className="wordmark">
                <Text className="wordmark-zh">数感训练场</Text>
                <Text className="wordmark-en">Number Sense Lab</Text>
              </View>
            </View>
          </View>
          <View className={`home-hero${view.mode === "paused" ? " is-resume" : ""}`}>
            <Mascot pose="welcome" className="mascot-hero" />
            <View className="bubble">
              <View className="bubble-tail" aria-hidden="true" />
              <Text className="bubble-title">{view.title}</Text>
              <View className={`bubble-text${view.ledeLines.length > 1 ? " is-split" : ""}`}>
                {view.ledeLines.map((line, i) => (
                  <Text key={i} className="bubble-line">{line}</Text>
                ))}
              </View>
            </View>
          </View>
          <View className="entries">
            {entry({
              id: view.cta.action,
              tone: "start",
              icon: "play",
              label: view.cta.label,
              sub: view.cta.sub,
              extra: " home-cta",
              onTap: () => navigate.toTraining(view.cta.action),
            })}
          </View>
          <View className="home-next" aria-label="下一步">
            <View className="home-next-head">
              <Text className="home-next-kicker">下一步</Text>
              <View className="home-next-line" aria-hidden="true" />
            </View>
            {HOME_ENTRIES.map((e, index) => (
              <View
                key={e.id}
                className="home-next-item"
                hoverClass="home-next-pressed"
                role="button"
                data-action={e.id}
                onClick={() => (e.id === "progress" ? navigate.toPage("progress") : navigate.toTab(e.id))}
              >
                <View className={`home-next-mark tone-${e.tone}`} aria-hidden="true">
                  <Icon name={e.icon} />
                </View>
                <View className="home-next-copy">
                  <Text className="home-next-name">{e.label}</Text>
                  <Text className="home-next-sub">{e.sub}</Text>
                </View>
                <Text className="home-next-index" aria-hidden="true">0{index + 1}</Text>
                <Icon name="caret-right" className="chev" />
              </View>
            ))}
          </View>
        </View>
      </View>
      <BottomNav active="home" bottomInset={safeArea.bottom} onTap={tabHandler("home")} />
    </View>
  );
}
