# 오늘 제주 날씨는?

HTML, CSS, JavaScript와 Vercel 서버 함수로 만든 제주 현재 날씨 웹앱입니다.

## 실행

Vercel CLI의 `vercel dev`로 화면과 서버 함수를 함께 실행하세요. HTML 파일을 직접 열거나 정적 서버만 사용하면 서버 함수가 실행되지 않습니다. 로컬 키는 Git에서 제외된 `.env.local`에 저장할 수 있습니다.

WeatherAPI의 `current.json`에 제주시 좌표와 `lang=ko`를 전달합니다. 기온, 습도, 한국어 날씨 설명, 업데이트 시각을 표시하며 화면 진입과 새로고침 버튼으로 요청합니다.

## Vercel

환경변수 `WEATHER_API_KEY`에 WeatherAPI 키를 저장하세요. `WEATHERAPI_API_KEY`, `WEATHERAPI_KEY` 이름도 지원합니다. 키를 사용할 배포 환경(Production/Preview/Development)을 선택한 뒤 재배포하세요.

Root Directory는 저장소 루트로 설정합니다. `vercel.json`은 정적 출력 폴더 `dist`를 지정하며, 루트의 `api/weather.mjs`는 `/api/weather` 서버 함수로 배포됩니다. 빌드나 패키지 설치는 필요 없습니다.

화면 진입과 새로고침 시 `/api/weather`를 요청합니다. 서버가 환경변수의 키로 WeatherAPI를 호출하고 날씨 데이터만 반환합니다. 사용자는 키를 입력하지 않으며 키는 브라우저나 소스에 포함되지 않습니다.

## 검증

`node --test tests/weather.test.mjs`로 모의 응답을 사용한 서버 및 화면 동작을 검증합니다.
