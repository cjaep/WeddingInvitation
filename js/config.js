// 청첩장 설정 파일: 이 파일만 수정하면 문구, 날짜, 계좌, 연동 주소가 모두 바뀝니다.
const CONFIG = {
  // 구글 앱스크립트 웹앱 URL (apps-script/Code.gs 배포 후 입력). 비워두면 참석/방명록이 저장되지 않습니다.
  apiUrl: "https://script.google.com/macros/s/AKfycbx-pInmEE6ZElLHQI-lQGJ0WC6VrLQpWNAUN0tDpFZU0lKNx5G7_Zs1QODrjWfmy5DN0Q/exec",

  groom: {
    name: "최재필",
    parents: "최중섭의 차남",
    phone: "010-0000-0000", // 예시 번호입니다. 실제 번호로 바꿔 주세요. 비워두면 전화 버튼이 숨겨집니다
  },
  bride: {
    name: "김나영",
    parents: "김창수의 장녀",
    phone: "010-0000-0000", // 예시 번호입니다. 실제 번호로 바꿔 주세요
  },

  wedding: {
    // 날짜는 ISO 형식(한국 시간). D-day 계산과 달력 강조에 사용됩니다.
    iso: "2027-06-19T18:00:00+09:00",
    dateText: "2027년 6월 19일 토요일 오후 6시",
    venue: "양재 엘타워",
    hall: "그레이스홀",
    address: "서울특별시 서초구 강남대로 213 (양재동, 엘타워)",
    tel: "02-543-5066",
  },

  greeting: {
    title: "소중한 분들을 초대합니다",
    body: [
      "서로를 가장 편안한 사람으로 아껴온 두 사람이",
      "이제 함께 같은 길을 걸으려 합니다.",
      "",
      "바쁘신 중에도 저희의 새로운 시작을 함께해 주시면",
      "더없는 기쁨이겠습니다.",
    ],
  },

  // 갤러리: assets/photos/01.jpg ~ 로 넣으면 자동 연결됩니다. 사진이 없으면 자리표시자가 보입니다.
  gallery: {
    count: 18, // 아직 없는 사진은 자리표시자로 보입니다. 사진을 넣을 때마다 자동으로 채워집니다
    path: "assets/photos/",
    ext: "jpg",
  },

  // 메인 사진: assets/photos/main.jpg
  mainPhoto: "assets/photos/main.jpg",

  // 배경음악: assets/bgm.mp3 (직접 준비한 음원을 권장합니다)
  bgm: "assets/bgm.mp3",

  accounts: {
    groom: [
      { relation: "신랑", bank: "은행명", number: "000-000-000000", holder: "최재필" },
    ],
    bride: [
      { relation: "신부", bank: "은행명", number: "000-000-000000", holder: "김나영" },
    ],
  },

  // 참석 여부 폼의 측 선택
  rsvpSides: [
    { value: "groom", label: "신랑측" },
    { value: "bride", label: "신부측" },
  ],

  // 지도 미리보기와 지도 앱 검색에 쓰는 주소
  mapQuery: "서울 서초구 강남대로 213 엘타워",
  // 카카오내비 목적지 좌표 (강남대로 213 엘타워 기준, OpenStreetMap 데이터)
  destination: { name: "엘타워", lat: 37.4827304, lng: 127.0348468 },
  mapName: "양재 엘타워",
};
