import IslandExperience from "./components/IslandExperience";
import {
  ArrowIcon,
  BusIcon,
  GitHubIcon,
  LinkIcon,
  RefreshIcon,
  ShieldIcon,
  SignalIcon,
  StopListIcon,
} from "./components/Icons";

const githubUrl = "https://github.com/lucanomics/tapso";

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
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav aria-label="주요 메뉴">
          <a href="#features">기능</a>
          <a href="#island">다이나믹 아일랜드</a>
          <a href="#matching">안전한 매칭</a>
        </nav>
        <a className="header-action" href="#island">
          데모 둘러보기
        </a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-grid">
        <div className="hero-copy">
          <h1>타고. 앱을 닫고.<br />제때 내리세요.</h1>
          <p>
            제주 버스의 물리 차량을 확인하고, 남은 정류장을 다이나믹
            아일랜드에 또렷하게 보여주는 승차 동반자.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#island">
              데모 둘러보기
              <ArrowIcon />
            </a>
            <a className="button button-secondary" href={githubUrl} target="_blank" rel="noreferrer">
              <GitHubIcon />
              GitHub에서 보기
            </a>
          </div>
        </div>

        <div className="hero-product" aria-label="TAPSO 앱과 다이나믹 아일랜드 화면 미리보기">
          <div className="phone-shell">
            <span className="phone-speaker" />
            <img src="/media/active-journey.jpg" alt="TAPSO 탑승 중 화면. 365번 버스 목적지까지 8정류장 남음." />
          </div>
          <div className="hero-island-shot">
            <img src="/media/dynamic-island-expanded.jpg" alt="365번 버스의 확장된 다이나믹 아일랜드 화면" />
          </div>
          <img className="hero-buddy" src="/media/dori.png" alt="귤을 얹고 파도와 함께 있는 TAPSO 현무암 친구 돌이" />
          <span className="hero-route-line" aria-hidden="true" />
        </div>
      </div>
      <div className="hero-horizon" aria-hidden="true" />
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

function FinalSection() {
  return (
    <section className="final-section" id="status">
      <div className="final-copy">
        <h2>제주에서,<br />내릴 때까지.</h2>
        <p>
          현재 데모는 합성 교통 데이터로 제품 흐름을 검증하고 있어요. 실제 제주
          버스 데이터 연동은 검증 후 단계적으로 공개합니다.
        </p>
        <a className="button button-primary final-button" href={githubUrl} target="_blank" rel="noreferrer">
          <GitHubIcon />
          GitHub에서 개발 보기
          <ArrowIcon />
        </a>
        <div className="testflight-status">
          <span className="status-clock" aria-hidden="true" />
          <span>TestFlight 준비 중</span>
        </div>
      </div>
      <div className="final-visual" aria-hidden="true">
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
        <p>차량을 추적하고, 승객의 위치는 기본으로 추적하지 않습니다.</p>
        <a href={githubUrl} target="_blank" rel="noreferrer" aria-label="TAPSO GitHub 저장소 열기">
          <GitHubIcon />
        </a>
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
        <FinalSection />
      </main>
      <Footer />
    </>
  );
}
