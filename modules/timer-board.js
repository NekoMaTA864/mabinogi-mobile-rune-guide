// 模組 2：台灣時間（UTC+8）即時排程與倒數儀表板
window.TimerBoard = (() => {
  const DAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const UTC8_MS = 8 * 3600 * 1000;

  let app = null;
  let timerId = null;
  let lastRenderedGameDay = null;

  // DOM 節點
  let clockMain, clockSub, timerGrid, dungeonHero, dungeonBody, bhList;

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
  function getTaipeiParts(nowMs) {
    const d = new Date(nowMs + UTC8_MS);
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

  function computeEvents(nowMs) {
    const cfg = SCHEDULE_CONFIG;
    const t = getTaipeiParts(nowMs);

    // 遊戲日（減去 6 小時，00:00~05:59 仍算前一個遊戲日）
    const gameD = new Date(nowMs + UTC8_MS - cfg.resetHour * 3600 * 1000);
    const gameDayIndex = gameD.getUTCDay();
    const gameDateStr = `${gameD.getUTCFullYear()}/${pad(gameD.getUTCMonth() + 1)}/${pad(gameD.getUTCDate())}（${DAY_NAMES[gameDayIndex]}）`;

    // 1. 距離每日重置（台北 06:00）
    let nextDaily = taipeiToUtcMs(t.year, t.month, t.date, cfg.resetHour);
    if (nextDaily <= nowMs) nextDaily += 24 * 3600 * 1000;

    // 2. 距離每週重置（台北週一 06:00）
    let daysUntilMon = (cfg.weeklyResetDay - t.day + 7) % 7;
    let nextWeekly = taipeiToUtcMs(t.year, t.month, t.date + daysUntilMon, cfg.resetHour);
    if (nextWeekly <= nowMs) nextWeekly += 7 * 24 * 3600 * 1000;

    // 3. 野外首領（每日 12:00 / 18:00 / 20:00 / 22:00，開打前 10 分可預入、持續 30 分）
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
            detail: `每日 12:00 / 18:00 / 20:00 / 22:00 出現（前 10 分鐘可入場，持續 30 分鐘）。`
          };
          break;
        }
      }
      if (bossCard) break;
    }

    // 4. 不詳的召喚結界（每日 06:00 起每逢整點出現，地面黑氣約 3 分鐘後召喚）
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
      cards: [
        {
          label: '每日重置（06:00）',
          status: '台灣時間',
          active: false,
          value: formatDuration(nextDaily - nowMs),
          detail: '週幾地下城、每日限購與日常次數於每日上午 06:00 重置。'
        },
        {
          label: '每週重置（週一 06:00）',
          status: '台灣時間',
          active: false,
          value: formatDuration(nextWeekly - nowMs),
          detail: '週任務、深淵／團本每週戰利品與每週以物易物於週一 06:00 重置。'
        },
        bossCard,
        barrierCard
      ]
    };
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
      const card = el('article', `timer-card${c.active ? ' is-active-event' : ''}`);
      const top = el('div', 'timer-card-top');
      top.append(el('span', 'timer-label', c.label), el('span', 'timer-status', c.status));
      card.append(top, el('div', 'timer-value', c.value), el('p', 'timer-detail', c.detail));
      timerGrid.append(card);
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
    dungeonHero = document.querySelector('#dungeon-hero');
    dungeonBody = document.querySelector('#dungeon-body');
    bhList = document.querySelector('#blackhole-links');

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
