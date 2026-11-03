# 오늘 제주 날씨는?

HTML, CSS, JavaScript로 만든 제주 현재 날씨 웹앱입니다.

## 실행

`dist/index.html`을 브라우저에서 열고 WeatherAPI.com에서 발급받은 API 키를 입력하세요. 키는 현재 탭의 sessionStorage에만 저장됩니다. 소스에 키를 넣어 공개하지 마세요.

WeatherAPI의 `current.json`에 제주시 좌표와 `lang=ko`를 전달합니다. 기온, 습도, 한국어 날씨 설명, 업데이트 시각을 표시하며 화면 진입과 새로고침 버튼으로 요청합니다.

## Vercel

이 저장소를 Import하여 배포하세요. `vercel.json`에 정적 출력 폴더 `dist`가 지정되어 있으며 빌드나 패키지 설치는 필요 없습니다. 배포된 페이지에서도 각 사용자가 API 키를 입력합니다.
