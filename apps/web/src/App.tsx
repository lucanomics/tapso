import IslandExperience from "./components/IslandExperience";
import WaitlistForm from "./components/WaitlistForm";
import {
  ArrowIcon,
  BusIcon,
  LinkIcon,
  RefreshIcon,
  ShieldIcon,
  SignalIcon,
  StopListIcon,
} from "./components/Icons";

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="TAPSO 탑서 홈">
      <img src="/media/app-icon.png" alt="" />
      <strong>TAPSO</strong>
      <span>탑서</span>
    </a>
  );
}

function Header() {
  return (
    <header className="figma-header" data-figma-node-id="4:3">
      <a
        className="figma-brand-lockup"
        href="#top"
        aria-label="TAPSO 탑서 홈"
        data-figma-node-id="4:4"
      >
        TAPSO 탑서
      </a>
      <span className="figma-platform-badge" data-figma-node-id="4:5">
        WEB · iOS · ANDROID
      </span>
    </header>
  );
}

function Hero() {
  return (
    <section
      className="figma-hero"
      id="top"
      aria-labelledby="tapso-hero-title"
      data-figma-node-id="4:2"
    >
      <div className="figma-hero-canvas">
        <div className="figma-hero-copy" data-figma-node-id="4:7">
          <h1 id="tapso-hero-title" data-figma-node-id="4:8">
            <span>와리지 말앙 혼저 탑서.</span>
            <span>내릴 땐 알려드리쿠다.</span>
          </h1>
          <p data-figma-node-id="4:9">
            제주 버스를 차량 기준으로 확인하고,
            <br className="figma-desktop-break" />
            중요한 여정 순간을 가장 가까운 화면에 보여주는 승차 동반자.
          </p>
        </div>

        <div
          className="figma-dynamic-island"
          aria-label="365번 버스가 정상 운행 중이며 목적지까지 8정류장 남음"
          data-figma-node-id="4:10"
        >
          <strong className="figma-island-route" data-figma-node-id="4:11">
            🚌 365
          </strong>
          <span className="figma-island-copy" data-figma-node-id="4:12">
            <strong>제주 바람 따라 잘 가고 있어요.</strong>
            <span>8 정류장 남음</span>
          </span>
        </div>

        <div className="figma-dori" aria-hidden="true" data-figma-node-id="4:13">
          <span className="figma-dori-body" data-figma-node-id="4:14" />
          <span className="figma-dori-tangerine" data-figma-node-id="4:15" />
          <span className="figma-dori-face" data-figma-node-id="4:16">
            • ᴗ •
          </span>
        </div>

        <p className="figma-sync-note" data-figma-node-id="4:17">
          Design system v0.2 · Figma ↔ Web sync · 2026-08-26 · 차량 추적, 승객 GPS 기본 사용 안 함
        </p>
      </div>
    </section>
  );
}

function FeatureIntro() {
  return (
    <section className="feature-intro" id="features">
      <div className="section-heading narrow">
        <h2>휴대폰을 내려놓아도,<br />중요한 순간은 놓치지 않게.</h2>
        <p>
          목적지와 남은 정류장이 가장 먼저 보입니다. 정보가 늦거나 차량이
          확실하지 않을 때는 알림보다 확인을 먼저 합니다.
        </p>
      </div>
      <div className="feature-ribbon" role="list" aria-label="TAPSO 핵심 원칙">
        <div role="listitem">
          <BusIcon />
          <span>차량을 추적</span>
          <strong>승객 GPS가 아닌 버스 기준</strong>
        </div>
        <div role="listitem">
          <SignalIcon />
          <span>한눈에 확인</span>
          <strong>남은 정류장과 데이터 상태</strong>
        </div>
        <div role="listitem">
          <ShieldIcon />
          <span>애매하면 멈춤</span>
          <strong>확신 없이는 자동 선택 안 함</strong>
        </div>
      </div>
    </section>
  );
}

