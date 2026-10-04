import { View, Text } from "@tarojs/components";
import Icon from "./icon/Icon";

/** The quiet pill at the top of an ordinary page: 回首页 / 返回练习 / 回错题本 / 返回选题. */
export default function BackButton({ label, icon = "arrow-left", onTap, action = "back" }) {
  return (
    <View className="quiet back" hoverClass="quiet-pressed" role="button" data-action={action} onClick={onTap}>
      <Icon name={icon} className="back-mark" />
      <Text>{label}</Text>
    </View>
  );
}
