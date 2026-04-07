'use client';

import { useState, useRef, useEffect } from 'react';
import type { FortuneResponse } from '@/lib/schemas';
import styles from './page.module.css';

// ─── 별자리 아이콘 ───────────────────────────────────────────
const ZODIAC_ICONS: Record<string, string> = {
  '염소자리': '♑', '물병자리': '♒', '물고기자리': '♓',
  '양자리': '♈', '황소자리': '♉', '쌍둥이자리': '♊',
  '게자리': '♋', '사자자리': '♌', '처녀자리': '♍',
  '천칭자리': '♎', '전갈자리': '♏', '사수자리': '♐',
};

// ─── 점수 게이지 SVG 컴포넌트 ─────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const [animatedScore, setAnimatedScore] = useState(0);
  const [dashOffset, setDashOffset] = useState(circumference);

  useEffect(() => {
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * score);
      setAnimatedScore(current);
      setDashOffset(circumference - (circumference * eased * score) / 100);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score, circumference]);

  const scoreColor = score >= 80 ? '#A78BFA' : score >= 60 ? '#60A5FA' : score >= 40 ? '#F59E0B' : '#FB7185';

  return (
    <div className={styles.gaugeContainer}>
      <svg viewBox="0 0 120 120" className={styles.gaugeSvg}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* 배경 원 */}
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        {/* 점수 원 */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 60 60)"
          filter="url(#glow)"
        />
        {/* 중앙 점수 */}
        <text x="60" y="55" textAnchor="middle" fill={scoreColor} fontSize="26" fontWeight="700" fontFamily="'Noto Sans KR', sans-serif">
          {animatedScore}
        </text>
        <text x="60" y="73" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontFamily="'Noto Sans KR', sans-serif">
          점
        </text>
      </svg>
    </div>
  );
}

// ─── 타이핑 효과 컴포넌트 ─────────────────────────────────────
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, ++i));
        } else {
          clearInterval(interval);
          setDone(true);
        }
      }, 35);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay]);

  return (
    <span>
      {displayed}
      {!done && <span className="cursor" />}
    </span>
  );
}

// ─── 결과 카드 탭 컴포넌트 ──────────────────────────────────
type TabKey = 'career' | 'love' | 'money' | 'health' | 'ootd';
const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: 'career', label: '커리어', emoji: '💼' },
  { key: 'love', label: '연애', emoji: '💗' },
  { key: 'money', label: '재물', emoji: '💰' },
  { key: 'health', label: '건강', emoji: '🌿' },
  { key: 'ootd', label: 'OOTD', emoji: '✨' },
];

