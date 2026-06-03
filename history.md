# HISTORY

이 파일은 yuykim-dev-diary 블로그 운영 중 발생한 문제와 해결 기록이다.

---

## 2026-06-03 - receive-devlog 후 deploy 미자동실행 문제

### Summary
- `receive-devlog.yml`이 성공적으로 실행되어 capstone 콘텐츠를 import했으나
- `deploy.yml`이 자동으로 트리거되지 않아 GitHub Pages에 반영되지 않음

### Reason (원인)
- GitHub Actions 보안 정책: `GITHUB_TOKEN`으로 만든 커밋은 다른 워크플로우를 트리거하지 않음 (무한 루프 방지)
- `receive-devlog.yml`이 import 후 `git push`할 때 `GITHUB_TOKEN`을 사용 → `deploy.yml` 미트리거

### Fix
- `receive-devlog.yml` 마지막에 `workflow_dispatch`로 `deploy.yml`을 직접 호출하는 step 추가
- `GITHUB_TOKEN`은 동일 레포의 `workflow_dispatch`는 트리거 가능

### Result / Verification
- 이후 `receive-devlog.yml` 실행 시 자동으로 `deploy.yml`도 연쇄 실행되어야 함
