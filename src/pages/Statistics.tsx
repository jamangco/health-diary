import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, subWeeks } from 'date-fns';
import { ko } from 'date-fns/locale';
import { BarChart3, TrendingUp, Award, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts';

type GraphType = 'weekly' | 'pr' | 'maxWeight' | 'volume' | 'inbody';

export default function Statistics() {
  const { workoutSessions, personalRecords, inbodyRecords, cleanupDuplicateInbodyRecords } = useStore();

  const [selectedGraph, setSelectedGraph] = useState<GraphType>('weekly');
  const [selectedVolumeExercise, setSelectedVolumeExercise] = useState<'all' | string>('all');
  const [selectedMaxExercise, setSelectedMaxExercise] = useState<string>('');
  const [selectedPRExercise, setSelectedPRExercise] = useState<'all' | string>('all');
  const [selectedWeeklyPeriod, setSelectedWeeklyPeriod] = useState<number>(8);
  const [selectedInbodyMetric, setSelectedInbodyMetric] = useState<'체중' | '근육량' | '체지방량' | '점수'>('체중');
  const [selectedInbodyDate, setSelectedInbodyDate] = useState<string>('');
  const [isInbodyGraphExpanded, setIsInbodyGraphExpanded] = useState<boolean>(true);
  const [isInbodyListExpanded, setIsInbodyListExpanded] = useState<boolean>(false);

  // 주간 운동 횟수 (필터링 가능)
  const weeklyWorkouts = Array.from({ length: selectedWeeklyPeriod }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), selectedWeeklyPeriod - 1 - i), { locale: ko });
    const weekEnd = endOfWeek(subWeeks(new Date(), selectedWeeklyPeriod - 1 - i), { locale: ko });
    const uniqueDays = new Set(
      workoutSessions
        .filter((session) => {
          const sessionDate = parseISO(session.date);
          return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
        })
        .map((session) => session.date.split('T')[0])
    );
    const count = uniqueDays.size;
    return {
      week: formatWeekLabel(weekStart),
      count,
    };
  });

  // 운동별 볼륨 그래프 (최근 4주)
  const exerciseVolumes = calculateExerciseVolumes(workoutSessions);
  const volumeExerciseNames =
    exerciseVolumes.length > 0
      ? Object.keys(exerciseVolumes[0]).filter((key) => key !== 'week')
      : [];
  const isVolumeAll = selectedVolumeExercise === 'all';
  const volumeChartData = isVolumeAll
    ? exerciseVolumes
    : exerciseVolumes.map((item) => ({
        week: item.week,
        volume: item[selectedVolumeExercise] || 0,
      }));

  // PR 기록 (스쿼트, 벤치프레스, 데드리프트만)
  const bigThreeExercises = ['스쿼트', '벤치프레스', '데드리프트'];
  
  // PR 기록 그래프 데이터 (스쿼트, 벤치프레스, 데드리프트)
  const allPRGraphData = getPRGraphData(personalRecords, bigThreeExercises);
  const isPRAll = selectedPRExercise === 'all';
  const prGraphData = isPRAll
    ? allPRGraphData
    : allPRGraphData.map((item) => ({
        date: item.date,
        [selectedPRExercise]: item[selectedPRExercise] || 0,
      }));

  // 최고 중량 변화
  const { histories: maxWeightHistories, defaultExercise } = getMaxWeightHistories(workoutSessions);
  const maxWeightExerciseNames = Object.keys(maxWeightHistories);
  
  // selectedMaxExercise가 비어있으면 기본 운동으로 설정
  const effectiveMaxExercise = selectedMaxExercise || defaultExercise || maxWeightExerciseNames[0] || '';
  const maxWeightHistory = effectiveMaxExercise
    ? maxWeightHistories[effectiveMaxExercise] || []
    : [];
  
  // 초기값 설정 (한 번만 실행)
  useEffect(() => {
    if (!selectedMaxExercise && effectiveMaxExercise) {
      setSelectedMaxExercise(effectiveMaxExercise);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMaxExercise]);

  // 중복 인바디 기록 정리 (컴포넌트 마운트 시 한 번만 실행)
  useEffect(() => {
    cleanupDuplicateInbodyRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 중복 인바디 기록 정리 (컴포넌트 마운트 시 한 번만 실행)
  useEffect(() => {
    cleanupDuplicateInbodyRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 인바디 날짜 필터 초기값 설정 (가장 최근 날짜)
  useEffect(() => {
    if (!selectedInbodyDate && inbodyRecords.length > 0) {
      const sortedDates = Array.from(new Set(inbodyRecords.map(r => r.date.split('T')[0])))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      if (sortedDates.length > 0) {
        setSelectedInbodyDate(sortedDates[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inbodyRecords.length]);

  // 인바디 기록 목록이 확장될 때 날짜 초기화
  useEffect(() => {
    if (selectedGraph === 'inbody' && isInbodyListExpanded && !selectedInbodyDate && inbodyRecords.length > 0) {
      const sortedDates = Array.from(new Set(inbodyRecords.map(r => r.date.split('T')[0])))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      if (sortedDates.length > 0) {
        setSelectedInbodyDate(sortedDates[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInbodyListExpanded, selectedGraph]);

  // 그래프 목록 정의
  const graphTabs = [
    { id: 'weekly' as GraphType, label: '주간 운동 횟수', icon: Activity, available: true },
    { id: 'pr' as GraphType, label: 'PR 기록', icon: Award, available: true },
    { id: 'maxWeight' as GraphType, label: '중량 변화', icon: TrendingUp, available: true },
    { id: 'volume' as GraphType, label: '운동별 볼륨', icon: BarChart3, available: exerciseVolumes.length > 0 },
    { id: 'inbody' as GraphType, label: '인바디 변화', icon: Activity, available: true },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
        통계 및 분석
      </h1>

      {/* 그래프 선택 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
        {graphTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedGraph(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl whitespace-nowrap transition-all active:scale-95 font-semibold ${
                  selectedGraph === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
      </div>

      {/* 주간 운동 횟수 */}
      {selectedGraph === 'weekly' && (
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Activity size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            주간 운동 횟수
          </h2>
          <select
            value={selectedWeeklyPeriod}
            onChange={(e) => setSelectedWeeklyPeriod(Number(e.target.value))}
            className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium mr-[30px] text-center"
          >
            <option value={4}>최근 4주</option>
            <option value={8}>최근 8주</option>
            <option value={12}>최근 12주</option>
            <option value={16}>최근 16주</option>
            <option value={24}>최근 24주</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={weeklyWorkouts} 
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            barCategoryGap="20%"
            barGap={20}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis domain={[0, 7]} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={126}>
              <LabelList dataKey="count" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      )}

      {/* PR 기록 그래프 */}
      {selectedGraph === 'pr' && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                <Award size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              PR 기록 (빅3)
            </h2>
            {allPRGraphData.length > 0 && (
              <select
                value={selectedPRExercise}
                onChange={(e) => setSelectedPRExercise(e.target.value)}
                className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium mr-[30px] text-center"
              >
                <option value="all">전체</option>
                {bigThreeExercises.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {allPRGraphData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={prGraphData} 
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                barCategoryGap="20%"
                barGap={20}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {isPRAll
                  ? bigThreeExercises.map((exerciseName, index) => {
                      const hasData = allPRGraphData.some((d) => d[exerciseName] > 0);
                      if (!hasData) return null;
                      const colors = ['#60a5fa', '#a855f7', '#86efac']; // 파란색, 보라색, 연녹색
                      return (
                        <Bar
                          key={exerciseName}
                          dataKey={exerciseName}
                          fill={colors[index]}
                          radius={[8, 8, 0, 0]}
                          maxBarSize={126}
                        >
                          <LabelList dataKey={exerciseName} position="top" />
                        </Bar>
                      );
                    })
                  : (
                    <Bar
                      dataKey={selectedPRExercise}
                      fill="#60a5fa"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={126}
                    >
                      <LabelList dataKey={selectedPRExercise} position="top" />
                    </Bar>
                  )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Award size={48} className="mx-auto mb-4 opacity-50" />
              <p>기록이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 중량 변화 */}
      {selectedGraph === 'maxWeight' && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
              </div>
              중량 변화
            </h2>
            {maxWeightHistory.length > 0 && maxWeightExerciseNames.length > 0 && (
              <select
                value={selectedMaxExercise}
                onChange={(e) => setSelectedMaxExercise(e.target.value)}
                className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium mr-[30px] text-center"
              >
                {maxWeightExerciseNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {maxWeightHistory.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart 
                  data={maxWeightHistory} 
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  barCategoryGap="20%"
                  barGap={20}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="maxWeight" name="최고 중량" radius={[8, 8, 0, 0]} maxBarSize={126}>
                    <LabelList dataKey="maxWeight" position="top" />
                    {maxWeightHistory.map((entry, index) => {
                      const today = format(new Date(), 'MM/dd', { locale: ko });
                      const isToday = entry.date === today;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={isToday ? '#F5D67D' : '#A1A7E7'}
                        />
                      );
                    })}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="maxWeight"
                    name="최고 중량"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
              <p>기록이 없습니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 운동별 볼륨 그래프 */}
      {selectedGraph === 'volume' && exerciseVolumes.length > 0 && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <BarChart3 size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              운동별 볼륨 (최근 4주)
            </h2>
            {volumeExerciseNames.length > 0 && (
              <select
                value={selectedVolumeExercise}
                onChange={(e) => setSelectedVolumeExercise(e.target.value)}
                className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium mr-[30px] text-center"
              >
                <option value="all">전체 (상위 5개 운동)</option>
                {volumeExerciseNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={volumeChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              {isVolumeAll
                ? volumeExerciseNames.map((exerciseName, index) => (
                    <Line
                      key={exerciseName}
                      type="monotone"
                      dataKey={exerciseName}
                      stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                      strokeWidth={2}
                    >
                      <LabelList dataKey={exerciseName} position="top" />
                    </Line>
                  ))
                : (
                  <Line
                    type="monotone"
                    dataKey="volume"
                    name={selectedVolumeExercise || '볼륨'}
                    stroke="#3b82f6"
                    strokeWidth={2}
                  >
                    <LabelList dataKey="volume" position="top" />
                  </Line>
                )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 인바디 변화 */}
      {selectedGraph === 'inbody' && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h2 
              className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setIsInbodyGraphExpanded(true);
                setIsInbodyListExpanded(false);
              }}
            >
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
                <Activity size={20} className="text-pink-600 dark:text-pink-400" />
              </div>
              인바디 변화
            </h2>
            {inbodyRecords.length > 0 && isInbodyGraphExpanded && (
              <select
                value={selectedInbodyMetric}
                onChange={(e) => setSelectedInbodyMetric(e.target.value as '체중' | '근육량' | '체지방량' | '점수')}
                className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium mr-[30px] text-center"
              >
                <option value="체중">체중</option>
                <option value="근육량">근육량</option>
                <option value="체지방량">체지방량</option>
                <option value="점수">점수</option>
              </select>
            )}
          </div>
          {isInbodyGraphExpanded && (
            <>
              {inbodyRecords.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={inbodyRecords
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((record) => {
                        const inbodyScore = record.notes?.includes('인바디점수:') 
                          ? parseFloat(record.notes.split('인바디점수:')[1]?.split(',')[0]?.trim() || '0')
                          : null;
                        return {
                          date: format(parseISO(record.date), 'MM/dd', { locale: ko }),
                          체중: record.weight || 0,
                          근육량: record.muscleMass || 0,
                          체지방량: record.bodyFat || 0,
                          점수: inbodyScore || 0,
                        };
                      })}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend align="center" />
                    {selectedInbodyMetric === '체중' && (
                      <Line
                        type="monotone"
                        dataKey="체중"
                        name="체중"
                        stroke="#3b82f6"
                        strokeWidth={2}
                      >
                        <LabelList dataKey="체중" position="top" />
                      </Line>
                    )}
                    {selectedInbodyMetric === '근육량' && (
                      <Line
                        type="monotone"
                        dataKey="근육량"
                        name="근육량"
                        stroke="#10b981"
                        strokeWidth={2}
                      >
                        <LabelList dataKey="근육량" position="top" />
                      </Line>
                    )}
                    {selectedInbodyMetric === '체지방량' && (
                      <Line
                        type="monotone"
                        dataKey="체지방량"
                        name="체지방량"
                        stroke="#ef4444"
                        strokeWidth={2}
                      >
                        <LabelList dataKey="체지방량" position="top" />
                      </Line>
                    )}
                    {selectedInbodyMetric === '점수' && (
                      <Line
                        type="monotone"
                        dataKey="점수"
                        name="점수"
                        stroke="#a855f7"
                        strokeWidth={2}
                      >
                        <LabelList dataKey="점수" position="top" />
                      </Line>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Activity size={48} className="mx-auto mb-4 opacity-50" />
                  <p>기록이 없습니다.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 인바디 기록 목록 */}
      {selectedGraph === 'inbody' && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 mx-auto max-w-4xl mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setIsInbodyListExpanded(true);
                setIsInbodyGraphExpanded(false);
              }}
            >
              인바디 기록 목록
            </h3>
            {inbodyRecords.length > 0 && selectedInbodyDate && isInbodyListExpanded && (
              <select
                value={selectedInbodyDate}
                onChange={(e) => setSelectedInbodyDate(e.target.value)}
                className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-center"
                style={{ marginRight: '1.75rem' }}
              >
                {Array.from(new Set(inbodyRecords.map(r => r.date.split('T')[0])))
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                  .slice(0, 7) // 최근 7개만 표시
                  .map((dateStr) => (
                    <option key={dateStr} value={dateStr}>
                      {format(parseISO(dateStr), 'yyyy년 MM월 dd일', { locale: ko })}
                    </option>
                  ))}
              </select>
            )}
          </div>
          {isInbodyListExpanded && (
            <>
              {inbodyRecords.length > 0 ? (
                <div className="space-y-8">
                  {inbodyRecords
                    .filter((record) => {
                      if (!selectedInbodyDate) return false;
                      return record.date.split('T')[0] === selectedInbodyDate;
                    })
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => {
                  const recordDate = parseISO(record.date);
                  const inbodyScore = record.notes?.includes('인바디점수:') 
                    ? record.notes.split('인바디점수: ')[1]?.split(',')[0]?.trim() 
                    : null;
                  
                  // 표준 범위 계산 함수 (성별과 키 기반, 인바디 기준)
                  const getStandardRange = (type: 'weight' | 'muscle' | 'fat', _value: number, gender?: 'male' | 'female', height?: number, weight?: number) => {
                    // 인바디 기기 표시 범위 (기준값 100% 기준)
                    const weightRange = [55, 70, 85, 100, 115, 130, 145, 160, 175, 190, 205]; // 체중: 55~205%
                    const muscleRange = [70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170]; // 골격근량: 70~170%
                    const fatRange = [40, 60, 80, 100, 160, 220, 280, 340, 400, 460, 520]; // 체지방량: 40~520%
                    
                    // 인바디 표준 범위 (기준값 대비 %)
                    const weightStandardMin = 85; // 체중: 85~115%
                    const weightStandardMax = 115;
                    const muscleStandardMin = 90; // 골격근량: 90~110%
                    const muscleStandardMax = 110;
                    const fatStandardMin = 80; // 체지방량: 80~160%
                    const fatStandardMax = 160;
                    
                    if (type === 'weight') {
                      // 체중: BMI 기준 (18.5-24.9)로 기준값 계산
                      if (!height) {
                        // 키 정보가 없으면 기본값 사용
                        const baseValue = 70;
                        return { 
                          min: baseValue * (weightStandardMin / 100), 
                          max: baseValue * (weightStandardMax / 100), 
                          baseValue, 
                          standardMinPercent: weightStandardMin,
                          standardMaxPercent: weightStandardMax,
                          range: weightRange 
                        };
                      }
                      const heightM = height / 100;
                      const bmiStandard = 21.7; // 표준 BMI 중간값
                      const baseValue = bmiStandard * heightM * heightM;
                      return { 
                        min: baseValue * (weightStandardMin / 100), 
                        max: baseValue * (weightStandardMax / 100), 
                        baseValue,
                        standardMinPercent: weightStandardMin,
                        standardMaxPercent: weightStandardMax,
                        range: weightRange 
                      };
                    } else if (type === 'muscle') {
                      // 골격근량: 성별과 체중 기반 기준값 계산 (인바디 기준)
                      // 체중이 없거나 0이면 키 기반 추정, 그것도 없으면 기본값 사용
                      let actualWeight = weight;
                      if (!actualWeight || actualWeight === 0) {
                        if (height && gender) {
                          // 키 기반 추정 체중 사용
                          const heightM = height / 100;
                          actualWeight = gender === 'male' 
                            ? 22 * heightM * heightM  // BMI 22 기준
                            : 21 * heightM * heightM;  // BMI 21 기준
                        } else {
                          // 정보가 없으면 기본값 사용
                          const baseValue = 35;
                          return { 
                            min: baseValue * (muscleStandardMin / 100), 
                            max: baseValue * (muscleStandardMax / 100), 
                            baseValue,
                            standardMinPercent: muscleStandardMin,
                            standardMaxPercent: muscleStandardMax,
                            range: muscleRange 
                          };
                        }
                      }
                      
                      if (!gender) {
                        // 성별이 없으면 기본값 사용
                        const baseValue = 35;
                        return { 
                          min: baseValue * (muscleStandardMin / 100), 
                          max: baseValue * (muscleStandardMax / 100), 
                          baseValue,
                          standardMinPercent: muscleStandardMin,
                          standardMaxPercent: muscleStandardMax,
                          range: muscleRange 
                        };
                      }
                      
                      // 체중 기반 골격근량 기준값 (인바디 기준)
                      // 남성: 체중의 약 36% (표준 범위 32-40%)
                      // 여성: 체중의 약 30% (표준 범위 26-34%)
                      const basePercent = gender === 'male' ? 0.36 : 0.30;
                      const baseValue = actualWeight * basePercent;
                      return { 
                        min: baseValue * (muscleStandardMin / 100), 
                        max: baseValue * (muscleStandardMax / 100), 
                        baseValue,
                        standardMinPercent: muscleStandardMin,
                        standardMaxPercent: muscleStandardMax,
                        range: muscleRange 
                      };
                    } else {
                      // 체지방량: 성별과 키, 체중 기반 기준값 계산
                      if (!height || !gender) {
                        // 정보가 없으면 기본값 사용
                        const baseValue = 10;
                        return { 
                          min: baseValue * (fatStandardMin / 100), 
                          max: baseValue * (fatStandardMax / 100), 
                          baseValue,
                          standardMinPercent: fatStandardMin,
                          standardMaxPercent: fatStandardMax,
                          range: fatRange 
                        };
                      }
                      // 성별과 키 기반 체지방량 기준값 (인바디 기준)
                      // 실제 체중이 있으면 사용, 없으면 키 기반 추정 체중 사용
                      const heightM = height / 100;
                      const actualWeight = weight || (gender === 'male' 
                        ? 22 * heightM * heightM  // BMI 22 기준
                        : 21 * heightM * heightM);  // BMI 21 기준
                      const basePercent = gender === 'male' ? 0.15 : 0.23; // 남성 15%, 여성 23%
                      const baseValue = actualWeight * basePercent;
                      return { 
                        min: baseValue * (fatStandardMin / 100), 
                        max: baseValue * (fatStandardMax / 100), 
                        baseValue,
                        standardMinPercent: fatStandardMin,
                        standardMaxPercent: fatStandardMax,
                        range: fatRange 
                      };
                    }
                  };

                  // 비선형 스케일 위치 계산 함수
                  const calculateNonLinearPosition = (percent: number, markers: number[]) => {
                    if (percent <= markers[0]) return 0;
                    if (percent >= markers[markers.length - 1]) return 100;
                    
                    // 어느 구간에 속하는지 찾기
                    for (let i = 0; i < markers.length - 1; i++) {
                      if (percent >= markers[i] && percent <= markers[i + 1]) {
                        // 해당 구간 내에서 선형 보간
                        const segmentStart = markers[i];
                        const segmentEnd = markers[i + 1];
                        const segmentStartPos = (i / (markers.length - 1)) * 100;
                        const segmentEndPos = ((i + 1) / (markers.length - 1)) * 100;
                        const segmentRatio = (percent - segmentStart) / (segmentEnd - segmentStart);
                        return segmentStartPos + (segmentEndPos - segmentStartPos) * segmentRatio;
                      }
                    }
                    return 0;
                  };

                  const renderBarChart = (label: string, value: number | undefined, type: 'weight' | 'muscle' | 'fat', unit: string) => {
                    if (!value) return null;
                    
                    const range = getStandardRange(type, value, record.gender, record.height, record.weight);
                    const markers = range.range;
                    
                    // 기준값 대비 측정값 퍼센트 계산 (인바디 기준)
                    const baseValue = range.baseValue;
                    const valuePercent = (value / baseValue) * 100;
                    
                    // 표준 범위는 이미 인바디 기준 퍼센트로 정의됨
                    const standardStartPercent = range.standardMinPercent;
                    const standardEndPercent = range.standardMaxPercent;
                    
                    // 비선형 스케일을 고려한 위치 계산
                    const standardStartPos = calculateNonLinearPosition(standardStartPercent, markers);
                    const standardEndPos = calculateNonLinearPosition(standardEndPercent, markers);
                    const valuePos = calculateNonLinearPosition(valuePercent, markers);
                    
                    return (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {label} ({unit})
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-base font-bold text-gray-900 dark:text-white">
                              {value.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              ({valuePercent.toFixed(0)}%)
                            </div>
                          </div>
                        </div>
                        <div className="relative h-8 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          {/* 표준 범위 배경 */}
                          <div 
                            className="absolute h-full bg-gray-300 dark:bg-gray-600"
                            style={{ 
                              left: `${standardStartPos}%`, 
                              width: `${standardEndPos - standardStartPos}%` 
                            }}
                          />
                          {/* 측정값 표시 (왼쪽 끝부터 기준값까지 세로 막대바 - 직사각형, 원형 막대바 안에 들어가도록 높이 줄임) */}
                          <div 
                            className="absolute bg-gray-700 dark:bg-gray-400"
                            style={{ 
                              left: '0%',
                              width: `${Math.max(0, Math.min(100, valuePos))}%`,
                              height: '45%',
                              top: '50%',
                              transform: 'translateY(-50%)'
                            }}
                          />
                          {/* 측정값 퍼센트 표시 */}
                          <div 
                            className="absolute text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap"
                            style={{ 
                              left: `${Math.max(0, Math.min(100, valuePos))}%`,
                              top: '-18px',
                              transform: 'translateX(-50%)'
                            }}
                          >
                            {valuePercent.toFixed(0)}%
                          </div>
                        </div>
                        {/* 퍼센트 구간 레이블 (막대그래프 위) */}
                        <div className="relative h-4 mt-1">
                          {(() => {
                            const markers = type === 'weight' 
                              ? [55, 70, 85, 100, 115, 130, 145, 160, 175, 190, 205]
                              : type === 'muscle'
                              ? [70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170]
                              : [40, 60, 80, 100, 160, 220, 280, 340, 400, 460, 520];
                            
                            // 각 그래프의 전체 너비를 11개 구간으로 동일하게 나눔
                            return markers.map((percent, index) => {
                              // 11개 구간으로 나누기 (0~10 인덱스)
                              const pos = (index / 10) * 100;
                              return (
                                <div
                                  key={percent}
                                  className="absolute text-[8px] text-gray-500 dark:text-gray-400 whitespace-nowrap leading-tight"
                                  style={{ 
                                    left: `${pos}%`,
                                    top: '0',
                                    transform: 'translateX(-50%)',
                                    letterSpacing: '-0.5px'
                                  }}
                                >
                                  {percent}%
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    );
                  };
                  
                  return (
                    <div
                      key={record.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 shadow-lg mb-8"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-semibold text-gray-900 dark:text-white text-base">
                          {format(recordDate, 'yyyy년 MM월 dd일', { locale: ko })}
                        </div>
                        {inbodyScore && (
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            점수: {inbodyScore}점
                          </div>
                        )}
                      </div>
                      
                      {/* 표준 범위 헤더 */}
                      <div className="relative mb-4 text-xs text-gray-600 dark:text-gray-400 h-4">
                        {/* 체중 그래프 기준으로 위치 계산 (55~205%) */}
                        <div 
                          className="absolute text-center"
                          style={{ 
                            left: `${((70 - 55) / (205 - 55)) * 100}%`,
                            transform: 'translateX(-50%)'
                          }}
                        >
                          표준이하
                        </div>
                        <div 
                          className="absolute text-center"
                          style={{ 
                            left: `${((100 - 55) / (205 - 55)) * 100}%`,
                            transform: 'translateX(-50%)'
                          }}
                        >
                          표준
                        </div>
                        <div 
                          className="absolute text-center"
                          style={{ 
                            left: `${((160 - 55) / (205 - 55)) * 100}%`,
                            transform: 'translateX(-50%)'
                          }}
                        >
                          표준이상
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {renderBarChart('체중', record.weight, 'weight', 'kg')}
                        {renderBarChart('골격근량', record.muscleMass, 'muscle', 'kg')}
                        {renderBarChart('체지방량', record.bodyFat, 'fat', 'kg')}
                      </div>
                    </div>
                  );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Activity size={48} className="mx-auto mb-4 opacity-50" />
                  <p>기록이 없습니다.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {graphTabs.filter((tab) => tab.available).length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 mx-auto max-w-4xl">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>아직 통계 데이터가 없습니다.</p>
          <p className="text-sm mt-2">운동 기록을 추가하면 통계가 표시됩니다.</p>
        </div>
      )}
    </div>
  );
}

function formatWeekLabel(date: Date) {
  const month = date.getMonth() + 1;
  const weekOfMonth = Math.floor((date.getDate() - 1) / 7) + 1;
  return `${month}월 ${weekOfMonth}주차`;
}

function calculateExerciseVolumes(workoutSessions: any[]) {
  const exerciseMap = new Map<string, Map<string, number>>();
  const weeks = Array.from({ length: 4 }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), 3 - i), { locale: ko });
    return formatWeekLabel(weekStart);
  });

  workoutSessions.forEach((session) => {
    const sessionDate = parseISO(session.date);
    const weekStart = startOfWeek(sessionDate, { locale: ko });
    const weekKey = formatWeekLabel(weekStart);

    session.exercises.forEach((exercise: any) => {
      const volume = exercise.sets.reduce(
        (sum: number, set: any) => sum + set.weight * set.reps,
        0
      );

      if (!exerciseMap.has(exercise.exerciseName)) {
        exerciseMap.set(exercise.exerciseName, new Map());
      }

      const weekMap = exerciseMap.get(exercise.exerciseName)!;
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + volume);
    });
  });

  const topExercises = Array.from(exerciseMap.entries())
    .map(([name, weekMap]) => ({
      name,
      totalVolume: Array.from(weekMap.values()).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 5)
    .map((e) => e.name);

  return weeks.map((week) => {
    const data: any = { week };
    topExercises.forEach((exerciseName) => {
      const weekMap = exerciseMap.get(exerciseName);
      data[exerciseName] = weekMap?.get(week) || 0;
    });
    return data;
  });
}

function getMaxWeightHistories(workoutSessions: any[]) {
  const histories: Record<string, { date: string; maxWeight: number }[]> = {};

  workoutSessions.forEach((session) => {
    session.exercises.forEach((exercise: any) => {
      if (!exercise.sets || exercise.sets.length === 0) return;
      const maxWeight = Math.max(...exercise.sets.map((set: any) => set.weight));

      if (!histories[exercise.exerciseName]) {
        histories[exercise.exerciseName] = [];
      }

      histories[exercise.exerciseName].push({
        date: session.date,
        maxWeight,
      });
    });
  });

  const entries = Object.entries(histories);
  if (entries.length === 0) {
    return { histories: {}, defaultExercise: '' };
  }

  const defaultExercise = entries
    .sort((a, b) => a[0].localeCompare(b[0]))
    .sort((a, b) => b[1].length - a[1].length)[0][0];

  Object.keys(histories).forEach((name) => {
    histories[name] = histories[name]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((entry) => ({
        date: format(parseISO(entry.date), 'MM/dd', { locale: ko }),
        maxWeight: entry.maxWeight,
      }));
  });

  return { histories, defaultExercise };
}

function getPRGraphData(personalRecords: any[], exerciseNames: string[]) {
  const prMap = new Map<string, { date: string; value: number }[]>();

  personalRecords
    .filter((pr) => pr.type === 'maxWeight' && exerciseNames.includes(pr.exerciseName))
    .forEach((pr) => {
      if (!prMap.has(pr.exerciseName)) {
        prMap.set(pr.exerciseName, []);
      }
      prMap.get(pr.exerciseName)!.push({
        date: pr.date,
        value: pr.value,
      });
    });

  const allDates = new Set<string>();
  exerciseNames.forEach((name) => {
    prMap.get(name)?.forEach((entry) => {
      allDates.add(entry.date.split('T')[0]);
    });
  });

  const sortedDates = Array.from(allDates).sort();

  return sortedDates.map((date) => {
    const data: any = { date: format(parseISO(date), 'MM/dd', { locale: ko }) };
    exerciseNames.forEach((name) => {
      const records = prMap.get(name) || [];
      const recordForDate = records.find((r) => r.date.split('T')[0] === date);
      data[name] = recordForDate ? recordForDate.value : 0;
    });
    return data;
  });
}
