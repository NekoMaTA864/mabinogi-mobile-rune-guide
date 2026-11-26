// 模組 2：台灣時間（UTC+8）即時排程與紫洞（愛麗沙）倒數儀表板
window.TimerBoard = (() => {
  const DAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const SHORT_DAYS = ['日', '一', '二', '三', '四', '五', '六'];
  const UTC8_MS = 8 * 3600 * 1000;
  const PH_STORAGE_KEY = 'mabi-alissa-purple-hole-anchor';

  let app = null;
  let timerId = null;
  let lastRenderedGameDay = null;
  let lastPhSlotKey = null;

  // 紫洞基準時刻（毫秒 UTC）與是否為自訂校準
  let phAnchorMs = Date.parse(SCHEDULE_CONFIG.purpleHole.defaultAnchorIso);
  let phIsCustom = false;

  // DOM 節點
  let clockMain, clockSub, timerGrid, phUpcomingEl, phAnchorMetaEl;
  let phInputEl, phApplyBtn, phNowBtn, phResetBtn;
  let dungeonHero, dungeonBody, bhList;

  function pad(n) {
    return String(Math.floor(n)).padStart(2, '0');
  }

  function formatDuration(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSec / 86400);
    const hrs = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (days > 0) return `${days} 天 ${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  // 以 UTC+8 計算台北時間（不依賴使用者電腦時區）
  function getTaipeiParts(ms) {
    const d = new Date(ms + UTC8_MS);
    return {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      date: d.getUTCDate(),
      day: d.getUTCDay(),
      hour: d.getUTCHours(),
      min: d.getUTCMinutes(),
      sec: d.getUTCSeconds()
    };
  }

  function taipeiToUtcMs(year, month, date, hour, min = 0, sec = 0) {
    return Date.UTC(year, month - 1, date, hour, min, sec) - UTC8_MS;
  }

  function formatTaipeiShort(ms) {
    const p = getTaipeiParts(ms);
    return `${pad(p.month)}/${pad(p.date)}（${SHORT_DAYS[p.day]}）${pad(p.hour)}:${pad(p.min)}`;
  }

  function formatTaipeiFull(ms) {
    const p = getTaipeiParts(ms);
    return `${p.year}/${pad(p.month)}/${pad(p.date)}（${SHORT_DAYS[p.day]}）${pad(p.hour)}:${pad(p.min)}:${pad(p.sec)}`;
  }

  function toDatetimeLocalValue(ms) {
    const p = getTaipeiParts(ms);
    return `${p.year}-${pad(p.month)}-${pad(p.date)}T${pad(p.hour)}:${pad(p.min)}`;
  }

  function parseTaipeiDatetimeLocal(str) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec((str || '').trim());
    if (!m) return null;
    return taipeiToUtcMs(
      Number(m[1]), Number(m[2]), Number(m[3]),
      Number(m[4]), Number(m[5]), Number(m[6] || 0)
    );
  }

  function loadSavedAnchor() {
    const defMs = Date.parse(SCHEDULE_CONFIG.purpleHole.defaultAnchorIso);
    phAnchorMs = defMs;
    phIsCustom = false;
    try {
      const saved = localStorage.getItem(PH_STORAGE_KEY);
      if (saved) {
        const parsed = Date.parse(saved);
        if (!Number.isNaN(parsed)) {
          phAnchorMs = parsed;
          phIsCustom = true;
        }
      }
    } catch (_) {}
  }

  function saveAnchor(ms, isCustom) {
    phAnchorMs = ms;
    phIsCustom = isCustom;
    try {
      if (isCustom) localStorage.setItem(PH_STORAGE_KEY, new Date(ms).toISOString());
      else localStorage.removeItem(PH_STORAGE_KEY);
    } catch (_) {}
    lastPhSlotKey = null;
    if (phInputEl) phInputEl.value = toDatetimeLocalValue(phAnchorMs);
    renderTick();
  }

  // 計算紫洞（愛麗沙）目前狀態與接下來 3 場開啟時刻
  function computePurpleHole(nowMs) {
    const ph = SCHEDULE_CONFIG.purpleHole;
    const cycleMs = ph.cycleMins * 60 * 1000;
    const durMs = ph.durationMins * 60 * 1000;
    const preMs = ph.preAlertMins * 60 * 1000;

    // 找出小於等於 nowMs 的最近一次開啟時間 prevStart
    const k = Math.floor((nowMs - phAnchorMs) / cycleMs);
    const prevStart = phAnchorMs + k * cycleMs;
    const prevEnd = prevStart + durMs;
    const nextStart = prevStart + cycleMs;

    let card;
    let upcoming;
    if (nowMs >= prevStart && nowMs < prevEnd) {
      card = {
        label: `紫洞（${ph.serverLabel}）`,
        status: '開啟中（15分）',
        active: true,
        isPurple: true,
        isPreAlert: false,
        value: formatDuration(prevEnd - nowMs),
        detail: `本場於 ${formatTaipeiShort(prevStart)} 開啟，距離入口關閉剩餘時間（可壓秒進場）。`
      };
      upcoming = [nextStart, nextStart + cycleMs, nextStart + cycleMs * 2];
    } else {
      const remain = nextStart - nowMs;
      const isPreAlert = remain <= preMs;
      card = {
        label: `紫洞（${ph.serverLabel}）`,
        status: isPreAlert ? '1 小時內預告' : `下場 ${formatTaipeiShort(nextStart)}`,
        active: false,
        isPurple: true,
        isPreAlert,
        value: formatDuration(remain),
        detail: isPreAlert
          ? `預計 ${formatTaipeiShort(nextStart)} 開啟（遊戲內狩獵場已廣播預告，每次存在 15 分鐘）。`
          : `週期 36 小時 15 分（存在 15 分鐘，不扣藍／紅洞次數）；停機維護後可於下方校準。`
      };
      upcoming = [nextStart, nextStart + cycleMs, nextStart + cycleMs * 2];
    }

    return {
      card,
      upcoming,
      slotKey: `${phAnchorMs}_${upcoming[0]}`
    };
  }

  function computeEvents(nowMs) {
    const cfg = SCHEDULE_CONFIG;
    const t = getTaipeiParts(nowMs);

    // 遊戲日（減去 6 小時，00:00~05:59 仍算前一個遊戲日）
    const gameD = new Date(nowMs + UTC8_MS - cfg.resetHour * 3600 * 1000);
    const gameDayIndex = gameD.getUTCDay();
    const gameDateStr = `${gameD.getUTCFullYear()}/${pad(gameD.getUTCMonth() + 1)}/${pad(gameD.getUTCDate())}（${DAY_NAMES[gameDayIndex]}）`;

    // 1. 紫洞（愛麗沙）倒數推算
    const phState = computePurpleHole(nowMs);

    // 2. 野外首領（每日 12:00 / 18:00 / 20:00 / 22:00，開打前 10 分可預入、持續 30 分）
    let bossCard = null;
    for (const offsetDay of [0, 1]) {
      for (const hr of cfg.fieldBossHours) {
        const startMs = taipeiToUtcMs(t.year, t.month, t.date + offsetDay, hr, 0, 0);
        const preMs = startMs - cfg.fieldBossPreEntryMins * 60 * 1000;
        const endMs = startMs + cfg.fieldBossDurationMins * 60 * 1000;
        if (nowMs >= startMs && nowMs < endMs) {
          bossCard = {
            label: '野外首領',
            status: '進行中',
            active: true,
            value: formatDuration(endMs - nowMs),
            detail: `${pad(hr)}:00 場次進行中，距離首領消失剩餘時間（每日 12/18/20/22 點）。`
          };
          break;
        }
        if (nowMs >= preMs && nowMs < startMs) {
          bossCard = {
            label: '野外首領',
            status: '可預先入場',
            active: true,
            value: formatDuration(startMs - nowMs),
            detail: `${pad(hr)}:00 場次已開放預先入場（開打前 10 分鐘可先進場等候）。`
          };
          break;
        }
        if (startMs > nowMs) {
          bossCard = {
            label: '野外首領',
            status: `下場 ${pad(hr)}:00`,
            active: false,
            value: formatDuration(startMs - nowMs),
            detail: '每日 12:00 / 18:00 / 20:00 / 22:00 出現（前 10 分鐘可入場，持續 30 分鐘）。'
          };
          break;
        }
      }
      if (bossCard) break;
    }

    // 3. 不詳的召喚結界（每日 06:00 起每逢整點出現，地面黑氣約 3 分鐘後召喚）
    const curHourStart = taipeiToUtcMs(t.year, t.month, t.date, t.hour, 0, 0);
    const prepEnd = curHourStart + cfg.summonBarrierPrepMins * 60 * 1000;
    const nextHourStart = curHourStart + 3600 * 1000;
    let barrierCard;
    if (nowMs >= curHourStart && nowMs < prepEnd) {
      barrierCard = {
        label: '不詳的召喚結界',
        status: '黑氣出現中',
        active: true,
        value: formatDuration(prepEnd - nowMs),
        detail: `${pad(t.hour)}:00 結界已於狩獵場現身，距離召喚石出怪約剩餘時間。`
      };
    } else {
      const nextHr = (t.hour + 1) % 24;
      barrierCard = {
        label: '不詳的召喚結界',
        status: `下場 ${pad(nextHr)}:00`,
        active: false,
        value: formatDuration(nextHourStart - nowMs),
        detail: '每日 06:00 起每隔 1 小時整點於狩獵場出現，約 3 分鐘後召喚怪物與首領。'
      };
    }

    return {
      taipeiClock: `${t.year}/${pad(t.month)}/${pad(t.date)}（${DAY_NAMES[t.day]}） ${pad(t.hour)}:${pad(t.min)}:${pad(t.sec)}`,
      gameDateStr,
      gameDayIndex,
      phState,
      cards: [phState.card, bossCard, barrierCard]
    };
  }

  function renderPurpleHolePanel(phState) {
    const { el } = app;
    const ph = SCHEDULE_CONFIG.purpleHole;

    phAnchorMetaEl.textContent = phIsCustom
      ? `目前基準（自訂校準・${ph.serverLabel}）：${formatTaipeiFull(phAnchorMs)}`
      : `目前基準（內建預設・${ph.serverLabel}）：${formatTaipeiFull(phAnchorMs)} · ${ph.defaultAnchorNote}`;

    phUpcomingEl.replaceChildren();
    phState.upcoming.forEach((ts, idx) => {
      const item = el('div', 'ph-slot');
      item.append(
        el('span', 'ph-slot-idx', idx === 0 ? '下一場' : `第 ${idx + 1} 場`),
        el('strong', 'ph-slot-time', formatTaipeiShort(ts))
      );
      phUpcomingEl.append(item);
    });
  }

  function renderWeekdayDungeons(gameDayIndex) {
    const { el } = app;
    const list = SCHEDULE_CONFIG.weekdayDungeons;
    const today = list.find(d => d.dayIndex === gameDayIndex) || list[0];

    dungeonHero.replaceChildren();
    dungeonHero.append(
      el('strong', '', `今日週幾地下城（${today.dayLabel}）：${today.name}`),
      el('p', '', `核心獎勵：${today.reward}｜${today.note}`)
    );

    dungeonBody.replaceChildren();
    for (const item of list) {
      const tr = dungeonBody.insertRow();
      if (item.dayIndex === gameDayIndex) tr.className = 'is-today';
      tr.append(
        el('td', '', item.dayIndex === gameDayIndex ? `${item.dayLabel}（今日）` : item.dayLabel),
        el('td', '', item.name),
        el('td', '', item.reward)
      );
    }
  }

  function renderTick() {
    const { el } = app;
    const state = computeEvents(Date.now());
    clockMain.textContent = state.taipeiClock;
    clockSub.textContent = `目前遊戲日（06:00 換日）：${state.gameDateStr} · 時區固定以台北時間（UTC+8）換算`;

    timerGrid.replaceChildren();
    for (const c of state.cards) {
      let cls = 'timer-card';
      if (c.isPurple) cls += ' is-purple-hole';
      if (c.active) cls += ' is-active-event';
      else if (c.isPreAlert) cls += ' is-pre-alert';

      const card = el('article', cls);
      const top = el('div', 'timer-card-top');
      top.append(el('span', 'timer-label', c.label), el('span', 'timer-status', c.status));
      card.append(top, el('div', 'timer-value', c.value), el('p', 'timer-detail', c.detail));
      timerGrid.append(card);
    }

    if (lastPhSlotKey !== state.phState.slotKey) {
      lastPhSlotKey = state.phState.slotKey;
      renderPurpleHolePanel(state.phState);
    }

    if (lastRenderedGameDay !== state.gameDayIndex) {
      lastRenderedGameDay = state.gameDayIndex;
      renderWeekdayDungeons(state.gameDayIndex);
    }
  }

  function init(ctx) {
    app = ctx;
    clockMain = document.querySelector('#clock-main');
    clockSub = document.querySelector('#clock-sub');
    timerGrid = document.querySelector('#timer-grid');
    phUpcomingEl = document.querySelector('#ph-upcoming');
    phAnchorMetaEl = document.querySelector('#ph-anchor-meta');
    phInputEl = document.querySelector('#ph-anchor-input');
    phApplyBtn = document.querySelector('#ph-apply-btn');
    phNowBtn = document.querySelector('#ph-now-btn');
    phResetBtn = document.querySelector('#ph-reset-btn');
    dungeonHero = document.querySelector('#dungeon-hero');
    dungeonBody = document.querySelector('#dungeon-body');
    bhList = document.querySelector('#blackhole-links');

    loadSavedAnchor();
    if (phInputEl) phInputEl.value = toDatetimeLocalValue(phAnchorMs);

    phApplyBtn.onclick = () => {
      const parsed = parseTaipeiDatetimeLocal(phInputEl.value);
      if (parsed === null) {
        app.showToast('請輸入有效的台北時間日期與時刻');
        return;
      }
      saveAnchor(parsed, true);
      app.showToast(`已更新愛麗莎紫洞基準：${formatTaipeiShort(parsed)}`);
    };

    phNowBtn.onclick = () => {
      const now = Date.now();
      saveAnchor(now, true);
      app.showToast(`已將愛麗莎紫洞基準設為現在（${formatTaipeiShort(now)}）`);
    };

    phResetBtn.onclick = () => {
      const defMs = Date.parse(SCHEDULE_CONFIG.purpleHole.defaultAnchorIso);
      saveAnchor(defMs, false);
      app.showToast('已恢復內建愛麗莎紫洞基準時間');
    };

    // 建立動態黑洞回報站快連卡片
    for (const site of SCHEDULE_CONFIG.blackHoleTrackers) {
      const a = app.el('a', 'quick-link-card');
      a.href = site.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.append(app.el('strong', '', `${site.name} ↗`), app.el('span', '', site.desc));
      bhList.append(a);
    }

    renderTick();
  }

  function start() {
    renderTick();
    if (!timerId) timerId = setInterval(renderTick, 1000);
  }

  function stop() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  return { init, start, stop };
})();
