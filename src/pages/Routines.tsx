import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Edit, Trash2, Calendar, Save } from 'lucide-react';
import { RoutineExercise } from '../types';

export default function Routines() {
  const { routines, deleteRoutine } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm('정말 이 루틴을 삭제하시겠습니까?')) {
      deleteRoutine(id);
    }
  };

  if (showCreateForm) {
    return (
      <RoutineForm
        onClose={() => setShowCreateForm(false)}
        onSave={() => setShowCreateForm(false)}
      />
    );
  }

  if (editingId) {
    return (
      <RoutineForm
        routineId={editingId}
        onClose={() => setEditingId(null)}
        onSave={() => setEditingId(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          루틴
        </h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 active:from-blue-600 active:to-blue-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-95 font-semibold shadow-lg shadow-blue-500/30"
        >
          <Plus size={22} />
          <span className="text-base">새 루틴</span>
        </button>
      </div>

      <div className="space-y-3">
        {routines.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
            <p>아직 루틴이 없습니다.</p>
            <p className="text-sm mt-2">새 루틴 버튼을 눌러 만들어보세요!</p>
          </div>
        ) : (
          routines.map((routine) => (
            <div
              key={routine.id}
              className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {routine.name}
                    </h3>
                    {routine.isTemplate && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        템플릿
                      </span>
                    )}
                  </div>
                  {routine.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {routine.description}
                    </p>
                  )}
                  {routine.daysOfWeek && routine.daysOfWeek.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar size={16} />
                      <span>
                        {routine.daysOfWeek
                          .map((day) => {
                            const days = ['일', '월', '화', '수', '목', '금', '토'];
                            return days[day];
                          })
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {routine.exercises.length}개 운동
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(routine.id)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(routine.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {routine.exercises.slice(0, 5).map((exercise) => (
                  <div
                    key={exercise.id}
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    • {exercise.exerciseName}
                    {exercise.targetSets && ` (${exercise.targetSets}세트)`}
                    {exercise.targetReps && ` × ${exercise.targetReps}회`}
                    {exercise.targetWeight && ` @ ${exercise.targetWeight}kg`}
                  </div>
                ))}
                {routine.exercises.length > 5 && (
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    +{routine.exercises.length - 5}개 더
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RoutineForm({
  routineId,
  onClose,
  onSave,
}: {
  routineId?: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const { routines, addRoutine, updateRoutine, exercises } = useStore();
  const routine = routineId ? routines.find((r) => r.id === routineId) : null;

  const [name, setName] = useState(routine?.name || '');
  const [description, setDescription] = useState(routine?.description || '');
  const [isTemplate, setIsTemplate] = useState(routine?.isTemplate || false);
  const [selectedDays, setSelectedDays] = useState<number[]>(
    routine?.daysOfWeek || []
  );
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>(
    routine?.exercises || []
  );
  const [showExerciseForm, setShowExerciseForm] = useState(false);

  const days = ['일', '월', '화', '수', '목', '금', '토'];

  const handleToggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddExercise = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const newExercise: RoutineExercise = {
      id: Date.now().toString() + Math.random(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      targetSets: 3,
      targetReps: 10,
      targetWeight: 0,
    };

    setRoutineExercises([...routineExercises, newExercise]);
    setShowExerciseForm(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setRoutineExercises(
      routineExercises.filter((ex) => ex.id !== exerciseId)
    );
  };

  const handleUpdateExercise = (
    exerciseId: string,
    updates: Partial<RoutineExercise>
  ) => {
    setRoutineExercises(
      routineExercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      )
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('루틴 이름을 입력해주세요.');
      return;
    }

    if (routineExercises.length === 0) {
      alert('최소 하나의 운동을 추가해주세요.');
      return;
    }

    const routineData = {
      name: name.trim(),
      description: description.trim() || undefined,
      exercises: routineExercises,
      daysOfWeek: selectedDays.length > 0 ? selectedDays : undefined,
      isTemplate,
    };

    if (routineId) {
      updateRoutine(routineId, routineData);
    } else {
      addRoutine(routineData);
    }

    onSave();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {routineId ? '루틴 편집' : '새 루틴'}
        </h1>
        <button
          onClick={onClose}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <Plus size={24} className="rotate-45" />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            루틴 이름 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 상체 루틴"
            className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            설명
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="루틴에 대한 설명을 입력하세요"
            rows={3}
            className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isTemplate}
              onChange={(e) => setIsTemplate(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              템플릿으로 저장
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            요일 선택
          </label>
          <div className="flex gap-2 flex-wrap">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => handleToggleDay(index)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedDays.includes(index)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              운동 목록
            </label>
            {!showExerciseForm && (
              <button
                onClick={() => setShowExerciseForm(true)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm flex items-center gap-1"
              >
                <Plus size={16} />
                운동 추가
              </button>
            )}
          </div>

          {showExerciseForm && (
            <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddExercise(e.target.value);
                  }
                }}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">운동 선택</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            {routineExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {exercise.exerciseName}
                  </span>
                  <button
                    onClick={() => handleRemoveExercise(exercise.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      세트
                    </label>
                    <input
                      type="number"
                      value={exercise.targetSets || ''}
                      onChange={(e) =>
                        handleUpdateExercise(exercise.id, {
                          targetSets: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      반복
                    </label>
                    <input
                      type="number"
                      value={exercise.targetReps || ''}
                      onChange={(e) =>
                        handleUpdateExercise(exercise.id, {
                          targetReps: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400">
                      중량(kg)
                    </label>
                    <input
                      type="number"
                      value={exercise.targetWeight || ''}
                      onChange={(e) =>
                        handleUpdateExercise(exercise.id, {
                          targetWeight: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 active:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-base"
        >
          <Save size={20} />
          <span>저장</span>
        </button>
      </div>
    </div>
  );
}
