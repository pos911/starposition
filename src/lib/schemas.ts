import { z } from 'zod';

/**
 * 사용자 입력 검증 스키마 (Zod)
 */
export const fortuneInputSchema = z.object({
  name: z
    .string()
    .min(1, '이름을 입력해주세요')
    .max(20, '이름은 20자 이내로 입력해주세요')
    .regex(/^[가-힣a-zA-Z\s]+$/, '올바른 이름을 입력해주세요'),
  gender: z.enum(['male', 'female'], {
    message: '성별을 선택해주세요',
  }),
  birthdate: z
    .string()
    .regex(/^\d{8}$/, '생년월일 8자리를 입력해주세요 (예: 19920315)')
    .refine((val) => {
      const year = parseInt(val.slice(0, 4));
      const month = parseInt(val.slice(4, 6));
      const day = parseInt(val.slice(6, 8));
      return year >= 1920 && year <= 2005 &&
        month >= 1 && month <= 12 &&
        day >= 1 && day <= 31;
    }, '올바른 생년월일을 입력해주세요'),
  birthtime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, '시간 형식이 올바르지 않습니다 (예: 14:30)')
    .optional()
    .or(z.literal('')),
});

export type FortuneInput = z.infer<typeof fortuneInputSchema>;

/**
 * AI 응답 스키마
 */
export const fortuneResponseSchema = z.object({
  daily_score: z.number().min(0).max(100),
  one_liner: z.string(),
  caution_points: z.array(z.string()).min(1).max(3),
  lucky_color: z.string(),
  lucky_color_hex: z.string(),
  lucky_item: z.string(),
  career_advice: z.string(),
  love_fortune: z.string(),
  money_fortune: z.string(),
  health_tip: z.string(),
  ootd_suggestion: z.string(),
  best_time: z.string(),
  avoid_time: z.string(),
  lucky_number: z.number(),
  mood_keyword: z.string(),
});

export type FortuneResponse = z.infer<typeof fortuneResponseSchema>;
