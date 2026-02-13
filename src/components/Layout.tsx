import { Link, useLocation } from 'react-router-dom';
import { Home, History, Calendar, BarChart3, List, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: '홈' },
    { path: '/history', icon: History, label: '기록' },
    { path: '/routines', icon: Calendar, label: '루틴' },
    { path: '/statistics', icon: BarChart3, label: '통계' },
    { path: '/exercises', icon: List, label: '운동목록' },
    { path: '/settings', icon: Settings, label: '설정' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto pb-24 px-4 sm:px-6">
        <main className="py-4">{children}</main>
      </div>
      
      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700 safe-area-inset-bottom">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-around">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center py-3 px-2 min-w-0 flex-1 active:bg-gray-100 dark:active:bg-gray-700 transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-xs mt-1 font-medium text-center leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
