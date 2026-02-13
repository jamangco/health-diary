import { create } from 'zustand';
import {
  Exercise,
  WorkoutSession,
  Routine,
  PersonalRecord,
  InbodyRecord,
  AppSettings,
} from '../types';

interface AppState {
  // 데이터
  exercises: Exercise[];
  workoutSessions: WorkoutSession[];
  routines: Routine[];
  personalRecords: PersonalRecord[];
  inbodyRecords: InbodyRecord[];
  settings: AppSettings;
  
  // 현재 운동 세션 (진행 중인 운동)
  currentWorkout: WorkoutSession | null;
  
  // Actions
  addExercise: (exercise: Omit<Exercise, 'id' | 'createdAt'>) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  deleteExercise: (id: string) => void;
  toggleExerciseFavorite: (id: string) => void;
  
  addWorkoutSession: (session: Omit<WorkoutSession, 'id'>) => void;
  updateWorkoutSession: (id: string, updates: Partial<WorkoutSession>) => void;
  deleteWorkoutSession: (id: string) => void;
  
  addRoutine: (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  
  setCurrentWorkout: (workout: WorkoutSession | null) => void;
  updateCurrentWorkout: (updates: Partial<WorkoutSession>) => void;
  
  addPersonalRecord: (record: Omit<PersonalRecord, 'id'>) => void;
  deletePersonalRecord: (exerciseId: string, date: string, type: 'maxWeight' | 'maxVolume' | 'maxReps') => void;
  
  addInbodyRecord: (record: Omit<InbodyRecord, 'id'>) => void;
  updateInbodyRecord: (id: string, updates: Partial<InbodyRecord>) => void;
  deleteInbodyRecord: (id: string) => void;
  
  updateSettings: (updates: Partial<AppSettings>) => void;
  
  // 백업/복원
  exportData: () => string;
  importData: (data: string) => void;
  
  // localStorage 동기화
  loadFromStorage: () => void;
  saveToStorage: () => void;
  
  // 중복 인바디 기록 정리 (같은 날짜의 기록 중 가장 최근 것만 유지)
  cleanupDuplicateInbodyRecords: () => void;
}

const STORAGE_KEY = 'health-diary-storage';

const defaultExercises: Exercise[] = [
  { id: '1', name: '벤치프레스', bodyPart: '가슴', isCustom: false, isFavorite: false, createdAt: new Date().toISOString() },
  { id: '2', name: '스쿼트', bodyPart: '하체', isCustom: false, isFavorite: false, createdAt: new Date().toISOString() },
  { id: '3', name: '데드리프트', bodyPart: '등', isCustom: false, isFavorite: false, createdAt: new Date().toISOString() },
  { id: '4', name: '오버헤드프레스', bodyPart: '어깨', isCustom: false, isFavorite: false, createdAt: new Date().toISOString() },
  { id: '5', name: '바벨 로우', bodyPart: '등', isCustom: false, isFavorite: false, createdAt: new Date().toISOString() },
  { id: '6', name: '레그프레스', bodyPart: '하체', isCustom: false, isFavorite: false, createdAt: new Date().toISOString() },
  { id: '7', name: '덤벨 플라이', bodyPart: '가슴', isCustom: false, isFavorite: false, createdAt: new Date().toISOString() },
  { id: '8', name: '사이드 레터럴 레이즈', bodyPart: '어깨', isCustom: false, isFavorite: false, createdAt: new Date().toISOString() },
  { id: '9', name: '바이셉 컬', bodyPart: '팔', isCustom: false, isFavorite: false, createdAt: new Date().toISOString() },
  { id: '10', name: '트라이셉스 익스텐션', bodyPart: '팔', isCustom: false, isFavorite: false, createdAt: new Date().toISOString() },
];

const loadInitialState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        exercises: data.exercises || defaultExercises,
        workoutSessions: data.workoutSessions || [],
        routines: data.routines || [],
        personalRecords: data.personalRecords || [],
        inbodyRecords: data.inbodyRecords || [],
        settings: data.settings || { darkMode: false },
        currentWorkout: data.currentWorkout || null,
      };
    }
  } catch (error) {
    console.error('로컬 스토리지 로드 실패:', error);
  }
  
  return {
    exercises: defaultExercises,
    workoutSessions: [],
    routines: [],
    personalRecords: [],
    inbodyRecords: [],
    settings: { darkMode: false },
    currentWorkout: null,
  };
};

const initialState = loadInitialState();

