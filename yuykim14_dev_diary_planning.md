# yuykim14 Dev Diary 기획서

> 여러 개발 리포지토리의 개발 기록을 자동으로 수집하여, GitHub Pages 기반 개인 개발 일기장 블로그로 발행하는 시스템 기획서

---

## 0. 최종 결정 사항

| 항목 | 결정 |
|---|---|
| 블로그 이름 | **yuykim14 Dev Diary** |
| 블로그 repo | `yuykim/yuykim-dev-diary` |
| 목적 | 개발 블로그 대용이자 개발 일기장 |
| 블로그 엔진 | Astro |
| 배포 | GitHub Pages + GitHub Actions |
| 도메인 | GitHub Pages 기본 도메인으로 시작 |
| 발행 방식 | push 시 바로 블로그 반영 |
| 공개 범위 | 기본 public, 단 `visibility: private`이면 제외 |
| 리포지토리 연결 방식 | 가장 간편한 opt-in 설치 방식 |
| 첫 테스트 source repo | `yuykim/gfootball-RLfootball-Imitation_Learning` |
| GitHub Actions token | `BLOG_DISPATCH_TOKEN` |
| `BLOG_DISPATCH_TOKEN` 권한 | fine-grained PAT, `yuykim/yuykim-dev-diary` repo, Contents read/write |
| GitHub Pages URL | `https://yuykim.github.io/yuykim-dev-diary/` |
| Astro base path | `/yuykim-dev-diary` |
| 이미지 저장 방식 | 각 repo의 `dev_diary/assets/`에 저장 |
| 글 단위 | 하루 1개 글 기본, 같은 날짜 글은 계속 수정 가능 |
| 문체 | 일기체 + 연구노트체 |
| 디자인 테마 | 옛날 도트 게임 느낌, 검정/남색 배경, 마젠타/네온블루/네온그린 포인트 |
| 포인트 요소 | 갤러그, 레트로 게임, 게임 컨트롤러 이모지, 픽셀 UI |
| HISTORY.md 노출 | 블로그에는 노출하지 않음. 필요 시 GitHub 원본에서 확인 |

---

## 1. 프로젝트 개요

`yuykim14 Dev Diary`는 사용자의 여러 GitHub 개발 리포지토리에서 작성되는 개발일지와 이미지 자료를 자동으로 수집하여, 개인 개발 블로그에 일기장처럼 발행하는 시스템이다.

기존 개발 블로그처럼 완성된 글을 따로 쓰는 방식이 아니라, 개발 과정에서 자연스럽게 작성되는 다음 파일을 기반으로 블로그를 자동 생성한다.

```txt
HISTORY.md
dev_diary/YYYY-MM-DD.md
dev_diary/assets/*
.devlog.yml
commit 정보
repository metadata
```

최종 사용 흐름은 다음과 같다.

```txt
코드 수정
→ HISTORY.md 작성 또는 갱신
→ dev_diary/YYYY-MM-DD.md 작성 또는 갱신
→ dev_diary/assets/에 이미지 저장
→ git push
→ GitHub Actions 실행
→ 블로그 repo에 자동 반영
→ GitHub Pages에 자동 배포
```

---

## 2. 핵심 목표

### 2.1 개발 일기장

이 시스템은 단순한 changelog 블로그가 아니다.

블로그 글은 개발자가 하루 동안 무엇을 했고, 왜 했고, 어떤 삽질을 했고, 어떤 결과가 나왔으며, 어떤 생각을 했는지를 기록하는 **개발 일기장**이어야 한다.

예상되는 글의 분위기:

```txt
오늘은 RealSense calibration 구조를 정리했다.
처음에는 config만 분리하면 끝날 줄 알았는데,
막상 보니 카메라 좌표계와 로봇 좌표계 변환 흐름까지 같이 봐야 했다.

겉으로 보기에는 큰 기능이 추가된 건 아니지만,
반복 실험을 하려면 꼭 필요한 기반 작업이었다.
```

### 2.2 HISTORY.md와 dev_diary의 역할 분리

`HISTORY.md`는 작업 판단 기록이다.

이 파일을 쓰는 이유는 AI 또는 사람이 어떤 작업을 했을 때, 나중에 그 작업을 왜 했는지 이해하고, 특정 수정이 개발의 분기점이 되었을 때 이전 상태로 돌아가야 하는지 판단하기 위해서다.

```txt
어떤 작업을 했는가
왜 그 작업을 했는가
어떤 판단이나 문제가 분기점이 되었는가
실행한 명령이나 코드가 무엇인가
실행 결과와 검증 결과가 무엇인가
어떤 디버깅 방법을 사용했는가
되돌린다면 어디까지 돌아가야 하는가
```

`dev_diary/`는 개발 일기 원본이다.

```txt
오늘 어떤 흐름으로 작업했는가
무엇이 막혔는가
어떤 장면이나 결과물이 있었는가
어떤 생각이 들었는가
다음에는 무엇을 할 것인가
```

정리하면 다음과 같다.

```txt
HISTORY.md = 작업 이유, 실행 기록, 디버깅 기록, 되돌림 판단 기준
dev_diary/YYYY-MM-DD.md = 블로그에 올라갈 개발 일기 원본
dev_diary/assets/* = 개발일지에 들어갈 이미지, GIF, 스크린샷
```

---

## 3. 전체 시스템 구조

### 3.1 저장소 종류

이 시스템은 크게 세 종류의 저장소로 구성된다.

```txt
1. 블로그 저장소
   yuykim/yuykim-dev-diary

2. 개발 저장소들
   예:
   - physical-ai-pipetting
   - xr-transfer-helper
   - database-team-project
   - unity-test-project

3. 공용 kit 저장소
   devlog-kit
```

### 3.2 추천 저장소 구조

가능하면 다음처럼 분리한다.

