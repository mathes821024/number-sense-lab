import { View } from "@tarojs/components";
import ThemeImage from "./ThemeImage";
import Icon from "./icon/Icon";
import { assetFor } from "../theme/index.js";

/**
 * A domain's round tile (h5/app.js domainArt): the theme picture when this
 * client has it, else the v0.4 interface glyph, else the plain round shape.
 * Decorative: the domain name next to it carries the meaning.
 */
export default function DomainTile({ domain, slot = "", glyph = "" }) {
  const hasArt = Boolean(slot && assetFor(slot));
  return (
    <View className={`tile tile-${domain}`} aria-hidden="true">
      {hasArt ? (
        <ThemeImage slot={slot} className="tile-art" />
      ) : (
        <View className="tile-glyph">{glyph ? <Icon name={glyph} /> : null}</View>
      )}
    </View>
  );
}
