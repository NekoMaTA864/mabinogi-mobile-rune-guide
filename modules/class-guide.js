// 模組 6：全 21 職業養成指南（寶石雕琢、技能特化、刻印重設、等級卡、進階可選項）
// 與符文中心採完全一致的 6 大職系均齊選擇器，並支援同職業一鍵雙向互跳。
window.ClassGuide = (() => {
  const families = {
    戰士系列: ['戰士', '大劍戰士', '劍術士', '騎士'],
    弓手系列: ['弓箭手', '長弓兵', '弩弓手'],
    魔法師系列: ['魔法師', '火焰術士', '冰結術士', '電擊術士'],
    治癒師系列: ['治癒師', '祭司', '修道士', '暗黑術士'],
    吟遊詩人系列: ['吟遊詩人', '舞者', '樂師'],
    盜賊系列: ['盜賊', '雙劍士', '格鬥家']
  };
  const allJobs = Object.values(families).flat();

  let app = null;
  let currentJob = null;
  let selectedBtn = null;
  const jobButtons = new Map();

  // DOM 節點
  let rulesGrid, jobsNav, panel;

  function makeTagRow(labelText, items, tagClass) {
    const { el } = app;
    const row = el('div', 'growth-kv');
    row.append(el('span', 'growth-k', labelText));
    const tags = el('div', 'tag-row');
    for (const txt of items) {
      tags.append(el('span', `g-tag ${tagClass}`, txt));
    }
    row.append(tags);
    return row;
  }

  function renderPanel(job) {
    const { el, showToast, syncHash } = app;
    const data = CLASS_GROWTH_GUIDES[job];
    panel.replaceChildren();
    if (!data) return;

    // 標題與操作列
    const head = el('div', 'panel-head');
    const titleWrap = el('div');
    const titleRow = el('div', 'growth-title-row');
    titleRow.append(el('h2', '', `${job}｜職業養成指南`));
    const stCls = data.status === 'verified'
      ? 'rc-tag is-verified'
      : data.status === 'kr_preview' ? 'rc-tag is-draft' : 'rc-tag';
    titleRow.append(el('span', stCls, data.statusLabel), el('span', 'rc-tag is-live', data.roleTag));
    titleWrap.append(titleRow, el('p', 'panel-meta', data.summary));

    const tools = el('div', 'panel-tools');
    const jumpRuneBtn = el('button', 'tool-btn is-primary', `查看「${job}」符文配裝 →`);
    jumpRuneBtn.type = 'button';
    jumpRuneBtn.onclick = () => {
      if (window.RuneCenter) RuneCenter.openJob(job, null, true);
    };

    const shareBtn = el('button', 'tool-btn', '複製連結');
    shareBtn.type = 'button';
    shareBtn.onclick = async () => {
      syncHash();
      try {
        await navigator.clipboard.writeText(location.href);
        showToast(`已複製「${job}」養成指南分享連結`);
      } catch (_) {
        showToast('已更新網址列，可直接複製網址分享');
      }
    };
    tools.append(jumpRuneBtn, shareBtn);
    head.append(titleWrap, tools);
    panel.append(head);

    // 5 大養成模組格線（4 張 2×2 核心卡 ＋ 1 張滿版進階可選項）
    const grid = el('div', 'growth-grid');

    // ① 寶石雕琢
    const cGem = el('article', 'growth-card');
    cGem.append(
      el('h3', '', '① 寶石雕琢（技能標籤優先級）'),
      makeTagRow('T0 必留標籤', data.gemCarving.t0, 'is-t0'),
      makeTagRow('T1 次選標籤', data.gemCarving.t1, 'is-t1'),
      makeTagRow('建議洗掉', data.gemCarving.avoid, 'is-avoid'),
      el('p', 'growth-tip', data.gemCarving.tip)
    );

    // ② 技能特化
    const cSpec = el('article', 'growth-card');
    cSpec.append(el('h3', '', '② 技能特化（30 等優先與流派核心）'));
    const ol = el('ol', 'spec-list');
    data.skillSpec.priority.forEach((sk, idx) => {
      const li = el('li');
      li.append(el('span', 'spec-rank', `優先 ${idx + 1}`), el('span', '', sk));
      ol.append(li);
    });
    const runeRow = el('div', 'growth-kv');
    runeRow.append(el('span', 'growth-k', '核心飾品聯動'), el('span', 'g-tag is-t1', data.skillSpec.runeLink));
    cSpec.append(ol, runeRow, el('p', 'growth-tip', data.skillSpec.tip));

    // ③ 刻印重設
    const cEng = el('article', 'growth-card');
    cEng.append(
      el('h3', '', '③ 刻印重設（裝備附加詞條選擇）'),
      makeTagRow('武／飾 T0 畢業', data.engravingReset.offenseT0, 'is-t0'),
      makeTagRow('武／飾 T1 可留', data.engravingReset.offenseT1, 'is-t1'),
      makeTagRow('防具／徽章建議', data.engravingReset.defense, 'is-def'),
      makeTagRow('建議避坑洗掉', data.engravingReset.avoid, 'is-avoid'),
      el('p', 'growth-tip', data.engravingReset.tip)
    );

    // ④ 等級卡
    const cLv = el('article', 'growth-card');
    const statOrderText = data.levelCards.endgameStats.join(' ＞ ');
    const statRow = el('div', 'growth-kv');
    statRow.append(el('span', 'growth-k', '滿等主屬性優先'), el('strong', 'growth-stat-chain', statOrderText));
    const earlyRow = el('div', 'growth-kv');
    earlyRow.append(el('span', 'growth-k', '1～50 級拓荒'), el('span', 'growth-inline-txt', data.levelCards.early));
    cLv.append(
      el('h3', '', '④ 等級卡（升級獎勵卡配置）'),
      statRow,
      earlyRow,
      el('p', 'growth-tip', data.levelCards.tip)
    );

    // ⑤ 進階養成可選項（滿版 3 欄）
    const cExtra = el('article', 'growth-card is-wide');
    cExtra.append(el('h3', '', '⑤ 進階養成可選項（副屬性／強化順序／寵物與稱號）'));
    const cols = el('div', 'extras-cols');
    const extraItems = [
      { label: '戰鬥副屬性收益排序', val: data.extras.subStatOrder },
      { label: '裝備強化先後順序', val: data.extras.enhanceOrder },
      { label: '寵物與稱號挑選方向', val: data.extras.petTitle }
    ];
    for (const ex of extraItems) {
      const box = el('div', 'extra-subcard');
      box.append(el('span', 'extra-subcard-label', ex.label), el('p', 'extra-subcard-val', ex.val));
      cols.append(box);
    }
    cExtra.append(cols);

    grid.append(cGem, cSpec, cEng, cLv, cExtra);
    panel.append(grid);
  }

  function openJob(job, updateHash = true) {
    if (!allJobs.includes(job)) return;
    app.setPrimaryTab('growth', false);
    const btn = jobButtons.get(job);
    if (!btn) return;
    if (selectedBtn) selectedBtn.setAttribute('aria-pressed', 'false');
    selectedBtn = btn;
    currentJob = job;
    btn.setAttribute('aria-pressed', 'true');
    panel.hidden = false;
    renderPanel(job);
    if (updateHash) app.syncHash();
  }

  function choose(button, job) {
    const close = selectedBtn === button;
    if (selectedBtn) selectedBtn.setAttribute('aria-pressed', 'false');
    selectedBtn = close ? null : button;
    currentJob = close ? null : job;
    panel.hidden = close;
    if (close) {
      panel.replaceChildren();
      app.syncHash();
      return;
    }
    button.setAttribute('aria-pressed', 'true');
    renderPanel(job);
    app.syncHash();
  }

  function init(ctx) {
    app = ctx;
    rulesGrid = document.querySelector('#growth-rules-grid');
    jobsNav = document.querySelector('#growth-jobs');
    panel = document.querySelector('#growth-panel');

    // 繪製全職業通用養成法則速查卡
    for (const r of GROWTH_GENERAL_RULES) {
      const card = app.el('div', 'guide-card');
      card.append(app.el('h3', '', r.title));
      const ul = app.el('ul');
      for (const pt of r.points) ul.append(app.el('li', '', pt));
      card.append(ul);
      rulesGrid.append(card);
    }

    // 繪製與符文中心一致的 6 大職系均齊選擇器
    for (const [family, names] of Object.entries(families)) {
      const group = app.el('section', 'family');
      group.append(app.el('h2', '', family));
      const row = app.el('div', 'job-btn-row');
      for (const name of names) {
        const b = app.el('button', '', name);
        b.type = 'button';
        b.setAttribute('aria-controls', 'growth-panel');
        b.setAttribute('aria-pressed', 'false');
        b.onclick = () => choose(b, name);
        jobButtons.set(name, b);
        row.append(b);
      }
      group.append(row);
      jobsNav.append(group);
    }
  }

  return {
    init,
    allJobs,
    openJob,
    getHashParams() {
      const p = new URLSearchParams();
      p.set('tab', 'growth');
      if (currentJob) p.set('job', currentJob);
      return p;
    },
    applyHashParams(params) {
      const job = params.get('job');
      if (job && allJobs.includes(job)) {
        openJob(job, false);
      }
    }
  };
})();
