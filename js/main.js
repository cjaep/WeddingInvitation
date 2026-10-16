(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const enc = encodeURIComponent;
  const PAGE_SIZE = 10;

  // "a.b.c" 경로로 CONFIG 값 읽기
  function get(path) {
    return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), CONFIG);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  // ───── 1. 텍스트/링크 바인딩 ─────
  function bindAll() {
    $$("[data-bind]").forEach((el) => {
      const v = get(el.dataset.bind);
      el.textContent = v == null ? "" : v;
    });

    // data-show="path": 값이 없으면 요소 숨김
    $$("[data-show]").forEach((el) => {
      if (!get(el.dataset.show)) el.hidden = true;
    });

    // data-href="tel:path" 형태: 프로토콜 + CONFIG 경로
    $$("[data-href]").forEach((el) => {
      const [, proto, path] = el.dataset.href.match(/^(\w+:)?(.+)$/);
      const v = get(path);
      if (v) el.setAttribute("href", (proto || "") + v);
    });
  }

  function renderGreeting() {
    $("#greetingBody").innerHTML = CONFIG.greeting.body
      .map((line) => (line === "" ? "<br />" : escapeHtml(line) + "<br />"))
      .join("");
  }

  function renderCover() {
    const img = new Image();
    img.onload = () => $("#coverPhoto").classList.add("loaded");
    img.src = CONFIG.mainPhoto;
    $("#coverPhoto").style.backgroundImage = `url("${CONFIG.mainPhoto}")`;
  }

  function renderDday() {
    const target = new Date(CONFIG.wedding.iso);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const diff = Math.round((targetDay - today) / 86400000);
    const el = $("#dday");
    if (diff > 0) el.textContent = `D-${diff}`;
    else if (diff === 0) el.textContent = "D-DAY";
    else el.textContent = "";
    if (!el.textContent) el.hidden = true;
  }

  // ───── 2. 달력 ─────
  function renderCalendar() {
    // ISO 문자열에서 연·월·일을 직접 읽어 시간대 영향을 피합니다
    const iso = CONFIG.wedding.iso;
    const year = Number(iso.slice(0, 4));
    const month = Number(iso.slice(5, 7));
    const day = Number(iso.slice(8, 10));

    $("#calHead").textContent = `${year}년 ${month}월`;

    const first = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const labels = ["일", "월", "화", "수", "목", "금", "토"];

    const cells = labels.map((l, i) => `<div class="dow${i === 0 ? " sun" : ""}">${l}</div>`);
    for (let i = 0; i < first; i++) cells.push("<div></div>");
    for (let d = 1; d <= lastDate; d++) {
      const dow = (first + d - 1) % 7;
      const cls = ["day"];
      if (dow === 0) cls.push("sun");
      if (dow === 6) cls.push("sat");
      if (d === day) cls.push("wedding");
      cells.push(`<div class="${cls.join(" ")}" ${d === day ? 'aria-label="예식일"' : ""}>${d}</div>`);
    }
    $("#calendarGrid").innerHTML = cells.join("");
  }

  // ───── 3. 갤러리 + 라이트박스 ─────
  const photos = [];
  let current = 0;

  function renderGallery() {
    const { count, path, ext } = CONFIG.gallery;
    const grid = $("#galleryGrid");
    for (let i = 1; i <= count; i++) {
      const src = `${path}${String(i).padStart(2, "0")}.${ext}`;
      photos.push(src);
      const btn = document.createElement("button");
      btn.className = "gallery-item";
      btn.type = "button";
      btn.setAttribute("aria-label", `사진 ${i} 크게 보기`);
      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = `웨딩 사진 ${i}`;
      img.src = src;
      img.onerror = () => {
        btn.innerHTML = `<div class="placeholder">사진 ${i}</div>`;
        btn.disabled = true;
        btn.style.cursor = "default";
      };
      btn.appendChild(img);
      btn.addEventListener("click", () => openLightbox(i - 1));
      grid.appendChild(btn);
    }
  }

  function openLightbox(index) {
    current = index;
    updateLightbox();
    $("#lightbox").hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    $("#lightbox").hidden = true;
    document.body.style.overflow = "";
  }

  function moveLightbox(step) {
    current = (current + step + photos.length) % photos.length;
    updateLightbox();
  }

  function updateLightbox() {
    $("#lbImg").src = photos[current];
    $("#lbImg").alt = `웨딩 사진 ${current + 1}`;
    $("#lbCount").textContent = `${current + 1} / ${photos.length}`;
  }

  function bindLightbox() {
    $("#lbClose").addEventListener("click", closeLightbox);
    $("#lbPrev").addEventListener("click", () => moveLightbox(-1));
    $("#lbNext").addEventListener("click", () => moveLightbox(1));
    $("#lightbox").addEventListener("click", (e) => {
      if (e.target.id === "lightbox") closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if ($("#lightbox").hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") moveLightbox(-1);
      if (e.key === "ArrowRight") moveLightbox(1);
    });

    // 스와이프
    let startX = null;
    const lb = $("#lightbox");
    lb.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) moveLightbox(dx < 0 ? 1 : -1);
      startX = null;
    });
  }

  // ───── 4. 계좌 복사 ─────
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // 보안 컨텍스트가 아닐 때의 대체 방법
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    return Promise.resolve();
  }

  function renderAccounts() {
    const groups = [
      { title: "신랑측", list: CONFIG.accounts.groom },
      { title: "신부측", list: CONFIG.accounts.bride },
    ];
    $("#accountGroups").innerHTML = groups
      .map((g) => `
        <div class="acc-group">
          <h3>${g.title}</h3>
          ${g.list.map((a) => `
            <div class="acc">
              <div class="meta">
                <div class="bank">${escapeHtml(a.bank)} · ${escapeHtml(a.holder)}</div>
                <div class="num">${escapeHtml(a.number)}</div>
              </div>
              <button class="btn-ghost" type="button" data-copy="${escapeHtml(a.number)}">복사</button>
            </div>`).join("")}
        </div>`)
      .join("");

    $("#accountGroups").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-copy]");
      if (!btn) return;
      copyText(btn.dataset.copy).then(() => toast("계좌번호를 복사했어요"));
    });
  }

  // ───── 5. 지도 앱 연결 ─────
  function renderMapLinks() {
    const q = CONFIG.mapQuery;
    // 페이지 안의 지도 미리보기 (API 키 없이 표시되는 구글 지도 임베드)
    $("#mapFrame").src = `https://www.google.com/maps?q=${enc(q)}&output=embed`;
    $("#mapNaver").href = `https://map.naver.com/v5/search/${enc(q)}`;
    // 카카오 길찾기 링크: 목적지 좌표를 넣으면 카카오맵/카카오내비에서 바로 길안내가 시작됩니다
    const { name, lat, lng } = CONFIG.destination;
    $("#mapKakaoNavi").href = `https://map.kakao.com/link/to/${enc(name)},${lat},${lng}`;
    $("#mapTmap").href = `tmap://search?name=${enc(CONFIG.mapName)}`;
  }

  // ───── 6. 참석 여부 ─────
  function renderSideRadios() {
    $("#sideRadios").innerHTML = CONFIG.rsvpSides
      .map((s, i) => `<label><input type="radio" name="side" value="${s.value}" ${i === 0 ? "checked" : ""} /> ${s.label}</label>`)
      .join("");
  }

  function setMsg(el, msg, isError) {
    el.textContent = msg;
    el.style.color = isError ? "#b5544c" : "";
  }

  // 구글 앱스크립트는 CORS 우회를 위해 text/plain 본문으로 받습니다
  async function apiPost(payload) {
    const res = await fetch(CONFIG.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async function apiGet(params) {
    const url = CONFIG.apiUrl + "?" + new URLSearchParams(params).toString();
    const res = await fetch(url);
    return res.json();
  }

  function bindRsvp() {
    $("#rsvpForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const msg = $("#rsvpMsg");
      const btn = $("#rsvpSubmit");
      const data = new FormData(form);
      const name = (data.get("name") || "").trim();

      if (!name) return setMsg(msg, "성함을 입력해 주세요", true);
      if (!form.consent.checked) return setMsg(msg, "개인정보 수집·이용에 동의해 주세요", true);
      if (!CONFIG.apiUrl) return setMsg(msg, "아직 저장 설정이 되지 않았어요 (관리자 설정 필요)", true);

      btn.disabled = true;
      btn.textContent = "전달 중...";
      try {
        const result = await apiPost({
          type: "rsvp",
          side: data.get("side"),
          attend: data.get("attend"),
          meal: data.get("meal"),
          name,
          guests: Number(data.get("guests") || 0),
          userAgent: navigator.userAgent.slice(0, 120),
        });
        if (!result.ok) throw new Error(result.error || "저장 실패");
        setMsg(msg, "참석 여부가 전달되었어요. 감사합니다!", false);
        form.reset();
        renderSideRadios();
        toast("전달되었습니다");
      } catch (err) {
        setMsg(msg, "전달에 실패했어요. 잠시 후 다시 시도해 주세요.", true);
      } finally {
        btn.disabled = false;
        btn.textContent = "전달하기";
      }
    });
  }

  // ───── 7. 방명록 ─────
  let guestItems = [];
  let guestShown = 0;

  function renderGuestList() {
    const list = $("#guestList");
    if (!guestItems.length) {
      list.innerHTML = `<li class="guest-empty">첫 번째 축하 메시지를 남겨 주세요</li>`;
      $("#guestMore").hidden = true;
      return;
    }
    const slice = guestItems.slice(0, guestShown);
    list.innerHTML = slice.map((g) => `
      <li>
        <span class="gname">${escapeHtml(g.name)}</span>
        <span class="gdate">${escapeHtml(g.date || "")}</span>
        <p class="gmsg">${escapeHtml(g.message)}</p>
      </li>`).join("");
    $("#guestMore").hidden = guestShown >= guestItems.length;
  }

  async function loadGuestbook() {
    if (!CONFIG.apiUrl) {
      $("#guestList").innerHTML = `<li class="guest-empty">방명록 연결 전입니다</li>`;
      return;
    }
    try {
      const result = await apiGet({ action: "guestbook" });
      guestItems = result.items || [];
      guestShown = PAGE_SIZE;
      renderGuestList();
    } catch (err) {
      $("#guestList").innerHTML = `<li class="guest-empty">방명록을 불러오지 못했어요</li>`;
    }
  }

  function bindGuestbook() {
    $("#guestMore").addEventListener("click", () => {
      guestShown += PAGE_SIZE;
      renderGuestList();
    });

    $("#guestForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const msg = $("#guestMsg");
      const btn = $("#guestSubmit");
      const name = form.name.value.trim();
      const message = form.message.value.trim();

      if (!name || !message) return setMsg(msg, "이름과 메시지를 입력해 주세요", true);
      if (!CONFIG.apiUrl) return setMsg(msg, "아직 저장 설정이 되지 않았어요 (관리자 설정 필요)", true);

      btn.disabled = true;
      btn.textContent = "남기는 중...";
      try {
        const result = await apiPost({ type: "guestbook", name, message });
        if (!result.ok) throw new Error(result.error || "저장 실패");
        form.reset();
        setMsg(msg, "메시지를 남겨 주셔서 감사합니다", false);
        await loadGuestbook();
      } catch (err) {
        setMsg(msg, "남기지 못했어요. 잠시 후 다시 시도해 주세요.", true);
      } finally {
        btn.disabled = false;
        btn.textContent = "남기기";
      }
    });
  }

  // ───── 8. 배경음악 ─────
  function bindMusic() {
    const btn = $("#musicBtn");
    const audio = $("#bgm");
    btn.addEventListener("click", async () => {
      if (!audio.src) audio.src = CONFIG.bgm;
      if (audio.paused) {
        try {
          await audio.play();
          btn.classList.add("playing");
        } catch (err) {
          toast("배경음악 파일을 찾을 수 없어요");
        }
      } else {
        audio.pause();
        btn.classList.remove("playing");
      }
    });
    audio.addEventListener("error", () => {
      btn.classList.remove("playing");
    });
  }

  // ───── 9. 공유 ─────
  function bindShare() {
    $("#shareBtn").addEventListener("click", async () => {
      const shareData = {
        title: document.title,
        text: `${CONFIG.wedding.dateText} · ${CONFIG.wedding.venue} ${CONFIG.wedding.hall}`,
        url: location.href,
      };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch (_) { /* 사용자가 취소한 경우 */ }
        return;
      }
      copyText(location.href).then(() => toast("링크를 복사했어요"));
    });
  }

  // ───── 10. 스크롤 효과 ─────
  function bindScrollEffects() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          observer.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach((el) => observer.observe(el));

    // 상단 메뉴는 커버를 지나면 나타남
    const nav = $("#topnav");
    const onScroll = () => {
      nav.classList.toggle("show", window.scrollY > window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ───── 시작 ─────
  function init() {
    bindAll();
    renderGreeting();
    renderCover();
    renderDday();
    renderCalendar();
    renderGallery();
    renderAccounts();
    renderMapLinks();
    renderSideRadios();
    bindLightbox();
    bindRsvp();
    bindGuestbook();
    bindMusic();
    bindShare();
    bindScrollEffects();
    loadGuestbook();
  }

  init();
})();
