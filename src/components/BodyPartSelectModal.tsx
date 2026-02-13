import { useState } from 'react';
import { Activity } from 'lucide-react';
import { BodyPart } from '../types';

interface BodyPartSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bodyPart: BodyPart | 'all') => void;
}

const bodyParts: BodyPart[] = ['가슴', '등', '어깨', '하체', '팔', '복근', '전신', '기타'];

export default function BodyPartSelectModal({ isOpen, onClose, onConfirm }: BodyPartSelectModalProps) {
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | 'all'>('all');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(selectedBodyPart);
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
            <Activity size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">운동 부위 선택</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">운동할 부위를 선택해주세요.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedBodyPart('all')}
              className={`px-4 py-4 rounded-xl transition-all active:scale-95 font-semibold ${
                selectedBodyPart === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              전체
            </button>
            {bodyParts.map((bodyPart) => (
              <button
                key={bodyPart}
                type="button"
                onClick={() => setSelectedBodyPart(bodyPart)}
                className={`px-4 py-4 rounded-xl transition-all active:scale-95 font-semibold ${
                  selectedBodyPart === bodyPart
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {bodyPart}
              </button>
            ))}
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