```txt
yuykim-dev-diary/
├─ Astro 블로그 본체
├─ GitHub Pages 배포 설정
└─ 여러 repo에서 import된 개발일지 content

devlog-kit/
├─ 공용 AGENTS.md
├─ 템플릿
├─ workflow
├─ 설치 스크립트
└─ 사용 가이드

각 개발 repo/
├─ AGENTS.md
├─ .devlog.yml
├─ HISTORY.md
├─ dev_diary/
└─ .github/workflows/publish-devlog.yml
```

---

## 4. 사용 시나리오

### 4.1 처음 연결할 때

개발 리포지토리에서 다음 명령어를 실행한다.

```bash
npx yuykim14-devlog-kit install
```

또는 초기 MVP에서는 직접 파일을 복사한다.

설치 결과:

```txt
AGENTS.md 생성
.devlog.yml 생성
HISTORY.md 생성
dev_diary/ 폴더 생성
dev_diary/assets/ 폴더 생성
.github/workflows/publish-devlog.yml 생성
```

### 4.2 매일 개발할 때

사용자는 하루 개발을 하면서 다음 파일을 작성한다.

```txt
dev_diary/2026-05-26.md
```

이미지나 GIF는 다음 경로에 저장한다.

```txt
dev_diary/assets/2026-05-26-01.png
dev_diary/assets/2026-05-26-error.png
dev_diary/assets/2026-05-26-demo.gif
```

작성 후 push한다.

```bash
git add .
git commit -m "docs: update dev diary"
git push
```

그러면 자동으로 블로그에 반영된다.

### 4.3 같은 날짜 글을 계속 수정하는 경우

하루 1개 글을 기본으로 한다.

예:

```txt
dev_diary/2026-05-26.md
```

이 파일은 하루 동안 계속 수정할 수 있다.

push할 때마다 블로그의 같은 글이 덮어쓰기 방식으로 최신화된다.

```txt
같은 repo + 같은 날짜 파일
= 기존 블로그 글 갱신
```

즉, 같은 날 오전에 한 번 작성하고, 밤에 내용을 추가하면 블로그 글도 최신 버전으로 바뀐다.

---

## 5. 개발 repo 구조

각 개발 repo는 다음 구조를 가진다.

```txt
project-repo/
├─ AGENTS.md
├─ .devlog.yml
├─ HISTORY.md
├─ dev_diary/
│  ├─ 2026-05-26.md
│  ├─ 2026-05-27.md
│  └─ assets/
│     ├─ 2026-05-26-01.png
│     ├─ 2026-05-26-error.png
│     └─ 2026-05-26-demo.gif
└─ .github/
   └─ workflows/
      └─ publish-devlog.yml
```

---

## 6. `.devlog.yml` 명세

`.devlog.yml`은 해당 repo를 블로그와 연결할지 결정하는 설정 파일이다.

### 6.1 예시

```yml
enabled: true

project:
  name: "gfootball-RLfootball-Imitation_Learning"
  slug: "gfootball-rlfootball-imitation-learning"
  description: "Google Research Football 환경에서 reinforcement learning과 imitation learning을 실험한 프로젝트"
  category: "AI"
  tags:
    - reinforcement-learning
    - imitation-learning
    - gfootball
    - football-ai
  repo_url: "https://github.com/yuykim/gfootball-RLfootball-Imitation_Learning"
  intro:
    title: "gfootball-RLfootball-Imitation_Learning 프로젝트 소개"
    summary: "이미 개발이 끝난 리포지토리일 수 있으므로, 처음 연결할 때 이 repo가 어떤 목표와 맥락을 가진 프로젝트인지 설명하는 소개 글을 생성한다."
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

privacy:
  default_visibility: "public"
  exclude_patterns:
    - ".env"
    - "secrets/"
    - "*.key"
    - "*.pem"
    - "private/"
    - "credentials/"
    - "*.db"
    - "*.sqlite"
```

### 6.2 필드 설명

| 필드 | 설명 |
|---|---|
| `enabled` | `true`인 repo만 블로그에 발행 |
| `project.name` | 블로그에 표시될 프로젝트 이름 |
| `project.slug` | URL, 파일 경로에 사용될 고유 이름 |
| `project.description` | 프로젝트 설명 |
| `project.category` | Robotics, Unity, AI, Web, Database 등 |
| `project.tags` | 프로젝트 기본 태그 |
| `project.repo_url` | 원본 GitHub repo 링크 |
| `project.intro` | 처음 연결할 때 생성할 프로젝트 소개 글 설정 |
| `diary.path` | 개발일지 Markdown 경로 |
| `diary.assets_path` | 이미지, GIF 저장 경로 |
| `history.path` | HISTORY.md 경로 |
| `publish.mode` | MVP에서는 `auto` |
| `publish.target_blog_repo` | 발행 대상 블로그 repo |
| `privacy.default_visibility` | 기본 공개 범위 |
| `privacy.exclude_patterns` | 발행 제외 파일 패턴 |

---

## 7. `AGENTS.md` 명세

각 repo에 공용으로 들어갈 `AGENTS.md`는 개발 기록 규칙을 정의한다.

### 7.1 목적

`AGENTS.md`는 사람과 AI coding agent 모두가 따라야 하는 개발 기록 규칙이다.

역할:

```txt
개발 기록 작성 규칙 통일
HISTORY.md 작성 방식 안내
AI 작업 이유와 판단 근거 추적
실행 명령, 결과, 디버깅 방법 기록
되돌림 판단 기준 기록
dev_diary 작성 방식 안내
이미지 저장 규칙 안내
보안 정보 기록 금지
자동 블로그 발행 방식 안내
```

### 7.2 공용 AGENTS.md 예시

````md
# AGENTS.md

version: yuykim14-devlog-kit v1.0.0
source: https://github.com/yuykim/devlog-kit

이 저장소는 yuykim14 Dev Diary 시스템을 사용한다.

## 1. 개발 기록 원칙

코드, 문서, 설정, 구조를 의미 있게 수정한 경우 반드시 개발 기록을 남긴다.

기록은 두 종류로 나뉜다.

1. HISTORY.md
   - 작업 판단 기록
   - 무엇을 했는지, 왜 했는지, 어떤 명령과 검증을 실행했는지, 어떤 디버깅을 했는지 기록
   - 나중에 이전 상태로 돌아갈지 판단할 수 있도록 분기점과 되돌림 기준을 기록

