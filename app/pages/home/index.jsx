import { useState } from "react";
import { View, Text } from "@tarojs/components";
import { DOMAIN_ORDER, domainLabel, filterByDomain, loadCoreCatalog } from "../../../src/core/content.js";
import { summarizeDomain } from "../../../src/core/mastery.js";
import { getStore, navigate, safeAreaStyle, useScreenLifecycle } from "../../platform/current";
import Button from "../../components/Button";
import Mascot from "../../components/Mascot";
import BottomNav from "../../components/BottomNav";
import Notice from "../../components/Notice";
import { homeView, DEVICE_NOTE } from "./model.js";

const catalog = loadCoreCatalog();
const SOON = "敬请期待";

export default function Home() {
  const store = getStore();
  const [state, setState] = useState(() => store.read());
  const [notice, setNotice] = useState("");
  useScreenLifecycle({ onShow: () => setState(store.read()) });

  const view = homeView(state);
  const soon = () => {
    setNotice(SOON);
    setTimeout(() => setNotice(""), 1600);
  };
  const go = (action) => {
    if (action === "restart") {
      store.write({ ...store.read(), activeSession: null });
      navigate.toTraining("start");
    } else navigate.toTraining(action);
  };

  return (
    <View className="page page-home" data-testid="home">
      <View className="column">
        <View className="home-bar">
          <Text className="kicker">数感训练场</Text>
          <Text className="brand-en">Number Sense Lab</Text>
        </View>
        <View className="home-hero">
          <Mascot slot="mascot.welcome" className="mascot-hero" />
          <View className="home-copy">
            <Text className="headline">{view.title}</Text>
            <Text className="lede">{view.lede}</Text>
          </View>
        </View>
        <Button kind="primary" label={view.cta} sub={view.sub} onTap={() => go(view.action)} className="home-cta" testId="cta" />
        {view.secondary ? <Button kind="quiet" label={view.secondary.label} onTap={() => go(view.secondary.action)} /> : null}
        <View className="domains">
          {DOMAIN_ORDER.map((domain) => (
            <View className="card domain" key={domain} role="button" onClick={soon}>
              <View className={`domain-mark domain-${domain}`} aria-hidden="true" />
              <View className="domain-body">
                <Text className="domain-name">{domainLabel(domain)}</Text>
                <Text className="domain-sub">{summarizeDomain(filterByDomain(domain, catalog), state.relations)}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text className="fine">{DEVICE_NOTE}</Text>
        <Notice text={notice} />
      </View>
      <BottomNav active="home" onTap={(id) => (id === "home" ? null : soon())} style={safeAreaStyle()} />
    </View>
  );
}
