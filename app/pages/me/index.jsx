import { useState } from "react";
import { Input, Switch, Text, View } from "@tarojs/components";
import { getActiveLearner, withActiveLearnerNickname, withActiveLearnerPrefs } from "../../../src/core/store.js";
import BottomNav from "../../components/BottomNav";
import Icon from "../../components/icon/Icon";
import MascotCompanion from "../../components/MascotCompanion";
import { getStore, motionClass, navigate, safeArea, useScreenLifecycle } from "../../platform/current";
import { getRecord } from "../record.js";
import { navPageStyle, tabHandler } from "../tabs.js";
import { profileView } from "./model.js";

function active(record) {
  return getActiveLearner(record.read());
}

export default function Me() {
  const record = getRecord(getStore);
  const [learner, setLearner] = useState(() => active(record));
  const [draft, setDraft] = useState(() => learner.profile?.nickname || "");
  const [saved, setSaved] = useState(false);
  useScreenLifecycle({
    onShow: () => {
      const next = active(record);
      setLearner(next);
      setDraft(next.profile?.nickname || "");
    },
  });

  const view = profileView(learner);
  const saveNickname = () => {
    const next = withActiveLearnerNickname(record.read(), draft);
    record.write(next);
    const nextLearner = getActiveLearner(next);
    setLearner(nextLearner);
    setDraft(nextLearner.profile?.nickname || "");
    setSaved(true);
  };
  const setSound = (enabled) => {
    const next = withActiveLearnerPrefs(record.read(), { sound: enabled });
    record.write(next);
    setLearner(getActiveLearner(next));
  };

  return (
    <View className={`page has-nav ${motionClass}`} style={navPageStyle()}>
      <View className="stage">
        <View className="screen screen-me" data-testid="me">
          <View className="profile-head">
            <MascotCompanion pose="thinking" className="profile-companion" />
            <View className="profile-intro">
              <Text className="profile-kicker">MY MATH DESK</Text>
              <Text className="title">{view.displayName}的数学桌</Text>
              <Text className="lede">把练过的关系留在这里，慢慢熟悉，不和别人比较。</Text>
            </View>
          </View>

          <View className="evidence-strip" aria-label="学习概览">
            <View className="evidence-cell">
              <Text className="evidence-value">{view.practicedRelations}</Text>
              <Text className="evidence-label">练过的数字关系</Text>
            </View>
            <View className="evidence-divider" aria-hidden="true" />
            <View className="evidence-cell">
              <Text className="evidence-value">{view.stableRelations}</Text>
              <Text className="evidence-label">已经比较熟悉</Text>
            </View>
          </View>

          <View className="profile-section">
            <Text className="profile-section-title">怎么称呼你</Text>
            <Text className="profile-section-note">可选，只保存在当前设备，最多 12 个字。</Text>
            <View className="nickname-editor">
              <Input
                className="nickname-input"
                value={draft}
                maxlength={24}
                placeholder="例如：晨曦"
                aria-label="昵称"
                onInput={(event) => { setDraft(event.detail.value); setSaved(false); }}
              />
              <View className="nickname-save" role="button" hoverClass="nickname-save-pressed" onClick={saveNickname}>
                <Text>保存称呼</Text>
              </View>
            </View>
            <Text className="save-status" role="status">{saved ? "已保存在这台设备" : ""}</Text>
          </View>

          <View className="settings-list" aria-label="偏好与说明">
            <View className="setting-row">
              <View className="setting-copy">
                <Text className="setting-name">声音提示</Text>
                <Text className="setting-note">答题时使用轻柔提示音</Text>
              </View>
              <Switch checked={view.sound} color="#118866" aria-label="声音提示" onChange={(event) => setSound(event.detail.value)} />
            </View>
            <View className="setting-row">
              <View className="setting-copy">
                <Text className="setting-name">动态效果</Text>
                <Text className="setting-note">轻量出现，不影响答题</Text>
              </View>
              <Text className="setting-value">跟随系统</Text>
            </View>
            <View className="setting-row is-link" role="button" onClick={() => navigate.toPage("about")}>
              <View className="setting-copy">
                <Text className="setting-name">关于数感训练场</Text>
                <Text className="setting-note">为什么做它，以及我们怎样陪伴学习</Text>
              </View>
              <Icon name="caret-right" className="chev" />
            </View>
          </View>

          <View className="local-data-note">
            <Text className="local-data-mark" aria-hidden="true">◎</Text>
            <Text>练习记录和称呼只保存在当前设备，不会自动同步到其他设备。</Text>
          </View>
        </View>
      </View>
      <BottomNav active="me" bottomInset={safeArea.bottom} onTap={tabHandler("me")} />
    </View>
  );
}
