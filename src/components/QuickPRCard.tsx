import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function QuickPRCard() {
  const { exercises, addPersonalRecord } = useStore();
  const [exerciseId, setExerciseId] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseId || !weight) {
      alert('운동과 중량을 입력해주세요.');
      return;
    }

    const exercise = exercises.find((ex) => ex.id === exerciseId);
    if (!exercise) {
      alert('선택한 운동을 찾을 수 없습니다.');
      return;
    }

    const parsedWeight = parseFloat(weight);
    if (!parsedWeight || parsedWeight <= 0) {
      alert('중량은 0보다 큰 숫자로 입력해주세요.');
      return;
    }

    addPersonalRecord({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      type: 'maxWeight',
      value: parsedWeight,
      date: new Date().toISOString(),
      workoutSessionId: 'manual',
    });

    alert('PR 기록이 저장되었습니다.');
    setWeight('');
    setExerciseId('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        PR 기록 재기
      </h2>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        운동과 중량을 입력해서 빠르게 PR(최대 중량)을 기록할 수 있어요.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <select
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">운동 선택</option>
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="중량"
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">kg</span>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          PR 기록하기
        </button>
      </form>
    </div>
  );
}

