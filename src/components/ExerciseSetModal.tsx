import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X } from 'lucide-react';
import { WorkoutSet } from '../types';

interface ExerciseSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  existingSets: WorkoutSet[];
  onSave: (sets: WorkoutSet[]) => void;
}

export default function ExerciseSetModal({
  isOpen,
  onClose,
  exerciseId,
  exerciseName,
  existingSets,
  onSave,
}: ExerciseSetModalProps) {
  const { workoutSessions } = useStore();
  const [sets, setSets] = useState<WorkoutSet[]>([]);

  // 모달이 열릴 때 기존 세트 불러오기 또는 이전 기록 불러오기
  useEffect(() => {
    if (isOpen) {
      // 기존 세트가 있으면 사용, 없으면 이전 기록에서 불러오기
      if (existingSets && existingSets.length > 0) {
        setSets(existingSets);
      } else {
        // 이전 기록에서 불러오기
        const previousSets = loadPreviousSets(exerciseId);
        if (previousSets && previousSets.length > 0) {
          setSets(previousSets);
        } else {
          // 이전 기록도 없으면 기본 1세트 추가
          setSets([
            {
              id: Date.now().toString() + Math.random(),
              reps: 10,
              weight: 0,
            },
          ]);
        }
      }
    }
  }, [isOpen, exerciseId, existingSets]);

  const loadPreviousSets = (baseExerciseId: string): WorkoutSet[] | null => {
    const recent = [...workoutSessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .find((session) =>
        session.exercises.some((ex) => ex.exerciseId === baseExerciseId)
      );

    if (!recent) {
      return null;
    }

    const prevEx = recent.exercises.find((ex) => ex.exerciseId === baseExerciseId);
    if (!prevEx || prevEx.sets.length === 0) {
      return null;
    }

    return prevEx.sets.map((s) => ({
      id: Date.now().toString() + Math.random(),
      reps: s.reps,
      weight: s.weight,
      restTime: s.restTime,
      notes: s.notes,
    }));
  };

  const handleAddSet = () => {
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
    const newSet: WorkoutSet = {
      id: Date.now().toString() + Math.random(),
      reps: lastSet?.reps || 10,
      weight: lastSet?.weight || 0,
      restTime: lastSet?.restTime,
      notes: lastSet?.notes,
    };
    setSets([...sets, newSet]);
  };

  const handleUpdateSet = (setId: string, updates: Partial<WorkoutSet>) => {
    setSets(
      sets.map((set) => (set.id === setId ? { ...set, ...updates } : set))
    );
  };

  const handleRemoveSet = (setId: string) => {
    setSets(sets.filter((set) => set.id !== setId));
  };

  const handleSave = () => {
    if (sets.length === 0) {
      alert('최소 1개 이상의 세트를 추가해주세요.');
      return;
    }
    onSave(sets);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {exerciseName}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-400 active:text-gray-900 dark:active:text-white active:bg-gray-100 dark:active:bg-gray-700 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-3 mb-4">
            {sets.map((set, index) => (
              <div
                key={set.id}
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-16">
                  세트 {index + 1}
                </span>
                <input
                  type="number"
                  value={set.weight || ''}
                  onChange={(e) =>
                    handleUpdateSet(set.id, {
                      weight: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="중량"
                  className="w-[30%] px-4 py-2.5 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  kg
                </span>
                <span className="text-gray-400 dark:text-gray-500">×</span>
                <input
                  type="number"
                  value={set.reps || ''}
                  onChange={(e) =>
                    handleUpdateSet(set.id, {
                      reps: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="반복"
                  className="w-[30%] px-4 py-2.5 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  회
                </span>
                <button
                  onClick={() => handleRemoveSet(set.id)}
                  className="text-red-500 active:text-red-700 p-1.5 active:bg-red-50 dark:active:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddSet}
            className="w-full py-3 mb-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 active:border-blue-500 active:text-blue-500 active:bg-blue-50 dark:active:bg-blue-900/20 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <span className="text-xl">+</span>
            세트 추가
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-700 font-semibold transition-all active:scale-95"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-5 py-3 text-base bg-gradient-to-r from-blue-500 to-blue-600 active:from-blue-600 active:to-blue-700 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-blue-500/30"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
