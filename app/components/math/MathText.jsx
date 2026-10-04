import { View, Text } from "@tarojs/components";
import { mathTokens, mathLabel } from "./tokens.js";

/** A fraction with a real bar (no HTML strings, nothing baked in an image). */
export function Fraction({ numerator, denominator, className = "" }) {
  return (
    <View className={`frac ${className}`} aria-label={`${numerator}/${denominator}`}>
      <Text className="num">{numerator}</Text>
      <Text className="den">{denominator}</Text>
    </View>
  );
}

/** The empty fraction of a fraction_fields prompt: a bar, nothing above or below. */
export function BlankFraction({ className = "" }) {
  return (
    <View className={`frac frac-blank ${className}`} role="img" aria-label="分数">
      <Text className="num" />
      <Text className="den" />
    </View>
  );
}

/** Textbook repeating decimal: dots over the first and the last digit of the block. */
export function Repeating({ token }) {
  return (
    <View className="rep" role="math" aria-label={token.label}>
      <Text className="rep-lead">{`${token.intPart}.`}</Text>
      {token.digits.map((d, j) => (
        <Text className={d.dot ? "rd" : "rn"} key={j}>
          {d.ch}
        </Text>
      ))}
    </View>
  );
}

/**
 * Student-facing math, drawn by components — the same reading as main's
 * h5/math-text.js formatMath(), on H5 and in the Mini Program alike.
 */
export default function MathText({ value, className = "" }) {
  const tokens = mathTokens(value);
  return (
    <View className={`math ${className}`} aria-label={mathLabel(value)}>
      {tokens.map((t, i) => {
        if (t.type === "fraction") return <Fraction key={i} numerator={t.numerator} denominator={t.denominator} />;
        if (t.type === "repeating") return <Repeating key={i} token={t} />;
        if (t.type === "blank_fraction") return <BlankFraction key={i} />;
        return (
          <Text className="math-text" key={i}>
            {t.text}
          </Text>
        );
      })}
    </View>
  );
}
