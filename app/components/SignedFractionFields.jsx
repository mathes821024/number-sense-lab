import { View, Text } from "@tarojs/components";
import { fieldSize } from "../../src/core/fraction-fields.js";

export default function SignedFractionFields({ fields, onFocus, tick }) {
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
      aria-label={fields.negative ? "负分数" : "正分数"}
      data-testid="signed-fraction-fields"
      data-focus={fields.focus}
      data-negative={fields.negative ? "true" : "false"}
    >
      <Text className="sff-sign" aria-hidden="true">{fields.negative ? "−" : ""}</Text>
      <View className="fraction-fields">
        {box("numerator")}
        <View className="ff-bar" aria-hidden="true" />
        {box("denominator")}
      </View>
    </View>
  );
}
