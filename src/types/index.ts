// 운동 부위 타입
export type BodyPart = 
  | '가슴' 
  | '등' 
  | '어깨' 
  | '하체' 
  | '팔' 
  | '복근' 
  | '전신'
  | '기타';

// 운동 정보
export interface Exercise {
  id: string;
  name: string;
  bodyPart: BodyPart;
  isCustom: boolean;
  isFavorite: boolean;
  createdAt: string;
}

// 세트 정보
export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  restTime?: number; // 초 단위
  notes?: string;
}

// 운동 기록
export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  notes?: string;
}

// 운동 세션
export interface WorkoutSession {
  id: string;
  date: string; // ISO date string
  exercises: WorkoutExercise[];
  duration?: number; // 분 단위
  notes?: string;
  routineId?: string; // 루틴에서 시작한 경우
}

// 루틴 운동
export interface RoutineExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps?: number;
  targetWeight?: number;
}

// 루틴
export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  daysOfWeek?: number[]; // 0-6 (일-토)
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

// PR 기록
export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: 'maxWeight' | 'maxVolume' | 'maxReps';
  value: number;
  date: string;
  workoutSessionId: string;
}

// 인바디 기록
export interface InbodyRecord {
  id: string;
  date: string;
  weight?: number;
  muscleMass?: number;
  bodyFat?: number;
  bodyFatPercentage?: number;
  height?: number; // 키 (cm)
  gender?: 'male' | 'female'; // 성별
  notes?: string;
}

// 앱 설정
export interface AppSettings {
  darkMode: boolean;
  lastBackup?: string;
}
