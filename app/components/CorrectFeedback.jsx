import { View, Text } from "@tarojs/components";
import Mascot from "./Mascot";
import MathText from "./math/MathText";

/**
 * Correct: a short 「对」 with a shape, the relation, the correct-pose mascot.
 * No button: the page moves on after the short pause. Tapping skips it.
 */
export default function CorrectFeedback({ relation, onSkip }) {
  return (
    <View className="screen screen-correct" data-testid="correct" onClick={onSkip}>
      <Mascot slot="mascot.correct" className="mascot-feedback" />
      <View className="card feedback-card is-correct">
        <View className="relation-row">
          <MathText value={relation} className="correct-eq" />
          <Text className="ok-mark" aria-hidden="true">✓</Text>
        </View>
        <Text className="word">对</Text>
      </View>
    </View>
  );
}
