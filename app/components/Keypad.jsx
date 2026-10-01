import { View, Text } from "@tarojs/components";

/**
 * On-screen keypad: the main input on phones and the complete input in the
 * Mini Program. "." only when the item needs a decimal point.
 */
export default function Keypad({ showDot, onDigit, onErase, onSubmit }) {
  const key = (label, onTap, extra = "") => (
    <View className={`key ${extra}`} hoverClass="key-pressed" role="button" onClick={onTap} key={label} data-key={label}>
      <Text>{label}</Text>
    </View>
  );
  return (
    <View className="keys">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => key(d, () => onDigit(d)))}
      {showDot ? key(".", () => onDigit(".")) : <View className="key key-ghost" aria-hidden="true" />}
      {key("0", () => onDigit("0"))}
      {key("删除", onErase, "key-word")}
      {key("提交", onSubmit, "key-go")}
    </View>
  );
}
