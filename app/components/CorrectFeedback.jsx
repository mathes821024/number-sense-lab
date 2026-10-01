import { View, Text } from "@tarojs/components";
import ThemeImage, { Mascot } from "./ThemeImage";
import MathText from "./math/MathText";

/**
 * Correct (h5/app.js renderCorrect): the correct mascot, 「太棒了！」, the
 * relation with an interface-drawn tick, and 「对」. No button — the next
 * question follows by itself after the short pause.
 */
export default function CorrectFeedback({ relation }) {
  return (
    <View className="screen screen-correct" data-testid="correct">
      <View className="feedback-hero">
        <Mascot pose="correct" className="mascot-feedback" />
        <ThemeImage slot="decor.sparkle" className="hero-spark" />
      </View>
      <Text className="feedback-title is-correct">太棒了！</Text>
      <View className="card feedback-card is-correct">
        <View className="relation-row">
          <MathText value={relation} className="correct-eq" />
          <View className="ok" aria-hidden="true">
            <View className="ok-check" />
          </View>
        </View>
        <Text className="word">对</Text>
      </View>
    </View>
  );
}
