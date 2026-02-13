import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, X, Save, Play, Award, Calendar } from 'lucide-react';
import { WorkoutExercise, WorkoutSet, Routine, BodyPart } from '../types';
import PRRecordModal from '../components/PRRecordModal';
import ExerciseSetModal from '../components/ExerciseSetModal';

type ViewMode = 'select' | 'active';

export default function StartWorkout() {
  const navigate = useNavigate();
  const {
    currentWorkout,
    setCurrentWorkout,
    updateCurrentWorkout,
    addWorkoutSession,
    updateWorkoutSession,
    workoutSessions,
    routines,
    exercises,
  } = useStore();
  
  // workoutSessions 변경 시 currentWorkout 동기화
  useEffect(() => {
    if (currentWorkout && currentWorkout.id) {
      // 저장된 세션이 있으면 workoutSessions에서 최신 상태로 동기화
      const updatedSession = workoutSessions.find(s => s.id === currentWorkout.id);
      if (updatedSession) {
        // 업데이트된 세션이 있으면 동기화
        setCurrentWorkout(updatedSession);
      } else {
        // 세션이 삭제되었으면 currentWorkout도 null로 설정
        setCurrentWorkout(null);
      }
    } else if (currentWorkout && !currentWorkout.id && currentWorkout.exercises.length > 0) {
      // currentWorkout에 id가 없는데 운동이 있으면, 같은 날짜의 가장 최근 세션과 연결 시도
      const todayStr = format(parseISO(currentWorkout.date), 'yyyy-MM-dd');
      const matchingSessions = workoutSessions.filter(s => {
        const sessionDate = s.date.split('T')[0];
        return sessionDate === todayStr;
      });
      
      if (matchingSessions.length > 0) {
        // 같은 날짜의 세션이 있으면 가장 최근 것으로 연결
        const latestSession = matchingSessions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        setCurrentWorkout(latestSession);
      }
    }
  }, [workoutSessions]);

  const [isPRModalOpen, setIsPRModalOpen] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>(
    currentWorkout ? 'active' : 'select'
  );

  // currentWorkout이 없으면 홈으로 리다이렉트 (운동 시작 선택 화면 제거)
  useEffect(() => {
    if (!currentWorkout) {
      navigate('/');
    }
  }, [currentWorkout, navigate]);

  const handleFinishWorkout = () => {
    if (!currentWorkout) return;
    
    if (currentWorkout.exercises.length === 0) {
      alert('운동을 추가해주세요.');
      return;
    }

    // selectedBodyPart는 메타데이터이므로 제거
    const { selectedBodyPart, ...workoutData } = currentWorkout as any;
    
    // 기존 운동 기록 수정 모드인지 확인
    if (currentWorkout.id) {
      // 수정 모드: 기존 기록 업데이트
      updateWorkoutSession(currentWorkout.id, {
        date: workoutData.date,
        exercises: workoutData.exercises,
        duration: workoutData.duration,
        notes: workoutData.notes,
      });
      // 업데이트된 세션 정보로 currentWorkout 업데이트
      setCurrentWorkout({
        ...currentWorkout,
        ...workoutData,
      });
    } else {
      // 새 운동 기록 추가
      addWorkoutSession(workoutData);
      // 새로 생성된 세션 ID를 가져와서 currentWorkout 업데이트
      // addWorkoutSession은 동기적으로 실행되므로, workoutSessions가 업데이트됨
      // 하지만 ID를 알 수 없으므로, 날짜와 시간으로 가장 최근 세션 찾기
      const newSessionDate = workoutData.date;
      setTimeout(() => {
        const latestSession = [...workoutSessions]
          .filter(s => s.date === newSessionDate || 
            Math.abs(new Date(s.date).getTime() - new Date(newSessionDate).getTime()) < 1000)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        if (latestSession) {
          setCurrentWorkout(latestSession);
        }
      }, 100);
    }
    
    alert('운동 기록이 저장되었습니다.');
  };

  // currentWorkout이 없으면 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (!currentWorkout) {
    return null;
  }

  return (
    <ActiveWorkoutView
      onFinish={handleFinishWorkout}
      onCancel={() => {
        if (confirm('운동을 종료하시겠습니까? 기록되지 않은 내용은 저장되지 않습니다.')) {
          setCurrentWorkout(null);
          navigate('/');
        }
      }}
    />
  );
}

