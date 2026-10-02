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

    const { name, birthdate, birthtime, gender, user_concern } = parsed.data;

    // 운세 입력값은 생성 목적에만 사용하며 분석 로그와 결합하지 않는다.
    console.log('[fortune] request accepted', {
      hasBirthTime: Boolean(birthtime),
      hasConcern: Boolean(user_concern),
    });

    const fortune = await generateFortune(name, gender, birthdate, birthtime, user_concern);

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
