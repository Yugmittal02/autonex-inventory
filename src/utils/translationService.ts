/**
 * Translation utilities - API translation + transliteration + fallback
 */

import { convertToHindi } from './translator';

// Translation cache
const translationCache = new Map<string, string>();
const TRANSLATION_CACHE_MAX = 500;

const cacheSet = (key: string, value: string) => {
  if (translationCache.size >= TRANSLATION_CACHE_MAX && !translationCache.has(key)) {
    const firstKey = translationCache.keys().next().value as string | undefined;
    if (firstKey) translationCache.delete(firstKey);
  }
  translationCache.set(key, value);
};

export const fetchWithTimeout = async (url: string, timeoutMs: number = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export const looksCorruptedTranslation = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  const s = String(value);
  if (!s) return false;
  if (s.includes('\uFFFD')) return true;
  const qCount = (s.match(/\?/g) || []).length;
  return qCount >= 2 && qCount / Math.max(1, s.length) > 0.12;
};

export const sanitizeDisplayText = (value: unknown, fallback: string = ''): string => {
  const s = value === null || value === undefined ? '' : String(value);
  if (!s) return '';
  if (looksCorruptedTranslation(s)) return fallback;
  return s;
};

// API Translation using MyMemory (Free, No API key needed)
export const translateWithAPI = async (
  text: string,
  from: string = 'en',
  to: string = 'hi'
): Promise<string> => {
  if (!text || text.trim() === '') return '';

  const cacheKey = `${from}:${to}:${text}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey)!;

  try {
    const response = await fetchWithTimeout(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`,
      8000
    );
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      if (!looksCorruptedTranslation(translated)) {
        cacheSet(cacheKey, translated);
        return translated;
      }
      return text;
    }
    throw new Error('API failed');
  } catch (error) {
    console.warn('Translation API failed, using fallback:', error);
    return text;
  }
};

// Google Transliteration (Hinglish Typing)
export const transliterateWithGoogle = async (text: string): Promise<string> => {
  if (!text || text.trim() === '') return '';

  const cacheKey = `translit:${text}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey)!;

  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(
      text
    )}&itc=hi-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`;

    const response = await fetchWithTimeout(url, 8000);
    const data = await response.json();

    if (data && data[0] === 'SUCCESS') {
      let result = '';
      data[1].forEach((wordData: any) => {
        result += wordData[1][0] + ' ';
      });
      const finalResult = result.trim();
      if (!looksCorruptedTranslation(finalResult)) {
        cacheSet(cacheKey, finalResult);
        return finalResult;
      }
      return text;
    }
    return text;
  } catch (error) {
    console.error('Transliteration Error:', error);
    return text;
  }
};

// Local Hindi helper (works offline)
export const convertToHindiFallback = (text: unknown): string => {
  try {
    const s = text === null || text === undefined ? '' : String(text);
    return s ? convertToHindi(s) : '';
  } catch {
    return text === null || text === undefined ? '' : String(text);
  }
};

// Text normalization for matching
export const normalizeForMatch = (text: string): string => {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/[.,!?;:(){}\[\]"'   ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Check if text is a greeting
export const isGreetingText = (text: string): boolean => {
  const s = normalizeForMatch(text);
  if (!s) return false;
  if (/(^|\s)(hello|hi|hey|hlo|helo|namaste|namaskar|pranam|ram\s*ram)(\s|$)/i.test(s)) return true;
  return false;
};
