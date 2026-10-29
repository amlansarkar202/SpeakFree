// Syllabus data — structured Bengali-to-English curriculum
// Architecture allows adding other native languages later

export const LEARNING_GOALS = [
  { id: 'daily', label: 'Daily Conversation', labelBn: 'দৈনন্দিন কথোপকথন', emoji: '💬' },
  { id: 'job', label: 'Job Interviews & Office', labelBn: 'চাকরির ইন্টারভিউ ও অফিস', emoji: '💼' },
  { id: 'travel', label: 'Travel & Socializing', labelBn: 'ভ্রমণ ও সামাজিকতা', emoji: '✈️' },
  { id: 'academic', label: 'Academic & Study', labelBn: 'পড়াশোনা ও একাডেমিক', emoji: '📚' },
  { id: 'fluency', label: 'Overall Fluency & Accent', labelBn: 'সার্বিক দক্ষতা ও উচ্চারণ', emoji: '🎯' },
];

export const LEVELS = [
  {
    id: 'beginner',
    label: 'Beginner',
    labelBn: 'নতুন শিক্ষার্থী',
    desc: 'I know very little English',
    descBn: 'আমি খুব কম ইংরেজি জানি',
    emoji: '🌱',
    xpGoal: 30,
  },
  {
    id: 'elementary',
    label: 'Elementary',
    labelBn: 'প্রাথমিক',
    desc: 'I know basics but struggle speaking',
    descBn: 'মূল বিষয় জানি কিন্তু বলতে কষ্ট হয়',
    emoji: '🌿',
    xpGoal: 40,
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    labelBn: 'মধ্যবর্তী',
    desc: 'I can form sentences but not fluently',
    descBn: 'বাক্য তৈরি করতে পারি কিন্তু স্বাভাবিকভাবে নয়',
    emoji: '🌳',
    xpGoal: 50,
  },
  {
    id: 'advanced',
    label: 'Advanced',
    labelBn: 'উন্নত',
    desc: 'I speak well but want to polish fluency',
    descBn: 'ভালো বলি কিন্তু আরো দক্ষ হতে চাই',
    emoji: '🚀',
    xpGoal: 60,
  },
];

export const TIMELINES = [
  { id: '15', label: '15 min / day', labelBn: 'প্রতিদিন ১৫ মিনিট', desc: 'Relaxed pace', minutes: 15 },
  { id: '30', label: '30 min / day', labelBn: 'প্রতিদিন ৩০ মিনিট', desc: 'Steady pace', minutes: 30 },
  { id: '45', label: '45 min / day', labelBn: 'প্রতিদিন ৪৫ মিনিট', desc: 'Fast track', minutes: 45 },
  { id: '60', label: '1 hour / day', labelBn: 'প্রতিদিন ১ ঘণ্টা', desc: 'Intensive mode', minutes: 60 },
];

