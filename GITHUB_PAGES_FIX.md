# GitHub Pages 활성화 방법

## 문제
현재 저장소가 Private이어서 GitHub Pages를 사용할 수 없습니다.

## 해결 방법

### 방법 1: 저장소를 Public으로 변경 (가장 간단)

1. GitHub 저장소 페이지에서 **Settings** 클릭
2. 왼쪽 사이드바 맨 아래 **"Danger Zone"** 섹션 찾기
3. **"Change repository visibility"** 클릭
4. **"Change visibility"** 버튼 클릭
5. **"Make public"** 선택
6. 저장소 이름 입력하여 확인
7. 다시 **Settings → Pages**로 이동
8. **Source**에서 **"GitHub Actions"** 선택
9. 저장

### 방법 2: Vercel 사용 (Private 저장소 유지)

Private 저장소를 유지하면서 배포하려면 Vercel을 사용하세요:

1. https://vercel.com 접속
2. GitHub로 로그인
3. "Add New Project" 클릭
4. 저장소 선택 후 "Import"
5. "Deploy" 클릭

**장점:**
- Private 저장소도 무료로 배포 가능
- 자동 배포
- 더 빠른 속도
