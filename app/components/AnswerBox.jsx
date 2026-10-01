import { View, Text } from "@tarojs/components";
import { Fraction, Repeating } from "./math/MathText";
import { answerDisplay } from "./math/tokens.js";

/** The answer box: digits, a textbook fraction, or 0.( dotted block ) — h5/app.js answerHtml. */
export default function AnswerBox({ item, answer, tick }) {
  const shown = answerDisplay(item, answer);
  const cls = `answer${shown.kind === "repeating" ? " answer-repeating" : ""}${tick ? " tick" : ""}`;
  let body;
  if (shown.kind === "repeating") {
    body = shown.token ? (
      <Repeating token={shown.token} />
    ) : (
      <>
        <Text className="rep-int">{`${shown.intPart}.`}</Text>
        <View className="rep-slot" aria-hidden="true" />
      </>
    );
  } else if (shown.kind === "fraction") {
    body = <Fraction numerator={shown.numerator} denominator={shown.denominator} className="answer-frac" />;
  } else {
    body = <Text className="answer-text">{shown.text}</Text>;
  }
  return (
    <View className={cls} aria-live="polite" data-testid="answer" data-answer={answer}>
      {body}
    </View>
  );
}
