import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, Check, Minus, Plus } from 'lucide-react';
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
  const [setCount, setSetCount] = useState(4);

  // 모달이 열릴 때 기존 세트 불러오기 또는 이전 기록 불러오기
  useEffect(() => {
    if (isOpen) {
      if (existingSets && existingSets.length > 0) {
        setSets(existingSets);
        setSetCount(existingSets.length);
      } else {
        const previousSets = loadPreviousSets(exerciseId);
        if (previousSets && previousSets.length > 0) {
          setSets(previousSets);
          setSetCount(previousSets.length);
        } else {
          const defaultSets = Array.from({ length: 4 }, (_, i) => ({
            id: Date.now().toString() + Math.random() + i,
            reps: 10,
            weight: 0,
          }));
          setSets(defaultSets);
          setSetCount(4);
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
    if (!recent) return null;
    const prevEx = recent.exercises.find((ex) => ex.exerciseId === baseExerciseId);
    if (!prevEx || prevEx.sets.length === 0) return null;
    return prevEx.sets.map((s) => ({
      id: Date.now().toString() + Math.random(),
      reps: s.reps,
      weight: s.weight,
      restTime: s.restTime,
      notes: s.notes,
    }));
  };

  const totalVolume = sets.reduce(
    (sum, set) => sum + (set.weight || 0) * (set.reps || 0),
    0
  );

  const previousVolume = (() => {
    const prev = loadPreviousSets(exerciseId);
    if (!prev || prev.length === 0) return 0;
    return prev.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0);
  })();
  const volumeDiff = totalVolume - previousVolume;

  const changeSetCount = (delta: number) => {
    const next = Math.max(1, Math.min(20, setCount + delta));
    setSetCount(next);
    if (next > sets.length) {
      const lastSet = sets[sets.length - 1];
      const newSets = [...sets];
      for (let i = sets.length; i < next; i++) {
        newSets.push({
          id: Date.now().toString() + Math.random() + i,
          reps: lastSet?.reps ?? 10,
          weight: lastSet?.weight ?? 0,
        });
      }
      setSets(newSets);
    } else if (next < sets.length) {
      setSets(sets.slice(0, next));
    }
  };

  const handleUpdateSet = (setId: string, updates: Partial<WorkoutSet>) => {
    setSets(
      sets.map((set) => (set.id === setId ? { ...set, ...updates } : set))
    );
  };

  const handleRemoveSet = (setId: string) => {
    const next = sets.filter((set) => set.id !== setId);
    setSets(next);
    setSetCount(next.length);
  };

  const handleSave = () => {
    const validSets = sets.filter((s) => (s.weight ?? 0) > 0 || (s.reps ?? 0) > 0);
    if (validSets.length === 0) {
      alert('최소 1개 이상의 세트를 입력해주세요.');
      return;
    }
    onSave(validSets);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: name + volume (가운데 정렬) */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-center relative">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {exerciseName}
            </h2>
            <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-0.5">
              총 볼륨: {totalVolume.toLocaleString()}kg
              {volumeDiff !== 0 && previousVolume > 0 && (
                <span className="ml-1">
                  ({volumeDiff > 0 ? '+' : ''}{volumeDiff.toLocaleString()})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            aria-label="닫기"
          >
            <X size={22} />
          </button>
        </div>

        {/* Set count selector (우측 정렬) */}
        <div className="px-5 pb-4 flex items-center justify-end">
          <div className="flex items-center rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={() => changeSetCount(-1)}
              className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Minus size={18} />
            </button>
            <span className="w-12 text-center text-base font-semibold text-gray-900 dark:text-white bg-gray-200/50 dark:bg-gray-600/50 py-2.5">
              {setCount}
            </span>
            <button
              type="button"
              onClick={() => changeSetCount(1)}
              className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Set list (팝업 너비에 맞춤, 가운데 정렬) */}
        <div className="px-5 space-y-2 pb-4 flex flex-col items-center w-full">
          {sets.slice(0, setCount).map((set, index) => (
            <div
              key={set.id}
              className="flex items-center justify-center gap-4 py-4 px-4 border-b border-gray-100 dark:border-gray-700 last:border-0 w-full rounded-xl bg-gray-50/50 dark:bg-gray-700/30"
            >
              <span className="text-base font-bold text-blue-500 w-8 text-center">
                {index + 1}
              </span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={set.weight || ''}
                onChange={(e) =>
                  handleUpdateSet(set.id, {
                    weight: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="w-24 px-4 py-2.5 text-center border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                kg
              </span>
              <input
                type="number"
                min={0}
                value={set.reps || ''}
                onChange={(e) =>
                  handleUpdateSet(set.id, {
                    reps: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="w-20 px-4 py-2.5 text-center border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                회
              </span>
              <button
                type="button"
                onClick={() => handleRemoveSet(set.id)}
                className="p-2 text-gray-400 hover:text-red-500 ml-auto"
                aria-label="세트 삭제"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* 세트 완료 버튼 (팝업 너비에 맞춤) */}
        <div className="p-5 pt-2 pb-6 sm:pb-5">
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-colors"
          >
            <Check size={22} strokeWidth={2.5} />
            세트 완료
          </button>
        </div>
      </div>
    </div>
  );
}