2. dev_diary/YYYY-MM-DD.md
   - 개발 일기
   - 작업 과정, 삽질, 스크린샷, 느낀 점, 다음 할 일을 기록

## 2. HISTORY.md 작성 규칙

각 작업 기록은 아래 형식을 따른다.

### Summary
무엇을 했는가

### Reason
왜 이 작업을 했는가

### Branch Point / Rollback
이 작업이 분기점이 되는 이유와 되돌릴 때 기준은 무엇인가

### Commands / Execution
실행한 명령, 코드, 주요 출력은 무엇인가

### Debugging Notes
확인한 문제, 시도한 방법, 원인 추정은 무엇인가

### Result / Verification
작업 결과와 검증 결과는 무엇인가

## 3. dev_diary 작성 규칙

개발일지는 일기체 + 연구노트체로 작성한다.

필수 항목:

- 오늘 한 일
- 왜 이 작업을 했는가
- 작업 과정
- 중간 결과
- 막힌 점
- 느낀 점
- 다음 할 일

가능하면 다음 자료를 포함한다.

- 스크린샷
- GIF
- 에러 로그 캡처
- 실행 결과 화면
- 실험 사진
- UI 변화 이미지

## 4. 이미지 저장 규칙

이미지는 다음 경로에 저장한다.

dev_diary/assets/YYYY-MM-DD-description.png

예:

dev_diary/assets/2026-05-26-realsense-test.png
dev_diary/assets/2026-05-26-error-log.png
dev_diary/assets/2026-05-26-demo.gif

## 5. 블로그 발행 규칙

.devlog.yml에서 enabled: true인 저장소만 블로그에 자동 발행한다.

push 시 자동으로 yuykim14 Dev Diary 블로그에 반영된다.

## 6. 공개 범위 규칙

개발일지는 기본적으로 public이다.

단, frontmatter에 아래 값이 있으면 발행하지 않는다.

visibility: "private"

## 7. 보안 규칙

다음 정보는 절대 기록하지 않는다.

- API key
- access token
- password
- secret key
- 개인정보
- 학교/회사 내부 기밀 자료
- 공개하면 안 되는 실험 데이터
- .env 파일 내용

## 8. 문체 규칙

개발일지는 너무 딱딱한 보고서가 아니라 실제 개발 일기처럼 쓴다.

좋은 예:

오늘은 RealSense calibration 구조를 정리했다.
처음에는 단순히 config만 분리하면 될 줄 알았는데,
실제로는 로봇 좌표계와 카메라 좌표계 변환 흐름까지 같이 봐야 했다.

나쁜 예:

- calibration.yaml 추가
- config loader 구현
- test passed

## 9. 자동화 도구 지침

자동화 도구 또는 AI coding agent는 코드를 수정한 뒤 다음을 확인해야 한다.

- HISTORY.md에 작업 이유, 실행 명령, 실행 결과, 디버깅 내용, 되돌림 판단 기준이 기록되었는가
- 필요한 경우 dev_diary/YYYY-MM-DD.md가 갱신되었는가
- 이미지나 결과물이 있다면 dev_diary/assets/에 저장되었는가
- visibility 값이 의도대로 설정되었는가
- 보안 정보가 기록되지 않았는가
````

---

## 8. `HISTORY.md` 템플릿

````md
# HISTORY

이 파일은 저장소의 작업 판단 기록이다.

AI 또는 사람이 어떤 작업을 했을 때 왜 그 작업을 했는지, 어떤 명령과 검증을 실행했는지, 어떤 디버깅을 했는지, 나중에 이전 상태로 돌아갈 때 무엇을 기준으로 판단해야 하는지를 남긴다.

---

## 2026-05-26 - RealSense calibration 설정 분리

### Summary
- RealSense calibration 값을 코드에서 분리했다.
- `config/calibration.yaml` 파일을 추가했다.
- 초기화 로직에서 calibration config를 읽도록 수정했다.

### Reason
- 실험마다 calibration 값을 직접 코드에서 바꾸는 방식이 불편했다.
- 좌표계 보정값을 반복적으로 비교해야 해서 설정 파일 기반 구조가 필요했다.
- 이후 AI가 calibration 관련 코드를 수정할 때, 하드코딩된 값이 아니라 설정 파일을 기준으로 판단하게 하기 위해 분리했다.

### Branch Point / Rollback
- 이 수정 이후 calibration 값의 기준 위치는 코드 내부가 아니라 `config/calibration.yaml`이다.
- 값 적용이 불안정하거나 실험 결과가 이전보다 나빠지면 이 변경 전의 하드코딩 방식과 현재 config 기반 방식을 비교한다.
- 되돌릴 경우 `config/calibration.yaml` 로딩 경로와 loader 적용 코드를 우선 확인한다.

### Commands / Execution
```bash
python scripts/run_calibration_test.py --config config/calibration.yaml
pytest tests/test_calibration_loader.py
```

실행 결과:

```txt
calibration config loaded
2 passed
```

### Debugging Notes
- 처음에는 yaml 경로를 상대 경로로만 처리해서 다른 작업 디렉터리에서 실행할 때 파일을 찾지 못했다.
- repo root 기준 경로로 변환하도록 loader를 수정했다.
- 카메라 좌표계와 로봇 좌표계 변환이 실제로 맞는지는 아직 실제 장비 테스트가 필요하다.

### Result / Verification
- 실험 환경별 calibration parameter 교체가 쉬워졌다.
- loader 단위 테스트는 통과했다.
- 다음 실험에서 ChArUco 기반 보정값을 적용해 실제 좌표 오차를 확인해야 한다.
````

---

## 9. `dev_diary` 템플릿

경로:

```txt
dev_diary/YYYY-MM-DD.md
```

예시:

