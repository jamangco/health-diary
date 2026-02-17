import { supabase } from './supabase';

const APP_DATA_TABLE = 'app_data';

export type AppDataRow = {
  user_id: string;
  data: Record<string, unknown>;
  updated_at?: string;
};

/** 클라우드에서 앱 데이터 불러오기. 없으면 null */
export async function loadAppDataFromCloud(userId: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(APP_DATA_TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('클라우드 데이터 로드 실패:', error);
    return null;
  }
  if (!data?.data) return null;
  return JSON.stringify(data.data);
}

/** 앱 데이터를 클라우드에 저장 */
export async function saveAppDataToCloud(userId: string, dataJson: string): Promise<boolean> {
  if (!supabase) return false;
  const data = JSON.parse(dataJson) as Record<string, unknown>;
  const { error } = await supabase.from(APP_DATA_TABLE).upsert(
    { user_id: userId, data, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  );
  if (error) {
    console.error('클라우드 데이터 저장 실패:', error);
    return false;
  }
  return true;
}