// ── CURRICULUM ────────────────────────────────────────────────────────────────
// Modular: each unit has lessons, each lesson has type + content
export const CURRICULUM = {
  beginner: [
    {
      id: 'u1',
      title: 'Starting From Scratch',
      titleBn: 'একদম শুরু থেকে',
      emoji: '🌱',
      lessons: [
        {
          id: 'u1l1',
          title: 'Greetings & Introductions',
          titleBn: 'শুভেচ্ছা ও পরিচয়',
          type: 'vocabulary',
          duration: 8,
          xp: 15,
          content: {
            vocabulary: [
              { word: 'Hello', meaning: 'হ্যালো / নমস্কার', example: 'Hello! My name is Amlan.' },
              { word: 'Good morning', meaning: 'শুভ সকাল', example: 'Good morning! How are you?' },
              { word: 'Nice to meet you', meaning: 'আপনার সাথে দেখা করে ভালো লাগলো', example: "I'm Riya. Nice to meet you!" },
              { word: 'How are you?', meaning: 'আপনি কেমন আছেন?', example: 'How are you today?' },
              { word: 'I am fine', meaning: 'আমি ভালো আছি', example: 'I am fine, thank you!' },
            ],
            phrases: [
              { english: "Hello, my name is Amlan.", bengali: "হ্যালো, আমার নাম অম্লান।" },
              { english: "I am from Kolkata, West Bengal.", bengali: "আমি কলকাতার বাসিন্দা।" },
              { english: "Nice to meet you!", bengali: "আপনার সাথে পরিচিত হতে পেরে ভালো লাগলো!" },
            ],
            practicePrompt: "Imagine you just met someone at a party. Introduce yourself in English!",
          },
        },
        {
          id: 'u1l2',
          title: 'Numbers & Time',
          titleBn: 'সংখ্যা ও সময়',
          type: 'vocabulary',
          duration: 10,
          xp: 15,
          content: {
            vocabulary: [
              { word: 'One, Two, Three', meaning: 'এক, দুই, তিন', example: 'I have three apples.' },
              { word: "What time is it?", meaning: 'কয়টা বাজে?', example: "What time is it? It's 3 o'clock." },
              { word: 'Morning / Evening / Night', meaning: 'সকাল / সন্ধ্যা / রাত', example: 'Good evening, sir!' },
            ],
            phrases: [
              { english: "It is nine o'clock in the morning.", bengali: "এখন সকাল নয়টা বাজে।" },
              { english: "See you tomorrow!", bengali: "কাল দেখা হবে!" },
            ],
            practicePrompt: "Tell me: What time do you wake up every morning? Answer in English!",
          },
        },
        {
          id: 'u1l3',
          title: 'Basic Questions',
          titleBn: 'সাধারণ প্রশ্ন',
          type: 'speaking',
          duration: 12,
          xp: 20,
          content: {
            vocabulary: [
              { word: 'What', meaning: 'কী / কোনটি', example: "What is your name?" },
              { word: 'Where', meaning: 'কোথায়', example: "Where do you live?" },
              { word: 'When', meaning: 'কখন', example: "When do you sleep?" },
              { word: 'Why', meaning: 'কেন', example: "Why are you late?" },
              { word: 'How', meaning: 'কীভাবে', example: "How do you go to school?" },
            ],
            phrases: [
              { english: "Can you repeat that?", bengali: "আবার বলবেন?" },
              { english: "I don't understand.", bengali: "আমি বুঝতে পারছি না।" },
              { english: "Could you speak slowly?", bengali: "একটু ধীরে বলবেন?" },
            ],
            practicePrompt: "Ask me 3 questions about my day using What, Where, or How!",
          },
        },
      ],
    },
    {
      id: 'u2',
      title: 'Everyday Life',
      titleBn: 'দৈনন্দিন জীবন',
      emoji: '🏠',
      lessons: [
        {
          id: 'u2l1',
          title: 'At Home',
          titleBn: 'ঘরে',
          type: 'vocabulary',
          duration: 10,
          xp: 15,
          content: {
            vocabulary: [
              { word: 'Kitchen', meaning: 'রান্নাঘর', example: 'My mother cooks in the kitchen.' },
              { word: 'Bedroom', meaning: 'শোবার ঘর', example: 'I sleep in my bedroom.' },
              { word: 'Living room', meaning: 'বসার ঘর', example: 'We watch TV in the living room.' },
            ],
            phrases: [
              { english: "Can you help me?", bengali: "আপনি কি আমাকে সাহায্য করতে পারবেন?" },
              { english: "I need water.", bengali: "আমার পানি দরকার।" },
            ],
            practicePrompt: "Describe your home to me in 3 sentences!",
          },
        },
        {
          id: 'u2l2',
          title: 'Shopping & Markets',
          titleBn: 'কেনাকাটা ও বাজার',
          type: 'roleplay',
          duration: 15,
          xp: 25,
          content: {
            vocabulary: [
              { word: 'How much?', meaning: 'কত দাম?', example: "How much does this cost?" },
              { word: 'Expensive', meaning: 'দামি', example: "This is too expensive." },
              { word: 'Discount', meaning: 'ছাড়', example: "Can I get a discount?" },
            ],
            phrases: [
              { english: "I would like to buy this book.", bengali: "আমি এই বইটি কিনতে চাই।" },
              { english: "Do you have this in another color?", bengali: "এটা কি অন্য রঙে আছে?" },
            ],
            practicePrompt: "Roleplay: You're at a shop. I'm the shopkeeper. Ask me about a shirt you want to buy!",
          },
        },
      ],
    },
  ],

  intermediate: [
    {
      id: 'u3',
      title: 'Speaking Naturally',
      titleBn: 'স্বাভাবিকভাবে কথা বলা',
      emoji: '🗣️',
      lessons: [
        {
          id: 'u3l1',
          title: 'Opinions & Feelings',
          titleBn: 'মতামত ও অনুভূতি',
          type: 'speaking',
          duration: 12,
          xp: 20,
          content: {
            vocabulary: [
              { word: 'In my opinion', meaning: 'আমার মতে', example: "In my opinion, this is the best solution." },
              { word: 'I feel that', meaning: 'আমার মনে হয়', example: "I feel that we need more time." },
              { word: 'Honestly', meaning: 'সৎভাবে বলতে গেলে', example: "Honestly, I don't agree." },
            ],
            phrases: [
              { english: "I believe education is the key to success.", bengali: "আমি বিশ্বাস করি শিক্ষাই সাফল্যের চাবিকাঠি।" },
              { english: "That's a good point!", bengali: "এটা একটা ভালো কথা!" },
              { english: "I see your point, but I have another perspective.", bengali: "আপনার কথা বুঝলাম, কিন্তু আমার অন্য দৃষ্টিকোণ আছে।" },
            ],
            practicePrompt: "Give your opinion: Should students use smartphones in school? Why or why not?",
          },
        },
        {
          id: 'u3l2',
          title: 'Tenses Made Easy',
          titleBn: 'কাল সহজে',
          type: 'grammar',
          duration: 15,
          xp: 25,
          content: {
            vocabulary: [
              { word: 'Yesterday / Today / Tomorrow', meaning: 'গতকাল / আজ / আগামীকাল', example: "Yesterday I went to school." },
              { word: 'Was / Were', meaning: 'ছিলাম / ছিলেন', example: "I was at home yesterday." },
              { word: 'Will / Going to', meaning: 'করব / করতে যাচ্ছি', example: "I will call you tomorrow." },
            ],
            phrases: [
              { english: "I was very busy yesterday.", bengali: "আমি গতকাল খুব ব্যস্ত ছিলাম।" },
              { english: "I am going to attend the meeting tomorrow.", bengali: "আমি আগামীকাল মিটিংয়ে যোগ দিতে যাচ্ছি।" },
            ],
            practicePrompt: "Tell me about: What you did yesterday, what you are doing now, and what you will do tomorrow.",
          },
        },
      ],
    },
    {
      id: 'u4',
      title: 'Professional English',
      titleBn: 'পেশাদার ইংরেজি',
      emoji: '💼',
      lessons: [
        {
          id: 'u4l1',
          title: 'Job Interview Prep',
          titleBn: 'চাকরির ইন্টারভিউ প্রস্তুতি',
          type: 'roleplay',
          duration: 20,
          xp: 30,
          content: {
            vocabulary: [
              { word: 'Strengths & Weaknesses', meaning: 'শক্তি ও দুর্বলতা', example: "My strength is attention to detail." },
              { word: 'Experience', meaning: 'অভিজ্ঞতা', example: "I have 2 years of experience." },
              { word: 'Opportunity', meaning: 'সুযোগ', example: "This is a great opportunity." },
            ],
            phrases: [
              { english: "I am passionate about software development.", bengali: "আমি সফটওয়্যার ডেভেলপমেন্টে আগ্রহী।" },
              { english: "My greatest strength is problem solving.", bengali: "আমার সবচেয়ে বড় শক্তি হলো সমস্যা সমাধান।" },
              { english: "I look forward to contributing to your team.", bengali: "আমি আপনার টিমে অবদান রাখতে উন্মুখ।" },
            ],
            practicePrompt: "Interview roleplay: I am the interviewer. Tell me: 'Tell me about yourself.' Answer in 4-5 sentences!",
          },
        },
      ],
    },
  ],

  advanced: [
    {
      id: 'u5',
      title: 'Fluency & Accent Mastery',
      titleBn: 'দক্ষতা ও উচ্চারণ দক্ষতা',
      emoji: '🚀',
      lessons: [
        {
          id: 'u5l1',
          title: 'Reducing Filler Words',
          titleBn: 'অপ্রয়োজনীয় শব্দ কমানো',
          type: 'fluency',
          duration: 15,
          xp: 25,
          content: {
            vocabulary: [
              { word: 'Pause deliberately', meaning: 'ইচ্ছাকৃতভাবে থামুন', example: "Instead of 'um', just pause for 1 second." },
              { word: 'Filler words', meaning: 'অর্থহীন শব্দ', example: "'Um', 'uh', 'like', 'you know' — replace with a pause." },
              { word: 'Cadence', meaning: 'ছন্দ', example: "Good cadence = speaking at a natural, steady rhythm." },
            ],
            phrases: [
              { english: "What I mean to say is that practice brings confidence.", bengali: "আমি বলতে চাইছি যে অনুশীলনের মাধ্যমেই আত্মবিশ্বাস আসে।" },
              { english: "Let me put it this way for clarity.", bengali: "স্পষ্টভাবে বোঝার জন্য আমি এভাবে বলি।" },
            ],
            practicePrompt: "Tell me about your favorite movie in 5 sentences — NO 'um', 'uh', or 'like'. Use deliberate pauses instead!",
          },
        },
        {
          id: 'u5l2',
          title: 'Connected Speech & Linking',
          titleBn: 'সংযুক্ত কথা বলা',
          type: 'pronunciation',
          duration: 15,
          xp: 25,
          content: {
            vocabulary: [
              { word: 'Articulation', meaning: 'স্পষ্ট উচ্চারণ', example: "Pronounce each word cleanly and politely" },
              { word: 'Polite Expression', meaning: 'ভদ্র প্রকাশভঙ্গি', example: "'I would like to' or 'I want to'" },
              { word: 'Stress & Rhythm', meaning: 'সঠিক জোর ও ছন্দ', example: "'I want to learn' emphasizes your clear intent" },
            ],
            phrases: [
              { english: "I want to go there.", bengali: "আমি সেখানে যেতে চাই।" },
              { english: "It is going to be wonderful!", bengali: "এটি অসাধারণ হতে চলেছে!" },
            ],
            practicePrompt: "Practice speaking clearly and politely: 'I would like to speak fluent and correct English every day.'",
          },
        },
      ],
    },
  ],
};

// Helper to get all lessons flat
export function getAllLessons(level = 'beginner') {
  return (CURRICULUM[level] || CURRICULUM.beginner)
    .flatMap((unit) => unit.lessons.map((l) => ({ ...l, unitId: unit.id, unitTitle: unit.title })));
}

export function getLessonById(lessonId, level = 'beginner') {
  return getAllLessons(level).find((l) => l.id === lessonId);
}
