import { View, Text } from "@tarojs/components";
import MathText from "./math/MathText";

/**
 * Correct (h5/app.js renderCorrect): the correct mascot, 「太棒了！」, the
 * relation with an interface-drawn tick, and 「对」. No button — the next
 * question follows by itself after the short pause.
 * Optional relationAriaLabel: formula-first contract Chinese SR for the relation.
 */
export default function CorrectFeedback({ relation, relationAriaLabel }) {
  return (
    <View className="screen screen-correct" data-testid="correct">
      <Text className="feedback-title is-correct">对</Text>
      <View className="card feedback-card is-correct">
        <View className="relation-row">
          <MathText value={relation} className="correct-eq" ariaLabel={relationAriaLabel} />
          <View className="ok" aria-hidden="true">
            <View className="ok-check" />
          </View>
        </View>
        <Text className="word">对</Text>
      </View>
    </View>
  );
}
