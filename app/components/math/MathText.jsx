import { View, Text } from "@tarojs/components";
import { mathTokens, mathLabel } from "./tokens.js";

/**
 * Math as drawn by components: a real fraction bar, and repeating dots over
 * the block. No HTML strings, no combining characters, nothing baked in
 * an image. Works the same in H5 and the Mini Program.
 */
export default function MathText({ value, className = "" }) {
  const tokens = mathTokens(value);
  return (
    <View className={`math ${className}`} aria-label={mathLabel(value)}>
      {tokens.map((t, i) => {
        if (t.type === "fraction") {
          return (
            <View className="frac" key={i}>
              <Text className="frac-num">{t.numerator}</Text>
              <Text className="frac-den">{t.denominator}</Text>
            </View>
          );
        }
        if (t.type === "repeating") {
          return (
            <View className="rep" key={i}>
              <Text>{t.lead}</Text>
              {t.block.split("").map((d, j) => (
                <View className="rep-digit" key={j}>
                  <Text>{d}</Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text className="math-text" key={i}>
            {t.text}
          </Text>
        );
      })}
    </View>
  );
}
