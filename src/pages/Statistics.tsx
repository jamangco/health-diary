import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { BodyPart } from '../types';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, subWeeks, subMonths, addWeeks, addMonths, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { BarChart3, TrendingUp, Award, Activity, List } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

type GraphType = 'weekly' | 'pr' | 'maxWeight' | 'volume' | 'inbody';

export default function Statistics() {
  const { workoutSessions, personalRecords, inbodyRecords, cleanupDuplicateInbodyRecords, exercises } = useStore();

  const [selectedGraph, setSelectedGraph] = useState<GraphType>('weekly');
  const [selectedVolumeFilter, setSelectedVolumeFilter] = useState<'all' | BodyPart>('all');
  const [selectedMaxExercise, setSelectedMaxExercise] = useState<string>('');
  const [selectedMaxBodyPart, setSelectedMaxBodyPart] = useState<BodyPart | 'all'>('all');
  const [activePRCard, setActivePRCard] = useState<'record' | 'predicted'>('record');
  const [selectedPRDate, setSelectedPRDate] = useState<string>('');
  const [selectedInbodyMetric, setSelectedInbodyMetric] = useState<'체중' | '근육량' | '체지방량' | '점수'>('체중');
  const [selectedInbodyDate, setSelectedInbodyDate] = useState<string>('');
  const [exerciseCountPeriod, setExerciseCountPeriod] = useState<'week' | 'month'>('week');
  const [bodyPartRatioPeriod, setBodyPartRatioPeriod] = useState<'week' | 'month' | 'total'>('total');
  const [activeVolumeCard, setActiveVolumeCard] = useState<'volume' | 'bodyPart'>('volume');
  const [volumePeriod, setVolumePeriod] = useState<'day' | 'week' | 'month'>('week');
  const [maxWeightPeriod, setMaxWeightPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [activeInbodyCard, setActiveInbodyCard] = useState<'graph' | 'list'>('graph');
  const [inbodyPeriod, setInbodyPeriod] = useState<'day' | 'week' | 'month'>('day');
  const weeklyChartScrollRef = useRef<HTMLDivElement>(null);
  const maxWeightChartScrollRef = useRef<HTMLDivElement>(null);
  const volumeChartScrollRef = useRef<HTMLDivElement>(null);
  const inbodyChartScrollRef = useRef<HTMLDivElement>(null);

  const FUTURE_SLOTS = 5;
  const SLOT_WIDTH = 220;
  const Y_AXIS_WIDTH = 50;

  // 운동 횟수: 주간(최근 8주) 또는 월간(최근 6개월) + 미래 빈 슬롯
  const exerciseCountDataRaw = exerciseCountPeriod === 'week'
    ? Array.from({ length: 8 }, (_, i) => {
        const weekStart = startOfWeek(subWeeks(new Date(), 7 - i), { locale: ko });
        const weekEnd = endOfWeek(subWeeks(new Date(), 7 - i), { locale: ko });
        const uniqueDays = new Set(
          workoutSessions
            .filter((session) => {
              const sessionDate = parseISO(session.date);
              return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
            })
            .map((session) => session.date.split('T')[0])
        );
        return {
          period: formatWeekLabel(weekStart),
          count: uniqueDays.size,
        };
      })
    : Array.from({ length: 6 }, (_, i) => {
        const monthStart = startOfMonth(subMonths(new Date(), 5 - i));
        const monthEnd = endOfMonth(subMonths(new Date(), 5 - i));
        const uniqueDays = new Set(
          workoutSessions
            .filter((session) => {
              const sessionDate = parseISO(session.date);
              return isWithinInterval(sessionDate, { start: monthStart, end: monthEnd });
            })
            .map((session) => session.date.split('T')[0])
        );
        return {
          period: formatMonthLabel(monthStart),
          count: uniqueDays.size,
        };
      });
  const exerciseCountData = [
    ...exerciseCountDataRaw,
    ...Array.from({ length: FUTURE_SLOTS }, (_, i) =>
      exerciseCountPeriod === 'week'
        ? { period: formatWeekLabel(addWeeks(new Date(), i + 1)), count: null as number | null }
        : { period: formatMonthLabel(addMonths(new Date(), i + 1)), count: null as number | null }
    ),
  ];

  // 운동별 볼륨 그래프 (일별/주별/월별)
  const exerciseVolumesByPeriod = calculateExerciseVolumesByPeriod(workoutSessions, volumePeriod);
  const volumeExerciseNames =
    exerciseVolumesByPeriod.length > 0
      ? Object.keys(exerciseVolumesByPeriod[0]).filter((key) => key !== 'periodLabel')
      : [];
  const volumeChartDataByBodyPart = calculateVolumeByBodyPartByPeriod(workoutSessions, exercises, ['가슴', '등', '하체', '어깨'], volumePeriod);
  const isVolumeAll = selectedVolumeFilter === 'all';
  const volumeChartDataCentered = getVolumeChartDataCenteredOnToday(volumePeriod);
  const volumeRawByLabel = new Map<string, Record<string, number>>();
  if (isVolumeAll) {
    exerciseVolumesByPeriod.forEach((row) => {
      const key = row.periodLabel;
      volumeRawByLabel.set(key, { ...row } as Record<string, number>);
    });
  } else {
    volumeChartDataByBodyPart.forEach((row) => {
      const v = row[selectedVolumeFilter];
      volumeRawByLabel.set(row.periodLabel, { volume: typeof v === 'number' ? v : 0 });
    });
  }
  const volumePastSlots = volumePeriod === 'day' ? 7 : 4;
  const volumeFutureStartIndex = volumePastSlots + 1;
  const volumeChartData = volumeChartDataCentered.map((row, i) => {
    const isFuture = i >= volumeFutureStartIndex;
    const raw = volumeRawByLabel.get(row.periodLabel);
    if (isVolumeAll) {
      const base = Object.fromEntries(
        volumeExerciseNames.map((n) => [n, raw ? (raw[n] ?? 0) : (isFuture ? null : 0) as number | null])
      );
      return { periodLabel: row.periodLabel, ...base } as Record<string, string | number | null>;
    }
    return {
      periodLabel: row.periodLabel,
      volume: raw ? raw.volume : (isFuture ? null : 0),
    } as Record<string, string | number | null>;
  });

  // 운동 부위별 볼륨 비율 (가슴, 등, 하체, 어깨) - 주간/월간/총
  const targetBodyParts: BodyPart[] = ['가슴', '등', '하체', '어깨'];
  const bodyPartVolumeData = getBodyPartRatioData(workoutSessions, exercises, targetBodyParts, bodyPartRatioPeriod);
  const bodyPartColors: Record<string, string> = {
    가슴: '#ef4444',
    등: '#3b82f6',
    하체: '#10b981',
    어깨: '#f59e0b',
  };

  // PR 기록 (스쿼트, 벤치프레스, 데드리프트만)
  const bigThreeExercises = ['스쿼트', '벤치프레스', '데드리프트'];
  const estimated1RMs = getEstimatedPRs(workoutSessions, bigThreeExercises);
  const estimatedPRChartData = estimated1RMs
    .filter((e) => e.value > 0)
    .map((e) => ({ name: e.exerciseName, value: Math.round(e.value) }));
  const totalEstimatedPR = estimated1RMs.reduce((sum, e) => sum + e.value, 0);
  const PR_COLORS = ['#60a5fa', '#a855f7', '#86efac'];
  
  // PR 기록 날짜 목록 (선택용)
  const prDateOptions = getPRDateOptions(personalRecords, bigThreeExercises);
  const effectivePRDate = selectedPRDate || prDateOptions[0] || '';
  const prRecordData = getPRAsOfDate(personalRecords, bigThreeExercises, effectivePRDate);
  const prChartDataForPie = prRecordData
    .filter((e) => e.value > 0)
    .map((e) => ({ name: e.exerciseName, value: e.value }));
  const totalPRWeight = prRecordData.reduce((sum, e) => sum + e.value, 0);

  useEffect(() => {
    if (prDateOptions.length > 0 && (!selectedPRDate || !prDateOptions.includes(selectedPRDate))) {
      setSelectedPRDate(prDateOptions[0]);
    }
  }, [prDateOptions.join(',')]);

  // 최고 중량 변화
  const { histories: maxWeightHistories, defaultExercise } = getMaxWeightHistories(workoutSessions);
  const maxWeightExerciseNames = Object.keys(maxWeightHistories);
  const bodyParts: (BodyPart | 'all')[] = ['all', '가슴', '등', '어깨', '하체', '팔'];
  const exerciseNameToBodyPart = (name: string): BodyPart | undefined =>
    exercises.find((e) => e.name === name)?.bodyPart;
  const maxWeightExerciseNamesFiltered =
    selectedMaxBodyPart === 'all'
      ? maxWeightExerciseNames
      : maxWeightExerciseNames.filter((name) => exerciseNameToBodyPart(name) === selectedMaxBodyPart);

  // selectedMaxExercise가 비어있거나 필터에 없으면 기본값으로 설정
  const effectiveMaxExercise =
    selectedMaxExercise && maxWeightExerciseNamesFiltered.includes(selectedMaxExercise)
      ? selectedMaxExercise
      : maxWeightExerciseNamesFiltered.includes(defaultExercise)
        ? defaultExercise
        : maxWeightExerciseNamesFiltered[0] || '';
  const rawMaxWeightHistory = effectiveMaxExercise
    ? maxWeightHistories[effectiveMaxExercise] || []
    : [];
  const maxWeightHistoryRaw = aggregateMaxWeightByPeriod(rawMaxWeightHistory, maxWeightPeriod);
  const maxWeightHistoryLabels = getMaxWeightHistoryDataOnly(maxWeightPeriod, maxWeightHistoryRaw);
  const rawMap = new Map(
    maxWeightHistoryRaw.map((e) => [e.date, e.maxWeight])
  );
  const todayLabel =
    maxWeightPeriod === 'day'
      ? format(new Date(), 'MM/dd', { locale: ko })
      : maxWeightPeriod === 'week'
      ? formatWeekLabel(startOfWeek(new Date(), { locale: ko }))
      : formatMonthLabel(new Date());
  const maxWeightHistory = maxWeightHistoryLabels.map((date, i) => {
    const isFutureSlot = i === maxWeightHistoryLabels.length - 1;
    const rawVal = rawMap.get(date);
    const value = rawVal !== undefined ? rawVal : (isFutureSlot ? null : 0);
    return { date, maxWeight: value } as { date: string; maxWeight: number | null };
  });
  const maxWeightTodayIndex = maxWeightHistoryLabels.indexOf(todayLabel);

  const inbodyChartDataRaw = aggregateInbodyByPeriod(inbodyRecords, inbodyPeriod);
  const inbodyChartDataLabels = getInbodyChartDataOnly(inbodyPeriod, inbodyChartDataRaw);
  const inbodyRawMap = new Map(
    inbodyChartDataRaw.map((e) => [e.date, { 체중: e.체중, 근육량: e.근육량, 체지방량: e.체지방량, 점수: e.점수 }])
  );
  const inbodyTodayLabel =
    inbodyPeriod === 'day'
      ? format(new Date(), 'MM/dd', { locale: ko })
      : inbodyPeriod === 'week'
      ? formatWeekLabel(startOfWeek(new Date(), { locale: ko }))
      : formatMonthLabel(new Date());
  const inbodyChartData = inbodyChartDataLabels.map((date, i) => {
    const isFutureSlot = i === inbodyChartDataLabels.length - 1;
    const raw = inbodyRawMap.get(date);
    return {
      date,
      체중: raw ? raw.체중 : (isFutureSlot ? null : 0) as number | null,
      근육량: raw ? raw.근육량 : (isFutureSlot ? null : 0) as number | null,
      체지방량: raw ? raw.체지방량 : (isFutureSlot ? null : 0) as number | null,
      점수: raw ? raw.점수 : (isFutureSlot ? null : 0) as number | null,
    };
  });
  const inbodyTodayIndex = inbodyChartDataLabels.indexOf(inbodyTodayLabel);
  
  // 초기값 설정 (한 번만 실행)
  useEffect(() => {
    if (!selectedMaxExercise && effectiveMaxExercise) {
      setSelectedMaxExercise(effectiveMaxExercise);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMaxExercise]);

  // 운동부위 필터 변경 시, 현재 선택 운동이 필터 결과에 없으면 선택 초기화
  useEffect(() => {
    if (selectedMaxExercise && !maxWeightExerciseNamesFiltered.includes(selectedMaxExercise)) {
      setSelectedMaxExercise('');
    }
  }, [selectedMaxBodyPart, maxWeightExerciseNamesFiltered.join(',')]);

  // 운동별 볼륨 탭 선택 시: 운동별 볼륨을 기본 표시
  useEffect(() => {
    if (selectedGraph === 'volume') {
      setActiveVolumeCard('volume');
    }
  }, [selectedGraph]);

  // 그래프 스크롤: 오늘/최근 데이터를 중앙에 배치
  useEffect(() => {
    const scrollToCenterLastReal = (
      ref: React.RefObject<HTMLDivElement | null>,
      realCount: number
    ) => {
      if (ref?.current && realCount > 0) {
        const el = ref.current;
        requestAnimationFrame(() => {
          const target = SLOT_WIDTH * (realCount - 0.5) - el.clientWidth / 2;
          el.scrollLeft = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, target));
        });
      }
    };
    if (selectedGraph === 'weekly')
      scrollToCenterLastReal(weeklyChartScrollRef, exerciseCountDataRaw.length);
    if (selectedGraph === 'maxWeight') {
      const centerIdx = maxWeightTodayIndex >= 0 ? maxWeightTodayIndex + 1 : Math.ceil(maxWeightHistory.length / 2);
      scrollToCenterLastReal(maxWeightChartScrollRef, centerIdx);
    }
    if (selectedGraph === 'volume' && volumeChartData.length > 0) {
      const centerIdx = volumeFutureStartIndex;
      scrollToCenterLastReal(volumeChartScrollRef, centerIdx);
    }
    if (selectedGraph === 'inbody' && activeInbodyCard === 'graph' && inbodyChartData.length > 0) {
      const centerIdx = inbodyTodayIndex >= 0 ? inbodyTodayIndex + 1 : Math.ceil(inbodyChartData.length / 2);
      scrollToCenterLastReal(inbodyChartScrollRef, centerIdx);
    }
  }, [
    selectedGraph,
    activeInbodyCard,
    exerciseCountDataRaw.length,
    maxWeightTodayIndex,
    maxWeightHistory.length,
    maxWeightPeriod,
    volumeChartData.length,
    volumeFutureStartIndex,
    volumePeriod,
    inbodyChartData.length,
    inbodyTodayIndex,
    inbodyPeriod,
  ]);

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

  // 그래프 목록 정의
  const graphTabs = [
    { id: 'weekly' as GraphType, label: '운동 횟수', icon: Activity, available: true },
    { id: 'pr' as GraphType, label: 'PR 기록', icon: Award, available: true },
    { id: 'maxWeight' as GraphType, label: '중량 변화', icon: TrendingUp, available: true },
    { id: 'volume' as GraphType, label: '운동별 볼륨', icon: BarChart3, available: exerciseVolumesByPeriod.length > 0 },
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

      {/* 운동 횟수 */}
      {selectedGraph === 'weekly' && (
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Activity size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            운동 횟수
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setExerciseCountPeriod('week')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all ${
                exerciseCountPeriod === 'week'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Activity size={18} />
              주간 운동횟수
            </button>
            <button
              onClick={() => setExerciseCountPeriod('month')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all ${
                exerciseCountPeriod === 'month'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Activity size={18} />
              월간 운동횟수
            </button>
          </div>
        </div>
        <div className="flex">
          <div className="flex-shrink-0 bg-white dark:bg-gray-850 rounded-l-lg" style={{ width: Y_AXIS_WIDTH, height: 400 }}>
            <ResponsiveContainer width={Y_AXIS_WIDTH} height={400}>
              <BarChart data={exerciseCountData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <YAxis domain={exerciseCountPeriod === 'week' ? [0, 7] : [0, 31]} width={Y_AXIS_WIDTH - 5} tick={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="transparent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div
            ref={weeklyChartScrollRef}
            className="overflow-x-auto overflow-y-hidden scrollbar-hide flex-1 min-w-0"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
          >
            <div style={{ minWidth: Math.max(800, SLOT_WIDTH * exerciseCountData.length), height: 400 }}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={exerciseCountData} 
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  barCategoryGap="20%"
                  barGap={20}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis width={0} hide domain={exerciseCountPeriod === 'week' ? [0, 7] : [0, 31]} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={126}>
                    <LabelList dataKey="count" position="top" formatter={(v: number | null) => v == null ? '' : v} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          {exerciseCountPeriod === 'week' ? '주 단위' : '월 단위'} · 왼쪽 스크롤: 과거 · 오른쪽 스크롤: 최근
        </p>
      </div>
      )}

      {/* PR 기록 / PR 예상기록 */}
      {selectedGraph === 'pr' && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActivePRCard('record')}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all ${
                  activePRCard === 'record'
                    ? 'bg-yellow-500 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Award size={18} />
                PR 기록
              </button>
              <button
                onClick={() => setActivePRCard('predicted')}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all ${
                  activePRCard === 'predicted'
                    ? 'bg-yellow-500 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <TrendingUp size={18} />
                PR 예상기록
              </button>
            </div>
            {activePRCard === 'record' && prDateOptions.length > 0 && (
              <select
                value={effectivePRDate}
                onChange={(e) => setSelectedPRDate(e.target.value)}
                className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-center"
              >
                {prDateOptions.map((d) => (
                  <option key={d} value={d}>
                    {format(parseISO(d), 'yyyy년 MM월 dd일', { locale: ko })}
                  </option>
                ))}
              </select>
            )}
          </div>
          {activePRCard === 'record' && (
          <>
          {prChartDataForPie.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 col-span-2 flex items-center gap-4" style={{ height: '275px' }}>
                <div className="flex flex-col gap-3 flex-shrink-0">
                  {prChartDataForPie.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PR_COLORS[index % PR_COLORS.length] }}
                      />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {entry.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={prChartDataForPie}
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
                        {prChartDataForPie.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PR_COLORS[index % PR_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center" style={{ height: '275px' }}>
                <div className="text-center w-full">
                  <div className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">3대</div>
                  <div className="text-6xl font-bold bg-gradient-to-br from-yellow-500 to-orange-500 bg-clip-text text-transparent leading-tight">
                    {totalPRWeight.toLocaleString()}kg
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 col-span-2 flex items-center justify-center" style={{ height: '275px' }}>
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Award size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">PR 기록이 없습니다</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center" style={{ height: '275px' }}>
                <div className="text-center w-full">
                  <div className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">3대</div>
                  <div className="text-6xl font-bold bg-gradient-to-br from-yellow-500 to-orange-500 bg-clip-text text-transparent leading-tight">
                    0kg
                  </div>
                </div>
              </div>
            </div>
          )}
          </>
          )}

          {activePRCard === 'predicted' && (
          <>
          {estimatedPRChartData.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 col-span-2 flex items-center gap-4" style={{ height: '275px' }}>
                <div className="flex flex-col gap-3 flex-shrink-0">
                  {estimatedPRChartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PR_COLORS[index % PR_COLORS.length] }}
                      />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {entry.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={estimatedPRChartData}
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
                        {estimatedPRChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PR_COLORS[index % PR_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`예상 ${value}kg`, '1RM']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center" style={{ height: '275px' }}>
                <div className="text-center w-full">
                  <div className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">예상 3대</div>
                  <div className="text-6xl font-bold bg-gradient-to-br from-yellow-500 to-orange-500 bg-clip-text text-transparent leading-tight">
                    {Math.round(totalEstimatedPR).toLocaleString()}kg
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">운동 기록 기반 1RM 추정</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 col-span-2 flex items-center justify-center" style={{ height: '275px' }}>
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">PR 예상기록이 없습니다</p>
                  <p className="text-xs mt-1">빅3 운동 기록을 추가하면 예상 1RM을 계산합니다</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-center items-center" style={{ height: '275px' }}>
                <div className="text-center w-full">
                  <div className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">예상 3대</div>
                  <div className="text-6xl font-bold bg-gradient-to-br from-yellow-500 to-orange-500 bg-clip-text text-transparent leading-tight">
                    0kg
                  </div>
                </div>
              </div>
            </div>
          )}
          </>
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
            <div className="flex flex-wrap items-center gap-2 mr-[30px]">
                <select
                  value={maxWeightPeriod}
                  onChange={(e) => setMaxWeightPeriod(e.target.value as 'day' | 'week' | 'month')}
                  className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-center"
                >
                  <option value="day">일별</option>
                  <option value="week">주별</option>
                  <option value="month">월별</option>
                </select>
                <select
                  value={selectedMaxBodyPart}
                  onChange={(e) => setSelectedMaxBodyPart(e.target.value as BodyPart | 'all')}
                  className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-center"
                >
                  <option value="all">전체 부위</option>
                  {bodyParts.filter((bp) => bp !== 'all').map((bp) => (
                    <option key={bp} value={bp}>
                      {bp}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedMaxExercise || effectiveMaxExercise || (maxWeightExerciseNamesFiltered.length === 0 ? '_none' : '')}
                  onChange={(e) => e.target.value !== '_none' && setSelectedMaxExercise(e.target.value)}
                  className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-center"
                >
                  {maxWeightExerciseNamesFiltered.length === 0 ? (
                    <option value="_none">해당 부위 기록 없음</option>
                  ) : (
                    maxWeightExerciseNamesFiltered.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))
                  )}
                </select>
              </div>
          </div>
          <>
              <div className="flex">
                <div className="flex-shrink-0 bg-white dark:bg-gray-850 rounded-l-lg" style={{ width: Y_AXIS_WIDTH, height: 400 }}>
                  <ResponsiveContainer width={Y_AXIS_WIDTH} height={400}>
                    <LineChart data={maxWeightHistory} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                      <YAxis width={Y_AXIS_WIDTH - 5} tick={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="maxWeight" stroke="transparent" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div
                  ref={maxWeightChartScrollRef}
                  className="overflow-x-auto overflow-y-hidden scrollbar-hide flex-1 min-w-0"
                  style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
                >
                  <div style={{ minWidth: Math.max(800, SLOT_WIDTH * maxWeightHistory.length), height: 400 }}>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart
                        data={maxWeightHistory}
                        margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis width={0} hide />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="maxWeight"
                          name="최고 중량"
                          stroke="#10b981"
                          strokeWidth={2}
                          connectNulls={false}
                          dot={{ fill: '#10b981' }}
                        >
                          <LabelList dataKey="maxWeight" position="top" formatter={(v: number | null) => v == null ? '' : v} />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">왼쪽 스크롤: 과거 · 오른쪽 스크롤: 최근</p>
            </>
        </div>
      )}

      {/* 운동별 볼륨 / 운동 부위 비율 */}
      {selectedGraph === 'volume' && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveVolumeCard('volume')}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all ${
                  activeVolumeCard === 'volume'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <BarChart3 size={18} />
                운동별 볼륨
              </button>
              <button
                onClick={() => setActiveVolumeCard('bodyPart')}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all ${
                  activeVolumeCard === 'bodyPart'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <BarChart3 size={18} />
                운동 부위 비율
              </button>
            </div>
            <div className="flex items-center gap-2">
            {activeVolumeCard === 'volume' && (
              <>
                <select
                  value={volumePeriod}
                  onChange={(e) => setVolumePeriod(e.target.value as 'day' | 'week' | 'month')}
                  className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-center"
                >
                  <option value="day">일별</option>
                  <option value="week">주별</option>
                  <option value="month">월별</option>
                </select>
                <select
                  value={selectedVolumeFilter}
                  onChange={(e) => setSelectedVolumeFilter(e.target.value as 'all' | BodyPart)}
                  className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-center"
                >
                  <option value="all">전체 (상위 5개 운동)</option>
                  <option value="가슴">가슴</option>
                  <option value="등">등</option>
                  <option value="하체">하체</option>
                  <option value="어깨">어깨</option>
                </select>
              </>
            )}
            {activeVolumeCard === 'bodyPart' && (
              <select
                value={bodyPartRatioPeriod}
                onChange={(e) => setBodyPartRatioPeriod(e.target.value as 'week' | 'month' | 'total')}
                className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-center"
              >
                <option value="week">주간 비율</option>
                <option value="month">월간 비율</option>
                <option value="total">총 비율</option>
              </select>
            )}
            </div>
          </div>
          {activeVolumeCard === 'volume' && (
          <>
          {exerciseVolumesByPeriod.length > 0 || volumeChartData.length > 0 ? (
          <>
          <div className="flex">
            <div className="flex-shrink-0 bg-white dark:bg-gray-850 rounded-l-lg" style={{ width: Y_AXIS_WIDTH, height: 400 }}>
              <ResponsiveContainer width={Y_AXIS_WIDTH} height={400}>
                <LineChart data={volumeChartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                  <YAxis width={Y_AXIS_WIDTH - 5} tick={{ fontSize: 12 }} />
                  {isVolumeAll
                    ? volumeExerciseNames.map((key) => <Line key={key} type="monotone" dataKey={key} stroke="transparent" />)
                    : <Line type="monotone" dataKey="volume" stroke="transparent" />}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div
              ref={volumeChartScrollRef}
              className="overflow-x-auto overflow-y-hidden scrollbar-hide flex-1 min-w-0"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
            >
              <div style={{ minWidth: Math.max(800, SLOT_WIDTH * volumeChartData.length), height: 400 }}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={volumeChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="periodLabel" />
                    <YAxis width={0} hide />
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
                          connectNulls={false}
                        >
                          <LabelList dataKey={exerciseName} position="top" formatter={(v: number | null) => v == null ? '' : v} />
                        </Line>
                      ))
                    : (
                      <Line
                        type="monotone"
                        dataKey="volume"
                        name={(selectedVolumeFilter as string) === 'all' ? '볼륨' : selectedVolumeFilter}
                        stroke="#3b82f6"
                        strokeWidth={2}
                        connectNulls={false}
                      >
                        <LabelList dataKey="volume" position="top" formatter={(v: number | null) => v == null ? '' : v} />
                      </Line>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">왼쪽 스크롤: 과거 주차 · 오른쪽 스크롤: 최근 주차</p>
          </>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>운동별 볼륨 데이터가 없습니다.</p>
            </div>
          )}
          </>
          )}

          {activeVolumeCard === 'bodyPart' && (
          <>
          {bodyPartVolumeData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-1/2 sm:pl-8" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={bodyPartVolumeData}
                      cx="55%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {bodyPartVolumeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={bodyPartColors[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _name: string, props: { payload?: BodyPartRatioEntry }) => {
                        const p = props.payload;
                        return bodyPartRatioPeriod === 'total' && p?.rawVolume != null
                          ? [`${p.rawVolume.toLocaleString()} kg (${value.toFixed(1)}%)`, '볼륨']
                          : [`${Number(value).toFixed(1)}%`, '비율'];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 flex flex-col gap-3">
                {bodyPartVolumeData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: bodyPartColors[entry.name] || '#94a3b8' }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {entry.name}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {bodyPartRatioPeriod === 'total' && entry.rawVolume != null
                        ? `${entry.rawVolume.toLocaleString()} kg (${entry.value.toFixed(1)}%)`
                        : `평균 ${entry.value.toFixed(1)}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>가슴, 등, 하체, 어깨 부위의 운동 기록이 없습니다.</p>
              <p className="text-sm mt-2">운동을 기록하면 부위별 비율이 표시됩니다.</p>
            </div>
          )}
          </>
          )}
        </div>
      )}

      {/* 인바디 변화 / 인바디 기록 목록 */}
      {selectedGraph === 'inbody' && (
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 mx-auto max-w-4xl">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveInbodyCard('graph')}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all ${
                  activeInbodyCard === 'graph'
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <Activity size={18} />
                인바디 변화
              </button>
              <button
                onClick={() => setActiveInbodyCard('list')}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all ${
                  activeInbodyCard === 'list'
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <List size={18} />
                인바디 기록 목록
              </button>
            </div>
            <div className="flex items-center gap-2">
            {activeInbodyCard === 'graph' && inbodyRecords.length > 0 && (
              <>
                <select
                  value={inbodyPeriod}
                  onChange={(e) => setInbodyPeriod(e.target.value as 'day' | 'week' | 'month')}
                  className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-center"
                >
                  <option value="day">일별</option>
                  <option value="week">주별</option>
                  <option value="month">월별</option>
                </select>
                <select
                  value={selectedInbodyMetric}
                  onChange={(e) => setSelectedInbodyMetric(e.target.value as '체중' | '근육량' | '체지방량' | '점수')}
                  className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-center"
                >
                  <option value="체중">체중</option>
                  <option value="근육량">근육량</option>
                  <option value="체지방량">체지방량</option>
                  <option value="점수">점수</option>
                </select>
              </>
            )}
            {activeInbodyCard === 'list' && inbodyRecords.length > 0 && selectedInbodyDate && (
              <select
                value={selectedInbodyDate}
                onChange={(e) => setSelectedInbodyDate(e.target.value)}
                className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium text-center"
              >
                {Array.from(new Set(inbodyRecords.map(r => r.date.split('T')[0])))
                  .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                  .slice(0, 7)
                  .map((dateStr) => (
                    <option key={dateStr} value={dateStr}>
                      {format(parseISO(dateStr), 'yyyy년 MM월 dd일', { locale: ko })}
                    </option>
                  ))}
              </select>
            )}
            </div>
          </div>
          {activeInbodyCard === 'graph' && (
            <>
              {inbodyRecords.length > 0 ? (
                <>
                  <div className="flex">
                    <div className="flex-shrink-0 bg-white dark:bg-gray-850 rounded-l-lg" style={{ width: Y_AXIS_WIDTH, height: 400 }}>
                      <ResponsiveContainer width={Y_AXIS_WIDTH} height={400}>
                        <LineChart data={inbodyChartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                          <YAxis width={Y_AXIS_WIDTH - 5} tick={{ fontSize: 12 }} />
                          <Line type="monotone" dataKey={selectedInbodyMetric} stroke="transparent" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div
                      ref={inbodyChartScrollRef}
                      className="overflow-x-auto overflow-y-hidden scrollbar-hide flex-1 min-w-0"
                      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
                    >
                      <div style={{ minWidth: Math.max(800, SLOT_WIDTH * inbodyChartData.length), height: 400 }}>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={inbodyChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis width={0} hide />
                          <Tooltip />
                          <Legend align="center" />
                          {selectedInbodyMetric === '체중' && (
                            <Line
                              type="monotone"
                              dataKey="체중"
                              name="체중"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              connectNulls={false}
                            >
                              <LabelList dataKey="체중" position="top" formatter={(v: number | null) => v == null ? '' : v} />
                            </Line>
                          )}
                          {selectedInbodyMetric === '근육량' && (
                            <Line
                              type="monotone"
                              dataKey="근육량"
                              name="근육량"
                              stroke="#10b981"
                              strokeWidth={2}
                              connectNulls={false}
                            >
                              <LabelList dataKey="근육량" position="top" formatter={(v: number | null) => v == null ? '' : v} />
                            </Line>
                          )}
                          {selectedInbodyMetric === '체지방량' && (
                            <Line
                              type="monotone"
                              dataKey="체지방량"
                              name="체지방량"
                              stroke="#ef4444"
                              strokeWidth={2}
                              connectNulls={false}
                            >
                              <LabelList dataKey="체지방량" position="top" formatter={(v: number | null) => v == null ? '' : v} />
                            </Line>
                          )}
                          {selectedInbodyMetric === '점수' && (
                            <Line
                              type="monotone"
                              dataKey="점수"
                              name="점수"
                              stroke="#a855f7"
                              strokeWidth={2}
                              connectNulls={false}
                            >
                              <LabelList dataKey="점수" position="top" formatter={(v: number | null) => v == null ? '' : v} />
                            </Line>
                          )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">왼쪽 스크롤: 과거 · 오른쪽 스크롤: 최근</p>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Activity size={48} className="mx-auto mb-4 opacity-50" />
                  <p>기록이 없습니다.</p>
                </div>
              )}
            </>
          )}
          {activeInbodyCard === 'list' && (
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

/** Epley 공식: 1RM = weight × (1 + reps/30) */
function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function getEstimatedPRs(
  sessions: { exercises: { exerciseName: string; sets: { weight: number; reps: number }[] }[] }[],
  exerciseNames: string[]
): { exerciseName: string; value: number }[] {
  const maxEstimated: Record<string, number> = {};
  exerciseNames.forEach((name) => { maxEstimated[name] = 0; });

  sessions.forEach((session) => {
    session.exercises.forEach((ex) => {
      if (!exerciseNames.includes(ex.exerciseName)) return;
      ex.sets.forEach((set) => {
        const est = estimate1RM(set.weight, set.reps);
        if (est > (maxEstimated[ex.exerciseName] ?? 0)) {
          maxEstimated[ex.exerciseName] = est;
        }
      });
    });
  });

  return exerciseNames.map((name) => ({
    exerciseName: name,
    value: maxEstimated[name] ?? 0,
  }));
}

function formatMonthLabel(date: Date) {
  return format(date, 'yyyy년 M월', { locale: ko });
}

type BodyPartRatioEntry = { name: string; value: number; rawVolume?: number };

function getVolumeByPart(
  sessions: { exercises: { exerciseName: string; sets: { weight: number; reps: number }[] }[] }[],
  exercises: { name: string; bodyPart: BodyPart }[],
  targetBodyParts: BodyPart[]
): Record<string, number> {
  const volumeByPart: Record<string, number> = {};
  targetBodyParts.forEach((bp) => { volumeByPart[bp] = 0; });

  sessions.forEach((session) => {
    session.exercises.forEach((ex) => {
      const exercise = exercises.find((e) => e.name === ex.exerciseName);
      const bodyPart = exercise?.bodyPart;
      if (!bodyPart || !targetBodyParts.includes(bodyPart)) return;

      const volume = ex.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      volumeByPart[bodyPart] = (volumeByPart[bodyPart] || 0) + volume;
    });
  });

  return volumeByPart;
}

function getBodyPartRatioData(
  workoutSessions: { date: string; exercises: { exerciseName: string; sets: { weight: number; reps: number }[] }[] }[],
  exercises: { name: string; bodyPart: BodyPart }[],
  targetBodyParts: BodyPart[],
  period: 'week' | 'month' | 'total'
): BodyPartRatioEntry[] {
  if (workoutSessions.length === 0) return [];

  if (period === 'total') {
    const volumeByPart = getVolumeByPart(workoutSessions, exercises, targetBodyParts);
    const total = targetBodyParts.reduce((sum, bp) => sum + (volumeByPart[bp] || 0), 0);
    if (total === 0) return [];

    return targetBodyParts
      .filter((bp) => (volumeByPart[bp] || 0) > 0)
      .map((bp) => ({
        name: bp,
        value: ((volumeByPart[bp] || 0) / total) * 100,
        rawVolume: volumeByPart[bp] || 0,
      }))
      .sort((a, b) => b.value - a.value);
  }

  // 주간 또는 월간: 각 주/월별 비율을 구한 뒤 평균
  const ratioSums: Record<string, number> = {};
  let periodCount = 0;

  if (period === 'week') {
    const weekMap = new Map<string, typeof workoutSessions>();
    workoutSessions.forEach((session) => {
      const sessionDate = parseISO(session.date);
      const weekStart = startOfWeek(sessionDate, { locale: ko });
      const key = weekStart.toISOString();
      if (!weekMap.has(key)) weekMap.set(key, []);
      weekMap.get(key)!.push(session);
    });

    weekMap.forEach((sessions) => {
      const volumeByPart = getVolumeByPart(sessions, exercises, targetBodyParts);
      const total = targetBodyParts.reduce((sum, bp) => sum + (volumeByPart[bp] || 0), 0);
      if (total === 0) return;

      periodCount += 1;
      targetBodyParts.forEach((bp) => {
        const pct = ((volumeByPart[bp] || 0) / total) * 100;
        ratioSums[bp] = (ratioSums[bp] || 0) + pct;
      });
    });
  } else {
    const monthMap = new Map<string, typeof workoutSessions>();
    workoutSessions.forEach((session) => {
      const sessionDate = parseISO(session.date);
      const monthStart = startOfMonth(sessionDate);
      const key = monthStart.toISOString();
      if (!monthMap.has(key)) monthMap.set(key, []);
      monthMap.get(key)!.push(session);
    });

    monthMap.forEach((sessions) => {
      const volumeByPart = getVolumeByPart(sessions, exercises, targetBodyParts);
      const total = targetBodyParts.reduce((sum, bp) => sum + (volumeByPart[bp] || 0), 0);
      if (total === 0) return;

      periodCount += 1;
      targetBodyParts.forEach((bp) => {
        const pct = ((volumeByPart[bp] || 0) / total) * 100;
        ratioSums[bp] = (ratioSums[bp] || 0) + pct;
      });
    });
  }

  if (periodCount === 0) return [];

  return targetBodyParts
    .filter((bp) => (ratioSums[bp] || 0) > 0)
    .map((bp) => ({
      name: bp,
      value: (ratioSums[bp] || 0) / periodCount,
    }))
    .sort((a, b) => b.value - a.value);
}

/** 운동별 볼륨: 일별/주별/월별 */
function calculateExerciseVolumesByPeriod(
  workoutSessions: { date: string; exercises: { exerciseName: string; sets: { weight: number; reps: number }[] }[] }[],
  period: 'day' | 'week' | 'month'
): { periodLabel: string; [key: string]: string | number }[] {
  const exerciseMap = new Map<string, Map<string, number>>();
  const getPeriods = () => {
    const PAST = period === 'day' ? 7 : 4;
    const FUTURE = 5;
    const now = new Date();
    if (period === 'day') {
      return Array.from({ length: PAST + 1 + FUTURE }, (_, i) => {
        const d = addDays(now, i - PAST);
        return format(d, 'MM/dd', { locale: ko });
      });
    }
    if (period === 'week') {
      return Array.from({ length: PAST + 1 + FUTURE }, (_, i) => {
        const d = addWeeks(now, i - PAST);
        return formatWeekLabel(startOfWeek(d, { locale: ko }));
      });
    }
    return Array.from({ length: PAST + 1 + FUTURE }, (_, i) => {
      const d = addMonths(now, i - PAST);
      return formatMonthLabel(d);
    });
  };
  const periods = getPeriods();

  const getKey = (d: Date) =>
    period === 'day'
      ? format(d, 'MM/dd', { locale: ko })
      : period === 'week'
      ? formatWeekLabel(startOfWeek(d, { locale: ko }))
      : formatMonthLabel(d);

  workoutSessions.forEach((session) => {
    const sessionDate = parseISO(session.date);
    const key = getKey(sessionDate);
    if (!periods.includes(key)) return;

    session.exercises.forEach((exercise: any) => {
      const volume = exercise.sets.reduce((sum: number, set: any) => sum + set.weight * set.reps, 0);
      if (!exerciseMap.has(exercise.exerciseName)) {
        exerciseMap.set(exercise.exerciseName, new Map());
      }
      const periodMap = exerciseMap.get(exercise.exerciseName)!;
      periodMap.set(key, (periodMap.get(key) || 0) + volume);
    });
  });

  const topExercises = Array.from(exerciseMap.entries())
    .map(([name, pm]) => ({ name, total: Array.from(pm.values()).reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((e) => e.name);

  return periods.map((periodLabel) => {
    const row: { periodLabel: string; [key: string]: string | number } = { periodLabel };
    topExercises.forEach((n) => {
      row[n] = exerciseMap.get(n)?.get(periodLabel) || 0;
    });
    return row;
  });
}

/** 부위별 볼륨: 일별/주별/월별 */
function calculateVolumeByBodyPartByPeriod(
  workoutSessions: { date: string; exercises: { exerciseName: string; sets: { weight: number; reps: number }[] }[] }[],
  exercises: { name: string; bodyPart: BodyPart }[],
  targetBodyParts: BodyPart[],
  period: 'day' | 'week' | 'month'
): { periodLabel: string; [key: string]: string | number }[] {
  const exerciseToBodyPart = new Map<string, BodyPart>();
  exercises.forEach((e) => exerciseToBodyPart.set(e.name, e.bodyPart));

  const periods = (() => {
    const PAST = period === 'day' ? 7 : 4;
    const FUTURE = 5;
    const now = new Date();
    if (period === 'day') {
      return Array.from({ length: PAST + 1 + FUTURE }, (_, i) => {
        const d = addDays(now, i - PAST);
        return format(d, 'MM/dd', { locale: ko });
      });
    }
    if (period === 'week') {
      return Array.from({ length: PAST + 1 + FUTURE }, (_, i) => {
        const d = addWeeks(now, i - PAST);
        return formatWeekLabel(startOfWeek(d, { locale: ko }));
      });
    }
    return Array.from({ length: PAST + 1 + FUTURE }, (_, i) => {
      const d = addMonths(now, i - PAST);
      return formatMonthLabel(d);
    });
  })();

  const getKey = (d: Date) =>
    period === 'day'
      ? format(d, 'MM/dd', { locale: ko })
      : period === 'week'
      ? formatWeekLabel(startOfWeek(d, { locale: ko }))
      : formatMonthLabel(d);

  const volumeByPartAndPeriod = new Map<string, Map<string, number>>();
  targetBodyParts.forEach((bp) => volumeByPartAndPeriod.set(bp, new Map()));
  periods.forEach((p) => targetBodyParts.forEach((bp) => volumeByPartAndPeriod.get(bp)!.set(p, 0)));

  workoutSessions.forEach((session) => {
    const sessionDate = parseISO(session.date);
    const key = getKey(sessionDate);
    if (!periods.includes(key)) return;

    session.exercises.forEach((ex) => {
      const bodyPart = exerciseToBodyPart.get(ex.exerciseName);
      if (!bodyPart || !targetBodyParts.includes(bodyPart)) return;
      const volume = ex.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      const partMap = volumeByPartAndPeriod.get(bodyPart)!;
      partMap.set(key, (partMap.get(key) || 0) + volume);
    });
  });

  return periods.map((periodLabel) => {
    const row: { periodLabel: string; [key: string]: string | number } = { periodLabel };
    targetBodyParts.forEach((bp) => {
      row[bp] = volumeByPartAndPeriod.get(bp)?.get(periodLabel) || 0;
    });
    return row;
  });
}

/** 운동별 볼륨 차트용 날짜 축 (오늘 중심) */
function getVolumeChartDataCenteredOnToday(period: 'day' | 'week' | 'month'): { periodLabel: string }[] {
  const PAST = period === 'day' ? 7 : 4;
  const FUTURE = 5;
  const now = new Date();

  if (period === 'day') {
    return Array.from({ length: PAST + 1 + FUTURE }, (_, i) => {
      const d = addDays(now, i - PAST);
      return { periodLabel: format(d, 'MM/dd', { locale: ko }) };
    });
  }
  if (period === 'week') {
    return Array.from({ length: PAST + 1 + FUTURE }, (_, i) => {
      const d = addWeeks(now, i - PAST);
      return { periodLabel: formatWeekLabel(startOfWeek(d, { locale: ko })) };
    });
  }
  return Array.from({ length: PAST + 1 + FUTURE }, (_, i) => {
    const d = addMonths(now, i - PAST);
    return { periodLabel: formatMonthLabel(d) };
  });
}

/** 인바디: 주/월별로 그룹화. 각 기간의 마지막(가장 최근) 기록 사용 */
function aggregateInbodyByPeriod(
  records: { date: string; weight?: number; muscleMass?: number; bodyFat?: number; notes?: string }[],
  period: 'day' | 'week' | 'month'
): { date: string; 체중: number; 근육량: number; 체지방량: number; 점수: number }[] {
  if (records.length === 0) return [];

  const parseRecord = (r: typeof records[0]) => {
    const inbodyScore = r.notes?.includes('인바디점수:')
      ? parseFloat(r.notes.split('인바디점수:')[1]?.split(',')[0]?.trim() || '0')
      : 0;
    return { 체중: r.weight || 0, 근육량: r.muscleMass || 0, 체지방량: r.bodyFat || 0, 점수: inbodyScore };
  };

  if (period === 'day') {
    return records
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((r) => ({
        date: format(parseISO(r.date), 'MM/dd', { locale: ko }),
        ...parseRecord(r),
      }));
  }

  const groupKey = (d: Date) =>
    period === 'week'
      ? format(startOfWeek(d, { locale: ko }), 'yyyy-MM-dd')
      : format(startOfMonth(d), 'yyyy-MM-dd');
  const labelFormat = period === 'week' ? (d: Date) => formatWeekLabel(d) : (d: Date) => formatMonthLabel(d);

  const map = new Map<string, ReturnType<typeof parseRecord>>();
  records
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((r) => {
      const d = parseISO(r.date);
      const key = groupKey(d);
      map.set(key, parseRecord(r));
    });

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key]) => ({
      date: labelFormat(parseISO(key)),
      ...map.get(key)!,
    }));
}

/** 인바디 변화: 데이터 있는 기간만 + 오늘 + 미래 1칸. 맨 왼쪽에 한 칸 전(0값) 추가. 날짜 라벨만 반환 */
function getInbodyChartDataOnly(
  period: 'day' | 'week' | 'month',
  raw: { date: string }[]
): string[] {
  const PAST_SLOTS = period === 'day' ? 7 : 4;
  const now = new Date();
  const fullLabels = (() => {
    if (period === 'day') {
      return Array.from({ length: PAST_SLOTS + 2 }, (_, i) => {
        const d = addDays(now, i - PAST_SLOTS);
        return format(d, 'MM/dd', { locale: ko });
      });
    }
    if (period === 'week') {
      return Array.from({ length: PAST_SLOTS + 2 }, (_, i) => {
        const d = addWeeks(now, i - PAST_SLOTS);
        return formatWeekLabel(startOfWeek(d, { locale: ko }));
      });
    }
    return Array.from({ length: PAST_SLOTS + 2 }, (_, i) => {
      const d = addMonths(now, i - PAST_SLOTS);
      return formatMonthLabel(d);
    });
  })();
  const todayLabel = fullLabels[PAST_SLOTS];
  const futureLabel = fullLabels[PAST_SLOTS + 1];
  const rawDateSet = new Set(raw.map((e) => e.date));
  const pastAndToday = fullLabels.slice(0, PAST_SLOTS + 1);
  const withDataOrToday = pastAndToday.filter((l) => rawDateSet.has(l) || l === todayLabel);
  const firstLabel = withDataOrToday[0];
  const firstIndex = fullLabels.indexOf(firstLabel);
  const onePeriodBeforeLabel =
    firstIndex > 0
      ? fullLabels[firstIndex - 1]
      : period === 'day'
      ? format(addDays(now, -PAST_SLOTS - 1), 'MM/dd', { locale: ko })
      : period === 'week'
      ? formatWeekLabel(startOfWeek(addWeeks(now, -PAST_SLOTS - 1), { locale: ko }))
      : formatMonthLabel(addMonths(now, -PAST_SLOTS - 1));
  return [onePeriodBeforeLabel, ...withDataOrToday, futureLabel];
}

/** 중량 변화: 데이터 있는 날만 + 오늘 + 미래 1칸(오늘 가운데용). 날짜 라벨만 반환 */
function getMaxWeightHistoryDataOnly(
  period: 'day' | 'week' | 'month',
  raw: { date: string; maxWeight: number }[]
): string[] {
  const PAST_SLOTS = period === 'day' ? 7 : 4;
  const now = new Date();
  const fullLabels = (() => {
    if (period === 'day') {
      return Array.from({ length: PAST_SLOTS + 2 }, (_, i) => {
        const d = addDays(now, i - PAST_SLOTS);
        return format(d, 'MM/dd', { locale: ko });
      });
    }
    if (period === 'week') {
      return Array.from({ length: PAST_SLOTS + 2 }, (_, i) => {
        const d = addWeeks(now, i - PAST_SLOTS);
        return formatWeekLabel(startOfWeek(d, { locale: ko }));
      });
    }
    return Array.from({ length: PAST_SLOTS + 2 }, (_, i) => {
      const d = addMonths(now, i - PAST_SLOTS);
      return formatMonthLabel(d);
    });
  })();
  const todayLabel = fullLabels[PAST_SLOTS];
  const futureLabel = fullLabels[PAST_SLOTS + 1];
  const rawDateSet = new Set(raw.map((e) => e.date));
  const pastAndToday = fullLabels.slice(0, PAST_SLOTS + 1);
  const withDataOrToday = pastAndToday.filter((l) => rawDateSet.has(l) || l === todayLabel);
  const firstLabel = withDataOrToday[0];
  const firstIndex = fullLabels.indexOf(firstLabel);
  const onePeriodBeforeLabel =
    firstIndex > 0
      ? fullLabels[firstIndex - 1]
      : period === 'day'
      ? format(addDays(now, -PAST_SLOTS - 1), 'MM/dd', { locale: ko })
      : period === 'week'
      ? formatWeekLabel(startOfWeek(addWeeks(now, -PAST_SLOTS - 1), { locale: ko }))
      : formatMonthLabel(addMonths(now, -PAST_SLOTS - 1));
  return [onePeriodBeforeLabel, ...withDataOrToday, futureLabel];
}

function aggregateMaxWeightByPeriod(
  history: { date: string; maxWeight: number }[],
  period: 'day' | 'week' | 'month'
): { date: string; maxWeight: number }[] {
  if (history.length === 0) return history;

  if (period === 'day') {
    return history.map((entry) => ({
      date: format(parseISO(entry.date), 'MM/dd', { locale: ko }),
      maxWeight: entry.maxWeight,
    }));
  }

  const groupKey = (d: Date) =>
    period === 'week'
      ? format(startOfWeek(d, { locale: ko }), 'yyyy-MM-dd')
      : format(startOfMonth(d), 'yyyy-MM-dd');
  const labelFormat = period === 'week' ? (d: Date) => formatWeekLabel(d) : (d: Date) => formatMonthLabel(d);

  const map = new Map<string, number>();
  history.forEach((entry) => {
    const d = parseISO(entry.date);
    const key = groupKey(d);
    const prev = map.get(key) ?? 0;
    map.set(key, Math.max(prev, entry.maxWeight));
  });

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key]) => ({
      date: labelFormat(parseISO(key)),
      maxWeight: map.get(key)!,
    }));
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
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  return { histories, defaultExercise };
}

function getPRDateOptions(personalRecords: any[], exerciseNames: string[]): string[] {
  const dates = new Set<string>();
  personalRecords
    .filter((pr) => pr.type === 'maxWeight' && exerciseNames.includes(pr.exerciseName))
    .forEach((pr) => dates.add(pr.date.split('T')[0]));
  return Array.from(dates).sort((a, b) => b.localeCompare(a));
}

function getPRAsOfDate(
  personalRecords: any[],
  exerciseNames: string[],
  asOfDate: string
): { exerciseName: string; value: number }[] {
  if (!asOfDate) {
    return exerciseNames.map((name) => ({ exerciseName: name, value: 0 }));
  }
  return exerciseNames.map((name) => {
    const records = personalRecords
      .filter(
        (pr) =>
          pr.type === 'maxWeight' &&
          pr.exerciseName === name &&
          pr.date.split('T')[0] <= asOfDate
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const maxValue = records.length > 0 ? Math.max(...records.map((r) => r.value)) : 0;
    return { exerciseName: name, value: maxValue };
  });
}
