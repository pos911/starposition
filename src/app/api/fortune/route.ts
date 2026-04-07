import { NextRequest, NextResponse } from 'next/server';
import { fortuneInputSchema } from '@/lib/schemas';
import { generateFortune } from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = fortuneInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    const { name, birthdate, birthtime, gender } = parsed.data;

    // Rate limiting: 간단한 IP 기반 체크 (프로덕션에서는 Upstash Redis 사용 권장)
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    console.log(`[운세 요청] IP: ${ip}, 이름: ${name.slice(0,1)}***, 성별: ${gender}, 생년월일: ${birthdate.slice(0,4)}****, 시간: ${birthtime || '미입력'}`);

    const fortune = await generateFortune(name, gender, birthdate, birthtime);

    return NextResponse.json({ fortune }, {
      headers: {
        'Cache-Control': 'no-store',
      }
    });
  } catch (error) {
    console.error('[운세 생성 오류]', error);
    return NextResponse.json(
      { error: '맞춤형 점성술사가 잠시 자리를 비웠어요. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
