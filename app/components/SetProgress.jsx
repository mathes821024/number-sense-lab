import { View, Text } from "@tarojs/components";
import { setPositionLabel } from "../../src/core/progress-label.js";

/** Calm position in this short set: 「第 k 题 · 共 10 题」 and a still bar. Not a timer; nothing animates or counts down. */
export default function SetProgress({ position, total }) {
  const done = Math.max(0, Math.min(total, position - 1));
  return (
    <View className="set-progress">
      <Text className="set-count" data-testid="set-count">{setPositionLabel(position, total)}</Text>
      <View className="set-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <View className="set-bar-fill" style={{ width: `${(done / total) * 100}%` }} />
      </View>
    </View>
  );
}
