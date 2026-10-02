import { useEffect, useReducer, useRef } from "react";
import { View, Text } from "@tarojs/components";
import {
  getStore,
  createCue,
  monotonicNow,
  navigate,
  safeArea,
  motionClass,
  useHardwareKeys,
  useRouteParams,
  useScreenLifecycle,
} from "../../platform/current";
import Keypad from "../../components/Keypad";
import AnswerBox from "../../components/AnswerBox";
import FractionFields from "../../components/FractionFields";
import { promptStem } from "../../../src/core/fraction-fields.js";
import SetProgress from "../../components/SetProgress";
import MathText from "../../components/math/MathText";
import { hasWords } from "../../components/math/tokens.js";
import CorrectFeedback from "../../components/CorrectFeedback";
import WrongFeedback from "../../components/WrongFeedback";
import PauseDialog from "../../components/PauseDialog";
import SessionEnd from "../../components/SessionEnd";
import BottomNav from "../../components/BottomNav";
import Notice from "../../components/Notice";
import useNotice from "../../components/useNotice";
import { createTrainingFlow, CORRECT_PAUSE_MS } from "./flow.js";
import { getRecord } from "../record.js";

/** FOCUS screens: no bottom entries while the student is answering (02_ux_spec §4). */
const FOCUS = new Set(["train", "correct", "wrong", "pause"]);

/**
 * Training, Correct, Wrong, the pause dialog and the end of the set, as one
 * page so a set is never split across navigation. The correct-answer pause is
 * shared UI (one ordinary timer, 700ms); lifecycle signals only cancel it.
 */
export default function Train() {
  const params = useRouteParams();
  const record = getRecord(getStore);
  const flowRef = useRef(null);
  if (!flowRef.current) flowRef.current = createTrainingFlow({ store: record, now: monotonicNow });
  const flow = flowRef.current;
  const cueRef = useRef(null);
  if (!cueRef.current) cueRef.current = createCue(() => flow.state.prefs?.sound !== false);
  const cue = cueRef.current;

  const [, rerender] = useReducer((n) => n + 1, 0);
  const [notice, showSoon] = useNotice();
  const [tick, bumpTick] = useReducer((n) => n + 1, 0);
  const timer = useRef(0);
  const interrupted = useRef(false);

  useEffect(() => {
    const intent = params.intent || "start-daily";
    if (intent === "resume") flow.resume();
    else if (intent === "restart-daily") flow.restart("daily", null);
    else if (intent === "see-last") flow.showLast();
    else flow.begin("daily", null);
    rerender();
    return () => clearTimeout(timer.current);
  }, []);

  const view = flow.view();

  const advance = () => {
    clearTimeout(timer.current);
    timer.current = 0;
    const before = flow.view().screen;
    const after = flow.advance();
    if (before !== "end" && after === "end") cue.done();
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

  const key = (k, mode = "onscreen_keypad") => {
    if (flow.input(k, mode)) {
      cue.tap();
      bumpTick();
      rerender();
    }
  };
  const focusBox = (which) => {
    if (flow.focus(which)) rerender();
  };
  const erase = (mode = "onscreen_keypad") => {
    if (flow.erase(mode)) {
      bumpTick();
      rerender();
    }
  };

  // Hidden or unloaded during the short pause: cancel it, and finish it
  // safely on return (the answer is already recorded; nothing is re-judged).
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

  useHardwareKeys((k) => {
    if (flow.view().screen !== "train") return false;
    if (k === "enter") submit();
    else if (k === "backspace") erase("physical_keyboard");
    else key(k, "physical_keyboard");
    return true;
  });

  const pause = () => {
    if (flow.pause()) rerender();
  };
  const unpause = () => {
    if (flow.unpause()) rerender();
  };
  const stop = () => {
    flow.stop();
    rerender();
  };

  let body = null;
  if (view.screen === "train" && view.item) {
    body = (
      <View className="screen screen-train" data-testid="train" data-item={view.item.id}>
        <View className="top">
          <View className="quiet pill-quiet" role="button" onClick={pause} data-action="pause">
            <Text>先停一下</Text>
          </View>
          <Text className="pill">{view.pill}</Text>
        </View>
        <SetProgress position={view.position} total={view.total} />
        <View className="practice-zone">
          <Text className="practice-label">看清关系，再写答案</Text>
          {view.fields ? (
            <View className="question-fields" key={view.item.id}>
              <MathText value={promptStem(view.item.prompt)} className="question" />
              <FractionFields fields={view.fields} onFocus={focusBox} tick={tick % 2 === 1} />
            </View>
          ) : (
            <>
              <MathText value={view.item.prompt} className={hasWords(view.item.prompt) ? "question is-words" : "question"} key={view.item.id} />
              <AnswerBox item={view.item} answer={view.answer} tick={tick % 2 === 1} />
            </>
          )}
          <View className="nudge" data-testid="nudge">
            {view.nudge ? <MathText value={view.nudge} /> : null}
          </View>
        </View>
        <Keypad extraKey={view.extraKey} onKey={(k) => key(k)} onErase={() => erase()} onSubmit={submit} />
      </View>
    );
  } else if (view.screen === "correct") {
    body = <CorrectFeedback relation={view.feedback?.relation || view.item?.relation || ""} />;
  } else if (view.screen === "wrong") {
    body = (
      <WrongFeedback
        key={`${view.item?.id}-${view.position}`}
        prompt={view.item?.prompt || ""}
        feedback={view.feedback}
        onNext={advance}
        onPause={pause}
      />
    );
  } else if (view.screen === "pause") {
    body = <PauseDialog onResume={unpause} onStop={stop} />;
  } else if (view.screen === "end") {
    body = (
      <SessionEnd result={view.result} onHome={() => navigate.toHome()} onProgress={() => showSoon("最近练得怎么样")} />
    );
  } else {
    body = (
      <View className="screen" data-testid="train-empty">
        <Text className="lede">这一段没有题目了。</Text>
        <View className="cta" role="button" onClick={() => navigate.toHome()}>
          <Text>回首页</Text>
        </View>
      </View>
    );
  }

  const withNav = !FOCUS.has(view.screen);
  return (
    <View
      className={`page${withNav ? " has-nav" : ""} ${motionClass}`}
      style={{ paddingTop: `calc(16px + ${safeArea.top})`, paddingBottom: withNav ? undefined : `calc(32px + ${safeArea.bottom})` }}
    >
      <View className="stage">{body}</View>
      {withNav ? (
        <>
          <Notice text={notice} />
          <BottomNav
            active=""
            bottomInset={safeArea.bottom}
            onTap={(id, label) => (id === "home" ? navigate.toHome() : showSoon(label))}
          />
        </>
      ) : null}
    </View>
  );
}