function ResultDashboard({ fortune, name }: { fortune: FortuneResponse; name: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>('career');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const tabContent: Record<TabKey, { title: string; content: string; icon: string }> = {
    career: { title: '커리어 & 인간관계', content: fortune.career_advice, icon: '💼' },
    love: { title: '연애 & 감정', content: fortune.love_fortune, icon: '💗' },
    money: { title: '재물 & 투자', content: fortune.money_fortune, icon: '💰' },
    health: { title: '건강 & 웰니스', content: fortune.health_tip, icon: '🌿' },
    ootd: { title: '오늘의 OOTD', content: fortune.ootd_suggestion, icon: '✨' },
  };

  return (
    <div className={`${styles.dashboard} ${visible ? styles.visible : ''}`}>
      {/* 상단 헤더 */}
      <div className={styles.dashHeader}>
        <div className={styles.dashGreeting}>
          <span className={styles.dashName}>{name}님의</span>
          <span className={styles.dashDate}>오늘의 별자리 운세</span>
        </div>
        <div className={styles.moodBadge}>
          <span>✦</span> {fortune.mood_keyword}
        </div>
      </div>

      {/* 점수 + 한줄 운세 */}
      <div className={`card ${styles.scoreCard}`}>
        <ScoreGauge score={fortune.daily_score} />
        <div className={styles.oneLineArea}>
          <p className={styles.oneLiner}>
            <TypewriterText text={fortune.one_liner} />
          </p>
        </div>
      </div>

      {/* 행운 아이템 그리드 */}
      <div className={styles.luckyGrid}>
        <div className={`card ${styles.luckyItem}`}>
          <div className={styles.colorSwatch} style={{ background: fortune.lucky_color_hex }} />
          <div className={styles.luckyInfo}>
            <span className={styles.luckyLabel}>행운의 컬러</span>
            <span className={styles.luckyValue}>{fortune.lucky_color}</span>
          </div>
        </div>
        <div className={`card ${styles.luckyItem}`}>
          <div className={styles.luckyEmoji}>🍀</div>
          <div className={styles.luckyInfo}>
            <span className={styles.luckyLabel}>행운의 숫자</span>
            <span className={styles.luckyValue}>{fortune.lucky_number}</span>
          </div>
        </div>
        <div className={`card ${styles.luckyItemFull}`}>
          <div className={styles.luckyEmoji}>👜</div>
          <div className={styles.luckyInfo}>
            <span className={styles.luckyLabel}>오늘의 행운 아이템</span>
            <span className={styles.luckyValueSm}>{fortune.lucky_item}</span>
          </div>
        </div>
      </div>

      {/* 주의사항 */}
      <div className={`card ${styles.cautionCard}`}>
        <div className={styles.cautionHeader}>
          <span>⚠️</span>
          <span>오늘은 이것만 조심하세요</span>
        </div>
        <ul className={styles.cautionList}>
          {fortune.caution_points.map((point, i) => (
            <li key={i} className={styles.cautionItem}>
              <span className={styles.cautionNum}>{i + 1}</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 시간대 */}
      <div className={styles.timeGrid}>
        <div className={`card ${styles.timeCard} ${styles.timeBest}`}>
          <div>🌟</div>
          <div>
            <div className={styles.timeLabel}>최고의 시간</div>
            <div className={styles.timeValue}>{fortune.best_time}</div>
          </div>
        </div>
        <div className={`card ${styles.timeCard} ${styles.timeAvoid}`}>
          <div>🌙</div>
          <div>
            <div className={styles.timeLabel}>피할 시간</div>
            <div className={styles.timeValue}>{fortune.avoid_time}</div>
          </div>
        </div>
      </div>

      {/* 탭 상세 정보 */}
      <div className={`card ${styles.tabCard}`}>
        <div className="tab-bar">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.tabContent}>
          <div className={styles.tabTitle}>{tabContent[activeTab].icon} {tabContent[activeTab].title}</div>
          <p className={styles.tabText}>{tabContent[activeTab].content}</p>
        </div>
      </div>

      {/* 공유 버튼 */}
      <ShareButton fortune={fortune} name={name} />
    </div>
  );
}

// ─── 공유 버튼 ─────────────────────────────────────────────
function ShareButton({ fortune, name }: { fortune: FortuneResponse; name: string }) {
  const handleShare = async () => {
    const text = `✨ ${name}님의 오늘 운세\n\n🌟 행운 점수: ${fortune.daily_score}점\n💬 "${fortune.one_liner}"\n🎨 행운의 색상: ${fortune.lucky_color}\n🍀 행운의 숫자: ${fortune.lucky_number}\n\n별자리 운세 앱에서 나의 운세 보기 →`;
    
    if (navigator.share) {
      await navigator.share({ title: '오늘의 별자리 운세', text });
    } else {
      await navigator.clipboard.writeText(text);
      alert('운세 결과가 클립보드에 복사되었어요! 💫');
    }
  };

  return (
    <button className={`btn-primary ${styles.shareBtn}`} onClick={handleShare}>
      <span>✨</span>
      <span>오늘의 운세 공유하기</span>
    </button>
  );
}

// ─── 로딩 스켈레톤 ──────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className={styles.loadingWrap}>
      <div className={styles.loadingOrb}>
        <div className={styles.orbRing} />
        <div className={styles.orbRing2} />
        <span className={styles.orbIcon}>🔮</span>
      </div>
      <p className={styles.loadingText}>
        <TypewriterText text="별들의 기운을 읽고 있어요..." />
      </p>
      <p className={styles.loadingSubText}>맞춤형 점성술사가 당신의 운세를 분석 중입니다</p>
    </div>
  );
}

