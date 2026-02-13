# Health Diary

운동 기록 및 인바디 데이터를 관리하는 개인 건강 일기 애플리케이션입니다.

## 주요 기능

- 📊 **운동 기록**: 운동 세트, 무게, 횟수 기록 및 관리
- 📈 **통계 분석**: 주간 운동 횟수, 중량 변화, 운동별 볼륨 그래프
- 💪 **PR 기록**: 벤치프레스, 스쿼트, 데드리프트 최고 기록 관리
- 📏 **인바디 기록**: 체중, 근육량, 체지방량 등 인바디 측정 데이터 기록
- 📅 **운동 히스토리**: 캘린더 및 리스트 뷰로 운동 기록 확인
- 🏋️ **루틴 관리**: 운동 루틴 생성 및 관리

## 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Zustand** - 상태 관리
- **React Router** - 라우팅
- **Tailwind CSS** - 스타일링
- **Recharts** - 차트 라이브러리
- **date-fns** - 날짜 처리
- **Lucide React** - 아이콘

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 프로젝트 구조

```
src/
├── components/     # 재사용 가능한 컴포넌트
├── pages/         # 페이지 컴포넌트
├── store/         # Zustand 상태 관리
├── types/         # TypeScript 타입 정의
└── App.tsx        # 메인 앱 컴포넌트
```

## 데이터 저장

모든 데이터는 브라우저의 `localStorage`에 저장됩니다.

## 라이선스

Private - 개인 프로젝트
