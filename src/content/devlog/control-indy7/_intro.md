---
title: Control Indy7 프로젝트 소개
date: '2026-05-30'
type: project_intro
project: Control Indy7
project_slug: control-indy7
mood: project setup
tags:
  - robotics
  - indy7
  - teleoperation
  - python
visibility: public
source_repo: yuykim/control_indy7
source_commit: 347cbcc556d55a109bc2b5b599b42d13ff88bfd8
---
# Control Indy7

`Control Indy7`는 Neuromeka Indy7 로봇팔을 Python으로 직접 조작하기 위한 teleoperation 프로젝트다. 핵심 목표는 로봇을 바로 움직이는 코드만 두는 것이 아니라, 실행 전 점검, 에러 복구, 안전 종료, 입력 장치 실험까지 하나의 작업 흐름으로 정리하는 것이다.

## 왜 만들었나

Indy7을 실험에 쓰려면 매번 같은 준비 과정이 반복된다.

- 로봇 컨트롤러와 PC 네트워크 연결 확인
- 서보 활성화
- 로봇 상태 확인
- 에러 상태 복구
- home 위치 복귀
- teleop 시작
- 실험 후 안전 종료

이 과정을 파일별로 나누고, 문제가 생겼을 때 어떤 스크립트를 실행해야 하는지 분명하게 만들기 위해 repo를 구성했다.

## 현재 구성

### 로봇 준비

- `indy7_start.py`: 로봇 연결, 서보 활성화, 상태 확인
- `error.py`: teleop 중단, recover, servo on, 에러 상태 확인
- `indy7_shutdown.py`: home 복귀, motion stop, servo off

### 키보드 제어

- `indy7_keyboard_control_v1.py`: Pygame 입력 루프와 `IndyDCP3` 상대 task teleop 연결
- `W/S`, `A/D`, `Q/E`: X/Y/Z 이동
- `U/O`, `I/K`, `J/L`: RX/RY/RZ 회전
- `[` / `]`: 이동 step size 조절
- `SPACE`: home 위치 복귀

### 진단과 실험

- `check_teleop.py`: teleop 상태와 device 정보 확인
- `check_controller.py`: 외부 컨트롤러 axes/buttons/D-pad 입력 확인
- `indy7_controller.py`: 조이패드 제어 방향으로 확장하기 위한 미완성 실험 파일

## 앞으로 기록할 내용

이 프로젝트의 Dev Diary에는 단순히 “코드를 추가했다”보다 다음 내용을 남길 예정이다.

- 로봇이 실제로 어떻게 반응했는지
- 키맵이나 step size를 왜 바꿨는지
- recover/servo/home 루틴에서 생긴 문제
- Pygame 입력 루프가 로봇 움직임에 어떤 영향을 줬는지
- 키보드 제어에서 조이패드 제어로 확장할 때 생기는 설계 판단

목표는 나중에 다시 Indy7을 세팅할 때, 어떤 순서로 확인하고 어떤 코드를 실행해야 하는지 바로 떠올릴 수 있게 만드는 것이다.
