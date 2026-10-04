import { useState } from "react";
import { View, Text } from "@tarojs/components";
import { loadCoreCatalog } from "../../../src/core/content.js";
import { getActiveLearner } from "../../../src/core/store.js";
import {
  defaultPrintSelection,
  selectCurrentMistakes,
  clearPrintSelection,
  togglePrintSelection,
} from "../../../src/core/a4.js";
import { localDay } from "../../../src/adapter/storage-contract.js";
import { getStore, navigate, printing, safeArea, motionClass, useRouteParams, useScreenLifecycle } from "../../platform/current";
import BottomNav from "../../components/BottomNav";
import Notice from "../../components/Notice";
import Icon from "../../components/icon/Icon";
import BackButton from "../../components/BackButton";
import { Mascot } from "../../components/ThemeImage";
import MathText from "../../components/math/MathText";
import { listPromptText, printPrompt } from "../../components/math/tokens.js";
import useNotice from "../../components/useNotice";
import { getRecord } from "../record.js";
import { tabHandler, navPageStyle } from "../tabs.js";
import { a4View, printSelectView, printSource, PRINT_NOTE, NO_PRINT_NOTE } from "../models.js";

const catalog = loadCoreCatalog();

/**
 * ONE print selector for 首页 / 最近练得怎么样 「选题打印」 and 错题本 「印这些题」
 * (h5/app.js renderPrintSelect), then the A4 page (renderA4): prompts only,
 * the answers on their own page. The selection is transient page state —
 * never stored, never written into the learner record.
 */
