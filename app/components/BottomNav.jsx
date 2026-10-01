import { View, Text } from "@tarojs/components";

const ITEMS = [
  { id: "home", label: "首页" },
  { id: "explore", label: "练习" },
  { id: "mistakes", label: "错题本" },
  { id: "me", label: "我的" },
];

/**
 * The four bottom entries, drawn in the page (capability matrix: tier A, not
 * the native tabBar). Never rendered while an answer is being written.
 * Entries outside this slice say 「敬请期待」.
 */
export default function BottomNav({ active = "home", onTap, style }) {
  return (
    <View className="bottom-nav" style={style}>
      {ITEMS.map((item) => (
        <View
          key={item.id}
          className={`nav-item ${item.id === active ? "is-on" : ""}`}
          role="button"
          onClick={() => onTap(item.id)}
        >
          <View className="nav-dot" aria-hidden="true" />
          <Text className="nav-label">{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