```md
---
title: "RealSense calibration 구조 정리"
date: "2026-05-26"
project: "Physical AI Pipetting"
project_slug: "physical-ai-pipetting"
mood: "삽질 많았지만 진전 있음"
tags:
  - robotics
  - realsense
  - calibration
thumbnail: "./assets/2026-05-26-realsense-test.png"
visibility: "public"
---

# 오늘 한 일

오늘은 RealSense calibration 값을 코드에서 분리하는 작업을 했다.

기존에는 transform 값이 코드 안에 직접 들어가 있어서 실험할 때마다 값을 바꾸기가 불편했다.
그래서 calibration 값을 yaml 파일로 분리하고, 초기화 시점에 불러오는 구조로 바꾸었다.

# 왜 이 작업을 했는가

Physical AI pipetting 실험에서는 카메라 좌표계와 로봇 좌표계의 정렬이 중요하다.
그런데 실험 환경이 조금만 바뀌어도 calibration 값을 다시 적용해야 한다.

하드코딩 구조로는 반복 실험을 하기가 어렵기 때문에,
설정 파일 기반 구조가 필요했다.

# 작업 과정

## 1. calibration.yaml 추가

`config/calibration.yaml` 파일을 만들고 transform 값을 분리했다.

## 2. loader 함수 작성

초기화 시 yaml 파일을 읽어서 calibration parameter를 적용하도록 수정했다.

## 3. 기존 코드 정리

기존에 코드 안에 직접 들어가 있던 값을 제거했다.

# 중간 결과

아직 실제 로봇 좌표계와 완전히 맞는지는 확인하지 못했다.
하지만 적어도 실험마다 값을 바꾸는 과정은 훨씬 편해졌다.

![RealSense 테스트 화면](./assets/2026-05-26-realsense-test.png)

# 막힌 점

좌표계 변환 흐름을 다시 보니 생각보다 정리가 안 되어 있었다.
단순히 config만 분리하면 될 줄 알았는데,
카메라 기준 좌표와 로봇 기준 좌표가 어디서 변환되는지도 같이 정리해야 했다.

# 느낀 점

오늘은 기능을 새로 만든 느낌보다는 실험을 위한 기반을 정리한 느낌이다.
겉으로 보기에는 큰 변화가 없어 보이지만,
나중에 반복 실험을 생각하면 꼭 필요한 작업이었다.

# 다음 할 일

- ChArUco 기반 calibration 테스트
- 실제 로봇 좌표계 오차 측정
- grasp pose 보정값 비교

# 관련 커밋

- 자동 삽입 예정
```

---

## 10. 블로그 repo 구조

Astro 기준 구조는 다음과 같다.

```txt
yuykim-dev-diary/
├─ package.json
├─ astro.config.mjs
├─ tsconfig.json
├─ public/
│  └─ images/
│     └─ devlog/
│        └─ physical-ai-pipetting/
│           └─ 2026-05-26/
│              ├─ 2026-05-26-realsense-test.png
│              └─ 2026-05-26-error-log.png
├─ src/
│  ├─ content/
│  │  ├─ config.ts
│  │  ├─ devlog/
│  │  │  └─ physical-ai-pipetting/
│  │  │     └─ 2026-05-26.md
│  │  └─ projects/
│  │     └─ physical-ai-pipetting.json
│  ├─ layouts/
│  │  ├─ BaseLayout.astro
│  │  └─ DiaryLayout.astro
│  ├─ components/
│  │  ├─ DiaryCard.astro
│  │  ├─ TimelineGroup.astro
│  │  ├─ ProjectCard.astro
│  │  ├─ ImageGallery.astro
│  │  ├─ MoodBadge.astro
│  │  ├─ TagList.astro
│  │  ├─ PixelFrame.astro
│  │  └─ GameHeader.astro
│  ├─ pages/
│  │  ├─ index.astro
│  │  ├─ diary/
│  │  │  └─ [...slug].astro
│  │  ├─ projects/
│  │  │  ├─ index.astro
│  │  │  └─ [slug].astro
│  │  └─ tags/
│  │     └─ [tag].astro
│  └─ styles/
│     └─ global.css
└─ .github/
   └─ workflows/
      ├─ receive-devlog.yml
      └─ deploy.yml
```

---

## 11. Astro Content Collection 스키마

파일:

```txt
src/content/config.ts
```

예시:

```ts
import { defineCollection, z } from "astro:content";

const devlog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    type: z.enum(["diary", "project_intro"]).default("diary"),
    project: z.string(),
    project_slug: z.string(),
    mood: z.string().optional(),
    tags: z.array(z.string()).default([]),
    thumbnail: z.string().optional(),
    visibility: z.enum(["public", "private"]).default("public"),
    source_repo: z.string().optional(),
    source_commit: z.string().optional(),
  }),
});

const projects = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    repo_url: z.string().optional(),
    thumbnail: z.string().optional(),
  }),
});

export const collections = {
  devlog,
  projects,
};
```

---

## 11.1 Astro 배포 설정

블로그 repo가 `yuykim.github.io`가 아니라 프로젝트 사이트 repo인 `yuykim-dev-diary`이므로 GitHub Pages 기본 도메인에서는 base path가 필요하다.

파일:

```txt
astro.config.mjs
```

설정:

```js
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://yuykim.github.io",
  base: "/yuykim-dev-diary",
});
```

따라서 MVP 블로그 URL은 다음과 같다.

```txt
https://yuykim.github.io/yuykim-dev-diary/
```

---

## 12. 블로그 UI / 디자인 명세

### 12.1 전체 디자인 컨셉

테마는 **옛날 도트 게임 개발 일기장**이다.

키워드:

```txt
retro pixel game
old arcade
Galaga
dark navy background
magenta neon
cyan neon
neon green
game controller
pixel border
scanline
terminal diary
```

### 12.2 색상 팔레트

추천 CSS 변수:

```css
:root {
  --bg-main: #050816;
  --bg-panel: #0b1026;
  --bg-card: #111936;

  --text-main: #e6f1ff;
  --text-muted: #8ea0c0;

  --neon-magenta: #ff2bd6;
  --neon-blue: #00d9ff;
  --neon-green: #39ff14;
  --neon-yellow: #fff200;

  --border-neon: #00d9ff;
  --danger-pixel: #ff3864;
}
```

