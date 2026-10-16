/**
 * 청첩장 백엔드: 참석 여부(RSVP)와 방명록을 구글 스프레드시트에 저장합니다.
 *
 * 설정 방법은 README.md의 "구글 스프레드시트 연결" 항목을 참고하세요.
 * 스프레드시트에서 [확장 프로그램 > Apps Script]로 열어야 이 스크립트가 시트에 연결됩니다.
 */

const SHEET_RSVP = "RSVP";
const SHEET_GUESTBOOK = "Guestbook";
const GUESTBOOK_LIMIT = 200; // 방명록 응답 최대 개수

const RSVP_HEADER = ["제출시각", "측", "참석여부", "식사여부", "성함", "동행인수", "기기정보"];
const GUESTBOOK_HEADER = ["작성시각", "이름", "메시지"];

// 방명록 조회: GET 웹앱URL?action=guestbook
function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : "";
  if (action === "guestbook") {
    return jsonResponse({ ok: true, items: readGuestbook() });
  }
  return jsonResponse({ ok: true, message: "wedding api alive" });
}

// 참석 여부 / 방명록 저장: POST 본문(JSON 문자열)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (data.type === "rsvp") {
        saveRsvp(data);
      } else if (data.type === "guestbook") {
        saveGuestbook(data);
      } else {
        return jsonResponse({ ok: false, error: "unknown type" });
      }
    } finally {
      lock.releaseLock();
    }
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function saveRsvp(d) {
  const name = clean(d.name, 20);
  if (!name) throw new Error("이름이 비어 있습니다");

  const sheet = getOrCreateSheet(SHEET_RSVP, RSVP_HEADER);
  sheet.appendRow([
    new Date(),
    clean(d.side, 10),
    d.attend === "yes" ? "참석" : "불참",
    d.meal === "yes" ? "식사" : "안 함",
    name,
    Math.max(0, Math.min(10, Number(d.guests) || 0)),
    clean(d.userAgent, 120),
  ]);
}

function saveGuestbook(d) {
  const name = clean(d.name, 20);
  const message = clean(d.message, 300);
  if (!name || !message) throw new Error("이름과 메시지가 필요합니다");

  const sheet = getOrCreateSheet(SHEET_GUESTBOOK, GUESTBOOK_HEADER);
  sheet.appendRow([new Date(), name, message]);
}

function readGuestbook() {
  const sheet = getOrCreateSheet(SHEET_GUESTBOOK, GUESTBOOK_HEADER);
  const last = sheet.getLastRow();
  if (last < 2) return [];

  const start = Math.max(2, last - GUESTBOOK_LIMIT + 1);
  const rows = sheet.getRange(start, 1, last - start + 1, 3).getValues();
  const tz = Session.getScriptTimeZone();

  return rows
    .reverse()
    .map((r) => ({
      date: Utilities.formatDate(new Date(r[0]), tz, "yyyy.MM.dd"),
      name: String(r[1]),
      message: String(r[2]),
    }));
}

// 시트가 없으면 만들고 머리글을 씁니다
function getOrCreateSheet(name, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(header);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// 입력값 정리: 문자열로 바꾸고, 앞뒤 공백을 제거하고, 길이를 자릅니다
function clean(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
