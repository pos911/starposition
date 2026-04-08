import { GoogleGenAI } from '@google/genai';
import { getKSTDateString, parseBirthDate } from './kst';
import { fortuneResponseSchema, type FortuneResponse } from './schemas';

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_INSTRUCTION = `당신은 서울에서 20년간 활동 중인 현대적인 맞춤형 점성술사입니다. 특히 대한민국 30대 여성(또는 남성)의 커리어, 재테크, 라이프스타일 심리 분석에 정통합니다.

당신의 특성:
- 말투는 신비로우면서도 지적이며, 따뜻하고 공감 능력이 뛰어납니다
- 상대방을 존중하는 존댓말(해요체)을 사용합니다
- 단순한 운세가 아닌 구체적인 행동 지침과 실용적인 조언을 제공합니다
- 2026년 최신 패션/경제 트렌드를 잘 알고 있습니다
- 2026년은 병오년(丙午年, 불의 말해)으로 강렬한 에너지와 변화의 해입니다

2026년 주요 트렌드:
- 패션: 아이시 블루(Icy Blue), 트랜스포머티브 틸(Teal), 클라우드 댄서(Cloud Dancer), 포엣코어(Poetcore) 스타일
- 경제: 불확실성 속의 신중한 투자, 자기계발 투자 증가
- 라이프스타일: 마음챙김, 프리미엄 웰니스, 소확행

응답은 반드시 아래 JSON 형식을 정확히 지켜주세요. 추가 텍스트 없이 JSON만 반환하세요.`;

function buildFortunePrompt(name: string, gender: 'male' | 'female', birthdate: string, birthtime?: string, userConcern?: string): string {
  const kstDate = getKSTDateString();
  const parsed = parseBirthDate(birthdate);
  const age = 2026 - parsed.year;
  const timeInfo = birthtime ? `\n태어난 시간: ${birthtime} (출생 시각은 상승궁과 행성 배치에 영향을 줍니다)` : '\n태어난 시간: 미입력 (시간 미입력 시 태양별자리 중심으로 분석)';
  const genderKr = gender === 'male' ? '남성' : '여성';

  return `${name}님(${genderKr}, ${age}세, ${parsed.zodiac}, ${parsed.chineseZodiac})의 오늘(${kstDate} KST 기준) 별자리 운세를 분석해주세요.

생년월일: ${birthdate.slice(0,4)}년 ${birthdate.slice(4,6)}월 ${birthdate.slice(6,8)}일${timeInfo}
별자리: ${parsed.zodiac}
오행: ${parsed.element}
${parsed.chineseZodiac}

${birthtime ? `출생 시각 ${birthtime}을 바탕으로 상승궁(Ascendant)과 달의 위치를 추론하여 더 정밀한 분석을 제공해주세요.` : ''}

요즘 ${name}님의 주요 고민: ${userConcern ? `"${userConcern}"` : '특별한 고민 없음'}

사용자의 성별(${genderKr}), 나이(${age}세), 별자리(${parsed.zodiac}), 입력된 고민을 바탕으로 '따뜻한 공감 -> 운세 기반의 분석 -> 실질적인 행동 지침' 순서로 답변을 제공해주세요.
2026년 트렌드를 반영하여 아래 JSON으로 응답해주세요:

{
  "daily_score": (0-100 사이 정수, 오늘의 총 운세 점수),
  "overall_score": (0-100 사이 정수, 고민의 해결 가능성이나 오늘의 에너지 수준을 반영한 점수),
  "consultation_result": (고민에 대한 공감과 운세적 해석 및 실질적인 행동 지침이 섞인 4-5문장의 따뜻한 상담 텍스트),
  "one_liner": (마음을 사로잡는 한 줄 오늘의 운세 문구, 신비롭고 가슴을 울리게),
  "caution_points": [(오늘 조심해야 할 행동 패턴 1), (조심해야 할 행동 패턴 2), (조심해야 할 행동 패턴 3)],
  "lucky_color": (2026 트렌드를 반영한 행운의 색상 이름, 한국어),
  "lucky_color_hex": (해당 색상의 HEX 코드, 예: #B0D4E8),
  "lucky_item": (오늘 행운을 가져다줄 구체적인 패션 아이템이나 소품),
  "career_advice": (커리어/업무/인간관계에 대한 구체적인 조언 2-3문장),
  "love_fortune": (연애/사랑/관계 운세, 싱글/커플 모두 해당되도록 2-3문장),
  "money_fortune": (재물/투자/소비에 관한 조언, 2026년 경제 상황 반영 2-3문장),
  "health_tip": (건강/멘탈/웰니스 팁 2-3문장),
  "ootd_suggestion": (오늘의 옷차림 추천, 2026 트렌드 기반으로 구체적으로 2-3문장),
  "best_time": (오늘 최고의 활동 시간대, 예: 오후 2시-4시),
  "avoid_time": (피하면 좋을 시간대, 예: 오전 10시-11시),
  "lucky_number": (오늘의 행운 숫자, 1-99 사이 정수),
  "mood_keyword": (오늘 ${name}님의 에너지를 한 단어로, 예: 직관, 열정, 평온 등)
}`;
}

