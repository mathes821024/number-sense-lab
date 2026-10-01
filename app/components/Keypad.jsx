import { View, Text } from "@tarojs/components";

/**
 * On-screen keypad: the main input on phones and the complete input in the
 * Mini Program (h5/app.js renderTrain). Left of 0: 「.」 for a decimal answer,
 * 「/」 for a fraction answer, otherwise an empty slot. A repeating decimal
 * needs no extra key: the answer box itself reads 0.( … ).
 */
export default function Keypad({ extraKey, onKey, onErase, onSubmit }) {
  const key = (label, onTap, cls = "", dataKey = label, aria) => (
    <View
      className={`key ${cls}`}
      hoverClass="key-pressed"
      hoverStayTime={60}
      role="button"
      aria-label={aria}
      onClick={onTap}
      key={dataKey}
      data-key={dataKey}
    >
      <Text>{label}</Text>
    </View>
  );
  return (
    <View className="keys">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => key(d, () => onKey(d)))}
      {extraKey
        ? key(extraKey, () => onKey(extraKey), "", extraKey, extraKey === "/" ? "分数线" : undefined)
        : <View className="key ghost" aria-hidden="true" />}
      {key("0", () => onKey("0"))}
      {key("删除", onErase, "key-word", "del")}
      {key("提交", onSubmit, "go", "submit")}
    </View>
  );
}
