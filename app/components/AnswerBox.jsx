import { View, Text } from "@tarojs/components";
import { Repeating } from "./math/MathText";
import { answerDisplay } from "./math/tokens.js";

/** The answer box: digits, 0.( dotted block ), or a percent with a fixed "%" suffix. */
export default function AnswerBox({ item, answer, tick, className = "" }) {
  const shown = answerDisplay(item, answer);
  const cls = `answer${shown.kind === "repeating" ? " answer-repeating" : ""}${shown.kind === "percent" ? " answer-percent" : ""}${tick ? " tick" : ""}${className ? ` ${className}` : ""}`;
  const aria = shown.kind === "percent"
    ? `${shown.text || ""}%`
    : shown.kind === "repeating" && shown.token
      ? shown.token.label
      : shown.text || "";
  let body;
  if (shown.kind === "repeating") {
    body = shown.token ? (
      <Repeating token={shown.token} />
    ) : (
      <>
        <Text className="rep-int">{shown.fixed || (String(shown.intPart).includes(".") ? shown.intPart : `${shown.intPart}.`)}</Text>
        <View className="rep-slot" aria-hidden="true" />
      </>
    );
  } else if (shown.kind === "percent") {
    body = (
      <>
        <Text className="answer-text">{shown.text}</Text>
        <Text className="answer-suffix" aria-hidden="true">%</Text>
      </>
    );
  } else {
    body = <Text className="answer-text">{shown.text}</Text>;
  }
  return (
    <View className={cls} aria-live="polite" aria-label={aria} data-testid="answer" data-answer={answer} data-kind={shown.kind}>
      {body}
    </View>
  );
}
