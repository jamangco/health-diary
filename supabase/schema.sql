-- Health Diary: 사용자별 앱 데이터 저장 테이블
-- Supabase 대시보드 → SQL Editor에서 이 스크립트를 실행하세요.

-- 테이블 생성 (user_id = auth.users.id, 한 사용자당 한 행)
create table if not exists public.app_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- RLS 활성화
alter table public.app_data enable row level security;

-- 정책: 본인 행만 조회/삽입/수정 가능
create policy "Users can read own app_data"
  on public.app_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own app_data"
  on public.app_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own app_data"
  on public.app_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at 자동 갱신 (선택)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger app_data_updated_at
  before update on public.app_data
  for each row execute function public.set_updated_at();
