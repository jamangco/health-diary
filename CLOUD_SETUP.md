# 클라우드 DB + 이메일 로그인 설정

## 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속 후 로그인
2. **New Project** 생성
3. 프로젝트 이름, 비밀번호 설정 후 생성 완료 대기

## 2. 테이블 생성

1. Supabase 대시보드 → **SQL Editor**
2. `supabase/schema.sql` 파일 내용을 복사해 붙여넣기
3. **Run** 실행

## 3. 이메일 로그인

Supabase의 이메일/비밀번호 로그인은 기본 활성화되어 있습니다.

- **Authentication** → **Providers** → **Email** 에서 이메일 인증 설정 가능
- 이메일 확인(Confirm email)이 켜져 있으면, 회원가입 후 메일의 링크 클릭이 필요할 수 있습니다. 끄려면 **Email** Provider에서 **Confirm email** 비활성화

## 4. 환경 변수 설정

1. 프로젝트 루트에 `.env` 파일 생성
2. `.env.example` 참고하여 다음 변수 입력:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

- **Project Settings** → **API**에서 URL과 `anon` `public` 키 확인

## 5. 앱 실행

```bash
npm install
npm run dev
```

설정 화면에서 **회원가입** 후 **로그인**하면, 데이터가 자동으로 클라우드에 백업됩니다.
