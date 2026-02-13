import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, List, ChevronLeft, ChevronRight, Trash2, Edit, X } from 'lucide-react';
import { WorkoutSession, Exercise } from '../types';

function getBodyPartsForSession(session: WorkoutSession, exercises: Exercise[]): string[] {
  const parts = new Set<string>();
  session.exercises.forEach((workoutEx) => {
    const exInfo = exercises.find((e) => e.id === workoutEx.exerciseId);
    if (exInfo) {
      parts.add(exInfo.bodyPart);
    }
  });
  return Array.from(parts);
}

export default function WorkoutHistory() {
  const navigate = useNavigate();
  const { workoutSessions, deleteWorkoutSession, exercises, setCurrentWorkout, currentWorkout, updateCurrentWorkout } = useStore();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [showDateDetailModal, setShowDateDetailModal] = useState(false);

  const sortedSessions = [...workoutSessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 캘린더 뷰를 위한 날짜별 세션 그룹화
  const sessionsByDate = sortedSessions.reduce((acc, session) => {
    const dateKey = session.date.split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, WorkoutSession[]>);

  const handleDelete = (id: string) => {
    if (confirm('정말 이 운동 기록을 삭제하시겠습니까?')) {
      const deletedSession = workoutSessions.find(s => s.id === id);
      deleteWorkoutSession(id);
      
      // currentWorkout이 삭제된 세션이면 currentWorkout도 업데이트
      if (currentWorkout && currentWorkout.id === id) {
        setCurrentWorkout(null);
      } else if (currentWorkout && deletedSession) {
        // 삭제된 세션의 운동들을 currentWorkout에서도 제거
        const deletedExerciseIds = new Set(deletedSession.exercises.map(ex => ex.exerciseId));
        const updatedExercises = currentWorkout.exercises.filter(
          ex => !deletedExerciseIds.has(ex.exerciseId)
        );
        
        if (updatedExercises.length !== currentWorkout.exercises.length) {
          // 운동이 삭제되었으면 currentWorkout 업데이트
          if (currentWorkout.id) {
            updateCurrentWorkout({
              exercises: updatedExercises,
            });
            // 저장된 세션이면 바로 업데이트
            updateWorkoutSession(currentWorkout.id, {
              exercises: updatedExercises,
            });
          } else {
            updateCurrentWorkout({
              exercises: updatedExercises,
            });
          }
        }
      }
    }
  };

  const handleEdit = (session: WorkoutSession, e: React.MouseEvent) => {
    e.stopPropagation();
    // 운동 기록을 currentWorkout으로 불러와서 수정 모드로 전환
    setCurrentWorkout(session);
    navigate('/workout');
  };

  const handleViewSession = (session: WorkoutSession) => {
    setSelectedSession(session);
  };

  const closeSessionDetail = () => {
    setSelectedSession(null);
  };

  if (selectedSession) {
    return (
      <SessionDetail
        session={selectedSession}
        onClose={closeSessionDetail}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          운동 기록
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-3 rounded-xl transition-all active:scale-95 ${
              viewMode === 'calendar'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Calendar size={22} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-3 rounded-xl transition-all active:scale-95 ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <List size={22} />
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-3">
          {sortedSessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>아직 운동 기록이 없습니다.</p>
            </div>
          ) : (
            sortedSessions.map((session) => {
              const bodyParts = getBodyPartsForSession(session, exercises);
              return (
                <div
                  key={session.id}
                  onClick={() => handleViewSession(session)}
                  className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer active:bg-gray-50 dark:active:bg-gray-700 transition-all active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 dark:text-white text-base mb-2">
                        {format(parseISO(session.date), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {session.duration && (
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold">
                            {session.duration}분
                          </span>
                        )}
                        {bodyParts.length > 0 && (
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-semibold">
                            {bodyParts.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={(e) => handleEdit(session, e)}
                        className="text-blue-500 active:text-blue-700 p-2 active:bg-blue-50 dark:active:bg-blue-900/20 rounded-xl transition-colors"
                        title="수정"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(session.id);
                        }}
                        className="text-red-500 active:text-red-700 p-2 active:bg-red-50 dark:active:bg-red-900/20 rounded-xl transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    {session.exercises.slice(0, 3).map((exercise) => (
                      <div
                        key={exercise.id}
                        className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <span className="text-base font-semibold text-gray-900 dark:text-white">
                          {exercise.exerciseName}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          {exercise.sets.length}세트
                        </span>
                      </div>
                    ))}
                    {session.exercises.length > 3 && (
                      <div className="text-sm text-gray-500 dark:text-gray-500 text-center pt-1">
                        +{session.exercises.length - 3}개 더
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <>
          <CalendarView
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              const dateKey = format(date, 'yyyy-MM-dd');
              if (sessionsByDate[dateKey] && sessionsByDate[dateKey].length > 0) {
                setShowDateDetailModal(true);
              }
            }}
            sessionsByDate={sessionsByDate}
            onSessionSelect={handleViewSession}
            exercises={exercises}
          />
          {showDateDetailModal && (
            <DateDetailModal
              date={selectedDate}
              sessions={sessionsByDate[format(selectedDate, 'yyyy-MM-dd')] || []}
              exercises={exercises}
              onClose={() => setShowDateDetailModal(false)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </>
      )}
    </div>
  );
}

function CalendarView({
  selectedDate,
  onDateSelect,
  sessionsByDate,
  onSessionSelect,
  exercises,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  sessionsByDate: Record<string, WorkoutSession[]>;
  onSessionSelect: (session: WorkoutSession) => void;
  exercises: Exercise[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="p-3 bg-gray-100 dark:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-xl transition-all active:scale-95">
          <ChevronLeft size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">
          {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
        </h2>
        <button onClick={nextMonth} className="p-3 bg-gray-100 dark:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-xl transition-all active:scale-95">
          <ChevronRight size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-3">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const sessions = sessionsByDate[dateKey] || [];
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const bodyPartsForDay = sessions.length
            ? Array.from(
                new Set(
                  sessions.flatMap((session) =>
                    getBodyPartsForSession(session, exercises)
                  )
                )
              )
            : [];

          return (
            <div
              key={dateKey}
              onClick={() => onDateSelect(day)}
              className={`aspect-[1/0.75] p-1.5 border-2 rounded-xl cursor-pointer transition-all active:scale-95 ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : isToday
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 active:bg-gray-100 dark:active:bg-gray-600'
              }`}
            >
              <div className="text-sm font-semibold mb-1">
                {format(day, 'd')}
              </div>
              {sessions.length > 0 && bodyPartsForDay.length > 0 && (
                <div className="text-xs">
                  <div className="flex flex-wrap justify-center gap-0.5">
                    {bodyPartsForDay.slice(0, 3).map((part) => (
                      <span
                        key={part}
                        className="text-xs px-1.5 py-0.5 bg-white/20 rounded font-medium"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

function DateDetailModal({
  date,
  sessions,
  exercises,
  onClose,
  onEdit,
  onDelete,
}: {
  date: Date;
  sessions: WorkoutSession[];
  exercises: Exercise[];
  onClose: () => void;
  onEdit: (session: WorkoutSession, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
}) {
  // 종목별로 운동을 그룹화
  const exercisesByType = sessions.reduce((acc, session) => {
    session.exercises.forEach((exercise) => {
      const exerciseName = exercise.exerciseName;
      if (!acc[exerciseName]) {
        acc[exerciseName] = [];
      }
      acc[exerciseName].push({
        sessionId: session.id,
        exercise: exercise,
        session: session,
      });
    });
    return acc;
  }, {} as Record<string, Array<{ sessionId: string; exercise: any; session: WorkoutSession }>>);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {format(date, 'yyyy년 MM월 dd일', { locale: ko })} 운동
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-400 active:text-gray-900 dark:active:text-white active:bg-gray-100 dark:active:bg-gray-700 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(exercisesByType).map(([exerciseName, exerciseData]) => {
              // 해당 종목이 포함된 세션 찾기
              const firstSession = exerciseData[0].session;
              const exerciseInfo = exercises.find((e) => e.name === exerciseName);
              
              return (
                <div
                  key={exerciseName}
                  className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-base text-gray-900 dark:text-white">
                      {exerciseName}
                    </h4>
                    {firstSession && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => onEdit(firstSession, e)}
                          className="text-blue-500 active:text-blue-700 p-1.5 active:bg-blue-50 dark:active:bg-blue-900/20 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(firstSession.id);
                          }}
                          className="text-red-500 active:text-red-700 p-1.5 active:bg-red-50 dark:active:bg-red-900/20 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {exerciseData.map(({ exercise, session }, idx) => (
                      <div key={`${session.id}-${exercise.id}-${idx}`} className="space-y-2">
                        {exerciseData.length > 1 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            세션 {idx + 1}
                          </div>
                        )}
                        <div className="space-y-1">
                          {exercise.sets.map((set, setIndex) => (
                            <div
                              key={set.id}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-600 dark:text-gray-400">
                                {setIndex + 1}세트
                              </span>
                              <span className="text-gray-900 dark:text-white font-semibold">
                                {set.weight}kg × {set.reps}회
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionDetail({
  session,
  onClose,
  onDelete,
}: {
  session: WorkoutSession;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const { setCurrentWorkout } = useStore();

  const handleEdit = () => {
    setCurrentWorkout(session);
    navigate('/workout');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-blue-600 dark:text-blue-400 font-medium"
        >
          ← 뒤로
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="text-blue-500 active:text-blue-700 p-2 active:bg-blue-50 dark:active:bg-blue-900/20 rounded-xl transition-colors"
            title="수정"
          >
            <Edit size={20} />
          </button>
          <button
            onClick={() => onDelete(session.id)}
            className="text-red-500 active:text-red-700 p-2 active:bg-red-50 dark:active:bg-red-900/20 rounded-xl transition-colors"
            title="삭제"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {format(parseISO(session.date), 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
        </h2>
        {session.duration && (
          <div className="text-base text-gray-600 dark:text-gray-400 mb-4">
            운동 시간: {session.duration}분
          </div>
        )}
        {session.notes && (
          <div className="text-sm text-gray-700 dark:text-gray-300 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
            {session.notes}
          </div>
        )}

        <div className="space-y-4">
          {session.exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
            >
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                {exercise.exerciseName}
              </h3>
              <div className="space-y-2">
                {exercise.sets.map((set, index) => (
                  <div
                    key={set.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-600 dark:text-gray-400">
                      세트 {index + 1}
                    </span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {set.weight}kg × {set.reps}회
                    </span>
                    {set.restTime && (
                      <span className="text-gray-500 dark:text-gray-500 text-xs">
                        휴식 {set.restTime}초
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {exercise.notes && (
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {exercise.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
