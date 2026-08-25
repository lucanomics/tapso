import { useState } from "react";
import { ArrowIcon, BusIcon, SignalIcon } from "./Icons";

const journeyStates = [
  {
    key: "ride",
    label: "이동 중 8",
    compact: "8 정거장",
    remaining: "8",
    instruction: "제주 바람 따라 잘 가고 있어요.",
    detail: "지금은 휴대폰을 내려놓아도 괜찮아요.",
    tone: "mint",
    progress: 24,
  },
  {
    key: "prepare",
    label: "준비 2",
    compact: "준비 2",
    remaining: "2",
    instruction: "슬슬 내릴 준비를 해요.",
    detail: "목적지까지 두 정거장 남았어요.",
    tone: "amber",
    progress: 68,
  },
  {
    key: "next",
    label: "다음 하차",
    compact: "다음 하차",
    remaining: "1",
    instruction: "다음 정류장에서 내려요.",
    detail: "곧 목적지에 도착해요.",
    tone: "coral",
    progress: 86,
  },
  {
    key: "arrived",
    label: "내려요",
    compact: "내려요",
    remaining: "0",
    instruction: "목적지에 도착했어요.",
    detail: "안전하게 내려 주세요.",
    tone: "orange",
    progress: 100,
  },
] as const;

export default function IslandExperience() {
  const [activeIndex, setActiveIndex] = useState(0);
  const state = journeyStates[activeIndex];

  const advance = () => {
    setActiveIndex((current) => (current + 1) % journeyStates.length);
  };

  return (
    <div className={`island-demo tone-${state.tone}`}>
      <div className="island-stage" aria-live="polite">
        <div className="compact-island compact-left" aria-hidden="true">
          <BusIcon />
          <strong>365</strong>
          <span className="destination-dot" />
        </div>

        <div className="expanded-island">
          <div className="island-topline">
            <div className="route-lockup">
              <span className="mini-buddy">
                <img src="/media/dori.png" alt="" />
              </span>
              <div>
                <strong>{state.instruction}</strong>
                <span>제주출입국·외국인청 → 용문마을</span>
              </div>
            </div>
            <SignalIcon className="signal-icon" />
          </div>

          <div className="island-progress" aria-hidden="true">
            <span className="island-progress-fill" style={{ width: `${state.progress}%` }} />
            <span className="bus-marker" style={{ left: `calc(${state.progress}% - 10px)` }}>
              <BusIcon />
            </span>
            <span className="destination-dot" />
          </div>

          <div className="island-bottomline">
            <span>{state.detail}</span>
            <strong>{state.compact}</strong>
          </div>
        </div>

        <div className="compact-island compact-right">
          <BusIcon />
          <strong>365</strong>
          <span>{state.compact}</span>
        </div>
      </div>

      <div className="state-rail" aria-label="다이나믹 아일랜드 여정 상태 선택">
        {journeyStates.map((item, index) => (
          <button
            className={index === activeIndex ? "state-step active" : "state-step"}
            key={item.key}
            type="button"
            aria-pressed={index === activeIndex}
            onClick={() => setActiveIndex(index)}
          >
            <span className="state-node" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <button className="advance-button" type="button" onClick={advance}>
        다음 상태 보기
        <ArrowIcon />
      </button>
    </div>
  );
}
