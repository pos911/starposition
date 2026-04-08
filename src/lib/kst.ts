/**
 * KST (Korean Standard Time) 유틸리티
 * Vercel 서버는 UTC 기준이므로 Asia/Seoul 시간대 보정 필수
 */

export function getKSTDate(): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()).replace(/\. /g, '-').replace('.', '');
}

export function getKSTDateParts(): { year: number; month: number; day: number; hour: number } {
  const now = new Date();
  const kst = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const parts = Object.fromEntries(kst.map(p => [p.type, p.value]));
  return {
    year: parseInt(parts.year),
    month: parseInt(parts.month),
    day: parseInt(parts.day),
    hour: parseInt(parts.hour),
  };
}

export function getKSTDateString(): string {
  const { year, month, day } = getKSTDateParts();
  return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
}

export function parseBirthDate(yyyymmdd: string): {
  year: number;
  month: number;
  day: number;
  zodiac: string;
  element: string;
  chineseZodiac: string;
} {
  const year = parseInt(yyyymmdd.slice(0, 4));
  const month = parseInt(yyyymmdd.slice(4, 6));
  const day = parseInt(yyyymmdd.slice(6, 8));

  const zodiac = getZodiacSign(month, day);
  const element = getChineseElement(year, month, day);
  const chineseZodiac = getChineseZodiac(year, month, day);

  return { year, month, day, zodiac, element, chineseZodiac };
}

function getZodiacSign(month: number, day: number): string {
  const signs = [
    { sign: '염소자리', start: [12, 22], end: [1, 19] },
    { sign: '물병자리', start: [1, 20], end: [2, 18] },
    { sign: '물고기자리', start: [2, 19], end: [3, 20] },
    { sign: '양자리', start: [3, 21], end: [4, 19] },
    { sign: '황소자리', start: [4, 20], end: [5, 20] },
    { sign: '쌍둥이자리', start: [5, 21], end: [6, 20] },
    { sign: '게자리', start: [6, 21], end: [7, 22] },
    { sign: '사자자리', start: [7, 23], end: [8, 22] },
    { sign: '처녀자리', start: [8, 23], end: [9, 22] },
    { sign: '천칭자리', start: [9, 23], end: [10, 22] },
    { sign: '전갈자리', start: [10, 23], end: [11, 21] },
    { sign: '사수자리', start: [11, 22], end: [12, 21] },
  ];

  for (const { sign, start, end } of signs) {
    if (sign === '염소자리') {
      if ((month === start[0] && day >= start[1]) || (month === end[0] && day <= end[1])) {
        return sign;
      }
    } else {
      if ((month === start[0] && day >= start[1]) || (month === end[0] && day <= end[1])) {
        return sign;
      }
    }
  }
  return '염소자리';
}

function getChineseElement(year: number, month: number, day: number): string {
  // 간단한 절기(입춘) 보정: 대략 2월 3일 이전은 해가 안 바뀐 것으로 간주 (음력/절기 기준)
  if (month === 1 || (month === 2 && day <= 3)) {
    year -= 1;
  }
  const elements = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'];
  return elements[(year - 4) % 10] + '(오행)';
}

function getChineseZodiac(year: number, month: number, day: number): string {
  // 간단한 절기(입춘) 보정
  if (month === 1 || (month === 2 && day <= 3)) {
    year -= 1;
  }
  const animals = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
  return animals[(year - 4) % 12] + '띠';
}
