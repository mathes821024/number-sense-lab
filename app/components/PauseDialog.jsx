import { View, Text } from "@tarojs/components";

/**
 * 先停一下 (h5/app.js renderPause): continue, or stop and keep what was done.
 * The quiet 「重新开始一小段」 under them is the restart Home used to show
 * (same action: drop the unfinished set, start a new daily one).
 */
export default function PauseDialog({ onResume, onStop, onRestart }) {
  return (
    <View className="screen screen-pause" data-testid="pause">
      <View className="dialog">
        <Text className="ask">先停在这里？</Text>
        <Text className="stay">已经做的会留下。</Text>
        <View className="cta" hoverClass="cta-pressed" role="button" onClick={onResume} data-action="resume-train">
          <Text>继续做</Text>
        </View>
        <View className="cta secondary" hoverClass="cta-pressed" role="button" onClick={onStop} data-action="stop-session">
          <Text>先停</Text>
        </View>
        {onRestart ? (
          <View className="quiet pause-restart" hoverClass="quiet-pressed" role="button" onClick={onRestart} data-action="restart-daily">
            <Text>重新开始一小段</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
