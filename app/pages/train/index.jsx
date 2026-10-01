import { useEffect, useReducer, useRef, useState } from "react";
import { View, Text } from "@tarojs/components";
import { getStore, createCue, navigate, safeAreaStyle, useHardwareKeys, useRouteParams, useScreenLifecycle } from "../../platform/current";
import Button from "../../components/Button";
import Keypad from "../../components/Keypad";
import SetProgress from "../../components/SetProgress";
import MathText from "../../components/math/MathText";
import CorrectFeedback from "../../components/CorrectFeedback";
import WrongFeedback from "../../components/WrongFeedback";
import { createTrainingFlow, CORRECT_PAUSE_MS } from "./flow.js";

/**
 * Training, Correct and Wrong: one question per screen inside one page, so
 * the set is never split across navigation. The correct-answer pause is
 * shared UI (one ordinary timer); lifecycle signals only cancel it.
 */
export default function Train() {
  const params = useRouteParams();
  const store = getStore();
  const flowRef = useRef(null);
  if (!flowRef.current) flowRef.current = createTrainingFlow({ store });
  const flow = flowRef.current;
  const cueRef = useRef(null);
  if (!cueRef.current) cueRef.current = createCue(() => flow.state.prefs?.sound !== false);
  const cue = cueRef.current;

  const [, rerender] = useReducer((n) => n + 1, 0);
  const [pausing, setPausing] = useState(false);
  const timer = useRef(0);
  const interrupted = useRef(false);

  useEffect(() => {
    if (params.intent === "resume") flow.resume();
    else flow.begin("daily", null);
    rerender();
    return () => clearTimeout(timer.current);
  }, []);

  const view = flow.view();

  useEffect(() => {
    if (view.screen === "done") {
      if (!view.summary?.earlyStop) cue.done();
      navigate.toHome();
    }
  }, [view.screen]);

  const advance = () => {
    clearTimeout(timer.current);
    timer.current = 0;
    flow.advance();
    rerender();
  };

  const submit = () => {
    const outcome = flow.submit();
    if (outcome === "correct") {
      cue.correct();
      clearTimeout(timer.current);
      timer.current = setTimeout(advance, CORRECT_PAUSE_MS);
    } else if (outcome === "wrong") {
      cue.wrong();
    }
    if (outcome) rerender();
  };

  const digit = (d, mode = "onscreen_keypad") => {
    if (flow.input(d, mode)) {
      cue.tap();
      rerender();
    }
  };
  const erase = (mode = "onscreen_keypad") => {
    if (flow.erase(mode)) rerender();
  };

  // Hidden or unloaded during the short pause: cancel it; finish it safely on return.
  useScreenLifecycle({
    onHide: () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = 0;
        interrupted.current = true;
      }
    },
    onShow: () => {
      if (interrupted.current) {
        interrupted.current = false;
        advance();
      }
    },
    onUnload: () => clearTimeout(timer.current),
  });

  useHardwareKeys((key) => {
    if (flow.view().screen !== "train" || pausing) return false;
    if (key === "enter") submit();
    else if (key === "backspace") erase("physical_keyboard");
    else digit(key, "physical_keyboard");
    return true;
  });

  const stop = () => {
    setPausing(false);
    flow.stop();
    rerender();
  };

  let body = null;
  if (view.screen === "train" && view.item) {
    body = (
      <View className="screen screen-train" data-testid="train">
        <View className="top">
          <Button kind="quiet" label="先停一下" onTap={() => setPausing(true)} />
          <Text className="pill">{view.pill}</Text>
        </View>
        <SetProgress position={view.position} total={view.total} />
        <View className="card practice">
          <MathText value={view.item.prompt} className="question" />
          <View className="answer" aria-live="polite" data-testid="answer">
            <Text>{view.answer}</Text>
          </View>
          <Text className="nudge">{view.nudge}</Text>
        </View>
        <Keypad showDot={view.needsDecimalPoint} onDigit={(d) => digit(d)} onErase={() => erase()} onSubmit={submit} />
      </View>
    );
  } else if (view.screen === "correct") {
    body = <CorrectFeedback relation={view.feedback?.relation || view.item?.relation || ""} onSkip={advance} />;
  } else if (view.screen === "wrong") {
    body = (
      <WrongFeedback
        key={`${view.item?.id}-${view.position}`}
        prompt={view.item?.prompt || ""}
        feedback={view.feedback}
        onNext={advance}
        onPause={() => setPausing(true)}
      />
    );
  }

  return (
    <View className="page page-train" style={safeAreaStyle()}>
      <View className="column">{body}</View>
      {pausing ? (
        <View className="overlay" data-testid="pause">
          <View className="card dialog">
            <Text className="ask">先停在这里？</Text>
            <Text className="stay">已经做的会留下。</Text>
            <Button kind="primary" label="继续做" onTap={() => setPausing(false)} />
            <Button kind="secondary" label="先停" onTap={stop} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
