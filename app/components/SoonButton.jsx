import { View, Text } from "@tarojs/components";
import Icon from "./icon/Icon";

/** A placeholder that only says 敬请期待 (h5/app.js soonButton). It never starts practice. */
export default function SoonButton({ name, icon, chip = false, onTap }) {
  return (
    <View className={chip ? "soon-chip" : "soon-tile"} role="button" data-action="soon" data-soon={name} onClick={() => onTap(name)}>
      <View className="soon-icon" aria-hidden="true">
        <Icon name={icon} />
      </View>
      <View className="soon-copy">
        <Text className="soon-name">{name}</Text>
        <Text className="soon-badge">敬请期待</Text>
      </View>
    </View>
  );
}