export const useStore = create<AppState>((set, get) => ({
  ...initialState,
  
  addExercise: (exercise) => {
    const newExercise: Exercise = {
      ...exercise,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const newState = { ...state, exercises: [...state.exercises, newExercise] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  updateExercise: (id, updates) => {
    set((state) => {
      const newState = {
        ...state,
        exercises: state.exercises.map((ex) =>
          ex.id === id ? { ...ex, ...updates } : ex
        ),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  deleteExercise: (id) => {
    set((state) => {
      const newState = {
        ...state,
        exercises: state.exercises.filter((ex) => ex.id !== id),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  toggleExerciseFavorite: (id) => {
    set((state) => {
      const newState = {
        ...state,
        exercises: state.exercises.map((ex) =>
          ex.id === id ? { ...ex, isFavorite: !ex.isFavorite } : ex
        ),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  addWorkoutSession: (session) => {
    const newSession: WorkoutSession = {
      ...session,
      id: Date.now().toString(),
    };
    set((state) => {
      const newState = {
        ...state,
        workoutSessions: [...state.workoutSessions, newSession],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      
      // PR 업데이트 체크
      get().checkAndUpdatePRs(newSession);
      
      return newState;
    });
  },
  
  updateWorkoutSession: (id, updates) => {
    set((state) => {
      const newState = {
        ...state,
        workoutSessions: state.workoutSessions.map((session) =>
          session.id === id ? { ...session, ...updates } : session
        ),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  deleteWorkoutSession: (id) => {
    set((state) => {
      const newState = {
        ...state,
        workoutSessions: state.workoutSessions.filter((session) => session.id !== id),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  addRoutine: (routine) => {
    const now = new Date().toISOString();
    const newRoutine: Routine = {
      ...routine,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => {
      const newState = {
        ...state,
        routines: [...state.routines, newRoutine],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  updateRoutine: (id, updates) => {
    set((state) => {
      const newState = {
        ...state,
        routines: state.routines.map((routine) =>
          routine.id === id
            ? { ...routine, ...updates, updatedAt: new Date().toISOString() }
            : routine
        ),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  deleteRoutine: (id) => {
    set((state) => {
      const newState = {
        ...state,
        routines: state.routines.filter((routine) => routine.id !== id),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  setCurrentWorkout: (workout) => {
    set((state) => {
      const newState = { ...state, currentWorkout: workout };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  updateCurrentWorkout: (updates) => {
    set((state) => {
      if (!state.currentWorkout) return state;
      const newState = {
        ...state,
        currentWorkout: { ...state.currentWorkout, ...updates },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  addPersonalRecord: (record) => {
    set((state) => {
      const newState = {
        ...state,
        personalRecords: [...state.personalRecords, record],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  deletePersonalRecord: (exerciseId, date, type) => {
    const dateStr = date.split('T')[0];
    set((state) => {
      const newState = {
        ...state,
        personalRecords: state.personalRecords.filter(
          (pr) => 
            !(pr.exerciseId === exerciseId && 
              pr.date.split('T')[0] === dateStr &&
              pr.type === type)
        ),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  addInbodyRecord: (record) => {
    const recordDate = new Date(record.date).toISOString().split('T')[0];
    
    set((state) => {
      // 같은 날짜의 기존 기록 찾기 (모든 중복 기록 제거)
      const existingRecord = state.inbodyRecords.find(
        (r) => r.date.split('T')[0] === recordDate
      );
      
      // 같은 날짜의 모든 기록 제거
      const filteredRecords = state.inbodyRecords.filter(
        (r) => r.date.split('T')[0] !== recordDate
      );
      
      let newState;
      if (existingRecord) {
        // 같은 날짜의 기록이 있으면 기존 ID 유지하며 업데이트
        const updatedRecord: InbodyRecord = {
          ...existingRecord,
          ...record,
          id: existingRecord.id,
        };
        newState = {
          ...state,
          inbodyRecords: [...filteredRecords, updatedRecord],
        };
      } else {
        // 같은 날짜의 기록이 없으면 새로 추가
        const newRecord: InbodyRecord = {
          ...record,
          id: Date.now().toString(),
        };
        newState = {
          ...state,
          inbodyRecords: [...filteredRecords, newRecord],
        };
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  updateInbodyRecord: (id, updates) => {
    set((state) => {
      const newState = {
        ...state,
        inbodyRecords: state.inbodyRecords.map((record) =>
          record.id === id ? { ...record, ...updates } : record
        ),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  deleteInbodyRecord: (id) => {
    set((state) => {
      const newState = {
        ...state,
        inbodyRecords: state.inbodyRecords.filter((record) => record.id !== id),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  },
  
  updateSettings: (updates) => {
    set((state) => {
      const newState = {
        ...state,
        settings: { ...state.settings, ...updates },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      
      // 다크모드 적용
      if (updates.darkMode !== undefined) {
        if (updates.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      return newState;
    });
  },
  
  exportData: () => {
    const state = get();
    const data = {
      exercises: state.exercises,
      workoutSessions: state.workoutSessions,
      routines: state.routines,
      personalRecords: state.personalRecords,
      inbodyRecords: state.inbodyRecords,
      settings: state.settings,
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },
  
  importData: (dataString) => {
    try {
      const data = JSON.parse(dataString);
      const newState = {
        exercises: data.exercises || defaultExercises,
        workoutSessions: data.workoutSessions || [],
        routines: data.routines || [],
        personalRecords: data.personalRecords || [],
        inbodyRecords: data.inbodyRecords || [],
        settings: data.settings || { darkMode: false },
        currentWorkout: data.currentWorkout || null,
      };
      set(newState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('데이터 가져오기 실패:', error);
      throw error;
    }
  },
  
  loadFromStorage: () => {
    const loaded = loadInitialState();
    set(loaded);
  },
  
  saveToStorage: () => {
    const state = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },
  
  // 중복 인바디 기록 정리 (같은 날짜의 기록 중 가장 최근 것만 유지)
  cleanupDuplicateInbodyRecords: () => {
    set((state) => {
      const dateMap = new Map<string, InbodyRecord>();
      
      // 같은 날짜의 기록 중 가장 최근 것만 유지
      state.inbodyRecords.forEach((record) => {
        const dateKey = record.date.split('T')[0];
        const existing = dateMap.get(dateKey);
        
        if (!existing || new Date(record.date).getTime() > new Date(existing.date).getTime()) {
          dateMap.set(dateKey, record);
        }
      });
      
      const cleanedRecords = Array.from(dateMap.values());
      
      // 변경사항이 있는 경우에만 업데이트
      if (cleanedRecords.length !== state.inbodyRecords.length) {
        const newState = {
          ...state,
          inbodyRecords: cleanedRecords,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        return newState;
      }
      
      return state;
    });
  },
  
  // PR 체크 헬퍼 함수
  checkAndUpdatePRs: (session: WorkoutSession) => {
    const state = get();
    session.exercises.forEach((workoutEx) => {
      if (workoutEx.sets.length === 0) return;
      
      const totalVolume = workoutEx.sets.reduce(
        (sum, set) => sum + set.weight * set.reps,
        0
      );
      const maxWeight = Math.max(...workoutEx.sets.map((s) => s.weight));
      const maxReps = Math.max(...workoutEx.sets.map((s) => s.reps));
      
      // 기존 PR 확인
      const existingPRs = state.personalRecords.filter(
        (pr) => pr.exerciseId === workoutEx.exerciseId
      );
      
      // 최대 중량 PR
      const maxWeightPR = existingPRs.find((pr) => pr.type === 'maxWeight');
      if (!maxWeightPR || maxWeight > maxWeightPR.value) {
        get().addPersonalRecord({
          exerciseId: workoutEx.exerciseId,
          exerciseName: workoutEx.exerciseName,
          type: 'maxWeight',
          value: maxWeight,
          date: session.date,
          workoutSessionId: session.id,
        });
      }
      
      // 최대 볼륨 PR
      const maxVolumePR = existingPRs.find((pr) => pr.type === 'maxVolume');
      if (!maxVolumePR || totalVolume > maxVolumePR.value) {
        get().addPersonalRecord({
          exerciseId: workoutEx.exerciseId,
          exerciseName: workoutEx.exerciseName,
          type: 'maxVolume',
          value: totalVolume,
          date: session.date,
          workoutSessionId: session.id,
        });
      }
      
      // 최대 반복 PR
      const maxRepsPR = existingPRs.find((pr) => pr.type === 'maxReps');
      if (!maxRepsPR || maxReps > maxRepsPR.value) {
        get().addPersonalRecord({
          exerciseId: workoutEx.exerciseId,
          exerciseName: workoutEx.exerciseName,
          type: 'maxReps',
          value: maxReps,
          date: session.date,
          workoutSessionId: session.id,
        });
      }
    });
  },
}));
