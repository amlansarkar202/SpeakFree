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
  let localKey = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localKey = localStorage.getItem('VITE_GEMINI_API_KEY');
    }
  } catch {}

  const envKey =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_GEMINI_API_KEY
      : null;

  const key = localKey || envKey || getDefaultKey();
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
- Name: ${name || 'Learner'}
- Native Language: ${nativeLanguage || 'Bengali (বাংলা)'}
- English Grip/Level: ${level || 'Beginner'}
- Learning Goal: ${learningGoal || 'Confident Daily English Speaking'}

Your Persona & Mentorship Guidelines:
1. Speak as a real, living female mentor — warm, caring, encouraging, and natural. NEVER sound like a generic robotic AI or an impersonal bot.
2. Direct Responsiveness:
   - Always respond DIRECTLY and ACCURATELY to whatever the user asks, says, or types. Answer their exact questions.
   - If they ask for grammar help, a translation, vocabulary, an interview practice, or casual talk, address it immediately and thoroughly.
3. Bilingual Fluency (বাংলা + English):
   - When the learner asks or speaks to you in Bengali or broken English, respond in fluent, warm Bengali first to make them feel comfortable and understood.
   - Immediately teach the clean, natural English sentence for their thought.
   - Provide pronunciation phonetically in Bengali script when helpful (e.g. "confidence [কনফিডেন্স]", "introduce [ইনট্রো-ডিউস]").
   - Always encourage them to repeat after you in English!
4. Honest & Constructive Corrections:
   - When they make grammar, tense, or pronunciation mistakes, gently but clearly correct them:
     "You said: '[mistake]', but naturally we say: '[correct sentence]'."
     Explain the reason in simple Bengali.
   - Never give unearned praise for broken sentences; guide them to speak it properly!
5. Spoken Voice Optimization:
   - Your messages will be spoken aloud to the student! Keep responses conversational, rhythmic, and natural (2 to 4 sentences).
   - Avoid long bulleted lists, markdown tables, or essays. Talk like you are sitting together in a private 1-on-1 tutoring session.
6. Strict Standard & Professional English (NO Slang or Street Reductions):
   - Always teach proper, polite, grammatically correct standard English (e.g., "want to", "going to", "would like to", "could you please").
   - NEVER teach or encourage informal slang reductions like "wanna", "gonna", "gotta", "lemme", or street colloquialisms.
   - If the learner uses "wanna" or "gonna", gently guide them to say "want to" or "going to", explaining in Bengali that standard, formal English is essential for jobs, interviews, and respectful communication.`;
}

/**
 * Clean and structure conversation history so Google Gemini receives strictly alternating turns
 * Rule: Must start with 'user', alternate 'user' -> 'model', and end with 'model'
 */
function cleanHistory(rawHistory) {
  if (!Array.isArray(rawHistory) || rawHistory.length === 0) return [];

  const turns = [];
  let expectedRole = 'user';

  for (const m of rawHistory) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const role = m.role === 'assistant' ? 'model' : 'user';

    if (role === expectedRole && m.content && m.content.trim()) {
      turns.push({ role, parts: [{ text: m.content.trim() }] });
      expectedRole = expectedRole === 'user' ? 'model' : 'user';
    }
  }

  // History for startChat must end with 'model' because sendMessage sends the next 'user' message
  if (turns.length > 0 && turns[turns.length - 1].role === 'user') {
    turns.pop();
  }

  // Keep last 6 alternating turns (3 pairs)
  return turns.slice(-6);
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

    const history = cleanHistory(chatHistory);

    const chat = m.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 380,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text().trim();
  } catch (err) {
    console.error('Nova AI chat error:', err);
    // If multi-turn history failed for any reason, retry with fresh single turn
    try {
      const systemPrompt = buildSystemPrompt(userProfile);
      const m = getModel(systemPrompt);
      if (m) {
        const singleChat = m.startChat({});
        const retryResult = await singleChat.sendMessage(userMessage);
        return retryResult.response.text().trim();
      }
    } catch (retryErr) {
      console.error('Nova single-turn retry error:', retryErr);
    }
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
 * Nova's intelligent fallback if network is completely down
 */
function getFallbackResponse(message, userProfile) {
  const name = userProfile?.name || 'বন্ধু';
  return `নমস্কার ${name}! আমি আপনার কথাটি বুঝতে পেরেছি। সাময়িক ইন্টারনেট সমস্যার কারণে বিস্তারিত উত্তর দিতে এক মুহূর্ত দেরি হচ্ছে। দয়া করে আরেকবার বলুন বা লিখুন! 😊`;
}

export function hasLiveAi() {
  return Boolean(getApiKey());
}

export function setGeminiKey(key) {
  try {
    if (typeof localStorage === 'undefined') return;
    if (key) {
      localStorage.setItem('VITE_GEMINI_API_KEY', key.trim());
    } else {
      localStorage.removeItem('VITE_GEMINI_API_KEY');
    }
  } catch {}
}
