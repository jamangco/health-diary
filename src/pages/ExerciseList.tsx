import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Edit, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Exercise, BodyPart } from '../types';

const bodyParts: BodyPart[] = ['가슴', '등', '어깨', '하체', '팔', '복근', '전신', '기타'];
const EXERCISES_PER_PAGE = 10;

export default function ExerciseList() {
  const { exercises, addExercise, deleteExercise } = useStore();
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredExercises = exercises.filter((ex) => {
    const matchesBodyPart = selectedBodyPart === 'all' || ex.bodyPart === selectedBodyPart;
    return matchesBodyPart;
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredExercises.length / EXERCISES_PER_PAGE);
  const startIndex = (currentPage - 1) * EXERCISES_PER_PAGE;
  const endIndex = startIndex + EXERCISES_PER_PAGE;
  const paginatedExercises = filteredExercises.slice(startIndex, endIndex);

  // 필터가 변경되면 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBodyPart]);

  const handleDelete = (id: string) => {
    const exercise = exercises.find((e) => e.id === id);
    if (exercise && !exercise.isCustom) {
      alert('기본 운동은 삭제할 수 없습니다.');
      return;
    }
    if (confirm('정말 이 운동을 삭제하시겠습니까?')) {
      deleteExercise(id);
    }
  };

  if (showAddForm) {
    return (
      <AddExerciseForm onClose={() => setShowAddForm(false)} />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          운동 목록
        </h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 active:from-blue-600 active:to-blue-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-95 font-semibold shadow-lg shadow-blue-500/30"
        >
          <Plus size={22} />
          <span className="text-base">추가</span>
        </button>
      </div>

      {/* 부위별 필터 */}
      <div className="flex flex-wrap gap-2 justify-center pb-2">
        <button
          onClick={() => setSelectedBodyPart('all')}
          className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all active:scale-95 font-medium ${
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
            onClick={() => setSelectedBodyPart(bodyPart)}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap transition-all active:scale-95 font-medium ${
              selectedBodyPart === bodyPart
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {bodyPart}
          </button>
        ))}
      </div>

      {/* 전체 운동 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          전체 운동 ({filteredExercises.length})
        </h2>
        {filteredExercises.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>운동이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {paginatedExercises.map((exercise) => (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  onDelete={() => handleDelete(exercise.id)}
                />
              ))}
            </div>
            
            {/* 페이지네이션 컨트롤 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                    currentPage === 1
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 active:from-blue-600 active:to-blue-700 text-white shadow-md shadow-blue-500/30'
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-xl transition-all active:scale-95 font-semibold ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                    currentPage === totalPages
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 active:from-blue-600 active:to-blue-700 text-white shadow-md shadow-blue-500/30'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ExerciseItem({
  exercise,
  onDelete,
}: {
  exercise: Exercise;
  onDelete: () => void;
}) {
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-3 shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="flex-1">
        <div className="font-semibold text-gray-900 dark:text-white text-base mb-1 line-clamp-1 text-center">
          {exercise.name}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
          {exercise.bodyPart}
          {exercise.isCustom && (
            <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
              사용자 추가
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-auto">
        {exercise.isCustom && (
          <button
            onClick={onDelete}
            className="text-red-500 active:text-red-700 p-1.5 active:bg-red-50 dark:active:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

function AddExerciseForm({ onClose }: { onClose: () => void }) {
  const { addExercise } = useStore();
  const [name, setName] = useState('');
  const [bodyPart, setBodyPart] = useState<BodyPart>('기타');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('운동 이름을 입력해주세요.');
      return;
    }

    addExercise({
      name: name.trim(),
      bodyPart,
      isCustom: true,
      isFavorite: false,
    });

    onClose();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          운동 추가
        </h1>
        <button
          onClick={onClose}
          className="p-2 text-gray-600 dark:text-gray-400 active:text-gray-900 dark:active:text-white active:bg-gray-100 dark:active:bg-gray-700 rounded-xl transition-colors"
        >
          <X size={26} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            운동 이름 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 덤벨 컬"
            className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            부위
          </label>
          <select
            value={bodyPart}
            onChange={(e) => setBodyPart(e.target.value as BodyPart)}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {bodyParts.map((bp) => (
              <option key={bp} value={bp}>
                {bp}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-5 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 active:bg-gray-50 dark:active:bg-gray-700 transition-all active:scale-95 font-semibold text-base"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 px-5 py-3 bg-blue-600 active:bg-blue-700 text-white rounded-xl transition-all active:scale-95 font-semibold text-base"
          >
            추가
          </button>
        </div>
      </form>
    </div>
  );
}
