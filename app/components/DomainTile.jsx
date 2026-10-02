import { View } from "@tarojs/components";
import ThemeImage from "./ThemeImage";
import Icon from "./icon/Icon";
import { assetFor } from "../theme/index.js";

/**
 * A domain's round tile (h5/app.js domainArt): the file in the theme's
 * `domain.<domain_id>` slot when this client has one, else the domain's
 * interface glyph on its group's light tint (05 §5, §7), else the plain round
 * shape. Decorative: the domain name next to it carries the meaning.
 */
export default function DomainTile({ domain, slot = "", glyph = "", tone = "" }) {
  const hasArt = Boolean(slot && assetFor(slot));
  return (
    <View className={`tile tile-${domain}${tone ? ` tone-${tone}` : ""}`} aria-hidden="true">
      {hasArt ? (
        <ThemeImage slot={slot} className="tile-art" />
      ) : (
        <View className="tile-glyph">{glyph ? <Icon name={glyph} /> : null}</View>
      )}
    </View>
  );
}
