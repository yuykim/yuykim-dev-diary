# yuykim14 Dev Diary

Astro 기반 개인 개발 일기장 블로그다.

이 repo는 여러 source repo의 `dev_diary/YYYY-MM-DD.md`, `dev_diary/assets/`, `.devlog.yml`을 import해서 GitHub Pages에 발행한다.

## 개발

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## Source Repo 연결

개발 repo를 이 블로그에 연결하려면 아래 순서대로 설정한다.

### 1. GitHub token 준비

source repo의 GitHub Actions가 이 블로그 repo에 `repository_dispatch` 이벤트를 보내야 한다.

GitHub에서 fine-grained Personal Access Token을 만들고 다음 권한을 준다.

```txt
Repository access: Only selected repositories
Selected repository: yuykim/yuykim-dev-diary
Repository permissions: Contents read/write
```

source repo의 `Settings` → `Secrets and variables` → `Actions`에 아래 이름으로 등록한다.

```txt
BLOG_DISPATCH_TOKEN
```

이 토큰은 AI API 토큰이 아니라 GitHub API 호출용 토큰이다.

### 2. source repo에 파일 추가

source repo에는 다음 파일과 폴더를 둔다.

```txt
AGENTS.md
.devlog.yml
HISTORY.md
dev_diary/YYYY-MM-DD.md
dev_diary/assets/*
.github/workflows/publish-devlog.yml
```

이 repo의 템플릿을 복사해서 시작할 수 있다.

```txt
templates/AGENTS.md -> AGENTS.md
templates/HISTORY_TEMPLATE.md -> HISTORY.md
templates/DEVLOG_CONFIG_TEMPLATE.yml -> .devlog.yml
workflows/publish-devlog.yml -> .github/workflows/publish-devlog.yml
```

### 3. `.devlog.yml` 수정

source repo에 맞게 프로젝트 정보를 수정한다.

```yml
enabled: true

project:
  name: "Project Name"
  slug: "project-slug"
  description: "프로젝트 설명"
  category: "AI"
  tags:
    - tag-one
    - tag-two
  repo_url: "https://github.com/yuykim/project-repo"
  intro:
    title: "Project Name 프로젝트 소개"
    summary: "처음 연결할 때 블로그에 표시할 프로젝트 소개"
    publish_on_first_import: true

diary:
  path: "dev_diary"
  assets_path: "dev_diary/assets"

history:
  path: "HISTORY.md"

publish:
  mode: "auto"
  target_blog_repo: "yuykim/yuykim-dev-diary"
  branch: "main"
```

`project.slug`는 URL과 파일 경로에 쓰이므로 영문 소문자, 숫자, 하이픈 조합을 권장한다.

### 4. 첫 개발일지 작성

날짜별 diary 파일을 만든다.

```txt
dev_diary/2026-05-26.md
```

이미지나 실행 결과는 아래에 저장한다.

```txt
dev_diary/assets/2026-05-26-demo.png
dev_diary/assets/2026-05-26-error-log.png
```

비공개로 두고 싶은 글은 frontmatter에 아래 값을 넣는다. 이 경우 블로그에 import되지 않는다.

```yml
visibility: "private"
```

### 5. push해서 발행

source repo에서 commit 후 push한다.

```bash
git add AGENTS.md .devlog.yml HISTORY.md dev_diary .github/workflows/publish-devlog.yml
git commit -m "docs: connect dev diary"
git push
```

push하면 source repo workflow가 실행되고, 이 블로그 repo의 `receive-devlog.yml`이 source repo의 diary를 import한다.

처음 연결되는 프로젝트는 `project.intro.publish_on_first_import: true`일 때 프로젝트 소개 글도 함께 생성된다.

## Import 테스트

```bash
node scripts/import-devlog.js --source ./source-repo --repo yuykim/example --sha local-test
```
