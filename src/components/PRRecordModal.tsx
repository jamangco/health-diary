import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Award } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface PRRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PRRecordModal({ isOpen, onClose }: PRRecordModalProps) {
  const { exercises, addPersonalRecord, deletePersonalRecord, personalRecords } = useStore();
  const [benchWeight, setBenchWeight] = useState<string>('');
  const [squatWeight, setSquatWeight] = useState<string>('');
  const [deadliftWeight, setDeadliftWeight] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );

  // 빅3 운동 찾기
  const benchExercise = exercises.find((ex) => ex.name === '벤치프레스');
  const squatExercise = exercises.find((ex) => ex.name === '스쿼트');
  const deadliftExercise = exercises.find((ex) => ex.name === '데드리프트');

  // 날짜가 변경되거나 모달이 열릴 때 기존 기록 불러오기
  useEffect(() => {
    if (isOpen && selectedDate) {
      const dateStr = selectedDate;
      
      // 벤치프레스 기록 불러오기
      if (benchExercise) {
        const benchRecord = personalRecords
          .filter((pr) => 
            pr.exerciseId === benchExercise.id && 
            pr.date.split('T')[0] === dateStr &&
            pr.type === 'maxWeight'
          )
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        setBenchWeight(benchRecord ? benchRecord.value.toString() : '');
      }
      
      // 스쿼트 기록 불러오기
      if (squatExercise) {
        const squatRecord = personalRecords
          .filter((pr) => 
            pr.exerciseId === squatExercise.id && 
            pr.date.split('T')[0] === dateStr &&
            pr.type === 'maxWeight'
          )
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        setSquatWeight(squatRecord ? squatRecord.value.toString() : '');
      }
      
      // 데드리프트 기록 불러오기
      if (deadliftExercise) {
        const deadliftRecord = personalRecords
          .filter((pr) => 
            pr.exerciseId === deadliftExercise.id && 
            pr.date.split('T')[0] === dateStr &&
            pr.type === 'maxWeight'
          )
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        setDeadliftWeight(deadliftRecord ? deadliftRecord.value.toString() : '');
      }
    }
  }, [isOpen, selectedDate, personalRecords, benchExercise, squatExercise, deadliftExercise]);

  useEffect(() => {
    if (!isOpen) {
      setBenchWeight('');
      setSquatWeight('');
      setDeadliftWeight('');
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const date = new Date(selectedDate);
    date.setHours(new Date().getHours());
    date.setMinutes(new Date().getMinutes());
    date.setSeconds(new Date().getSeconds());

    let hasRecord = false;

    // 벤치프레스 기록 저장
    if (benchExercise && benchWeight) {
      const parsedWeight = parseFloat(benchWeight);
      if (parsedWeight > 0) {
        // 기존 기록 제거 (같은 날짜, 같은 운동)
        deletePersonalRecord(benchExercise.id, date.toISOString(), 'maxWeight');
        
        addPersonalRecord({
          exerciseId: benchExercise.id,
          exerciseName: benchExercise.name,
          type: 'maxWeight',
          value: parsedWeight,
          date: date.toISOString(),
          workoutSessionId: 'manual',
        });
        hasRecord = true;
      }
    }

    // 스쿼트 기록 저장
    if (squatExercise && squatWeight) {
      const parsedWeight = parseFloat(squatWeight);
      if (parsedWeight > 0) {
        // 기존 기록 제거 (같은 날짜, 같은 운동)
        deletePersonalRecord(squatExercise.id, date.toISOString(), 'maxWeight');
        
        addPersonalRecord({
          exerciseId: squatExercise.id,
          exerciseName: squatExercise.name,
          type: 'maxWeight',
          value: parsedWeight,
          date: date.toISOString(),
          workoutSessionId: 'manual',
        });
        hasRecord = true;
      }
    }

    // 데드리프트 기록 저장
    if (deadliftExercise && deadliftWeight) {
      const parsedWeight = parseFloat(deadliftWeight);
      if (parsedWeight > 0) {
        // 기존 기록 제거 (같은 날짜, 같은 운동)
        deletePersonalRecord(deadliftExercise.id, date.toISOString(), 'maxWeight');
        
        addPersonalRecord({
          exerciseId: deadliftExercise.id,
          exerciseName: deadliftExercise.name,
          type: 'maxWeight',
          value: parsedWeight,
          date: date.toISOString(),
          workoutSessionId: 'manual',
        });
        hasRecord = true;
      }
    }

    if (!hasRecord) {
      alert('최소 하나의 운동 중량을 입력해주세요.');
      return;
    }

    alert('PR 기록이 저장되었습니다.');
    onClose();
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
          <div className="inline-flex p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl mb-3">
            <Award size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            PR 기록하기
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            빅3 운동의 중량을 입력해서 PR(최대 중량)을 기록할 수 있어요.
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
              className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 dark:focus:border-purple-500 transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              선택된 날짜: {format(new Date(selectedDate), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
            </p>
          </div>
          
          {/* 벤치프레스 */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              벤치프레스
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={benchWeight}
                onChange={(e) => setBenchWeight(e.target.value)}
                placeholder="중량 입력"
                className="flex-1 px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-base font-medium text-gray-600 dark:text-gray-400">kg</span>
            </div>
          </div>

          {/* 스쿼트 */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              스쿼트
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={squatWeight}
                onChange={(e) => setSquatWeight(e.target.value)}
                placeholder="중량 입력"
                className="flex-1 px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-base font-medium text-gray-600 dark:text-gray-400">kg</span>
            </div>
          </div>

          {/* 데드리프트 */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              데드리프트
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={deadliftWeight}
                onChange={(e) => setDeadliftWeight(e.target.value)}
                placeholder="중량 입력"
                className="flex-1 px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-base font-medium text-gray-600 dark:text-gray-400">kg</span>
            </div>
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
              className="flex-1 px-5 py-3 text-base bg-gradient-to-r from-purple-500 to-purple-600 active:from-purple-600 active:to-purple-700 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-purple-500/30"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

