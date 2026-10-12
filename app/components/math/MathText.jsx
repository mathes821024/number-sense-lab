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
      <Text className="rep-lead">{String(token.intPart).includes(".") ? token.intPart : `${token.intPart}.`}</Text>
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
 *
 * Optional contract Chinese SR: pass ariaLabel (React) or aria-label (the
 * H5/mini build may rewrite the camelCase form on call sites). Default keeps
 * mathLabel(value) so other skills are unchanged.
 */
export default function MathText(props) {
  const { value, className = "" } = props;
  // H5/mini compile may rewrite ariaLabel → aria-label on JSX call sites; accept both.
  const override = props.ariaLabel ?? props["aria-label"];
  const tokens = mathTokens(value);
  const label = override == null || override === "" ? mathLabel(value) : override;
  return (
    <View className={`math ${className}`} aria-label={label}>
      {tokens.map((t, i) => {
        if (t.type === "fraction") return <Fraction key={i} numerator={t.numerator} denominator={t.denominator} />;
        if (t.type === "repeating") return <Repeating key={i} token={t} />;
        if (t.type === "blank_fraction") return <BlankFraction key={i} />;
        if (t.type === "superscript") {
          return <Text className="math-sup" aria-label={t.label} key={i}>{t.exponent}</Text>;
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