export default function Print() {
  const params = useRouteParams();
  const source = printSource(params.source);
  const record = getRecord(getStore);
  const [state, setState] = useState(() => getActiveLearner(record.read()));
  const [selectedIds, setSelected] = useState(() => defaultPrintSelection(catalog, state.relations || {}));
  const [domain, setDomain] = useState(null);
  // From the Mistake Book the other practiced relations start folded away.
  const [showOthers, setShowOthers] = useState(source !== "mistakes");
  const [screen, setScreen] = useState("select");
  const [showAnswers, setShowAnswers] = useState(false);
  const [notice, showSoon] = useNotice();
  useScreenLifecycle({ onShow: () => setState(getActiveLearner(record.read())) });
  const relations = state.relations || {};

  const back = () => {
    if (source === "mistakes") navigate.back("mistakes");
    else if (source === "progress") navigate.back("progress");
    else navigate.toHome();
  };
  const backLink =
    source === "mistakes" ? (
      <BackButton label="回错题本" action="mistakes" onTap={back} />
    ) : source === "progress" ? (
      <BackButton label="返回最近练习" action="progress" onTap={back} />
    ) : (
      <BackButton label="回首页" icon="house" action="home" onTap={back} />
    );

  let body;
  if (screen === "a4") {
    const sheet = a4View(state, catalog, { selectedIds, day: localDay() });
    const toSelect = <BackButton label="返回选题" action="print-back" onTap={() => {
          setShowAnswers(false);
          setScreen("select");
        }} />;
    body = sheet.empty ? (
      <View className="screen" data-testid="a4" data-empty="true">
        {toSelect}
        <Text className="title">印到纸上</Text>
        <Text className="lede">{sheet.emptyMessage}</Text>
      </View>
    ) : (
      <View className="screen screen-a4" data-testid="a4" data-source={source}>
        <View className="no-print">
          {toSelect}
          <Text className="title">印到纸上</Text>
          <Text className="lede">{showAnswers ? "这一页只有答案。写完题目再看。" : sheet.subtitle}</Text>
        </View>
        {showAnswers ? (
          <View className="sheet sheet-answers" data-testid="a4-answers">
            <Text className="sheet-title">答案（写完再看）</Text>
            <Text className="sheet-sub">{sheet.sub}</Text>
            <View className="sheet-list">
              {sheet.answerKey.map((a, i) => (
                <View className="sheet-item" key={a.id} data-id={a.id}>
                  <Text className="sheet-n">{`${i + 1}.`}</Text>
                  <MathText value={a.relation} className="sheet-math" />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="sheet" data-testid="a4-sheet">
            <Text className="sheet-title">{sheet.title}</Text>
            <Text className="sheet-sub">{sheet.sub}</Text>
            <View className="sheet-list">
              {sheet.prompts.map((p) => {
                const line = printPrompt(p.prompt);
                return (
                  <View className="sheet-item" key={p.id} data-id={p.id}>
                    <Text className="sheet-n">{`${p.n}.`}</Text>
                    <MathText value={line.text} className="sheet-math" />
                    {line.line ? <View className="blank" /> : null}
                  </View>
                );
              })}
            </View>
          </View>
        )}
        <View className="no-print">
          {printing.available ? (
            <View className="cta" hoverClass="cta-pressed" role="button" data-action="print" onClick={() => printing.print()}>
              <Text>打印 / 保存为 PDF</Text>
            </View>
          ) : null}
          <View className="cta secondary" hoverClass="cta-pressed" role="button" data-action="toggle-answers" onClick={() => setShowAnswers(!showAnswers)}>
            <Text>{showAnswers ? "收起答案" : "答案单独一页（写完再看）"}</Text>
          </View>
          <Text className="fine print-note">{printing.available ? PRINT_NOTE : NO_PRINT_NOTE}</Text>
        </View>
      </View>
    );
  } else {
    const sel = printSelectView(state, catalog, { selectedIds, domain, showOthers });
    body = sel.empty ? (
      <View className="screen" data-testid="print-select" data-source={source} data-empty="true">
        {backLink}
        <Text className="title">{sel.title}</Text>
        <View className="empty">
          <Mascot pose="welcome" className="mascot-empty" />
          <Text className="lede">{sel.noCandidates}</Text>
        </View>
        <View className="cta" hoverClass="cta-pressed" role="button" data-action="home" onClick={() => navigate.toHome()}>
          <Text>先练一小段</Text>
        </View>
      </View>
    ) : (
      <View className="screen screen-print" data-testid="print-select" data-source={source}>
        {backLink}
        <Text className="title">{sel.title}</Text>
        <Text className="lede">{sel.lede}</Text>
        <View className="filters" role="group" aria-label="按块看">
          {sel.filters.map((f) => {
            const on = (domain || "") === f.value;
            return (
              <View className={`chip${on ? " is-on" : ""}`} role="button" aria-pressed={on} key={f.value || "all"} data-action="print-domain" data-domain={f.value} onClick={() => setDomain(f.value || null)}>
                <Text>{f.label}</Text>
              </View>
            );
          })}
        </View>
        <View className="pick-bar">
          <View className="quiet pick-action" role="button" data-action="print-select-mistakes" onClick={() => setSelected(selectCurrentMistakes(catalog, relations, selectedIds, domain))}>
            <Text>错题全选</Text>
          </View>
          <View className="quiet pick-action" role="button" data-action="print-clear" onClick={() => setSelected(clearPrintSelection(catalog, relations, selectedIds, domain))}>
            <Text>清空</Text>
          </View>
          <Text className="pick-count" data-testid="print-count" aria-live="polite">
            {sel.selectedLabel}
          </Text>
        </View>
        {sel.rows.length ? (
          <View className="list picks" data-testid="print-list">
            {sel.rows.map((c) => (
              <View className="list-row pick" role="checkbox" aria-checked={c.selected} key={c.id} data-id={c.id} data-selected={c.selected ? "true" : "false"} onClick={() => setSelected(togglePrintSelection(catalog, relations, selectedIds, c.id))}>
                <View className={`pick-box${c.selected ? " is-on" : ""}`} aria-hidden="true">
                  <View className="pick-tick" />
                </View>
                <MathText value={listPromptText(c.prompt)} className="pick-text" />
                {c.label ? <Text className="meta">{c.label}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
        {sel.nothingHere ? <Text className="body">这一类还没有练过的题。</Text> : null}
        {sel.hiddenOthers ? (
          <View className="quiet more-picks" role="button" data-action="print-show-others" onClick={() => setShowOthers(true)}>
            <Icon name="plus" className="back-mark" />
            <Text>也看看其他练过的题</Text>
          </View>
        ) : null}
        <View
          className={`cta${sel.selectedCount === 0 ? " is-disabled" : ""}`}
          hoverClass={sel.selectedCount === 0 ? "none" : "cta-pressed"}
          role="button"
          aria-disabled={sel.selectedCount === 0}
          data-action="print-preview"
          onClick={() => {
            if (sel.selectedCount === 0) return;
            setShowAnswers(false);
            setScreen("a4");
          }}
        >
          <Text>预览题目</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`page has-nav ${motionClass}`} style={navPageStyle()}>
      <View className="stage">{body}</View>
      <Notice text={notice} />
      <BottomNav
        active={source === "mistakes" ? "mistakes" : "home"}
        bottomInset={safeArea.bottom}
        onTap={(id, label) => (id === "home" ? navigate.toHome() : tabHandler("", showSoon)(id, label))}
      />
    </View>
  );
}
