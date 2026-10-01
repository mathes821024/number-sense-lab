import { Text } from "@tarojs/components";
import { GLYPHS } from "./glyphs.js";

/**
 * A Phosphor glyph from the embedded subset (icon-font.css) — the same icons
 * main's h5/ shows, drawn as text so it takes the surrounding colour on H5
 * and in the Mini Program. Decorative: the words next to it carry the meaning.
 */
export default function Icon({ name, className = "" }) {
  const glyph = GLYPHS[name];
  if (!glyph) return null;
  return (
    <Text className={`icon ${className}`} aria-hidden="true">
      {glyph}
    </Text>
  );
}
