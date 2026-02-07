/**
 * - Input format: { userRequest: string, context?: { userId?: string, locale?: string, previousMessages?: string[] } }
 * - Output format: { budget?: { currency: string, max: number }, deadline?: string, preferences?: Record<string, string | number | boolean>, mustHaves?: string[], niceToHaves?: string[], clarifyingQuestions?: string[] }
 * - Communicates with: searchAgent.ts (sends normalized request), (user) (asks clarifying questions if needed)
 */

