import { useStore } from '../store/useStore';
import { Moon, Sun, Download, Upload, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const { settings, updateSettings, exportData, importData } = useStore();
  const [importError, setImportError] = useState<string | null>(null);

  const handleToggleDarkMode = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  const handleExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `health-diary-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('백업 파일이 다운로드되었습니다.');
    } catch (error) {
      alert('백업 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result as string;
          importData(data);
          setImportError(null);
          alert('데이터가 성공적으로 가져와졌습니다.');
        } catch (error) {
          setImportError('데이터 가져오기 실패. 파일 형식을 확인해주세요.');
          console.error(error);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearData = () => {
    if (
      confirm(
        '정말 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
      )
    ) {
      if (
        confirm(
          '정말로 삭제하시겠습니까? 마지막 확인입니다.'
        )
      ) {
        localStorage.removeItem('health-diary-storage');
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        설정
      </h1>

      {/* 다크모드 */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${settings.darkMode ? 'bg-gray-800' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
              {settings.darkMode ? (
                <Moon size={22} className="text-white" />
              ) : (
                <Sun size={22} className="text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">
                다크모드
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                어두운 테마로 전환
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={handleToggleDarkMode}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* 데이터 백업/복원 */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-gray-700 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Download size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          데이터 관리
        </h2>

        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 active:from-blue-100 active:to-blue-200 dark:active:from-blue-800/30 dark:active:to-blue-700/30 rounded-xl border border-blue-200 dark:border-blue-700 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Download size={18} className="text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 dark:text-white text-base">
                  데이터 백업
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  모든 데이터를 JSON 파일로 저장
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={handleImport}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 active:from-green-100 active:to-green-200 dark:active:from-green-800/30 dark:active:to-green-700/30 rounded-xl border border-green-200 dark:border-green-700 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Upload size={18} className="text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 dark:text-white text-base">
                  데이터 복원
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  백업 파일에서 데이터 가져오기
                </div>
              </div>
            </div>
          </button>

          {importError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {importError}
            </div>
          )}

          {settings.lastBackup && (
            <div className="text-xs text-gray-500 dark:text-gray-500">
              마지막 백업: {new Date(settings.lastBackup).toLocaleString('ko-KR')}
            </div>
          )}
        </div>
      </div>

      {/* 데이터 삭제 */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl p-5 shadow-lg border border-red-200 dark:border-red-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">
                모든 데이터 삭제
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                모든 운동 기록, 루틴, 설정 삭제
              </p>
            </div>
          </div>
          <button
            onClick={handleClearData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            삭제
          </button>
        </div>
      </div>

      {/* 앱 정보 */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>운동 기록 앱 v1.0.0</p>
      </div>
    </div>
  );
}
