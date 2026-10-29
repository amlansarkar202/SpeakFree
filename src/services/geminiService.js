// Gemini AI Service for SpeakFree
// Uses @google/generative-ai with a free API key set via env

import { GoogleGenerativeAI } from '@google/generative-ai';

function getApiKey() {
  const key =
    localStorage.getItem('VITE_GEMINI_API_KEY') ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    '';
  if (!key || key.includes('paste_') || key.includes('your_gemini')) {
    return null;
  }
  return key.trim();
}

let genAI = null;
let cachedKey = null;
let model = null;

function getModel(modelName = 'gemini-3.5-flash-lite') {
  const key = getApiKey();
  if (!key) return null;

  if (!genAI || cachedKey !== key) {
    cachedKey = key;
    genAI = new GoogleGenerativeAI(key);
    model = genAI.getGenerativeModel({ model: modelName });
  }
  return model;
}

/**
 * Build a system context for the AI tutor
 */
function buildSystemPrompt(userProfile) {
  const { name, level, learningGoal, nativeLanguage } = userProfile || {};
  return `You are "Nova", a warm, encouraging and expert English tutor for SpeakFree.
The learner's name is ${name || 'the learner'}.
Their native language is ${nativeLanguage || 'Bengali (বাংলা)'}.
Their current English level is: ${level || 'Beginner'}.
Their goal: ${learningGoal || 'Daily conversational English'}.

Rules:
1. ALWAYS respond in a mix of simple English + Bengali explanations when the learner seems confused or stuck.
2. Keep responses SHORT (2-4 sentences max) unless asked to explain deeply.
3. When the learner makes a grammar/pronunciation mistake, gently correct them with: ✏️ "You could say: [corrected version]"
4. Use emojis lightly to feel warm and human, not robotic.
5. If they write/speak in Bengali, understand it and respond with the English equivalent, then ask them to try saying it.
6. Give XP-style encouragement: "Great job! +10 XP 🎉", "Almost there!", etc.
7. For pronunciation: use phonetics in brackets e.g., "comfortable [KUM-fer-tuh-bul]".
8. Never make the learner feel bad about mistakes — normalize them as part of learning.
9. When asked to roleplay (interview, ordering food, etc.), stay in character as the other person.
10. Language of instruction when needed: Bengali (বাংলা).`;
}

/**
 * Send a chat message to Gemini and get a response
 */
export async function sendToGemini(userMessage, chatHistory = [], userProfile = null) {
  const m = getModel();
  if (!m) {
    // Fallback offline mode
    return getFallbackResponse(userMessage, userProfile);
  }

  try {
    const systemPrompt = buildSystemPrompt(userProfile);

    // Build history for Gemini (alternating user/model)
    const history = chatHistory
      .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
      .slice(-10) // last 10 exchanges
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const chat = m.startChat({
      history,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.85,
      },
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (err) {
    console.error('Gemini error:', err);
    return getFallbackResponse(userMessage, userProfile);
  }
}

/**
 * Evaluate a lesson answer / speaking response
 */
export async function evaluateResponse(userAnswer, expectedContext, userProfile = null) {
  const m = getModel();
  if (!m) return { score: 80, feedback: 'Good effort! Keep practicing.', correction: null };

  try {
    const prompt = `You are an English tutor evaluating a learner's answer.
Context/Expected: "${expectedContext}"
Learner answered: "${userAnswer}"

Respond in JSON with this exact format:
{
  "score": <0-100>,
  "feedback": "<short encouraging feedback in 1-2 sentences>",
  "correction": "<corrected version if needed, or null>",
  "pronunciation_tip": "<a quick pronunciation tip if relevant, or null>"
}`;

    const result = await m.generateContent(prompt);
    const text = result.response.text().trim();
    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Eval error:', err);
  }
  return { score: 75, feedback: 'Good try! Practice makes perfect. 💪', correction: null, pronunciation_tip: null };
}

/**
 * Generate a personalized lesson based on level
 */
export async function generateDailyLesson(userProfile) {
  const m = getModel();
  if (!m) return null;

  const { level, learningGoal } = userProfile || {};
  try {
    const prompt = `Generate a short English speaking lesson for a ${level} learner whose goal is "${learningGoal}".
Return JSON:
{
  "title": "lesson title",
  "topic": "topic in one word",
  "objective": "what they'll learn",
  "vocabulary": [{"word": "", "meaning_bengali": "", "example": ""}],
  "phrases": [{"english": "", "bengali": ""}],
  "practice_prompt": "a roleplay or speaking prompt to practice"
}
Keep it SHORT (3 vocab words, 3 phrases max). Respond only JSON.`;

    const result = await m.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Lesson gen error:', err);
  }
  return null;
}

/**
 * Offline fallback responses
 */
function getFallbackResponse(message, userProfile) {
  const responses = [
    "That's a great attempt! 🌟 Keep practicing — consistency is key to fluency.\n✏️ Try speaking slowly and clearly first, then speed will come naturally.",
    "আপনি ভালো করছেন! (You're doing well!) Don't worry about mistakes — every mistake is a lesson. 💪",
    "Interesting! Let me help you with that. Try saying it again, and focus on each word clearly.",
    "Great effort! Remember: [COM-fort-uh-bul] = comfortable. Practice in front of a mirror! 🪞",
    "You're improving every day! 📈 Set a small goal: speak 5 English sentences today. You can do it!",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

export function hasLiveAi() {
  return Boolean(getApiKey());
}

export function setGeminiKey(key) {
  if (key) {
    localStorage.setItem('VITE_GEMINI_API_KEY', key.trim());
  } else {
    localStorage.removeItem('VITE_GEMINI_API_KEY');
  }
}
