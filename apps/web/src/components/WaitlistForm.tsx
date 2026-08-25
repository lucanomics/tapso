import { FormEvent, useId, useState } from "react";
import { ArrowIcon } from "./Icons";

const waitlistEmail = "seonjae.k02@gmail.com";

type WaitlistDraft = {
  name: string;
  email: string;
  riderType: string;
  message: string;
};

const initialDraft: WaitlistDraft = {
  name: "",
  email: "",
  riderType: "제주 도민",
  message: "",
};

export default function WaitlistForm() {
  const formId = useId();
  const [draft, setDraft] = useState(initialDraft);
  const [isPrepared, setIsPrepared] = useState(false);

  const update = (field: keyof WaitlistDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setIsPrepared(false);
  };

  const prepareApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPrepared(true);
  };

  const subject = encodeURIComponent("[TAPSO] 사전예약 신청");
  const body = encodeURIComponent(
    [
      "TAPSO 사전예약을 신청합니다.",
      "",
      `이름: ${draft.name || "미입력"}`,
      `회신 이메일: ${draft.email}`,
      `이용 유형: ${draft.riderType}`,
      `남기실 말: ${draft.message || "없음"}`,
      "",
      "사전예약 안내를 위한 이메일 이용에 동의합니다.",
    ].join("\n"),
  );

  return (
    <div className="waitlist-card">
      <form onSubmit={prepareApplication} aria-labelledby={`${formId}-title`}>
        <div className="waitlist-card-heading">
          <span id={`${formId}-title`}>첫 탑승 소식 받기</span>
          <strong>무료 사전예약</strong>
        </div>

        <div className="form-row">
          <label htmlFor={`${formId}-name`}>이름 <span>선택</span></label>
          <input
            id={`${formId}-name`}
            name="name"
            type="text"
            autoComplete="name"
            placeholder="어떻게 불러드릴까요?"
            value={draft.name}
            onChange={(event) => update("name", event.target.value)}
          />
        </div>

        <div className="form-row">
          <label htmlFor={`${formId}-email`}>이메일</label>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="hello@example.com"
            required
            value={draft.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </div>

        <div className="form-row">
          <label htmlFor={`${formId}-type`}>나는</label>
          <select
            id={`${formId}-type`}
            name="riderType"
            value={draft.riderType}
            onChange={(event) => update("riderType", event.target.value)}
          >
            <option>제주 도민</option>
            <option>제주 여행객</option>
            <option>제주 버스 애호가</option>
            <option>그 외 지역에서 응원 중</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor={`${formId}-message`}>한마디 <span>선택</span></label>
          <textarea
            id={`${formId}-message`}
            name="message"
            rows={3}
            placeholder="자주 타는 노선이나 기대하는 기능을 알려주세요."
            value={draft.message}
            onChange={(event) => update("message", event.target.value)}
          />
        </div>

        <label className="consent-row">
          <input type="checkbox" required />
          <span>사전예약 안내를 위한 이메일 이용에 동의해요.</span>
        </label>

        {!isPrepared ? (
          <button className="waitlist-submit" type="submit">
            신청서 만들기
            <ArrowIcon />
          </button>
        ) : (
          <div className="waitlist-ready" role="status" aria-live="polite">
            <span aria-hidden="true">🍊</span>
            <div>
              <strong>신청서가 다 됐수다!</strong>
              <p>메일 앱에서 보내기를 누르면 사전예약이 완료돼요.</p>
            </div>
            <a href={`mailto:${waitlistEmail}?subject=${subject}&body=${body}`}>
              메일로 보내기
              <ArrowIcon />
            </a>
          </div>
        )}

        <p className="form-privacy">입력 내용은 사용자의 메일 앱을 통해서만 전송됩니다.</p>
      </form>
    </div>
  );
}
