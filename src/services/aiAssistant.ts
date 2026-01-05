import { isGreetingText } from '../utils/translationService';

const GEMINI_API_KEY = "AIzaSyBDvhgjYjN3qpmjDB3EYnEGj0H6OPRvpLQ";

/**
 * Get smart local response (works offline)
 */
export const getSmartLocalResponse = (question: string, lang: string): string => {
  const q = question.toLowerCase();
  const isHindi = lang === 'hi';

  // Greetings
  if (isGreetingText(question)) {
    return isHindi ? 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूं?' : 'Hello! How can I help you today?';
  }

  // Time
  if (/\b(time|samay|kya baja|kitne baje)\b/i.test(q)) {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    return isHindi ? `अभी ${time} बज रहे हैं।` : `The current time is ${time}.`;
  }

  // Date
  if (/\b(date|tarikh|aaj|today)\b/i.test(q)) {
    const date = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return isHindi ? `आज की तारीख ${date} है।` : `Today's date is ${date}.`;
  }

  // Weather (basic)
  if (/\b(weather|mausam|garmi|sardi|barish)\b/i.test(q)) {
    return isHindi
      ? 'मौसम की जानकारी के लिए अपने फोन का वेदर ऐप देखें।'
      : "Please check your phone's weather app for current conditions.";
  }

  // Math calculations
  const mathMatch = q.match(/(\d+)\s*[\+\-\*\/x×÷]\s*(\d+)/);
  if (mathMatch) {
    try {
      const expr = q.replace(/x|×/g, '*').replace(/÷/g, '/');
      const numMatch = expr.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
      if (numMatch) {
        const [, a, op, b] = numMatch;
        let result = 0;
        switch (op) {
          case '+':
            result = parseInt(a) + parseInt(b);
            break;
          case '-':
            result = parseInt(a) - parseInt(b);
            break;
          case '*':
            result = parseInt(a) * parseInt(b);
            break;
          case '/':
            result = parseInt(a) / parseInt(b);
            break;
        }
        return isHindi ? `जवाब है ${result}` : `The answer is ${result}`;
      }
    } catch {
      /* ignore */
    }
  }

  // Stock/Inventory queries - guide to search
  if (/\b(stock|maal|item|product|kitna|available|hai kya)\b/i.test(q)) {
    return isHindi
      ? 'स्टॉक खोजने के लिए सर्च बार इस्तेमाल करें या नीचे देखें।'
      : 'Please check the search results below or use the app search.';
  }

  // Business/Shop
  if (/\b(business|dukan|shop|sell|buy|price|rate)\b/i.test(q)) {
    return isHindi
      ? 'बिज़नेस टूल्स के लिए सेटिंग्स में जाएं।'
      : 'For business tools, go to Settings > Business Tools.';
  }

  // Who are you
  if (/\b(who are you|kaun ho|tum kaun|your name|naam kya)\b/i.test(q)) {
    return isHindi
      ? 'मैं Autonex AI हूं, आपका स्मार्ट बिजनेस असिस्टेंट!'
      : 'I am Autonex AI, your smart business assistant!';
  }

  // Thank you
  if (/\b(thank|thanks|dhanyawad|shukriya)\b/i.test(q)) {
    return isHindi ? 'आपका स्वागत है! और कुछ मदद चाहिए?' : "You're welcome! Need anything else?";
  }

  // Default response
  return isHindi
    ? 'मैं पूरी तरह समझ नहीं पाया। कृपया फिर से बोलें, या बताएं कि यह स्टॉक, बिल्स, टूल्स, या सेटिंग्स के बारे में है।'
    : "I didn't fully understand. Please rephrase, or tell me if this is about stock, bills, tools, or settings.";
};

/**
 * Ask AI Assistant using Google Gemini API
 */
export const askAIAssistant = async (
  question: string,
  language: string = 'en'
): Promise<string> => {
  // 1. Detect if the question is basically Hindi/Hinglish
  const isHindiQuestion =
    /[\u0900-\u097F]/.test(question) ||
    /\b(kya|hai|kaise|kahan|kaun|kitna|batao|bolo|dhundo|dekho|aaj|kal|mausam|weather)\b/i.test(
      question
    );

  const responseLanguage = isHindiQuestion ? 'hi' : language;

  // 2. Define the System Prompt (AI's Personality)
  const systemPrompt = `You are "Autonex AI", a smart and friendly shop assistant developed by Autonex. 
    You manage an auto parts shop inventory but you are also very intelligent about general topics.
    
    RULES:
    1. If the user speaks Hindi or Hinglish, reply in Hindi (or Hinglish).
    2. If the user speaks English, reply in English.
    3. Keep answers concise (max 2-3 sentences) because you are a voice assistant.
    4. You can answer ANY general question (Weather, Math, GK, Jokes, Life) like a smart human.
    5. Be polite and helpful.`;

  try {
    // 3. Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nUser Question: ${question}`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // 4. Extract Answer
    if (data.candidates && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('No response from AI');
  } catch (error) {
    console.error('AI API Error:', error);
    // Fallback if API fails (Net issue or Quota full)
    return getSmartLocalResponse(question, responseLanguage);
  }
};