### 12.3 배경

배경은 검정색과 남색을 섞은 어두운 레트로 게임 화면 느낌으로 한다.

```txt
기본 배경: 거의 검정에 가까운 남색
패널 배경: 살짝 밝은 남색
카드 배경: 네온 테두리가 있는 어두운 박스
```

선택 효과:

```txt
- 아주 약한 scanline 효과
- 미세한 grid overlay
- 별/우주 배경 느낌
- Galaga 느낌의 작은 픽셀 아이콘
```

### 12.4 포인트 컬러

```txt
마젠타: 제목, 강조선, 버튼 hover
네온블루: 링크, 카드 테두리, active 상태
네온그린: 성공, 완료, commit 정보
노랑: warning, today badge
```

### 12.5 이모지 / 아이콘

사이트 곳곳에 레트로 게임 이모지를 포인트로 사용한다.

예:

```txt
🎮 yuykim14 Dev Diary
👾 Project Log
🚀 Today’s Build
🕹️ Continue
💾 Save Point
🛠️ Fix Log
📸 Screenshot
🧪 Lab Note
🟢 Success
🔴 Bug
⚡ Push
```

### 12.6 폰트

추천:

```txt
제목: 픽셀 느낌 폰트
본문: 가독성 좋은 sans-serif
코드: monospace
```

가능한 폰트 후보:

```txt
Press Start 2P
Pixelify Sans
DungGeunMo
Pretendard
JetBrains Mono
```

주의:

픽셀 폰트는 본문 전체에 사용하지 않는다. 본문에 쓰면 가독성이 나빠질 수 있다.

권장:

```txt
로고 / 큰 제목 / 버튼 / badge = 픽셀 폰트
본문 = Pretendard 또는 system sans-serif
코드 = JetBrains Mono
```

### 12.7 카드 스타일

개발일지 카드는 옛날 게임 UI 패널처럼 보이게 한다.

```txt
- 어두운 남색 박스
- 1~2px 네온 테두리
- hover 시 네온 glow
- 카드 상단에 날짜
- 카드 안에 프로젝트 badge
- mood badge
- 썸네일
- "PRESS START TO READ" 같은 버튼
```

예시 문구:

```txt
PRESS START TO READ
LOAD DIARY
OPEN LOG
CONTINUE ▶
```

---

## 13. 페이지별 UI 명세

### 13.1 홈 `/`

역할:

```txt
전체 개발일지를 최신순으로 보여주는 타임라인
```

디자인:

```txt
상단:
🎮 yuykim14 Dev Diary
A retro pixel-style development diary.

메인:
날짜별 타임라인

각 날짜 그룹:
2026.05.26 TUE  |  SAVE POINT

각 카드:
프로젝트명
제목
mood
요약
썸네일
태그
PRESS START TO READ 버튼
```

와이어프레임:

```txt
┌──────────────────────────────────────────────┐
│ 🎮 yuykim14 Dev Diary                         │
│ A retro pixel-style development diary.        │
├──────────────────────────────────────────────┤
│ 2026.05.26 TUE  💾 SAVE POINT                 │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ 👾 Physical AI Pipetting                 │ │
│ │ RealSense calibration 구조 정리          │ │
│ │ mood: 삽질 많았지만 진전 있음            │ │
│ │ [thumbnail]                              │ │
│ │ #robotics #realsense #calibration        │ │
│ │ PRESS START TO READ ▶                    │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### 13.2 개발일지 상세 `/diary/[slug]`

역할:

```txt
하루 개발일지 전문을 보여주는 페이지
```

디자인:

```txt
상단에 게임 세이브 슬롯처럼 정보 표시

SAVE SLOT 2026-05-26
PROJECT: Physical AI Pipetting
MOOD: 삽질 많았지만 진전 있음
STATUS: PUBLIC
```

본문:

```txt
Markdown 본문 렌더링
이미지 크게 표시
코드 블록은 터미널처럼 표시
관련 커밋은 네온그린 텍스트
```

하단:

```txt
원본 repo 링크
source commit 링크
이전 글 / 다음 글
```

### 13.3 프로젝트 목록 `/projects`

역할:

```txt
연결된 프로젝트 목록 표시
```

디자인:

```txt
게임 캐릭터 선택 화면 느낌
각 프로젝트를 카드로 표시
```

카드 정보:

```txt
프로젝트 이름
카테고리
태그
최근 업데이트 날짜
총 diary 개수
repo 링크
```

### 13.4 프로젝트 상세 `/projects/[slug]`

역할:

```txt
특정 프로젝트의 모든 개발일지와 이미지 모아보기
```

디자인:

```txt
프로젝트별 게임 스테이지 화면 느낌
```

구성:

```txt
PROJECT STAGE: Physical AI Pipetting
Description
Tech tags
Repository link

