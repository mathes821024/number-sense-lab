import { useState } from "react";
import { View, Text } from "@tarojs/components";
import Mascot from "./Mascot";
import MathText from "./math/MathText";
import Button from "./Button";

/**
 * Wrong: the correct relation is the main object, plus one hook. Input is
 * locked; no retry on this item. The student presses 「下一题」.
 */
export default function WrongFeedback({ prompt, feedback, onNext, onPause }) {
  const [showPattern, setShowPattern] = useState(false);
  const [showFrames, setShowFrames] = useState(false);
  const fb = feedback || {};
  const pattern = fb.level3 || fb.pattern || {};
  const frames = fb.level3?.frames || fb.frames || [];
  return (
    <View className="screen screen-wrong" data-testid="wrong">
      <View className="top">
        <Button kind="quiet" label="先停一下" onTap={onPause} />
      </View>
      <View className="wrong-head">
        <MathText value={prompt} className="demoted" />
        <Mascot slot="mascot.thinking" className="mascot-side" />
      </View>
      <View className="panel">
        <MathText value={fb.relation || ""} className="eq" />
        <MathText value={fb.hook || ""} className="hook" />
        <Text className="see">○ 看这里</Text>
        {showPattern ? (
          <View className="pattern">
            <MathText value={pattern.check || ""} className="check" />
            {(pattern.family || []).map((line, i) => (
              <MathText key={i} value={line} className="family" />
            ))}
          </View>
        ) : null}
        {showFrames ? (
          <View className="frames">
            {frames.map((f, i) => (
              <View className="frame" key={i}>
                <Text className="frame-n">{i + 1}</Text>
                <View className="frame-body">
                  <MathText value={f.title} className="frame-title" />
                  <MathText value={f.detail} className="frame-detail" />
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {!showPattern ? <Button kind="link" label="看看这个规律" onTap={() => setShowPattern(true)} /> : null}
      {!showFrames && frames.length ? <Button kind="link" label="看看这几步" onTap={() => setShowFrames(true)} /> : null}
      <Button kind="primary" label="下一题" onTap={onNext} testId="next" />
    </View>
  );
}
