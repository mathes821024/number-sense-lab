import { useState } from "react";
import { Text, View } from "@tarojs/components";
import { Mascot } from "./ThemeImage";

const DEFAULT_OBSERVATION = "先看关系，再决定怎么算。";

/**
 * A quiet, display-only companion. It never writes learning state and becomes
 * interactive only when a page explicitly opts in.
 */
export default function MascotCompanion({
  pose = "welcome",
  observation = DEFAULT_OBSERVATION,
  interactive = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const canObserve = interactive === true && Boolean(observation);
  return (
    <View className={`mascot-companion pose-${pose}${className ? ` ${className}` : ""}`} data-companion={pose}>
      <Mascot pose={pose} className="mascot-companion-image" />
      {canObserve ? (
        <View
          className="companion-observe"
          hoverClass="companion-observe-pressed"
          role="button"
          aria-expanded={open}
          data-action="companion-observation"
          onClick={() => setOpen(!open)}
        >
          <Text>{open ? observation : "听听伙伴的观察"}</Text>
        </View>
      ) : null}
      {canObserve && open ? <Text className="companion-note" role="status">{observation}</Text> : null}
    </View>
  );
}
