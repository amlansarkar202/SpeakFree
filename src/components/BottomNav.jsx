import { Home, BookOpen, MessageCircle, BarChart2, Settings } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const NAV = [
  { id: 'home',     icon: Home,          label: 'Home' },
  { id: 'learn',    icon: BookOpen,       label: 'Learn' },
  { id: 'chat',     icon: MessageCircle,  label: 'Tutor' },
  { id: 'progress', icon: BarChart2,      label: 'Progress' },
  { id: 'settings', icon: Settings,       label: 'Settings' },
];

export default function BottomNav() {
  const activePage    = useAppStore((s) => s.activePage);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const theme         = useAppStore((s) => s.theme);

  return (
    <nav className={`
      md:hidden fixed bottom-0 inset-x-0 z-50 flex
      ${theme === 'dark'
        ? 'bg-[#111827]/95 border-t border-[#1e2d45]'
        : 'bg-white/95 border-t border-[#c7d7f8]'}
      backdrop-blur-md safe-bottom
    `}>
      {NAV.map(({ id, icon: Icon, label }) => {
        const active = activePage === id;
        return (
          <button
            key={id}
            onClick={() => setActivePage(id)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-all
              ${active
                ? 'text-brand-500'
                : theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}
            `}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span className={`text-[10px] font-medium ${active ? 'opacity-100' : 'opacity-60'}`}>
              {label}
            </span>
            {active && (
              <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-brand-500" />
            )}
            {id === 'chat' && !active && (
              <span className="absolute top-2 ml-4 w-1.5 h-1.5 rounded-full bg-success-400" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
