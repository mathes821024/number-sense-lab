import { View, Text } from "@tarojs/components";

/** Primary (one per screen), secondary, or quiet. A drawn button, the same on every client. */
export default function Button({ kind = "primary", label, sub, onTap, className = "", testId }) {
  return (
    <View
      className={`btn btn-${kind} ${className}`}
      hoverClass="btn-pressed"
      role="button"
      data-testid={testId}
      onClick={onTap}
    >
      <Text className="btn-label">{label}</Text>
      {sub ? <Text className="btn-sub">{sub}</Text> : null}
    </View>
  );
}
