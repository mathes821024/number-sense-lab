import { useState } from "react";
import { View, Text } from "@tarojs/components";
import { getActiveLearner } from "../../../src/core/store.js";
import { getStore, navigate, safeArea, motionClass, useScreenLifecycle } from "../../platform/current";
import ThemeImage, { Mascot } from "../../components/ThemeImage";
import HomeDecor from "../../components/HomeDecor";
import BottomNav from "../../components/BottomNav";
import Notice from "../../components/Notice";
import Icon from "../../components/icon/Icon";
import useNotice from "../../components/useNotice";
import { homeView, HOME_ENTRIES, DEVICE_NOTE } from "./model.js";
import { getRecord } from "../record.js";

function readLearner(record) {
  return getActiveLearner(record.read());
}

/** Home (h5/app.js renderHome): one main path, three secondary cards, the device note, the four entries. */
export default function Home() {
  const record = getRecord(getStore);
  const [state, setState] = useState(() => readLearner(record));
  const [notice, showSoon] = useNotice();
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
    <View className={`page has-nav ${motionClass}`} style={{ paddingTop: `calc(16px + ${safeArea.top})` }}>
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
          <View className="home-hero">
            <Mascot pose="welcome" className="mascot-hero" />
            <View className="bubble">
              <View className="bubble-tail" aria-hidden="true" />
              <Text className="bubble-title">{view.title}</Text>
              <Text className="bubble-text">{view.lede}</Text>
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
            {view.secondary ? (
              <View
                className="home-secondary"
                role="button"
                data-action={view.secondary.action}
                onClick={() => navigate.toTraining(view.secondary.action)}
              >
                <Text>{view.secondary.label}</Text>
              </View>
            ) : null}
            {HOME_ENTRIES.map((e) => entry({ ...e, onTap: () => showSoon(e.label) }))}
          </View>
          <Text className="fine device-note">{DEVICE_NOTE}</Text>
        </View>
      </View>
      <Notice text={notice} />
      <BottomNav active="home" bottomInset={safeArea.bottom} onTap={(id, label) => (id === "home" ? null : showSoon(label))} />
    </View>
  );
}
