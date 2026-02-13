# GitHub에 프로젝트 올리기 가이드

## 1단계: Git 저장소 초기화

프로젝트 폴더에서 다음 명령어를 실행하세요:

```bash
git init
```

## 2단계: 파일 추가 및 커밋

```bash
# 모든 파일 추가
git add .

# 첫 커밋 생성
git commit -m "Initial commit: Health Diary application"
```

## 3단계: GitHub에서 새 저장소 생성

1. GitHub 웹사이트(https://github.com)에 로그인
2. 우측 상단의 "+" 버튼 클릭 → "New repository" 선택
3. 저장소 이름 입력 (예: `health-diary`)
4. Public 또는 Private 선택
5. **"Initialize this repository with a README"는 체크하지 마세요** (이미 로컬에 파일이 있으므로)
6. "Create repository" 클릭

## 4단계: 원격 저장소 연결 및 푸시

GitHub에서 생성된 저장소의 URL을 복사한 후:

```bash
# 원격 저장소 추가 (YOUR_USERNAME과 REPO_NAME을 실제 값으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 기본 브랜치를 main으로 설정 (필요한 경우)
git branch -M main

# GitHub에 푸시
git push -u origin main
```

## 참고사항

- GitHub 인증이 필요할 수 있습니다 (Personal Access Token 또는 SSH 키 사용)
- 한글 경로 문제로 인해 터미널에서 실행이 어려운 경우, VS Code의 Git 기능을 사용하거나 GitHub Desktop을 사용할 수 있습니다
