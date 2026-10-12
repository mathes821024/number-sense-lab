import { useState } from "react";
import { View, Text } from "@tarojs/components";
import { loadCoreCatalog } from "../../../src/core/content.js";
import { getActiveLearner } from "../../../src/core/store.js";
import { getStore, navigate, safeArea, motionClass, useScreenLifecycle } from "../../platform/current";
import BottomNav from "../../components/BottomNav";
import Icon from "../../components/icon/Icon";
import MascotCompanion from "../../components/MascotCompanion";
import MathText from "../../components/math/MathText";
import { listPromptText } from "../../components/math/tokens.js";
import { getRecord } from "../record.js";
import { tabHandler, navPageStyle } from "../tabs.js";
import { mistakesView } from "../models.js";

const catalog = loadCoreCatalog();

/**
 * 错题本 (h5/app.js renderMistakes): current mistakes only (core's
 * buildMistakeBook), grouped by domain in DOMAIN_ORDER, empty groups left
 * out. Each row is the prompt and its student label — no counts, no badges,
 * and no future tabs pretending to be available.
 */
export default function Mistakes() {
  const record = getRecord(getStore);
  const [state, setState] = useState(() => getActiveLearner(record.read()));
  useScreenLifecycle({ onShow: () => setState(getActiveLearner(record.read())) });
  const book = mistakesView(state, catalog);

  const body = book.empty ? (
    <View className="screen screen-mistakes" data-testid="mistakes" data-empty="true">
      <Text className="title">{book.title}</Text>
      <Text className="mistake-scope">当前需要再写熟的题</Text>
      <View className="empty">
        <MascotCompanion pose="rest" className="mascot-empty" />
        <Text className="lede">{book.emptyMessage}</Text>
      </View>
      <View className="cta" hoverClass="cta-pressed" role="button" data-action="home" onClick={() => navigate.toHome()}>
        <Text>回首页</Text>
      </View>
    </View>
  ) : (
    <View className="screen screen-mistakes" data-testid="mistakes">
      <Text className="title">{book.title}</Text>
      <Text className="mistake-scope">当前需要再写熟的题</Text>
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
      <View className="mistake-actions">
        <View className="cta" hoverClass="cta-pressed" role="button" data-action="start-mistakes" onClick={() => navigate.toTraining("start-mistakes")}>
          <Text>{book.practiceLabel}</Text>
        </View>
        <View className="quiet-action with-icon" hoverClass="quiet-action-pressed" role="button" data-action="a4-mistakes" onClick={() => navigate.toPage("print", { source: "mistakes" })}>
          <Icon name="printer" className="quiet-action-mark" />
          <Text>印这些题</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View className={`page has-nav ${motionClass}`} style={navPageStyle()}>
      <View className="stage">{body}</View>
      <BottomNav active="mistakes" bottomInset={safeArea.bottom} onTap={tabHandler("mistakes")} />
    </View>
  );
}
