import { View } from "@tarojs/components";
import ThemeImage from "./ThemeImage";

/** Edge decoration (07 decor.*). Home only, behind the content; never in training. */
export default function HomeDecor() {
  return (
    <View className="page-decor home-decor" aria-hidden="true">
      <ThemeImage slot="decor.cloud1" className="deco deco-cloud1" />
      <ThemeImage slot="decor.cloud2" className="deco deco-cloud2" />
      <ThemeImage slot="decor.hill" className="deco deco-hill" />
      <ThemeImage slot="decor.leaf1" className="deco deco-leaf" />
      <ThemeImage slot="decor.leaf2" className="deco deco-leaf2" />
      <ThemeImage slot="decor.sprout" className="deco deco-sprout" />
    </View>
  );
}
