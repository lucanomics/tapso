import WaitlistForm from "./components/WaitlistForm";

function Header() {
  return (
    <header className="web-header" data-figma-node-id="9:3">
      <a className="web-brand" href="#top" aria-label="TAPSO 탑서 홈" data-figma-node-id="9:4">
        TAPSO 탑서
      </a>
      <nav className="web-nav" aria-label="주요 메뉴" data-figma-node-id="9:5">
        <a href="#features">기능</a>
        <a href="#island-preview">다이나믹 아일랜드</a>
        <a href="#journey-card">안전한 매칭</a>
      </nav>
      <a className="web-header-cta" href="#waitlist" data-figma-node-id="9:9">
        계속하기 <span aria-hidden="true">→</span>
      </a>
      <a className="web-mobile-reserve" href="#waitlist" data-figma-node-id="10:23">
        사전예약
      </a>
    </header>
  );
}

function JourneyCard() {
  return (
    <article className="journey-card" id="journey-card" data-figma-node-id="9:22">
      <div className="journey-card-header">
        <strong>365</strong>
        <span>이동 중</span>
      </div>
      <strong className="journey-stop desktop-stop">용문사거리</strong>
      <strong className="journey-stop mobile-stop">관덕정</strong>
      <strong className="journey-remaining">8 정류장</strong>
      <span className="journey-next desktop-stop">다음 · 서문시장</span>
      <span className="journey-next mobile-stop">다음 · 광양</span>
    </article>
  );
}

function ProductPreview() {
  return (
    <div className="product-preview" data-figma-node-id="9:21">
      <JourneyCard />
      <div className="dynamic-island" id="island-preview" data-figma-node-id="9:29">
        <strong className="island-route" data-figma-node-id="9:30">🚌 365</strong>
        <span className="island-copy desktop-island-copy" data-figma-node-id="9:31">
          <strong>제주 바람 따라 잘 가고 있어요.</strong>
          <span>8 정류장 남음</span>
        </span>
        <span className="mobile-island-copy" data-figma-node-id="10:33">8 정거장 남음</span>
      </div>
      <img
        className="product-dori"
        src="/media/dori.png"
        alt=""
        aria-hidden="true"
        data-figma-node-id="9:32"
      />
    </div>
  );
}

function Hero() {
  return (
    <section className="web-hero" id="top" data-figma-node-id="9:12">
      <div className="hero-copy" data-figma-node-id="9:13">
        <h1 data-figma-node-id="9:14">
          <span>와리지 말앙 혼저 탑서.</span>
          <span>내릴 땐 알려드리쿠다.</span>
        </h1>
        <p data-figma-node-id="9:15">
          <span className="desktop-body">
            제주 버스의 물리 차량을 확인하고, 남은 정류장을 다이나믹 아일랜드에 또렷하게 보여주는 승차 동반자.
          </span>
          <span className="mobile-body">
            차량을 확인하고, 남은 정류장을 다이나믹 아일랜드에 또렷하게.
          </span>
        </p>
        <a className="hero-cta" href="#waitlist" data-figma-node-id="9:17">
          계속하기 <span aria-hidden="true">→</span>
        </a>
        <span className="hero-trust" data-figma-node-id="9:20">
          차량 기준 추적 · 승객 GPS 기본 사용 안 함
        </span>
      </div>
      <ProductPreview />
    </section>
  );
}

const features = [
  { icon: "🚌", title: "차량을 추적", description: "승객 GPS가 아닌 버스 기준", node: "9:34" },
  { icon: "◉", title: "한눈에 확인", description: "남은 정류장과 데이터 상태", node: "9:38" },
  { icon: "✓", title: "애매하면 멈춤", description: "확신 없이는 자동 선택 안 함", node: "9:42" },
];

function FeatureRibbon() {
  return (
    <section className="feature-ribbon" id="features" aria-label="TAPSO 핵심 원칙" data-figma-node-id="9:33">
      {features.map((feature) => (
        <article className="feature-card" key={feature.title} data-figma-node-id={feature.node}>
          <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
          <div className="feature-text">
            <strong>{feature.title}</strong>
            <span>{feature.description}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function WaitlistSection() {
  return (
    <section className="web-waitlist" id="waitlist" data-figma-node-id="9:46">
      <div className="waitlist-copy" data-figma-node-id="9:47">
        <h2 data-figma-node-id="9:48">
          <span>하영 홍보해줍서.</span>
          <span>곧 소식 전해드리쿠다.</span>
        </h2>
        <p data-figma-node-id="9:49">
          <span className="desktop-body">
            현재 합성 교통 데이터로 흐름을 검증하고 있어요. 사전예약을 남기면 TestFlight가 준비되는 대로 먼저 알려드릴게요.
          </span>
          <span className="mobile-body">
            합성 데이터로 흐름을 검증 중이에요. TestFlight가 준비되면 먼저 알려드릴게요.
          </span>
        </p>
        <span className="waitlist-support" data-figma-node-id="9:50">
          🍊 후원보다 첫 승객이 되어주는 게 더 힘이 됩주.
        </span>
      </div>
      <WaitlistForm />
    </section>
  );
}

export default function App() {
  return (
    <div className="web-page" data-figma-page-id="3:4">
      <Header />
      <main>
        <Hero />
        <FeatureRibbon />
        <WaitlistSection />
      </main>
    </div>
  );
}