function IslandSection() {
  return (
    <section className="island-section" id="island">
      <div className="island-copy">
        <h2>앱을 보고 있지 않아도,<br /><span>여정은 계속 보여요.</span></h2>
        <p>남은 정류장은 항상 보이고, 두 정거장 전부터 차분하게 준비를 시작해요.</p>
      </div>
      <IslandExperience />
    </section>
  );
}

function MatchingSection() {
  return (
    <section className="matching-section" id="matching">
      <div className="matching-copy">
        <h2>감이 아니라,<br />차량을 확인합니다.</h2>
        <p>노선·방향·정류장 순서·데이터 신선도를 함께 보고, 애매하면 추측하지 않아요.</p>

        <div className="route-story" aria-label="365번 버스 진행 예시">
          <div className="route-line" aria-hidden="true"><span /></div>
          <div className="route-stop done">
            <span className="route-node"><BusIcon /></span>
            <div><small>출발</small><strong>제주출입국·외국인청</strong></div>
          </div>
          <div className="route-stop current">
            <span className="route-node" />
            <div><small>현재</small><strong>제주버스터미널</strong><em>탑승 중 · 8정류장 이동</em></div>
          </div>
          <div className="route-stop">
            <span className="route-node" />
            <div><small>다음 정류장</small><strong>용문마을</strong></div>
          </div>
          <div className="route-stop destination">
            <span className="route-node" />
            <div><small>도착 정류장</small><strong>신제주초등학교</strong></div>
          </div>
        </div>
      </div>

      <div className="matching-evidence">
        <div className="trust-strip" aria-label="연결과 차량 매칭 상태">
          <div><ShieldIcon /><span>차량 매칭<strong>신뢰 높음</strong></span></div>
          <div><LinkIcon /><span>다이나믹 아일랜드<strong>연결됨</strong></span></div>
          <div><RefreshIcon /><span>신호가 다르면<strong>확인 중</strong></span></div>
        </div>

        <div className="evidence-body">
          <div className="evidence-stack" aria-label="차량 매칭 근거">
            <div><BusIcon /><span>노선 일치<strong>365번</strong></span></div>
            <div><ArrowIcon /><span>방향 일치<strong>제주 시내 방향</strong></span></div>
            <div><StopListIcon /><span>정류장 순서 일치<strong>관측 순서 확인</strong></span></div>
            <div><SignalIcon /><span>데이터 신선도<strong>최근 신호 확인</strong></span></div>
          </div>
          <div className="buddy-check">
            <span className="check-wave wave-one" />
            <span className="check-wave wave-two" />
            <img src="/media/dori.png" alt="차량 신호를 확인하는 돌이" />
            <span className="check-mark"><ShieldIcon /></span>
          </div>
        </div>
      </div>
    </section>
  );
}

function WaitlistSection() {
  return (
    <section className="final-section waitlist-section" id="waitlist">
      <div className="final-copy">
        <h2>혼저 옵서.<br />첫 소식 전해드리쿠다.</h2>
        <p>
          현재 합성 교통 데이터로 제품 흐름을 검증하고 있어요. 사전예약을 남기면
          TestFlight가 준비되는 대로 가장 먼저 알려드릴게요.
        </p>
        <div className="support-note">
          <span aria-hidden="true">🍊</span>
          <span>후원은 고맙지만, 지금은 첫 승객이 되어주는 게 더 힘이 됩주.</span>
        </div>
      </div>
      <div className="waitlist-form-wrap">
        <WaitlistForm />
      </div>
      <div className="final-visual waitlist-buddy" aria-hidden="true">
        <span className="jeju-silhouette" />
        <span className="dotted-route" />
        <span className="final-destination" />
        <img src="/media/dori.png" alt="" />
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <Brand />
        <p>차량은 확인하고, 승객의 위치는 기본으로 추적하지 않수다.</p>
        <a className="footer-reserve" href="#waitlist">혼저 예약합서</a>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeatureIntro />
        <IslandSection />
        <MatchingSection />
        <WaitlistSection />
      </main>
      <Footer />
    </>
  );
}
