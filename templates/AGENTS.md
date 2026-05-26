# AGENTS.md

version: yuykim14-devlog-kit v1.0.0
source: https://github.com/yuykim/yuykim-dev-diary

이 저장소는 yuykim14 Dev Diary 시스템을 사용한다.

## 1. 개발 기록 원칙

코드, 문서, 설정, 구조를 의미 있게 수정한 경우 반드시 개발 기록을 남긴다.

기록은 두 종류로 나뉜다.

1. `HISTORY.md`
   - 작업 판단 기록
   - 작업 이유, 실행 명령, 실행 결과, 디버깅 내용, 되돌림 판단 기준을 기록

2. `dev_diary/YYYY-MM-DD.md`
   - 블로그에 올라갈 개발 일기 원본
   - 작업 과정, 삽질, 스크린샷, 느낀 점, 다음 할 일을 기록

## 2. 보안 규칙

다음 정보는 기록하지 않는다.

- API key
- access token
- password
- secret key
- 개인정보
- 내부 기밀 자료
- `.env` 파일 내용

## 3. 자동화 도구 지침

AI coding agent는 코드를 수정한 뒤 다음을 확인한다.

- `HISTORY.md`에 작업 이유와 검증 결과가 기록되었는가
- 필요한 경우 `dev_diary/YYYY-MM-DD.md`가 갱신되었는가
- 이미지나 결과물이 있다면 `dev_diary/assets/`에 저장되었는가
- `visibility` 값이 의도대로 설정되었는가
- 보안 정보가 기록되지 않았는가