Recent Logs
Gallery
```

### 13.5 태그 페이지 `/tags/[tag]`

역할:

```txt
태그별 개발일지 목록
```

예:

```txt
/tags/robotics
/tags/unity
/tags/database
```

---

## 14. 자동 발행 방식

### 14.1 정책

사용자는 다음 정책을 선택했다.

```txt
push하면 바로 블로그 반영
단, visibility: private이면 제외
```

따라서 workflow는 PR을 만들지 않고 블로그 repo에 직접 commit한다.

MVP에서 source repo가 blog repo에 repository_dispatch 이벤트를 보내기 위한 GitHub token 이름은 다음으로 고정한다.

```txt
BLOG_DISPATCH_TOKEN
```

이 token은 AI API token이 아니라 GitHub Personal Access Token이다.

권한은 다음처럼 설정한다.

```txt
Token type: fine-grained Personal Access Token
Repository access: Only selected repositories
Selected repository: yuykim/yuykim-dev-diary
Repository permissions: Contents read/write
```

GitHub REST API의 repository_dispatch 생성 endpoint는 fine-grained token에서 `Contents` write 권한을 요구한다.

private source repo까지 연결해야 하는 경우에는 blog repo가 source repo를 checkout할 수 있도록 `SOURCE_REPO_READ_TOKEN`을 추가로 사용할 수 있다. 첫 MVP에서는 public source repo를 기준으로 시작한다.

### 14.2 개발 repo workflow

파일:

```txt
.github/workflows/publish-devlog.yml
```

목표:

```txt
- main branch push 시 실행
- HISTORY.md, dev_diary/**, .devlog.yml 변경 시에만 실행
- .devlog.yml이 있는지 확인
- 블로그 repo에 repository_dispatch 이벤트 전송
```

예시:

```yml
name: Publish Dev Diary

on:
  push:
    branches:
      - main
    paths:
      - "HISTORY.md"
      - "dev_diary/**"
      - ".devlog.yml"

jobs:
  publish:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout source repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Check devlog config exists
        run: |
          test -f .devlog.yml

      - name: Send repository dispatch to blog
        env:
          BLOG_TOKEN: ${{ secrets.BLOG_DISPATCH_TOKEN }}
          SOURCE_REPO: ${{ github.repository }}
          SOURCE_SHA: ${{ github.sha }}
        run: |
          curl -X POST \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer $BLOG_TOKEN" \
            https://api.github.com/repos/yuykim/yuykim-dev-diary/dispatches \
            -d "{
              \"event_type\": \"devlog_updated\",
              \"client_payload\": {
                \"source_repo\": \"$SOURCE_REPO\",
                \"source_sha\": \"$SOURCE_SHA\"
              }
            }"
```

### 14.3 블로그 repo workflow

파일:

```txt
.github/workflows/receive-devlog.yml
```

목표:

```txt
- repository_dispatch 이벤트 수신
- source repo checkout
- .devlog.yml 읽기
- enabled 확인
- visibility private 제외
- dev_diary Markdown 복사
- assets 복사
- 이미지 경로 변환
- source_repo, source_commit 추가
- 보안 패턴 검사
- 블로그 repo에 직접 commit
```

예시:

```yml
name: Receive Dev Diary

on:
  repository_dispatch:
    types:
      - devlog_updated

jobs:
  receive:
    runs-on: ubuntu-latest

    permissions:
      contents: write

    steps:
      - name: Checkout blog repository
        uses: actions/checkout@v4

      - name: Checkout source repository
        uses: actions/checkout@v4
        with:
          repository: ${{ github.event.client_payload.source_repo }}
          path: source-repo
          fetch-depth: 2

      - name: Install dependencies
        run: npm ci

      - name: Import dev diary
        run: |
          node scripts/import-devlog.js \
            --source ./source-repo \
            --repo "${{ github.event.client_payload.source_repo }}" \
            --sha "${{ github.event.client_payload.source_sha }}"

      - name: Commit changes
        run: |
          git config user.name "devlog-bot"
          git config user.email "devlog-bot@users.noreply.github.com"
          git add src/content public/images
          git commit -m "docs: import dev diary from ${{ github.event.client_payload.source_repo }}" || echo "No changes"
          git push
```

---

## 15. `import-devlog.js` 명세

파일:

```txt
scripts/import-devlog.js
```

### 15.1 입력

```txt
--source
- source repo checkout 경로

--repo
- source repo 이름
- 예: yuykim/gfootball-RLfootball-Imitation_Learning

--sha
- source commit sha
```

### 15.2 처리 순서

```txt
1. source repo의 .devlog.yml 읽기
2. enabled가 true인지 확인
3. project 정보 읽기
4. src/content/projects/{project_slug}.json 생성 또는 갱신
5. 해당 project_slug가 처음 import되는 경우 프로젝트 소개 글 생성
6. dev_diary/*.md 파일 목록 읽기
7. visibility가 private인 diary는 제외
8. 각 diary의 frontmatter 읽기
9. project_slug를 기준으로 블로그 content 경로 생성
10. Markdown 파일을 src/content/devlog/{project_slug}/로 복사
11. assets를 public/images/devlog/{project_slug}/{date}/로 복사
12. Markdown 내부 이미지 경로를 Astro base path가 포함된 블로그 public 경로로 변환
13. thumbnail 경로도 Astro base path가 포함된 블로그 public 경로로 변환
14. source_repo, source_commit frontmatter 추가
15. secret-like pattern 검사
16. 같은 날짜 글은 덮어쓰기
17. 완료 로그 출력
```

### 15.3 프로젝트 소개 글 생성 규칙

이미 개발이 끝난 repo를 처음 연결할 수 있으므로, 해당 프로젝트가 어떤 repo인지 설명하는 소개 글을 처음 import 때 자동 생성한다.

생성 조건:

```txt
- src/content/projects/{project_slug}.json이 새로 생성되는 경우
- 또는 src/content/devlog/{project_slug}/_intro.md가 아직 없는 경우
- .devlog.yml의 project.intro.publish_on_first_import가 true인 경우
```

생성 위치:

```txt
src/content/devlog/{project_slug}/_intro.md
```

포함 내용:

```txt
- 프로젝트 이름
- 원본 repo 링크
- project.description
- category
- tags
- 처음 연결된 날짜
- source_repo
- source_commit
- "이 글은 기존 개발 repo를 Dev Diary에 처음 연결하면서 생성된 프로젝트 소개 글"이라는 설명
```

프로젝트 소개 글은 일반 개발일지와 구분하기 위해 frontmatter에 `type: "project_intro"`를 넣는다.

프로젝트 소개 글의 `date`는 처음 import한 날짜를 사용한다.

### 15.4 이미지 경로 변환 규칙

원본 diary:

```md
![RealSense 테스트](./assets/2026-05-26-realsense-test.png)
```

블로그 content 변환 후:

```md
![RealSense 테스트](/yuykim-dev-diary/images/devlog/physical-ai-pipetting/2026-05-26/2026-05-26-realsense-test.png)
```

thumbnail 원본:

```yml
thumbnail: "./assets/2026-05-26-realsense-test.png"
```

thumbnail 변환 후:

```yml
thumbnail: "/yuykim-dev-diary/images/devlog/physical-ai-pipetting/2026-05-26/2026-05-26-realsense-test.png"
```

GitHub Pages 프로젝트 사이트는 `/yuykim-dev-diary` base path 아래에서 서비스되므로, Markdown 본문과 thumbnail에 들어가는 public asset 경로에도 base path를 포함한다.

### 15.5 출력 파일 예시

```txt
src/content/devlog/physical-ai-pipetting/2026-05-26.md
public/images/devlog/physical-ai-pipetting/2026-05-26/2026-05-26-realsense-test.png
src/content/projects/physical-ai-pipetting.json
```

---

## 16. 중복 발행 규칙

하루 1개 글을 기본으로 한다.

따라서 다음 파일은 블로그에서도 하나의 글로 유지된다.

```txt
dev_diary/2026-05-26.md
```

같은 파일이 수정되어 다시 push되면 기존 블로그 글을 갱신한다.

```txt
source: dev_diary/2026-05-26.md
target: src/content/devlog/{project_slug}/2026-05-26.md
```

예외적으로 같은 날 여러 글을 쓰고 싶다면 다음처럼 허용할 수 있다.

```txt
dev_diary/2026-05-26.md
dev_diary/2026-05-26-realsense.md
dev_diary/2026-05-26-ui.md
```

그러나 기본 UX는 하루 1개 글을 전제로 설계한다.

---

## 17. 보안 / 프라이버시 요구사항

자동 발행 시스템이므로 보안 검사를 반드시 수행한다.

### 17.1 발행 제외 frontmatter

다음 값이 있으면 블로그에 발행하지 않는다.

```yml
visibility: "private"
```

### 17.2 발행 제외 파일 패턴

다음 파일은 복사하거나 발행하지 않는다.

```txt
.env
*.key
*.pem
secrets/**
private/**
credentials/**
*.sqlite
*.db
```

### 17.3 secret-like pattern 검사

`import-devlog.js`는 Markdown 본문에서 다음 패턴을 발견하면 발행을 중단한다.

```txt
OPENAI_API_KEY
GITHUB_TOKEN
password=
secret=
api_key=
BEGIN PRIVATE KEY
access_token
```

발행 중단 시 로그:

```txt
Publishing blocked: possible secret detected in dev_diary/2026-05-26.md
```

---

## 18. 공용 devlog-kit

### 18.1 목적

`devlog-kit`은 모든 repo에 공통으로 설치되는 규칙, 템플릿, workflow를 관리한다.

### 18.2 구조

```txt
devlog-kit/
├─ AGENTS.md
├─ README.md
├─ templates/
│  ├─ HISTORY_TEMPLATE.md
│  ├─ DIARY_TEMPLATE.md
│  └─ DEVLOG_CONFIG_TEMPLATE.yml
├─ workflows/
│  └─ publish-devlog.yml
├─ scripts/
│  ├─ install-devlog-kit.js
│  ├─ new-diary.js
│  └─ sync-agents.js
└─ package.json
```

### 18.3 설치 방식

최종 목표:

```bash
npx yuykim14-devlog-kit install
```

MVP에서는 다음 방식도 허용한다.

```txt
devlog-kit에서 파일을 복사해서 각 repo에 붙여넣기
```

### 18.4 new diary 명령어

```bash
npx yuykim14-devlog-kit new
```

실행 결과:

```txt
dev_diary/YYYY-MM-DD.md 생성
```

기존 파일이 있으면 덮어쓰지 않는다.

옵션:

```bash
npx yuykim14-devlog-kit new --title "RealSense calibration 구조 정리"
```

---

## 19. 페이지 기능 요구사항

### 19.1 홈 `/`

필수 기능:

```txt
- 최신 개발일지를 날짜별로 그룹핑
- 최신순 정렬
- 프로젝트명 표시
- 제목 표시
- mood 표시
- thumbnail 표시
- tags 표시
- PRESS START TO READ 버튼 표시
```

### 19.2 개발일지 상세 `/diary/[slug]`

필수 기능:

```txt
- Markdown 렌더링
- 이미지 렌더링
- 코드 블록 렌더링
- mood badge
- tag list
- source repo link
- source commit link
- 이전/다음 글 이동
```

### 19.3 프로젝트 목록 `/projects`

필수 기능:

```txt
- 연결된 프로젝트 목록 표시
- 프로젝트별 diary 개수 표시
- 최근 업데이트 날짜 표시
- 카테고리 표시
- repo link 표시
```

### 19.4 프로젝트 상세 `/projects/[slug]`

필수 기능:

```txt
- 프로젝트 설명
- 프로젝트 태그
- repo link
- 해당 프로젝트의 diary 목록
- 해당 프로젝트 이미지 갤러리
```

### 19.5 태그 페이지 `/tags/[tag]`

필수 기능:

```txt
- 특정 태그를 가진 diary 목록 표시
```

---

## 20. MVP 범위

### 20.1 반드시 구현할 것

```txt
1. Astro 블로그 기본 구조
2. yuykim14 Dev Diary 레트로 도트 게임 디자인
3. devlog content collection
4. projects content collection
5. 홈 타임라인 페이지
6. diary 상세 페이지
7. projects 목록 페이지
8. project 상세 페이지
9. tag 페이지
10. import-devlog.js
11. source repo publish-devlog.yml
12. blog repo receive-devlog.yml
13. GitHub Pages deploy workflow
14. AGENTS.md 템플릿
15. HISTORY.md 템플릿
16. dev_diary 템플릿
17. .devlog.yml 템플릿
18. visibility: private 발행 제외
19. 기본 secret-like pattern 검사
20. 이미지 경로 변환
```

### 20.2 MVP에서 제외할 것

```txt
- AI 자동 글쓰기
- 댓글 기능
- 로그인
- 웹 UI에서 repo 선택
- Velog 동시 발행
- 검색 기능
- RSS
- 월간 회고 자동 생성
- 이미지 자동 압축
- Git LFS 자동 설정
```

---

## 21. 향후 2차 기능

```txt
1. 검색 기능
2. 태그 필터 UI
3. RSS feed
4. 월간 개발 회고 자동 생성
5. AI 기반 diary 초안 생성
6. commit diff 요약 자동 삽입
7. GitHub Issues / PR 자동 연결
8. 이미지 자동 압축
9. GIF 최적화
10. 프로젝트별 통계
11. Velog 백업 발행
12. private preview 모드
```

---

## 22. Codex 구현 지시문

아래 지시문을 Codex에게 그대로 전달할 수 있다.

```txt
You are implementing "yuykim14 Dev Diary", a personal automated development diary blog system.

Build an Astro-based GitHub Pages blog that imports development diary Markdown files from multiple GitHub repositories.

The system must use the following decisions:

- Blog name: yuykim14 Dev Diary
- Default visibility: public
- Posts with visibility: private must not be published
- Publishing mode: auto publish on push
- Source repositories store images in dev_diary/assets
- Default post unit: one editable post per day
- Writing style: diary-like + research-note-like
- Design theme: retro pixel game style
- Background: black / dark navy
- Accent colors: neon magenta, neon blue, neon green
- Use small game-like emoji accents such as 🎮, 👾, 🕹️, 💾, 🚀, 📸

Implement:

1. Astro project structure.
2. Content collections:
   - devlog
   - projects
3. Pages:
   - /
   - /diary/[slug]
   - /projects
   - /projects/[slug]
   - /tags/[tag]
4. Components:
   - DiaryCard
   - TimelineGroup
   - ProjectCard
   - ImageGallery
   - MoodBadge
   - TagList
   - PixelFrame
   - GameHeader
5. CSS:
   - dark navy background
   - neon pixel borders
   - magenta / cyan / green accents
   - readable body typography
   - pixel-style headers and buttons
   - mobile responsive layout
6. Source repository convention:
   - AGENTS.md
   - .devlog.yml
   - HISTORY.md
   - dev_diary/YYYY-MM-DD.md
   - dev_diary/assets/*
7. Node script `scripts/import-devlog.js`:
   - reads `.devlog.yml` from checked-out source repo
   - skips repo if `enabled` is not true
   - creates a project intro post on first import so already-finished repositories can be introduced in the blog
   - reads diary Markdown files
   - skips posts with `visibility: private`
   - copies Markdown files into `src/content/devlog/{project_slug}/`
   - copies assets into `public/images/devlog/{project_slug}/{date}/`
   - rewrites relative image paths with the `/yuykim-dev-diary` base path
   - rewrites thumbnail path with the `/yuykim-dev-diary` base path
   - injects `source_repo` and `source_commit` frontmatter
   - creates or updates `src/content/projects/{project_slug}.json`
   - blocks publishing if secret-like patterns are detected
   - overwrites same-date posts so that daily diary can be continuously updated
8. GitHub Actions:
   - source repo workflow triggers on changes to HISTORY.md, dev_diary/**, or .devlog.yml
   - source repo sends repository_dispatch to blog repo
   - blog repo receives repository_dispatch
   - blog repo checks out source repo
   - blog repo runs import-devlog.js
   - blog repo commits changes directly
   - GitHub Pages deploys automatically
9. Templates:
   - AGENTS.md
   - HISTORY_TEMPLATE.md
   - DIARY_TEMPLATE.md
   - DEVLOG_CONFIG_TEMPLATE.yml
   - HISTORY_TEMPLATE.md must record Summary, Reason, Branch Point / Rollback, Commands / Execution, Debugging Notes, and Result / Verification.
10. Do not implement:
   - AI writing
   - login
   - comments
   - external CMS
   - Velog publishing
   - web dashboard for repo selection
   - RSS in MVP

Prioritize a working MVP over extra features.
The result should feel like an old arcade pixel-game diary, not a generic corporate tech blog.
```

---

## 23. 결정된 구현 설정

현재 MVP 구현에 필요한 주요 설정은 다음처럼 결정되었다.

### 23.1 실제 GitHub repo 이름

```txt
blog repo: yuykim/yuykim-dev-diary
first source repo: yuykim/gfootball-RLfootball-Imitation_Learning
```

### 23.2 도메인

```txt
GitHub Pages 기본 도메인으로 시작
```

### 23.3 폰트

```txt
제목: Pixelify Sans
본문: Pretendard
코드: JetBrains Mono
```

### 23.4 HISTORY.md 노출

```txt
HISTORY.md는 블로그에 직접 노출하지 않는다.
필요하면 GitHub 원본 repo에서 확인한다.
```

### 23.5 자동 설치 수준

```txt
MVP: 파일 수동 복사 또는 간단한 install script
2차: npx yuykim14-devlog-kit install
```

### 23.6 아직 구현 중 정하면 되는 것

```txt
- 첫 프로젝트 소개 글의 실제 문장
```

---

## 24. 최종 요약

`yuykim14 Dev Diary`는 각 개발 repo의 `dev_diary/YYYY-MM-DD.md`와 `dev_diary/assets/`를 원본으로 삼아, push할 때마다 자동으로 GitHub Pages 블로그에 반영되는 개발 일기장 시스템이다.

이 시스템의 핵심은 다음이다.

```txt
HISTORY.md = 작업 이유, 실행 기록, 디버깅 기록, 되돌림 판단 기준
dev_diary/YYYY-MM-DD.md = 블로그 원본
dev_diary/assets/* = 이미지 자료
.devlog.yml = 연결 여부 및 프로젝트 정보
GitHub Actions = 자동 발행
Astro = 레트로 픽셀 게임풍 블로그 UI
```

최종 사용 경험은 다음과 같아야 한다.

```txt
개발하다가 기록한다.
스크린샷을 넣는다.
push한다.
블로그에 자동으로 오늘의 개발 일기가 올라간다.
```

블로그는 일반 기술 블로그가 아니라, 어두운 남색 배경에 네온 마젠타, 네온블루, 네온그린 포인트가 들어간 옛날 도트 게임풍 개인 개발 일기장이어야 한다.

🎮 **yuykim14 Dev Diary**
👾 **Write code. Save logs. Continue tomorrow.**