// ─── 메인 아이콘 ────────────────────────────────────────────
function StarIcon() {
  return (
    <svg className={styles.heroStar} viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="starGrad">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#7C3AED" />
        </radialGradient>
      </defs>
      <path
        d="M50 10 L58 38 L88 38 L65 56 L74 84 L50 67 L26 84 L35 56 L12 38 L42 38 Z"
        fill="url(#starGrad)"
        opacity="0.9"
      />
      <circle cx="50" cy="50" r="18" fill="none" stroke="rgba(200,180,255,0.4)" strokeWidth="1.5" />
      {[0,45,90,135,180,225,270,315].map(angle => (
        <circle
          key={angle}
          cx={50 + 30 * Math.cos((angle * Math.PI) / 180)}
          cy={50 + 30 * Math.sin((angle * Math.PI) / 180)}
          r="1.5"
          fill="rgba(200,180,255,0.6)"
        />
      ))}
    </svg>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────
export default function HomePage() {
  const [step, setStep] = useState<'input' | 'loading' | 'result'>('input');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [birthdate, setbirthdate] = useState('');
  const [birthtime, setBirthtime] = useState('');
  const [fortune, setFortune] = useState<FortuneResponse | null>(null);
  const [errors, setErrors] = useState<{ name?: string; gender?: string; birthdate?: string; birthtime?: string }>({});
  const [serverError, setServerError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 'result' && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = '이름을 입력해주세요';
    else if (!/^[가-힣a-zA-Z\s]+$/.test(name)) newErrors.name = '한글 또는 영문 이름을 입력해주세요';
    
    if (!birthdate.trim()) newErrors.birthdate = '생년월일을 입력해주세요';
    else if (!/^\d{8}$/.test(birthdate)) newErrors.birthdate = '8자리 숫자로 입력해주세요 (예: 19920315)';
    else {
      const y = parseInt(birthdate.slice(0, 4));
      const m = parseInt(birthdate.slice(4, 6));
      const d = parseInt(birthdate.slice(6, 8));
      if (y < 1920 || y > 2005 || m < 1 || m > 12 || d < 1 || d > 31) {
        newErrors.birthdate = '올바른 생년월일을 입력해주세요';
      }
    }

    if (birthtime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(birthtime)) {
      newErrors.birthtime = '올바른 시간 형식으로 입력해주세요 (예: 14:30)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setServerError('');
    setStep('loading');

    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), gender, birthdate, birthtime }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? '알 수 없는 오류가 발생했습니다.');
      }
      setFortune(data.fortune);
      setStep('result');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setStep('input');
    }
  }

  function handleRetry() {
    setStep('input');
    setFortune(null);
    setServerError('');
  }

  return (
    <main className={styles.main}>
      {/* 히어로 섹션 */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <StarIcon />
            <div className={styles.heroBadge}>
              <span>✦</span>
              <span>2026 맞춤형 별자리 운세</span>
              <span>✦</span>
            </div>
            <h1 className={styles.heroTitle}>
              오늘, 별이<br />
              <span className={styles.heroGradientText}>당신에게 말을 건네요</span>
            </h1>
            <p className={styles.heroDesc}>
              맞춤형 점성술사가 분석하는 나만의 운세<br />
              커리어 · 연애 · 재물 · 2026 트렌드 코디까지
            </p>
          </div>
        </div>
      </section>

      {/* 입력 섹션 */}
      {(step === 'input' || step === 'loading') && (
        <section className={styles.inputSection}>
          <div className="container">
            <div className={`card ${styles.inputCard}`}>
              <div className={styles.inputCardHeader}>
                <h2 className={styles.inputCardTitle}>운세 알아보기</h2>
                <p className={styles.inputCardDesc}>이름과 출생 정보를 입력하면 맞춤형 점성술사가 오늘의 운세를 분석해드려요</p>
              </div>

              {step === 'loading' ? (
                <LoadingSkeleton />
              ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className="label" htmlFor="name-input">이름 및 성별</label>
                    <div className={styles.nameRow}>
                      <input
                        id="name-input"
                        type="text"
                        className={`input-field ${errors.name ? styles.inputError : ''} ${styles.nameInput}`}
                        placeholder="예: 김지연"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        maxLength={20}
                        autoComplete="off"
                      />
                      <div className={styles.genderToggle}>
                        <button
                          type="button"
                          className={`${styles.genderBtn} ${gender === 'female' ? styles.active : ''}`}
                          onClick={() => setGender('female')}
                        >
                          여성
                        </button>
                        <button
                          type="button"
                          className={`${styles.genderBtn} ${gender === 'male' ? styles.active : ''}`}
                          onClick={() => setGender('male')}
                        >
                          남성
                        </button>
                      </div>
                    </div>
                    {errors.name && <p className={styles.errorMsg}>{errors.name}</p>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className="label" htmlFor="birth-input">생년월일 (양력)</label>
                    <input
                      id="birth-input"
                      type="text"
                      className={`input-field ${errors.birthdate ? styles.inputError : ''}`}
                      placeholder="예: 19920315"
                      value={birthdate}
                      onChange={e => setbirthdate(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      maxLength={8}
                      inputMode="numeric"
                    />
                    {errors.birthdate && <p className={styles.errorMsg}>{errors.birthdate}</p>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className="label" htmlFor="time-input">태어난 시간 (선택사항)</label>
                    <input
                      id="time-input"
                      type="time"
                      className={`input-field ${errors.birthtime ? styles.inputError : ''}`}
                      value={birthtime}
                      onChange={e => setBirthtime(e.target.value)}
                    />
                    {errors.birthtime && <p className={styles.errorMsg}>{errors.birthtime}</p>}
                    <p className={styles.inputHint}>정확한 출생각 조언을 위해 시간을 입력해주세요</p>
                  </div>

                  {serverError && (
                    <div className={styles.serverError}>
                      <span>⚠️</span>
                      <span>{serverError}</span>
                    </div>
                  )}

                  <button type="submit" className="btn-primary">
                    <span>🔮</span>
                    <span>오늘의 운세 확인하기</span>
                  </button>

                  <p className={styles.disclaimer}>
                    입력하신 정보는 운세 생성 후 즉시 폐기됩니다
                  </p>
                </form>
              )}
            </div>

            {/* 특징 카드 */}
            {step === 'input' && (
              <div className={styles.featuresGrid}>
                {[
                  { icon: '🔮', title: '맞춤형 점성술사', desc: '개인 차트를 기반으로 분석하는 정밀 운세' },
                  { icon: '✨', title: '2026 트렌드', desc: '최신 패션 트렌드까지 반영한 OOTD 추천' },
                  { icon: '🛡️', title: '개인정보 보호', desc: '분석 후 즉시 데이터 폐기' },
                ].map(f => (
                  <div key={f.title} className={`card ${styles.featureCard}`}>
                    <span className={styles.featureIcon}>{f.icon}</span>
                    <div>
                      <div className={styles.featureTitle}>{f.title}</div>
                      <div className={styles.featureDesc}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 결과 섹션 */}
      {step === 'result' && fortune && (
        <section className={styles.resultSection} ref={resultRef}>
          <div className="container">
            <ResultDashboard fortune={fortune} name={name} />
            <button className={styles.retryBtn} onClick={handleRetry}>
              ↩ 다시 확인하기
            </button>
          </div>
        </section>
      )}

      {/* 푸터 */}
      <footer className={styles.footer}>
        <div className="container">
          <p>✦ 별자리 운세 ✦</p>
          <p className={styles.footerDesc}>AI가 생성하는 운세는 재미와 영감을 위한 콘텐츠입니다</p>
        </div>
      </footer>
    </main>
  );
}
