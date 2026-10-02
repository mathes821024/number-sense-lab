import { useState } from "react";
import { View, Text } from "@tarojs/components";
import { loadCoreCatalog } from "../../../src/core/content.js";
import { getActiveLearner } from "../../../src/core/store.js";
import { getStore, navigate, safeArea, motionClass, useScreenLifecycle } from "../../platform/current";
import BottomNav from "../../components/BottomNav";
import Notice from "../../components/Notice";
import Icon from "../../components/icon/Icon";
import { Mascot } from "../../components/ThemeImage";
import MathText from "../../components/math/MathText";
import { listPromptText } from "../../components/math/tokens.js";
import useNotice from "../../components/useNotice";
import { getRecord } from "../record.js";
import { tabHandler, navPageStyle } from "../tabs.js";
import { mistakesView } from "../models.js";

const catalog = loadCoreCatalog();

/**
 * 错题本 (h5/app.js renderMistakes): current mistakes only (core's
 * buildMistakeBook), grouped by domain in DOMAIN_ORDER, empty groups left
 * out. Each row is the prompt and its student label — no counts, no badges.
 * 已掌握 / 全部 answer 敬请期待.
 */
export default function Mistakes() {
  const record = getRecord(getStore);
  const [state, setState] = useState(() => getActiveLearner(record.read()));
  const [notice, showSoon] = useNotice();
  useScreenLifecycle({ onShow: () => setState(getActiveLearner(record.read())) });
  const book = mistakesView(state, catalog);

  const tabs = (
    <View className="segmented" role="group" aria-label="错题范围">
      <View className="seg is-on" aria-pressed="true">
        <Text>当前错题</Text>
      </View>
      {["已掌握", "全部"].map((name) => (
        <View className="seg seg-soon" role="button" aria-disabled="true" key={name} data-action="soon" data-soon={name} onClick={() => showSoon(name)}>
          <Text className="seg-name">{name}</Text>
          <Text className="seg-note">敬请期待</Text>
        </View>
      ))}
    </View>
  );

  const body = book.empty ? (
    <View className="screen screen-mistakes" data-testid="mistakes" data-empty="true">
      <Text className="title">{book.title}</Text>
      {tabs}
      <View className="empty">
        <Mascot pose="welcome" className="mascot-empty" />
        <Text className="lede">{book.emptyMessage}</Text>
      </View>
      <View className="cta" hoverClass="cta-pressed" role="button" data-action="home" onClick={() => navigate.toHome()}>
        <Text>回首页</Text>
      </View>
    </View>
  ) : (
    <View className="screen screen-mistakes" data-testid="mistakes">
      <Text className="title">{book.title}</Text>
      {tabs}
      <Text className="lede">{book.lede}</Text>
      {book.groups.map((group) => (
        <View className="mistake-group" key={group.domain} data-domain={group.domain}>
          <Text className="group-label">{group.label}</Text>
          <View className="list ledger">
            {group.items.map((item) => (
              <View className="list-row" key={item.id} data-id={item.id}>
                <MathText value={listPromptText(item.prompt)} className="row-prompt" />
                <Text className="meta">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
      <View className="action-pair">
        <View className="cta secondary with-icon" hoverClass="cta-pressed" role="button" data-action="a4-mistakes" onClick={() => navigate.toPage("print", { source: "mistakes" })}>
          <Icon name="printer" className="cta-mark" />
          <Text>印这些题</Text>
        </View>
        <View className="cta" hoverClass="cta-pressed" role="button" data-action="start-mistakes" onClick={() => navigate.toTraining("start-mistakes")}>
          <Text>练这些错题</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className={`page has-nav ${motionClass}`} style={navPageStyle()}>
      <View className="stage">{body}</View>
      <Notice text={notice} />
      <BottomNav active="mistakes" bottomInset={safeArea.bottom} onTap={tabHandler("mistakes", showSoon)} />
    </View>
  );
}
