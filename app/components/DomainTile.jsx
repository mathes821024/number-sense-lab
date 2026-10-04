import { useState } from "react";
import { Image, View } from "@tarojs/components";
import Icon from "./icon/Icon";
import { assetFor } from "../theme/index.js";

/**
 * A domain's icon chip (h5/app.js domainArt): the F-B PNG in the domain's
 * `domain.<domain_id>` slot (assets/themes/math-lab/specialist/asset-manifest.json,
 * docs/ui/08_fb_specialist_visual.md §1) on its group's light chip. If the slot
 * has no file or the file fails to load, the domain's interface glyph shows in
 * the same chip, so no tile is ever empty. Decorative: the name next to it
 * carries the meaning.
 */
export default function DomainTile({ domain, slot = "", glyph = "", tone = "" }) {
  const src = slot ? assetFor(slot) : "";
  const [broken, setBroken] = useState(false);
  const hasArt = Boolean(src) && !broken;
  return (
    <View className={`tile tile-${domain}${tone ? ` tone-${tone}` : ""}${hasArt ? " has-art" : ""}${broken ? " is-broken" : ""}`} aria-hidden="true">
      {hasArt ? (
        <View className="tile-art" data-slot={slot}>
          <Image className="theme-img" src={src} mode="aspectFit" onError={() => setBroken(true)} />
        </View>
      ) : (
        <View className="tile-glyph">{glyph ? <Icon name={glyph} /> : null}</View>
      )}
    </View>
  );
}
