import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface InbodyRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InbodyRecordModal({ isOpen, onClose }: InbodyRecordModalProps) {
  const { addInbodyRecord, inbodyRecords } = useStore();
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [weight, setWeight] = useState<string>('');
  const [muscleMass, setMuscleMass] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [inbodyScore, setInbodyScore] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');

  // 이전 기록이 있으면 자동으로 불러오기
  useEffect(() => {
    if (isOpen && inbodyRecords.length > 0) {
      // 선택한 날짜의 기록이 있으면 그 기록을 가져오고, 없으면 가장 최근 기록 가져오기
      const selectedDateStr = selectedDate;
      const recordForDate = inbodyRecords.find(
        (r) => r.date.split('T')[0] === selectedDateStr
      );
      
      const recordToLoad = recordForDate || [...inbodyRecords].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];

      if (recordToLoad.weight) setWeight(recordToLoad.weight.toString());
      if (recordToLoad.muscleMass) setMuscleMass(recordToLoad.muscleMass.toString());
      if (recordToLoad.bodyFat) setBodyFat(recordToLoad.bodyFat.toString());
      if (recordToLoad.height) setHeight(recordToLoad.height.toString());
      if (recordToLoad.gender) setGender(recordToLoad.gender);
      
      // 인바디 점수는 notes에서 추출
      if (recordToLoad.notes?.includes('인바디점수:')) {
        const score = recordToLoad.notes.split('인바디점수:')[1]?.trim();
        if (score) setInbodyScore(score);
      }
    }
  }, [isOpen, inbodyRecords, selectedDate]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
      setWeight('');
      setMuscleMass('');
      setBodyFat('');
      setInbodyScore('');
      setHeight('');
      setGender('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!weight) {
      alert('몸무게를 입력해주세요.');
      return;
    }

    if (!gender) {
      alert('성별을 선택해주세요.');
      return;
    }

    if (!height) {
      alert('키를 입력해주세요.');
      return;
    }

    const date = new Date(selectedDate);
    date.setHours(new Date().getHours());
    date.setMinutes(new Date().getMinutes());
    date.setSeconds(new Date().getSeconds());

    const record: any = {
      date: date.toISOString(),
      weight: parseFloat(weight) || undefined,
      muscleMass: muscleMass ? parseFloat(muscleMass) : undefined,
      bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
      height: height ? parseFloat(height) : undefined,
      gender: gender || undefined,
      notes: inbodyScore ? `인바디점수: ${inbodyScore}` : '',
    };

    addInbodyRecord(record);
    alert('인바디 기록이 저장되었습니다.');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md mx-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-3xl shadow-2xl p-6 space-y-5 border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="inline-flex p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mb-3">
            <Activity size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            인바디 기록하기
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            인바디 측정 결과를 기록할 수 있어요.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 날짜 - 전체 너비 */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              날짜
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-green-500 dark:focus:border-green-500 transition-colors text-center"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              선택된 날짜: {format(new Date(selectedDate), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
            </p>
          </div>

          {/* 성별과 키 - 한 행에 2개 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                성별 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex-1 px-3 py-3 text-sm border-2 rounded-xl font-semibold transition-all ${
                    gender === 'male'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:scale-95'
                  }`}
                >
                  남성
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex-1 px-3 py-3 text-sm border-2 rounded-xl font-semibold transition-all ${
                    gender === 'female'
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 active:scale-95'
                  }`}
                >
                  여성
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                키(cm) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="예: 175"
                step="0.1"
                required
                className="w-full px-2 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
              />
            </div>
          </div>

          {/* 몸무게와 골격근량 - 한 행에 2개 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                몸무게(kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="예: 70"
                step="0.1"
                className="w-full px-2 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                골격근량(kg)
              </label>
              <input
                type="number"
                value={muscleMass}
                onChange={(e) => setMuscleMass(e.target.value)}
                placeholder="예: 36.7"
                step="0.1"
                className="w-full px-2 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
              />
            </div>
          </div>

          {/* 체지방량과 인바디 점수 - 한 행에 2개 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                체지방량(kg)
              </label>
              <input
                type="number"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="예: 7.0"
                step="0.1"
                className="w-full px-2 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                인바디점수(점)
              </label>
              <input
                type="number"
                value={inbodyScore}
                onChange={(e) => setInbodyScore(e.target.value)}
                placeholder="예: 85"
                step="0.1"
                className="w-full px-2 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
              />
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
              className="flex-1 px-5 py-3 text-base bg-gradient-to-r from-green-500 to-green-600 active:from-green-600 active:to-green-700 text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg shadow-green-500/30"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
