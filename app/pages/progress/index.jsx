import { useState } from "react";
import { View, Text } from "@tarojs/components";
import { loadCoreCatalog } from "../../../src/core/content.js";
import { getActiveLearner } from "../../../src/core/store.js";
import { getStore, navigate, safeArea, motionClass, useScreenLifecycle } from "../../platform/current";
import BottomNav from "../../components/BottomNav";
import Notice from "../../components/Notice";
import Icon from "../../components/icon/Icon";
import BackButton from "../../components/BackButton";
import { Mascot } from "../../components/ThemeImage";
import MathText from "../../components/math/MathText";
import { listPromptText } from "../../components/math/tokens.js";
import useNotice from "../../components/useNotice";
import { getRecord } from "../record.js";
import { tabHandler, navPageStyle } from "../tabs.js";
import { progressView } from "../models.js";

const catalog = loadCoreCatalog();

/**
 * 最近练得怎么样 (h5/app.js renderProgress): the last sets, then the latest
 * recorded outcome (对 / 错) per practiced relation. Mastery is not the label;
 * nothing is changed here. 选题打印 opens the shared print selector.
 */
export default function Progress() {
  const record = getRecord(getStore);
  const [state, setState] = useState(() => getActiveLearner(record.read()));
  const [notice, showSoon] = useNotice();
  useScreenLifecycle({ onShow: () => setState(getActiveLearner(record.read())) });
  const view = progressView(state, catalog);

  return (
    <View className={`page has-nav ${motionClass}`} style={navPageStyle()}>
      <View className="stage">
        <View className="screen screen-progress" data-testid="progress">
          <BackButton label="回首页" icon="house" action="home" onTap={() => navigate.toHome()} />
          <Text className="title">最近练得怎么样</Text>
          {view.sessions.length === 0 ? (
            <View className="empty">
              <Mascot pose="welcome" className="mascot-empty" />
              <Text className="lede">还没有练习。回首页开始一小段吧。</Text>
            </View>
          ) : (
            <View className="list ledger sessions">
              {view.sessions.map((s, i) => (
                <View className="list-row" key={i}>
                  <Text className="row-text">{`${s.day} · ${s.status}`}</Text>
                  <Text className="meta">{s.score}</Text>
                </View>
              ))}
            </View>
          )}
          {view.outcomes.length ? (
            <View className="recent">
              <Text className="body section-label">最近练过的题</Text>
              <Text className="fine section-note">显示最近一次作答的对错</Text>
              <View className="list ledger outcomes" data-testid="recent-outcomes">
                {view.outcomes.map((row) => (
                  <View className="list-row" key={row.id} data-id={row.id} data-outcome={row.right ? "right" : "wrong"}>
                    <MathText value={listPromptText(row.prompt)} className="row-prompt" />
                    <View className={`outcome ${row.right ? "is-right" : "is-wrong"}`}>
                      <Text className="om" aria-hidden="true">
                        {row.right ? "✓" : "×"}
                      </Text>
                      <Text>{row.right ? "对" : "错"}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
          <View className="cta secondary with-icon" hoverClass="cta-pressed" role="button" data-action="a4-progress" onClick={() => navigate.toPage("print", { source: "progress" })}>
            <Icon name="printer" className="cta-mark" />
            <Text>选题打印</Text>
          </View>
        </View>
      </View>
      <Notice text={notice} />
      <BottomNav active="home" bottomInset={safeArea.bottom} onTap={(id, label) => (id === "home" ? navigate.toHome() : tabHandler("", showSoon)(id, label))} />
    </View>
  );
}
