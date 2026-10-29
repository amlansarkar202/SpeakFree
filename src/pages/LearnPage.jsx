import { useState } from 'react';
import { ChevronRight, Lock, CheckCircle2, Clock, Zap, BookOpen, Mic, Users, BarChart2, X, Volume2 } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { CURRICULUM, getAllLessons } from '../data/curriculum';
import LessonView from '../components/LessonView';
import { useTTS } from '../hooks/useSpeech';

const TYPE_META = {
  vocabulary: { icon: BookOpen,  color: 'bg-brand-500',   label: 'Vocabulary' },
  speaking:   { icon: Mic,       color: 'bg-accent-500',  label: 'Speaking' },
  roleplay:   { icon: Users,     color: 'bg-success-500', label: 'Roleplay' },
  grammar:    { icon: BarChart2, color: 'bg-warn-500',    label: 'Grammar' },
  fluency:    { icon: Mic,       color: 'bg-purple-500',  label: 'Fluency' },
  pronunciation: { icon: Volume2, color: 'bg-pink-500',   label: 'Pronunciation' },
};

export default function LearnPage() {
  const theme            = useAppStore((s) => s.theme);
  const userProfile      = useAppStore((s) => s.userProfile);
  const completedLessons = useAppStore((s) => s.completedLessons);

  const [activeLesson, setActiveLesson] = useState(null);

  const isDark    = theme === 'dark';
  const levelKey  = userProfile?.level || 'beginner';
  const units     = CURRICULUM[levelKey] || CURRICULUM.beginner;
  const allFlat   = getAllLessons(levelKey);

  function isLocked(lessonId) {
    const idx = allFlat.findIndex((l) => l.id === lessonId);
    if (idx === 0) return false;
    const prevId = allFlat[idx - 1]?.id;
    return prevId && !completedLessons.includes(prevId);
  }

  if (activeLesson) {
    return <LessonView lesson={activeLesson} onClose={() => setActiveLesson(null)} />;
  }

  return (
    <div className={`flex-1 min-h-screen pb-20 md:pb-0 ${isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Your Course</h2>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {completedLessons.length} of {allFlat.length} lessons completed ·{' '}
            <span className="capitalize text-brand-500">{levelKey}</span> level
          </p>
        </div>

        {/* Units */}
        {units.map((unit, ui) => (
          <div key={unit.id}>
            {/* Unit header */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${isDark ? 'bg-[#161f2e]' : 'bg-white shadow-sm'}`}>
                {unit.emoji}
              </div>
              <div>
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Unit {ui + 1}: {unit.title}
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{unit.titleBn}</p>
              </div>
            </div>

            {/* Lesson cards */}
            <div className="space-y-2 ml-2 border-l-2 border-dashed border-brand-500/20 pl-4">
              {unit.lessons.map((lesson) => {
                const done   = completedLessons.includes(lesson.id);
                const locked = !done && isLocked(lesson.id);
                const meta   = TYPE_META[lesson.type] || TYPE_META.vocabulary;
                const Icon   = meta.icon;

                return (
                  <button
                    key={lesson.id}
                    disabled={locked}
                    onClick={() => !locked && setActiveLesson(lesson)}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all
                      ${done
                        ? isDark
                          ? 'bg-success-500/10 border-success-500/30'
                          : 'bg-success-50 border-success-200'
                        : locked
                          ? isDark ? 'bg-[#161f2e]/50 border-[#1e2d45]/50 opacity-50' : 'bg-gray-50 border-gray-200 opacity-60'
                          : isDark
                            ? 'bg-[#161f2e] border-[#1e2d45] hover:border-brand-500/40 hover:scale-[1.01]'
                            : 'bg-white border-[#c7d7f8] hover:border-brand-300 hover:scale-[1.01]'}
                      active:scale-[0.99] cursor-${locked ? 'not-allowed' : 'pointer'}
                    `}
                  >
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                      ${done ? 'bg-success-500' : locked ? (isDark ? 'bg-[#1e2d45]' : 'bg-gray-200') : meta.color}
                    `}>
                      {done
                        ? <CheckCircle2 size={20} className="text-white" />
                        : locked
                          ? <Lock size={18} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
                          : <Icon size={20} className="text-white" />
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${done ? (isDark ? 'text-success-400' : 'text-success-700') : isDark ? 'text-white' : 'text-slate-800'}`}>
                        {lesson.title}
                      </p>
                      <p className={`text-[11px] truncate ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {lesson.titleBn}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-medium capitalize ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {meta.label}
                        </span>
                        <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>·</span>
                        <span className={`text-[10px] flex items-center gap-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          <Clock size={9} /> {lesson.duration} min
                        </span>
                        <span className={`text-[10px] flex items-center gap-0.5 text-warn-500 font-medium`}>
                          <Zap size={9} /> +{lesson.xp} XP
                        </span>
                      </div>
                    </div>

                    {!locked && !done && (
                      <ChevronRight size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                    )}
                    {done && (
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-success-500/20 text-success-400' : 'bg-success-100 text-success-700'}`}>
                        Done ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
