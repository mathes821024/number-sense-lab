import { View, Text } from "@tarojs/components";

/** 「敬请期待」 for placeholders: a short status line above the tab bar, drawn by the page. */
export default function Notice({ text }) {
  return (
    <View className={`toast${text ? " is-on" : ""}`} role="status" aria-live="polite" data-testid="toast">
      <Text>{text}</Text>
    </View>
  );
}
