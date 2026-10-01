import { View, Text } from "@tarojs/components";
import Icon from "./icon/Icon";

const TABS = [
  { id: "home", icon: "house", label: "首页" },
  { id: "explore", icon: "pencil-simple-line", label: "练习" },
  { id: "mistakes", icon: "book-open-text", label: "错题本" },
  { id: "me", icon: "user", label: "我的" },
];

/**
 * The four bottom entries, drawn in the page (capability matrix tier A, not
 * the native tabBar). Ordinary pages only: never rendered while the student
 * is answering (train / correct / wrong / pause).
 */
export default function BottomNav({ active = "home", onTap, bottomInset = "0px" }) {
  return (
    <View className="tabbar" style={{ paddingBottom: `calc(6px + ${bottomInset})` }} aria-label="主要入口">
      {TABS.map((tab) => (
        <View
          key={tab.id}
          className={`tab${tab.id === active ? " is-on" : ""}`}
          role="button"
          aria-current={tab.id === active ? "page" : undefined}
          data-tab={tab.id}
          onClick={() => onTap(tab.id, tab.label)}
        >
          <Icon name={tab.icon} className="tab-icon" />
          <Text className="tab-label">{tab.label}</Text>
        </View>
      ))}
    </View>
  );
}
