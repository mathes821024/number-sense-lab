import { View, Text } from "@tarojs/components";

/** A short in-page note such as 「敬请期待」. Drawn by the page, no platform toast. */
export default function Notice({ text }) {
  if (!text) return null;
  return (
    <View className="notice" role="status">
      <Text>{text}</Text>
    </View>
  );
}
