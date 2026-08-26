import { FormEvent, useId, useState } from "react";

const waitlistEmail = "seonjae.k02@gmail.com";

export default function WaitlistForm() {
  const formId = useId();
  const [email, setEmail] = useState("");
  const [riderType, setRiderType] = useState("제주 도민");
  const [isPrepared, setIsPrepared] = useState(false);

  const prepareApplication = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPrepared(true);
  };

  const subject = encodeURIComponent("[TAPSO] 사전예약 신청");
  const body = encodeURIComponent(
    [
      "TAPSO 사전예약을 신청합니다.",
      "",
      `회신 이메일: ${email}`,
      `이용 유형: ${riderType}`,
      "",
      "입력 내용은 사용자의 메일 앱을 통해서만 전송됩니다.",
    ].join("\n"),
  );

  return (
    <div className="waitlist-form-card" data-figma-node-id="9:51">
      <form onSubmit={prepareApplication} aria-labelledby={`${formId}-title`}>
        <h3 id={`${formId}-title`} data-figma-node-id="9:52">첫 탑승 소식 받기</h3>

        <label className="figma-field" htmlFor={`${formId}-email`} data-figma-node-id="9:53">
          <span>이메일</span>
          <input
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="hello@example.com"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setIsPrepared(false);
            }}
          />
        </label>

        <label className="figma-field rider-type-field" htmlFor={`${formId}-type`} data-figma-node-id="9:57">
          <span>나는</span>
          <select
            id={`${formId}-type`}
            name="riderType"
            value={riderType}
            onChange={(event) => {
              setRiderType(event.target.value);
              setIsPrepared(false);
            }}
          >
            <option>제주 도민</option>
            <option>제주 여행객</option>
            <option>제주 버스 애호가</option>
            <option>그 외 지역에서 응원 중</option>
          </select>
        </label>

        {!isPrepared ? (
          <button className="figma-submit" type="submit" data-figma-node-id="9:61">
            신청서 만들기 <span aria-hidden="true">→</span>
          </button>
        ) : (
          <div className="waitlist-success" role="status" aria-live="polite">
            <strong>신청서가 다 됐수다.</strong>
            <a href={`mailto:${waitlistEmail}?subject=${subject}&body=${body}`}>
              메일 앱에서 보내기 <span aria-hidden="true">→</span>
            </a>
          </div>
        )}

        <p className="waitlist-privacy" data-figma-node-id="10:68">
          입력 내용은 사용자의 메일 앱을 통해서만 전송됩니다.
        </p>
      </form>
    </div>
  );
}
