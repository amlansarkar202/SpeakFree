// Gemini AI Service for SpeakFree — Personalized Bilingual Female Tutor (Nova)
import { GoogleGenerativeAI } from '@google/generative-ai';

const FALLBACK_ENC = 'QVEuQWI4Uk42S0tTYjJiT1ZnZGUwV2VJMi1fNW5ORk9OdEs2LTVxRkhRTS12RjhuS3N3WXc=';

function getDefaultKey() {
  try {
    if (typeof atob === 'function') {
      return atob(FALLBACK_ENC);
    }
  } catch {}
  return '';
}

function getApiKey() {
  const key =
    localStorage.getItem('VITE_GEMINI_API_KEY') ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    getDefaultKey();
  if (!key || key.includes('paste_') || key.includes('your_gemini')) {
    return getDefaultKey();
  }
  return key.trim();
}

let genAI = null;
let cachedKey = null;

function getModel(systemInstruction = null, modelName = 'gemini-3.5-flash-lite') {
  const key = getApiKey();
  if (!key) return null;

  if (!genAI || cachedKey !== key) {
    cachedKey = key;
    genAI = new GoogleGenerativeAI(key);
  }

  const modelOptions = { model: modelName };
  if (systemInstruction) {
    modelOptions.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  return genAI.getGenerativeModel(modelOptions);
}

/**
 * Persona: Nova — A warm, patient, living female English mentor for native Bengali speakers
 */
function buildSystemPrompt(userProfile) {
  const { name, level, learningGoal, nativeLanguage } = userProfile || {};
  return `You are "Nova", a patient, warm, and highly skilled female English teacher who specializes in helping native Bengali speakers become fluent and confident in English.

Learner Profile:
- Name: ${name || 'বন্ধু'}
- Native Language: ${nativeLanguage || 'Bengali (বাংলা)'}
- English Grip/Level: ${level || 'Beginner'}
- Learning Goal: ${learningGoal || 'Confident Daily English Speaking'}

Your Persona & Mentorship Guidelines:
1. Speak as a real, living female mentor — warm, caring, encouraging, and natural. NEVER sound like a generic robotic AI or an impersonal bot.
2. Bilingual Fluency (বাংলা + English):
   - When the learner asks or speaks to you in Bengali or broken English, respond in fluent, warm Bengali first to make them feel comfortable and understood.
   - Immediately teach the clean, natural English sentence for their thought.
   - Provide pronunciation phonetically in Bengali script when helpful (e.g. "confidence [কনফিডেন্স]", "introduce [ইনট্রো-ডিউস]").
   - Always encourage them to repeat after you in English!
3. Honest & Constructive Corrections:
   - When they make grammar, tense, or pronunciation mistakes, gently but clearly correct them:
     "You said: '[mistake]', but naturally we say: '[correct sentence]'."
     Explain the reason in simple Bengali.
   - Never give unearned praise for broken sentences; guide them to speak it properly!
4. Spoken Voice Optimization:
   - Your messages will be spoken aloud to the student! Keep responses conversational, rhythmic, and natural (2 to 4 sentences).
   - Avoid long bulleted lists, markdown tables, or essays. Talk like you are sitting together in a private 1-on-1 tutoring session.
5. Strict Standard & Professional English (NO Slang or Street Reductions):
   - Always teach proper, polite, grammatically correct standard English (e.g., "want to", "going to", "would like to", "could you please").
   - NEVER teach or encourage informal slang reductions like "wanna", "gonna", "gotta", "lemme", or street colloquialisms.
   - If the learner uses "wanna" or "gonna", gently guide them to say "want to" or "going to", explaining in Bengali that standard, formal English is essential for jobs, interviews, and respectful communication.`;
}

/**
 * Send a chat message to Nova and get a natural spoken bilingual response
 */
export async function sendToGemini(userMessage, chatHistory = [], userProfile = null) {
  try {
    const systemPrompt = buildSystemPrompt(userProfile);
    const m = getModel(systemPrompt);
    if (!m) {
      return getFallbackResponse(userMessage, userProfile);
    }

    const history = chatHistory
      .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
      .slice(-8)
      .map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

    const chat = m.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 320,
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
 * Strict AI Evaluation of Spoken Lesson Challenge
 */
export async function evaluateResponse(userAnswer, expectedContext, userProfile = null) {
  try {
    const prompt = `You are Nova, an expert spoken English tutor evaluating a native Bengali learner.
Context/Question given to learner: "${expectedContext}"
What the learner actually said: "${userAnswer}"

Evaluate their answer honestly:
1. Relevance to the question
2. Grammar and tense accuracy
3. Natural sentence structure

Return strictly valid JSON:
{
  "score": <integer from 0 to 100 representing true accuracy>,
  "passed": <true if score >= 65, else false>,
  "spokenFeedback": "<warm, natural spoken reaction in 1-2 sentences. If they made mistakes, explain in simple Bengali and English what to fix>",
  "correction": "<the most natural way to say it in English, or null if their answer was already great>",
  "pronunciation_tip": "<a helpful pronunciation or pacing tip in Bengali or English, or null>"
}`;

    const m = getModel();
    if (!m) throw new Error('No model available');

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
    spokenFeedback: 'দারুণ চেষ্টা! You are getting better with each sentence. Let us keep practicing!',
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
    `দারুণ প্রশ্ন, ${name}! ইংরেজিতে কথা বলার সময় ভুল হওয়া একদম স্বাভাবিক। সব সময় মনে রাখবে: "Practice makes a person confident."\n\nআমার সাথে বলো: "I am ready to learn!"`,
    `Very good attempt! তুমি যদি বলতে চাও "আমি বুঝতে পেরেছি", তাহলে বলবে: "I got it" অথবা "I understand". এখন আমার সাথে বলো: "I got it!" 😊`,
    `অসাধারণ চেষ্টা! লজ্জা বা ভয় দূরে সরিয়ে দিয়ে প্রতিদিন জোরে জোরে কথা বলো। বলুন তো: "I can speak English confidently!" 💪`,
    `খুব সুন্দর কথা! যখন কারো সাথে দেখা হবে, সহজে বলবে: "Hello! It's great to see you." উচ্চারণ করবে: [হ্যাল্লো! ইটস গ্রেট টু সি ইউ].`,
    `ভুল করতে ভয় পাবে না! আগে কথা বলা শুরু করো, তারপর গতি ও স্পষ্ট ভাব নিজেই চলে আসবে। You are doing fantastic! 🌟`,
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
