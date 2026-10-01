import { Image, View } from "@tarojs/components";
import { assetFor } from "../theme/index.js";

/** A mascot by semantic slot. Missing art → nothing, never an error. */
export default function Mascot({ slot, className = "" }) {
  const src = assetFor(slot);
  if (!src) return null;
  return (
    <View className={`mascot ${className}`} aria-hidden="true">
      <Image className="mascot-img" src={src} mode="aspectFit" webp data-slot={slot} />
    </View>
  );
}
