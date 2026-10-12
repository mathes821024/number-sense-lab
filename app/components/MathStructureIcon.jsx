import { Text, View } from "@tarojs/components";

function NumberLine({ compare = false, move = false }) {
  return (
    <View className="ms-number-line">
      <View className="ms-axis" />
      <View className="ms-tick is-left" />
      <View className="ms-tick is-zero" />
      <View className="ms-tick is-right" />
      <Text className="ms-zero">0</Text>
      {compare ? <><View className="ms-point is-a" /><View className="ms-point is-b" /></> : null}
      {move ? <View className="ms-move">›</View> : null}
    </View>
  );
}

export default function MathStructureIcon({ kind }) {
  let graphic;
  if (kind === "number-line") graphic = <NumberLine />;
  else if (kind === "compare-points") graphic = <NumberLine compare />;
  else if (kind === "signed-move") graphic = <NumberLine move />;
  else if (kind === "grouping") graphic = (
    <View className="ms-groups"><View><Text>••</Text></View><View><Text>••</Text></View></View>
  );
  else if (kind === "fraction-align") graphic = (
    <View className="ms-fractions"><View className="ms-frac-line is-short" /><View className="ms-frac-line" /></View>
  );
  else if (kind === "fraction-area") graphic = (
    <View className="ms-area"><View /><View className="is-fill" /><View /><View className="is-fill" /></View>
  );
  else if (kind === "power") graphic = <View className="ms-power"><Text>a</Text><Text className="ms-power-sup">²</Text></View>;
  else graphic = (
    <View className="ms-tree"><View className="ms-tree-top" /><View className="ms-tree-branch is-left" /><View className="ms-tree-branch is-right" /><View className="ms-tree-dot is-left" /><View className="ms-tree-dot is-right" /></View>
  );
  return <View className={`math-structure-icon kind-${kind || "unknown"}`} aria-hidden="true">{graphic}</View>;
}