function ActiveWorkoutView({
  onFinish,
  onCancel,
}: {
  onFinish: () => void;
  onCancel: () => void;
}) {
  const { currentWorkout, updateCurrentWorkout, addWorkoutSession, updateWorkoutSession, exercises, workoutSessions } = useStore();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [selectedBodyPartForAdd, setSelectedBodyPartForAdd] = useState<BodyPart | 'all'>('all');
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editedDate, setEditedDate] = useState<string>('');
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<WorkoutExercise | null>(null);

  if (!currentWorkout) return null;


  // 날짜 편집 모드 진입
  useEffect(() => {
    if (currentWorkout) {
      const dateStr = format(parseISO(currentWorkout.date), 'yyyy-MM-dd');
      setEditedDate(dateStr);
    }
  }, [currentWorkout]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateStr = e.target.value;
    setEditedDate(newDateStr);
    
    // 날짜와 시간을 합쳐서 ISO 문자열로 변환
    const selectedDate = new Date(newDateStr);
    const currentDate = parseISO(currentWorkout.date);
    selectedDate.setHours(currentDate.getHours());
    selectedDate.setMinutes(currentDate.getMinutes());
    selectedDate.setSeconds(currentDate.getSeconds());
    
    updateCurrentWorkout({
      date: selectedDate.toISOString(),
    });
  };

  // 운동 추가 시 선택한 부위에 맞는 운동만 필터링
  const filteredExercises = selectedBodyPartForAdd === 'all' 
    ? exercises 
    : exercises.filter((ex) => ex.bodyPart === selectedBodyPartForAdd);

  const handleAddExercise = () => {
    if (!selectedExerciseId) return;

    const exercise = filteredExercises.find((e) => e.id === selectedExerciseId);
    if (!exercise) return;

    const newExercise: WorkoutExercise = {
      id: Date.now().toString() + Math.random(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [],
      notes: '',
    };

    updateCurrentWorkout({
      exercises: [...currentWorkout.exercises, newExercise],
    });

    setSelectedExerciseId('');
  };

  const handleRemoveExercise = (exerciseId: string) => {
    updateCurrentWorkout({
      exercises: currentWorkout.exercises.filter((ex) => ex.id !== exerciseId),
    });
  };


  const totalVolume = currentWorkout.exercises.reduce((total, ex) => {
    return (
      total +
      ex.sets.reduce((sum, set) => sum + set.weight * set.reps, 0)
    );
  }, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          운동 중
        </h1>
        <button
          onClick={onCancel}
          className="p-2 text-gray-600 dark:text-gray-400 active:text-gray-900 dark:active:text-white active:bg-gray-100 dark:active:bg-gray-700 rounded-xl transition-colors"
        >
          <X size={26} />
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 shadow-lg shadow-blue-500/30">
        <div className="flex items-center justify-center gap-2 mb-2">
          {isEditingDate ? (
            <>
              <input
                type="date"
                value={editedDate}
                onChange={handleDateChange}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="px-3 py-1.5 text-sm border-2 border-blue-300 rounded-lg bg-white text-gray-900 focus:border-blue-200 focus:outline-none"
                autoFocus
                onBlur={() => setIsEditingDate(false)}
              />
              <button
                onClick={() => setIsEditingDate(false)}
                className="text-blue-100 hover:text-white text-sm px-2 py-1 rounded"
              >
                완료
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditingDate(true)}
              className="text-sm text-blue-100 hover:text-white font-medium text-center cursor-pointer active:opacity-80"
            >
              {format(parseISO(currentWorkout.date), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
            </button>
          )}
        </div>
        <div className="text-2xl font-bold text-white text-center">
          총 볼륨: {totalVolume.toLocaleString()}kg
        </div>
      </div>

      {/* 운동 추가 */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4 text-lg flex items-center gap-2">
          <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Plus size={18} className="text-green-600 dark:text-green-400" />
          </div>
          운동 추가
        </h2>
        
        {/* 부위 선택과 운동 선택을 같은 행에 배치 */}
        <div className="flex gap-3">
          {/* 부위 선택 */}
          <select
            value={selectedBodyPartForAdd}
            onChange={(e) => {
              setSelectedBodyPartForAdd(e.target.value as BodyPart | 'all');
              setSelectedExerciseId(''); // 부위 변경 시 운동 선택 초기화
            }}
            className="w-32 px-3 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">전체</option>
            <option value="가슴">가슴</option>
            <option value="등">등</option>
            <option value="어깨">어깨</option>
            <option value="하체">하체</option>
            <option value="팔">팔</option>
            <option value="복근">복근</option>
            <option value="전신">전신</option>
            <option value="기타">기타</option>
          </select>
          
          {/* 운동 선택 */}
          <select
            value={selectedExerciseId}
            onChange={(e) => {
              const exerciseId = e.target.value;
              if (!exerciseId) return;
              
              const exercise = filteredExercises.find((ex) => ex.id === exerciseId);
              if (!exercise) return;

              // 이미 같은 운동이 있는지 확인
              const existingExercise = currentWorkout.exercises.find(
                (ex) => ex.exerciseId === exercise.id
              );

              if (existingExercise) {
                // 이미 있으면 해당 운동의 세트 모달 열기
                setSelectedExerciseForModal(existingExercise);
              } else {
                // 없으면 새 운동 카드 생성 (세트 없이)
                const newExercise: WorkoutExercise = {
                  id: Date.now().toString() + Math.random(),
                  exerciseId: exercise.id,
                  exerciseName: exercise.name,
                  sets: [],
                  notes: '',
                };

                updateCurrentWorkout({
                  exercises: [newExercise, ...currentWorkout.exercises],
                });

                // 새로 추가된 운동의 세트 모달 열기
                setSelectedExerciseForModal(newExercise);
              }

              // 선택 초기화
              setSelectedExerciseId('');
            }}
            disabled={selectedBodyPartForAdd === 'all' && filteredExercises.length === 0}
            className="flex-1 px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400"
          >
            <option value="">운동 선택</option>
            {filteredExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>
        {filteredExercises.length === 0 && selectedBodyPartForAdd !== 'all' && (
          <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
            선택한 부위({selectedBodyPartForAdd})에 해당하는 운동이 없습니다.
          </div>
        )}
        {filteredExercises.length === 0 && selectedBodyPartForAdd === 'all' && (
          <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
            등록된 운동이 없습니다. 운동 목록에서 운동을 추가해주세요.
          </div>
        )}
      </div>

      {/* 운동 리스트 */}
      {currentWorkout.exercises.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-2">
            <Plus size={48} className="mx-auto opacity-50" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            운동을 추가해주세요
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            위에서 운동을 선택해주세요
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentWorkout.exercises.map((exercise) => {
            const totalVolume = exercise.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
            
            return (
              <div
                key={exercise.id}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 cursor-pointer active:scale-95 transition-all"
                onClick={() => setSelectedExerciseForModal(exercise)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {exercise.exerciseName}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {exercise.sets.length > 0 
                        ? `${exercise.sets.length}세트 · 총 볼륨: ${totalVolume.toLocaleString()}kg`
                        : '세트를 추가해주세요'
                      }
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveExercise(exercise.id);
                    }}
                    className="text-red-500 active:text-red-700 p-2 active:bg-red-50 dark:active:bg-red-900/20 rounded-lg transition-colors ml-2"
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 세트 입력 모달 */}
      {selectedExerciseForModal && (
        <ExerciseSetModal
          isOpen={!!selectedExerciseForModal}
          onClose={() => setSelectedExerciseForModal(null)}
          exerciseId={selectedExerciseForModal.exerciseId}
          exerciseName={selectedExerciseForModal.exerciseName}
          existingSets={selectedExerciseForModal.sets}
          onSave={(sets) => {
            // selectedExerciseForModal 값 저장 (닫기 전에 사용)
            const exerciseToUpdate = selectedExerciseForModal;
            
            // 팝업 먼저 닫기
            setSelectedExerciseForModal(null);
            
            // currentWorkout 업데이트
            const updatedExercises = currentWorkout.exercises.map((ex) =>
              ex.id === exerciseToUpdate.id
                ? { ...ex, sets }
                : ex
            );
            
            // 업데이트된 전체 세션 데이터 준비
            const { selectedBodyPart, ...workoutData } = currentWorkout as any;
            const updatedWorkoutData = {
              ...workoutData,
              exercises: updatedExercises,
            };
            
            // currentWorkout이 이미 저장된 세션인 경우 바로 업데이트
            if (currentWorkout.id) {
              // workoutSessions에 저장 (통계 페이지에 반영됨)
              updateWorkoutSession(currentWorkout.id, {
                date: updatedWorkoutData.date,
                exercises: updatedWorkoutData.exercises,
                duration: updatedWorkoutData.duration,
                notes: updatedWorkoutData.notes,
              });
              // currentWorkout도 업데이트
              updateCurrentWorkout({
                exercises: updatedExercises,
              });
            } else {
              // 새 세션인 경우 workoutSessions에 저장 (통계 페이지에 반영됨)
              addWorkoutSession({
                date: updatedWorkoutData.date,
                exercises: updatedWorkoutData.exercises,
                duration: updatedWorkoutData.duration,
                notes: updatedWorkoutData.notes,
              });
              
              // currentWorkout도 업데이트 (ID는 나중에 useEffect에서 연결됨)
              updateCurrentWorkout({
                exercises: updatedExercises,
              });
            }
          }}
        />
      )}
    </div>
  );
}
