import { useState } from 'react';
import { ChevronRight, Lock, CheckCircle2, Clock, Zap, BookOpen, Mic, Users, BarChart2, X, Volume2 } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { CURRICULUM, getAllLessons } from '../data/curriculum';
import LessonView from '../components/LessonView';

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
    <div className={`flex-1 min-h-screen pb-28 lg:pb-10 transition-colors ${isDark ? 'bg-[#0f1623]' : 'bg-[#f0f4ff]'}`}>
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Your Learning Syllabus
            </h1>
            <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {completedLessons.length} of {allFlat.length} lessons completed ·{' '}
              <span className="capitalize font-semibold text-brand-500">{levelKey}</span> Level
            </p>
          </div>
        </div>

        {/* Units */}
        {units.map((unit, ui) => (
          <div key={unit.id} className="space-y-3">
            {/* Unit Header */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                isDark ? 'bg-[#161f2e] border border-[#1e2d45]' : 'bg-white border border-[#c7d7f8] shadow-xs'
              }`}>
                {unit.emoji}
              </div>
              <div className="min-w-0">
                <h2 className={`font-bold text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Unit {ui + 1}: {unit.title}
                </h2>
                <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{unit.titleBn}</p>
              </div>
            </div>

            {/* Lesson Cards Timeline */}
            <div className="space-y-2.5 ml-2 sm:ml-4 border-l-2 border-dashed border-brand-500/20 pl-3 sm:pl-4">
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
                      w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl border text-left transition-all
                      ${done
                        ? isDark
                          ? 'bg-success-500/10 border-success-500/30'
                          : 'bg-success-50/80 border-success-200 shadow-xs'
                        : locked
                          ? isDark ? 'bg-[#161f2e]/40 border-[#1e2d45]/40 opacity-40 cursor-not-allowed' : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                          : isDark
                            ? 'bg-[#161f2e] border-[#1e2d45] hover:border-brand-500/40 hover:scale-[1.005] active:scale-[0.99] cursor-pointer'
                            : 'bg-white border-[#c7d7f8] hover:border-brand-300 shadow-xs hover:scale-[1.005] active:scale-[0.99] cursor-pointer'}
                    `}
                  >
                    {/* Status / Type Icon */}
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs
                      ${done ? 'bg-success-500' : locked ? (isDark ? 'bg-[#1e2d45]' : 'bg-gray-200') : meta.color}
                    `}>
                      {done
                        ? <CheckCircle2 size={18} className="text-white" />
                        : locked
                          ? <Lock size={16} className={isDark ? 'text-slate-600' : 'text-slate-400'} />
                          : <Icon size={18} className="text-white" />
                      }
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-xs sm:text-sm truncate ${
                        done ? (isDark ? 'text-success-400' : 'text-success-700') : isDark ? 'text-white' : 'text-slate-800'
                      }`}>
                        {lesson.title}
                      </p>
                      <p className={`text-[11px] sm:text-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {lesson.titleBn}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                        <span className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isDark ? 'bg-white/5 text-slate-300' : 'bg-brand-50 text-brand-700'
                        }`}>
                          {meta.label}
                        </span>
                        <span className={`text-[10px] sm:text-[11px] flex items-center gap-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <Clock size={10} /> {lesson.duration}m
                        </span>
                        <span className="text-[10px] sm:text-[11px] flex items-center gap-0.5 text-warn-500 font-semibold">
                          <Zap size={10} /> +{lesson.xp} XP
                        </span>
                      </div>
                    </div>

                    {!locked && !done && (
                      <div className={`p-1.5 rounded-lg shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        <ChevronRight size={16} />
                      </div>
                    )}
                    {done && (
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isDark ? 'bg-success-500/20 text-success-400' : 'bg-success-100 text-success-700'
                      }`}>
                        Completed ✓
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
