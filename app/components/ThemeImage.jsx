import { Image, View } from "@tarojs/components";
import { assetFor } from "../theme/index.js";

/**
 * A theme picture by semantic slot (mascot.*, decor.*, logo.mark). Pictures
 * are decorative; the words around them carry the meaning. A slot the client
 * does not fill renders nothing, never an error.
 */
export default function ThemeImage({ slot, className = "" }) {
  const src = assetFor(slot);
  if (!src) return null;
  return (
    <View className={className} aria-hidden="true" data-slot={slot}>
      <Image className="theme-img" src={src} mode="widthFix" />
    </View>
  );
}

/** Mascot poses: welcome on Home and the stop page, correct / thinking on feedback. Never on the question. */
export function Mascot({ pose, className = "" }) {
  return <ThemeImage slot={`mascot.${pose}`} className={`mascot ${className}`} />;
}
