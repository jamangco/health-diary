import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface DateSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  defaultDate?: Date;
}

export default function DateSelectModal({ isOpen, onClose, onConfirm, defaultDate }: DateSelectModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );

  useEffect(() => {
    if (isOpen && defaultDate) {
      setSelectedDate(format(defaultDate, 'yyyy-MM-dd'));
    }
  }, [isOpen, defaultDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const date = new Date(selectedDate);
    date.setHours(new Date().getHours());
    date.setMinutes(new Date().getMinutes());
    date.setSeconds(new Date().getSeconds());
    onConfirm(date);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md mx-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-3xl shadow-2xl p-6 space-y-5 border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="inline-flex p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-3">
            <Calendar size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            운동 날짜 선택
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            운동한 날짜를 선택해주세요.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              날짜
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              선택된 날짜: {format(new Date(selectedDate), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-700 font-semibold transition-all active:scale-95"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-3 text-base bg-gradient-to-r from-blue-500 to-blue-600 active:from-blue-600 active:to-blue-700 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-blue-500/30"
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
