import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import WorkoutHistory from './pages/WorkoutHistory';
import StartWorkout from './pages/StartWorkout';
import Routines from './pages/Routines';
import Statistics from './pages/Statistics';
import ExerciseList from './pages/ExerciseList';
import Settings from './pages/Settings';

function App() {
  const { settings, loadFromStorage } = useStore();

  useEffect(() => {
    // 다크모드 초기화
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // 스토리지에서 데이터 로드
    loadFromStorage();
  }, [settings.darkMode, loadFromStorage]);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<WorkoutHistory />} />
          <Route path="/workout" element={<StartWorkout />} />
          <Route path="/routines" element={<Routines />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/exercises" element={<ExerciseList />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
