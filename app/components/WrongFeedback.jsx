import { useState } from "react";
import { View, Text } from "@tarojs/components";
import ThemeImage, { Mascot } from "./ThemeImage";
import MathText from "./math/MathText";
import Icon from "./icon/Icon";

/**
 * Wrong (h5/app.js renderWrong): it stops. The question steps back, the
 * correct relation is the largest thing, then the short hook (小提示) and
 * 「看这里」. The pattern and the steps open only when asked. No keypad, no
 * retry of this item; the student presses 「下一题」.
 */
export default function WrongFeedback({ prompt, feedback, onNext, onPause }) {
  const [showPattern, setShowPattern] = useState(false);
  const [showFrames, setShowFrames] = useState(false);
  const fb = feedback || {};
  const pattern = fb.level3 || fb.pattern || {};
  const frames = fb.level3?.frames || fb.frames || [];
  return (
    <View className="screen screen-wrong" data-testid="wrong">
      <View className="quiet pill-quiet" role="button" onClick={onPause} data-action="pause">
        <Text>先停一下</Text>
      </View>
      <View className="wrong-head">
        <MathText value={prompt} className="demoted" />
        <View className="wrong-art">
          <Mascot pose="thinking" className="mascot-side" />
          <ThemeImage slot="decor.question" className="hero-question" />
        </View>
      </View>
      <View className="panel">
        <MathText value={fb.relation || ""} className="eq" />
        <View className="hook">
          <View className="hint-label">
            <Icon name="lightbulb" />
            <Text>小提示</Text>
          </View>
          <MathText value={fb.hook || ""} className="hook-text" />
        </View>
        <View className="see">
          <Text className="see-mark" aria-hidden="true">○</Text>
          <Text> 看这里</Text>
        </View>
        {showPattern ? (
          <View className="pattern" data-testid="pattern">
            <MathText value={pattern.check || ""} className="check" />
            <View className="family">
              {(pattern.family || []).map((line, i) => (
                <View className="family-line" key={i}>
                  <MathText value={line} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {showFrames ? (
          <View className="frames" data-testid="frames">
            {frames.map((f, i) => (
              <View className="frame" key={i}>
                <Text className="n">{i + 1}</Text>
                <View className="frame-body">
                  <MathText value={f.title} className="frame-title" />
                  <MathText value={f.detail} className="frame-detail" />
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <View className="more" role="button" onClick={() => setShowPattern(true)} data-action="expand-pattern">
        <Text>看看这个规律</Text>
      </View>
      <View className="more" role="button" onClick={() => setShowFrames(true)} data-action="expand-frames">
        <Text>看看这几步</Text>
      </View>
      <View className="cta" hoverClass="cta-pressed" role="button" onClick={onNext} data-testid="next">
        <Text>下一题</Text>
      </View>
    </View>
  );
}
