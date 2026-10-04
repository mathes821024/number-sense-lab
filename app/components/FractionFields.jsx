import { View, Text } from "@tarojs/components";
import { fieldSize } from "../../src/core/fraction-fields.js";

/**
 * The fraction_fields answer: a numerator box over a bar over a denominator
 * box (docs/curriculum/09 §3–§4). ONE component for H5 and the Mini Program.
 * Its rules live in src/core/fraction-fields.js; the page only hands it the
 * fields and the keys. Tapping a box focuses it.
 */
export default function FractionFields({ fields, onFocus, tick }) {
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
      className={`fraction-fields${tick ? " tick" : ""}`}
      aria-live="polite"
      data-testid="fraction-fields"
      data-focus={fields.focus}
    >
      {box("numerator")}
      <View className="ff-bar" aria-hidden="true" />
      {box("denominator")}
    </View>
  );
}
