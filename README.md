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

source repo에는 다음 파일을 둔다.

```txt
AGENTS.md
.devlog.yml
HISTORY.md
dev_diary/YYYY-MM-DD.md
dev_diary/assets/*
.github/workflows/publish-devlog.yml
```

source repo의 GitHub secret에는 `BLOG_DISPATCH_TOKEN`을 등록한다.

`BLOG_DISPATCH_TOKEN`은 GitHub fine-grained Personal Access Token이며, `yuykim/yuykim-dev-diary` repo에 대해 `Contents read/write` 권한이 필요하다.

## Import 테스트

```bash
node scripts/import-devlog.js --source ./source-repo --repo yuykim/example --sha local-test
```
