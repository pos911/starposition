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
    const err = error as {
      name?: string;
      message?: string;
      status?: number;
      code?: number | string;
    };

    console.error('[fortune] generation failed', {
      name: err?.name ?? 'UnknownError',
      message: (err?.message ?? 'unknown').slice(0, 500),
      status: err?.status,
      code: err?.code,
      model: 'gemini-3.8-flash',
    });

    const upstreamStatus =
      typeof err?.status === 'number'
        ? err.status
        : typeof err?.code === 'number'
          ? err.code
          : undefined;

    const errorCode =
      err?.message === 'GEMINI_API_KEY_MISSING'
        ? 'AI_CONFIG'
        : upstreamStatus === 401 || upstreamStatus === 403
          ? 'AI_AUTH'
          : upstreamStatus === 404
            ? 'AI_MODEL'
            : upstreamStatus === 429
              ? 'AI_QUOTA'
              : upstreamStatus && upstreamStatus >= 500
                ? 'AI_UPSTREAM'
                : err?.message?.startsWith('AI_EMPTY_RESPONSE')
                  ? 'AI_EMPTY'
                  : err?.message?.startsWith('AI_RESPONSE_PARSE_FAILED')
                    ? 'AI_PARSE'
                    : 'AI_REQUEST';

    return NextResponse.json(
      {
        error: '맞춤형 점성술사가 잠시 자리를 비웠어요. 잠시 후 다시 시도해주세요.',
        errorCode,
      },
      { status: 500 }
    );
  }
}
