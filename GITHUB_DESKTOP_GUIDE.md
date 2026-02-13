# GitHub Desktop 사용 가이드

## 현재 상황
로컬 폴더가 아직 Git 저장소로 초기화되지 않았습니다.

## 해결 방법

### 방법 1: GitHub Desktop에서 직접 생성 (가장 간단)

1. **모달에서 파란색 "create a repository" 링크 클릭**
   - 또는 모달을 닫고 File → New Repository 선택

2. **설정 확인**
   - Local path: `C:\Users\hyuk8\OneDrive\바탕 화면\health_diary`
   - Repository name: `health-diary`
   - Description: (선택사항) "운동 기록 및 인바디 데이터 관리 앱"

3. **"Create a repository" 클릭**

4. **변경사항 커밋**
   - 왼쪽에서 모든 파일이 선택되어 있는지 확인
   - 하단에 커밋 메시지 입력: "Initial commit"
   - "Commit to main" 클릭

5. **GitHub에 푸시**
   - "Publish repository" 버튼 클릭
   - 저장소 이름 확인 후 "Publish repository" 클릭

### 방법 2: VS Code에서 Git 초기화 후 추가

1. VS Code에서 프로젝트 폴더 열기
2. 왼쪽 사이드바의 소스 제어 아이콘 클릭 (또는 `Ctrl+Shift+G`)
3. "Initialize Repository" 클릭
4. GitHub Desktop으로 돌아가서 다시 "Add local repository" 시도