export async function generateFortune(name: string, gender: 'male' | 'female', birthdate: string, birthtime?: string, userConcern?: string): Promise<FortuneResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
  }

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: buildFortunePrompt(name, gender, birthdate, birthtime, userConcern) }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      temperature: 0.85,
      maxOutputTokens: 1500,
    },
  });

  const text = response.text ?? '';
  let parsed: unknown;
  try {
    // JSON 코드블록 제거
    const clean = text.replace(/```json\s*/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('AI 응답 파싱 실패');
  }

  const validated = fortuneResponseSchema.safeParse(parsed);
  if (!validated.success) {
    // 파싱된 데이터가 있으면 부분적으로 사용
    const raw = parsed as Record<string, unknown>;
    return {
      daily_score: typeof raw.daily_score === 'number' ? raw.daily_score : 75,
      overall_score: typeof raw.overall_score === 'number' ? raw.overall_score : 80,
      consultation_result: typeof raw.consultation_result === 'string' ? raw.consultation_result : '당신의 고민에 깊이 공감합니다. 우주의 흐름이 당신을 돕고 있으니, 자신을 믿고 한 걸음씩 나아가세요. 좋은 결과가 있을 것입니다.',
      one_liner: typeof raw.one_liner === 'string' ? raw.one_liner : '오늘은 별들이 당신에게 미소 짓고 있어요.',
      caution_points: Array.isArray(raw.caution_points) ? raw.caution_points as string[] : ['감정적인 결정 주의'],
      lucky_color: typeof raw.lucky_color === 'string' ? raw.lucky_color : '아이시 블루',
      lucky_color_hex: typeof raw.lucky_color_hex === 'string' ? raw.lucky_color_hex : '#B0D4E8',
      lucky_item: typeof raw.lucky_item === 'string' ? raw.lucky_item : '실크 스카프',
      career_advice: typeof raw.career_advice === 'string' ? raw.career_advice : '오늘은 새로운 아이디어를 메모해두세요.',
      love_fortune: typeof raw.love_fortune === 'string' ? raw.love_fortune : '소중한 인연에 집중하는 날이에요.',
      money_fortune: typeof raw.money_fortune === 'string' ? raw.money_fortune : '충동 구매보다 저축에 집중하세요.',
      health_tip: typeof raw.health_tip === 'string' ? raw.health_tip : '충분한 수분 섭취가 중요해요.',
      ootd_suggestion: typeof raw.ootd_suggestion === 'string' ? raw.ootd_suggestion : '아이시 블루 계열의 아이템으로 포인트를 주세요.',
      best_time: typeof raw.best_time === 'string' ? raw.best_time : '오후 2시-4시',
      avoid_time: typeof raw.avoid_time === 'string' ? raw.avoid_time : '오전 10시-11시',
      lucky_number: typeof raw.lucky_number === 'number' ? raw.lucky_number : 7,
      mood_keyword: typeof raw.mood_keyword === 'string' ? raw.mood_keyword : '직관',
    };
  }

  return validated.data;
}
