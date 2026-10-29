// Gemini AI Service for SpeakFree — Personalized Bilingual Tutor (Nova)
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
 * Persona: Nova — A warm, supportive, human-like bilingual English mentor & tutor
 */
function buildSystemPrompt(userProfile) {
  const { name, level, learningGoal, nativeLanguage } = userProfile || {};
  return `You are "Nova", a patient, warm, and highly skilled female English teacher who specializes in helping native Bengali speakers become fluent and confident in English.

Learner Profile:
- Name: ${name || 'বন্ধু'}
- Native Language: ${nativeLanguage || 'Bengali (বাংলা)'}
- English Grip/Level: ${level || 'Beginner'}
- Learning Goal: ${learningGoal || 'Confident Daily English Speaking'}

Your Persona & Teaching Rules:
1. Speak as a real, living mentor — warm, supportive, conversational, and natural. NEVER sound like a generic robotic AI or a textbook.
2. Natural Bilingual Fluency:
   - When introducing new ideas or explaining difficult concepts, use friendly, natural Bengali (e.g., "দারুণ চেষ্টা!", "চলো এটা সহজ করে বুঝি...").
   - Give the clean, natural English equivalent right after.
   - Teach pronunciation phonetically when helpful (e.g. "schedule [SKED-jool]").
3. Strict Accountability & Honest Mentorship:
   - When the learner makes a mistake in grammar or vocabulary, GENTLY but CLEARLY pinpoint it:
     ✏️ "You said: [what they said], but a native speaker would say: [natural way]"
     Explain WHY in simple Bengali.
   - Do NOT just hand out praise when their grammar is wrong. Help them fix it!
4. Voice-Optimized Responses:
   - Your messages will be spoken aloud to the student! Keep sentences conversational, rhythmic, and natural (2 to 4 sentences).
   - Avoid long bulleted essays. Talk to them like you're sitting together in a private 1-on-1 tutoring session.
5. If the learner writes or speaks to you in Bengali or Banglish:
   - Understand them completely.
   - Respond in warm Bengali and teach them how to say that exact thought in natural, confident English.
   - Ask them to repeat it back to you!`;
}

/**
 * Send a chat message to Nova and get a spoken conversational response
 */
export async function sendToGemini(userMessage, chatHistory = [], userProfile = null) {
  const m = getModel();
  if (!m) {
    return getFallbackResponse(userMessage, userProfile);
  }

  try {
    const systemPrompt = buildSystemPrompt(userProfile);

    const history = chatHistory
      .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
      .slice(-8)
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const chat = m.startChat({
      history,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: 280,
        temperature: 0.8,
      },
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text().trim();
  } catch (err) {
    console.error('Nova AI chat error:', err);
    return getFallbackResponse(userMessage, userProfile);
  }
}

/**
 * Strict AI Evaluation of Spoken Lesson Response
 */
export async function evaluateResponse(userAnswer, expectedContext, userProfile = null) {
  const m = getModel();
  if (!m) {
    return {
      score: 75,
      passed: true,
      feedback: 'Good effort! Focus on speaking every word clearly.',
      spokenFeedback: 'Good try! Remember to speak with confidence. Let us keep practicing!',
      correction: null,
      pronunciation_tip: 'Practice pausing slightly between phrases.',
    };
  }

  try {
    const prompt = `You are Nova, an expert English spoken tutor evaluating a Bengali learner.
Context/Question given to learner: "${expectedContext}"
What the learner actually said: "${userAnswer}"

Evaluate their answer honestly based on:
1. Relevance to the question
2. Grammar and tense accuracy
3. Natural sentence structure

Return strictly valid JSON:
{
  "score": <integer from 0 to 100 representing true accuracy>,
  "passed": <true if score >= 65, else false>,
  "spokenFeedback": "<a warm, natural spoken reaction in 1-2 sentences. If they made mistakes, explain in simple Bengali and English what to fix>",
  "correction": "<the most natural way to say it in English, or null if their answer was already great>",
  "pronunciation_tip": "<a helpful pronunciation or pacing tip, or null>"
}`;

    const result = await m.generateContent(prompt);
    const text = result.response.text().trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: typeof parsed.score === 'number' ? parsed.score : 70,
        passed: Boolean(parsed.passed ?? parsed.score >= 65),
        feedback: parsed.spokenFeedback || 'Good effort!',
        spokenFeedback: parsed.spokenFeedback || 'Good attempt!',
        correction: parsed.correction || null,
        pronunciation_tip: parsed.pronunciation_tip || null,
      };
    }
  } catch (err) {
    console.error('Nova evaluation error:', err);
  }

  return {
    score: 70,
    passed: true,
    feedback: 'Good attempt! Keep practicing your pacing.',
    spokenFeedback: 'দারুণ চেষ্টা! You are getting better with each sentence.',
    correction: null,
    pronunciation_tip: null,
  };
}

/**
 * Nova's offline fallback responses with authentic Bengali-English mentoring
 */
function getFallbackResponse(message, userProfile) {
  const name = userProfile?.name || 'বন্ধু';
  const responses = [
    `দারুণ প্রশ্ন, ${name}! ইংরেজিতে কথা বলার সময় ভুল হওয়া একদম স্বাভাবিক। সব সময় মনে রাখবে: "Practice makes a person confident."\n\nচলো আবার চেষ্টা করি!`,
    `Very good attempt! তুমি যদি বলতে চাও "আমি বুঝতে পেরেছি", তাহলে বলবে: "I got it" অথবা "I understand". এখন আমার সাথে বলো: "I got it!" 😊`,
    `অসাধারণ চেষ্টা! Keep speaking out loud. লজ্জা বা ভয় দূরে সরিয়ে দিয়ে প্রতিদিন ৫টি করে নতুন বাক্য বলো। You can do it! 💪`,
    `Good question! যখন কারো সাথে দেখা হবে, সহজ করে বলবে: "Hello! It's so nice to see you." উচ্চারণ করবে: [nais tu see yoo].`,
    `খুব ভালো! Don't worry about perfect grammar right now. আগে স্পষ্ট করে কথা বলা শুরু করো, তারপর গতি ও নিখুঁত ভাব নিজেই চলে আসবে। 🌟`,
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
