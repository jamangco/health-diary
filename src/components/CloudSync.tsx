import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { loadAppDataFromCloud, saveAppDataToCloud } from '../lib/supabaseSync';
import type { User } from '@supabase/supabase-js';

const SAVE_DEBOUNCE_MS = 1500;

export function CloudSync({ user }: { user: User | null }) {
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const hasLoadedCloudOnce = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 로그인 시 클라우드에서 데이터 한 번 로드 (없으면 현재 로컬 데이터 업로드)
  useEffect(() => {
    if (!user?.id || hasLoadedCloudOnce.current) return;
    hasLoadedCloudOnce.current = true;

    loadAppDataFromCloud(user.id).then((cloudJson) => {
      if (cloudJson) {
        try {
          importData(cloudJson);
        } catch (e) {
          console.error('클라우드 데이터 적용 실패:', e);
        }
      } else {
        // 클라우드에 데이터 없음 → 현재 로컬 데이터를 클라우드에 업로드
        saveAppDataToCloud(user.id, exportData());
      }
    });
  }, [user?.id, importData, exportData]);

  // 로그아웃 시 다음 로그인을 위해 플래그 리셋
  useEffect(() => {
    if (!user) hasLoadedCloudOnce.current = false;
  }, [user]);

  // 스토어 변경 시 디바운스 저장
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = useStore.subscribe(() => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        saveAppDataToCloud(user.id, useStore.getState().exportData());
      }, SAVE_DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [user?.id]);

  return null;
}
