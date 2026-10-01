import { View, Text } from "@tarojs/components";
import ThemeImage, { Mascot } from "./ThemeImage";
import MathText from "./math/MathText";
import Icon from "./icon/Icon";

/**
 * End of a set (h5/app.js renderEnd): reached by finishing the set, by
 * 「先停」, or from Home's 「看看这次」. Words and numbers from the stored
 * summary (src/core finishSession). 「看看最近练得怎么样」 opens Progress,
 * which is not migrated yet (敬请期待).
 */
export default function SessionEnd({ result, onHome, onProgress }) {
  if (!result) {
    return (
      <View className="screen" data-testid="end-empty">
        <Text className="lede">还没有结束记录。</Text>
        <View className="cta" role="button" onClick={onHome}>
          <Text>回首页</Text>
        </View>
      </View>
    );
  }
  const stopped = Boolean(result.earlyStop);
  return (
    <View className="screen screen-end" data-testid="end">
      <View className="end-art">
        <Mascot pose={stopped ? "welcome" : "correct"} className="mascot-end" />
        {stopped ? null : <ThemeImage slot="decor.sparkle" className="hero-spark" />}
      </View>
      <Text className="end-title">{stopped ? "先停在这里了" : "先到这里"}</Text>
      <Text className="lede end-lede">{stopped ? "已经做的留下了。" : "这一小段练完了。"}</Text>
      <View className="card end-card">
        <Text className="body">{`对了 ${result.correct} 题，做了 ${result.total} 题。`}</Text>
        {result.grewFamiliar && result.grewFamiliar.length ? (
          <View className="body familiar">
            <Text>这几个更熟了：</Text>
            {result.grewFamiliar.map((rel, i) => (
              <View className="familiar-item" key={i}>
                <MathText value={rel} />
                <Text>{i < result.grewFamiliar.length - 1 ? "、" : "。"}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <View className="cta" hoverClass="cta-pressed" role="button" onClick={onHome} data-action="home">
        <Text>先到这里</Text>
      </View>
      <View className="links">
        <View className="link-row" role="button" onClick={onProgress} data-action="progress">
          <Icon name="chart-line" className="link-mark" />
          <Text>看看最近练得怎么样</Text>
        </View>
      </View>
    </View>
  );
}
