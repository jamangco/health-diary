import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Dumbbell, TrendingUp, Calendar, Award, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import PRRecordModal from '../components/PRRecordModal';
import InbodyRecordModal from '../components/InbodyRecordModal';

export default function Home() {
  const navigate = useNavigate();
  const {
    workoutSessions,
    routines,
    personalRecords,
    currentWorkout,
    setCurrentWorkout,
  } = useStore();
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [isInbodyModalOpen, setIsInbodyModalOpen] = useState(false);

  const today = new Date();
  const weekStart = startOfWeek(today, { locale: ko });
  const weekEnd = endOfWeek(today, { locale: ko });

  // 이번주 운동한 날짜 수 (하루 여러 번 운동해도 1회)
  const thisWeekWorkoutDays = new Set(
    workoutSessions
      .filter((session) => {
        const sessionDate = parseISO(session.date);
        return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
      })
      .map((session) => session.date.split('T')[0])
  );
  const thisWeekWorkoutCount = thisWeekWorkoutDays.size;

  // 전체 기간 동안 운동한 날짜 수
  const uniqueWorkoutDays = Array.from(
    new Set(workoutSessions.map((session) => session.date.split('T')[0]))
  ).sort();
  const totalWorkoutDays = uniqueWorkoutDays.length;
  const firstWorkoutDate = uniqueWorkoutDays[0]
    ? parseISO(uniqueWorkoutDays[0])
    : null;


  // 최근 PR 기록 (스쿼트, 벤치프레스, 데드리프트 각 종목별 최근 기록)
  const bigThreeExercises = ['스쿼트', '벤치프레스', '데드리프트'];
  const recentPRs = bigThreeExercises.map((exerciseName) => {
    const prs = personalRecords
      .filter((pr) => pr.exerciseName === exerciseName && pr.type === 'maxWeight')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return prs.length > 0 ? prs[0] : null;
  }).filter((pr) => pr !== null);

  // 원형 그래프용 데이터 및 총합 계산
  const prChartData = recentPRs.map((pr) => ({
    name: pr.exerciseName,
    value: pr.value,
  }));

  const totalPRWeight = recentPRs.reduce((sum, pr) => sum + pr.value, 0);

  // 원형 그래프 색상
  const COLORS = ['#60a5fa', '#a855f7', '#86efac']; // 파란색, 보라색, 연녹색

  // 진행중인 루틴 (요일별 루틴)
  const activeRoutines = routines.filter((routine) => {
    if (!routine.daysOfWeek || routine.daysOfWeek.length === 0) return false;
    const todayDay = today.getDay();
    return routine.daysOfWeek.includes(todayDay);
  });

  const handleStartWorkout = () => {
    if (currentWorkout) {
      // 이미 진행 중인 운동이 있으면 운동 계속하기
      navigate('/workout');
    } else {
      // 오늘 날짜의 기존 기록이 있는지 확인
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const todaySessions = workoutSessions.filter((session) => {
        const sessionDate = session.date.split('T')[0];
        return sessionDate === todayStr;
      });

      if (todaySessions.length > 0) {
        // 오늘 날짜의 가장 최근 기록 불러오기
        const latestSession = todaySessions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        setCurrentWorkout(latestSession);
      } else {
        // 오늘 날짜로 빈 운동 시작
        const newWorkout: any = {
          date: new Date().toISOString(),
          exercises: [],
        };
        setCurrentWorkout(newWorkout);
      }
      navigate('/workout');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          운동 기록
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {format(today, 'yyyy년 MM월 dd일', { locale: ko })}
        </span>
      </div>

      {/* 운동 기록하기 버튼 */}
      <button
        onClick={handleStartWorkout}
        className="w-full bg-gradient-to-br from-blue-500 to-blue-600 active:from-blue-600 active:to-blue-700 text-white font-semibold py-5 px-4 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
      >
        <Dumbbell size={26} />
        <span className="text-base">운동 기록하기</span>
      </button>

      {/* PR 기록하기 / 인바디 기록하기 버튼 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setIsPRModalOpen(true)}
          className="bg-gradient-to-br from-purple-500 to-purple-600 active:from-purple-600 active:to-purple-700 text-white font-semibold py-5 px-4 rounded-2xl shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Award size={26} />
          <span className="text-base">PR 기록하기</span>
        </button>
        <button
          onClick={() => setIsInbodyModalOpen(true)}
          className="bg-gradient-to-br from-green-500 to-green-600 active:from-green-600 active:to-green-700 text-white font-semibold py-5 px-4 rounded-2xl shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Activity size={26} />
          <span className="text-base">인바디 기록하기</span>
        </button>
      </div>

      {/* 진행중인 루틴 */}
      {activeRoutines.length > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            오늘의 루틴
          </h2>
          <div className="space-y-3">
            {activeRoutines.map((routine) => (
              <div
                key={routine.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 active:bg-gray-50 dark:active:bg-gray-700 transition-all active:scale-[0.98] shadow-sm"
              >
                <div className="font-semibold text-gray-900 dark:text-white text-base">
                  {routine.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {routine.exercises.length}개 운동
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 이번주 운동 & 누적 운동 일수 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <div className="p-1 bg-blue-500 rounded-lg">
                <TrendingUp size={14} className="text-white" />
              </div>
              <h2 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                이번주 운동
              </h2>
            </div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {thisWeekWorkoutCount}일
            </div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400">
              {format(weekStart, 'MM/dd', { locale: ko })} - {format(weekEnd, 'MM/dd', { locale: ko })}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <div className="p-1 bg-purple-500 rounded-lg">
                <TrendingUp size={14} className="text-white" />
              </div>
              <h2 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                누적 일수
              </h2>
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {totalWorkoutDays}일
            </div>
            {firstWorkoutDate && (
              <div className="text-[10px] text-gray-600 dark:text-gray-400">
                {format(firstWorkoutDate, 'MM/dd', { locale: ko })}부터
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 최근 PR 기록 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
            <Award size={18} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          최근 PR 기록 (빅3)
        </h2>
        
        {recentPRs.length > 0 ? (
          /* 원형 그래프와 3대 중량을 같은 행에 배치 (2:1 비율) */
          <div className="grid grid-cols-3 gap-4">
            {/* 원형 그래프 카드 (범례 포함) */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 col-span-2 flex items-center gap-4" style={{ height: '275px' }}>
              {/* 범례 (왼쪽, 세로) */}
              <div className="flex flex-col gap-3 flex-shrink-0">
                {prChartData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* 원형 그래프 (오른쪽) */}
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={prChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ cx, cy, midAngle, outerRadius, value }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="white"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={18}
                            fontWeight="bold"
                          >
                            {value}kg
                          </text>
                        );
                      }}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3대 중량 카드 */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center" style={{ height: '275px' }}>
              <div className="text-center w-full">
                <div className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">3대</div>
                <div className="text-6xl font-bold bg-gradient-to-br from-yellow-500 to-orange-500 bg-clip-text text-transparent leading-tight">
                  {totalPRWeight.toLocaleString()}kg
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* PR 기록이 없을 때 */
          <div className="grid grid-cols-3 gap-4">
            {/* 원형 그래프 카드 (빈 상태) */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 col-span-2 flex items-center justify-center" style={{ height: '275px' }}>
              <div className="text-center text-gray-500 dark:text-gray-400">
                <Award size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">PR 기록이 없습니다</p>
              </div>
            </div>

            {/* 3대 중량 카드 */}
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center" style={{ height: '275px' }}>
              <div className="text-center w-full">
                <div className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">3대</div>
                <div className="text-6xl font-bold bg-gradient-to-br from-yellow-500 to-orange-500 bg-clip-text text-transparent leading-tight">
                  0kg
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 빈 상태 */}
      {workoutSessions.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Dumbbell size={48} className="mx-auto mb-4 opacity-50" />
          <p>아직 운동 기록이 없습니다.</p>
          <p className="text-sm mt-2">운동 기록하기 버튼을 눌러 시작하세요!</p>
        </div>
      )}
      {/* PR 기록 모달 */}
      <PRRecordModal isOpen={isPRModalOpen} onClose={() => setIsPRModalOpen(false)} />
      
      {/* 인바디 기록 모달 */}
      <InbodyRecordModal isOpen={isInbodyModalOpen} onClose={() => setIsInbodyModalOpen(false)} />
    </div>
  );
}
