import { View, Text } from "@tarojs/components";
import { fieldSize } from "../../src/core/fraction-fields.js";

export default function SignedFractionFields({ fields, onFocus, tick }) {
  const signLabel = fields.sign === "-"
    ? "负分数"
    : fields.sign === "+"
      ? "显式正分数"
      : "未填写符号，默认正分数";
  const signGlyph = fields.sign === "-" ? "−" : fields.sign;
  const box = (which) => {
    const value = fields[which];
    const focused = fields.focus === which;
    return (
      <View
        className={`ff-box ff-${which}${focused ? " is-focus" : ""}${value ? "" : " is-empty"}${fieldSize(value) ? ` is-${fieldSize(value)}` : ""}`}
        role="button"
        aria-label={which === "numerator" ? "分子" : "分母"}
        aria-pressed={focused}
        data-field={which}
        data-value={value}
        onClick={() => onFocus(which)}
      >
        <Text className="ff-digits">{value}</Text>
        {focused ? <View className="ff-caret" aria-hidden="true" /> : null}
      </View>
    );
  };
  return (
    <View
      className={`signed-fraction-fields${tick ? " tick" : ""}`}
      aria-live="polite"
      aria-label={signLabel}
      data-testid="signed-fraction-fields"
      data-focus={fields.focus}
      data-sign={fields.sign || "blank"}
    >
      <View className={`sff-sign${fields.sign ? "" : " is-empty"}`} aria-hidden="true">
        <Text>{signGlyph}</Text>
      </View>
      <View className="fraction-fields">
        {box("numerator")}
        <View className="ff-bar" aria-hidden="true" />
        {box("denominator")}
      </View>
    </View>
  );
}
