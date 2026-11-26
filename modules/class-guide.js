// 模組 6：全 21 職業養成指南（S1 Lv.85 最新版本）與 S1 核心系統攻略（Phase 6A：附魔卷軸與增幅避坑總表）
// 6 大單職模組：寶石雕琢、技能特化、刻印重設、裝備附魔（S1 卷軸）、等級卡（1~85）、進階養成可選項（2×3 對稱卡片）。
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
  let currentSub = 'guides'; // 'guides' | 'systems'
  let currentJob = null;
  let selectedBtn = null;
  const jobButtons = new Map();

  // DOM 節點
  let viewGuides, viewSystems, rulesGrid, jobsNav, panel;
  let enchantBody, enchantRangesList, enchantPitfallsList;

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

  function setSubTab(sub, updateHash = true) {
    if (sub !== 'guides' && sub !== 'systems') sub = 'guides';
    currentSub = sub;
    document.querySelectorAll('#tab-growth .mode-tab').forEach(btn => {
      btn.setAttribute('aria-selected', String(btn.dataset.growth === sub));
    });
    viewGuides.hidden = sub !== 'guides';
    viewSystems.hidden = sub !== 'systems';
    if (updateHash) app.syncHash();
  }

  function renderEnchantSystemView() {
    if (typeof S1_ENCHANT_CATALOG === 'undefined') return;
    const { el } = app;

    enchantBody.replaceChildren();
    for (const sc of S1_ENCHANT_CATALOG.scrolls) {
      const tr = enchantBody.insertRow();
      const nameTd = el('td');
      nameTd.append(
        el('strong', '', sc.name),
        el('div', 'cell-sub', `${sc.kr} · ${sc.grade}`)
      );
      tr.append(
        el('td', '', sc.slot),
        nameTd,
        el('td', '', sc.effect),
        el('td', '', sc.source),
        el('td', '', sc.fit)
      );
    }

    enchantRangesList.replaceChildren();
    for (const line of S1_ENCHANT_CATALOG.randomRanges) {
      enchantRangesList.append(el('li', '', line));
    }

    enchantPitfallsList.replaceChildren();
    for (const line of S1_ENCHANT_CATALOG.pitfalls) {
      enchantPitfallsList.append(el('li', '', line));
    }
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

    // 6 大養成模組格線（2×3 對稱卡片）
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

    // ② 飾品符文與技能特化
    const cSpec = el('article', 'growth-card');
    cSpec.append(
      el('h3', '', '② 技能特化（飾品符文對應與用法）'),
      makeTagRow('搭配飾品符文', data.skillSpec.runes, 'is-t0')
    );
    const comboRow = el('div', 'growth-kv');
    comboRow.append(el('span', 'growth-k', '對應技能特化'));
    const comboWrap = el('div', 'tag-row');
    for (const c of data.skillSpec.specCombos) {
      comboWrap.append(el('span', 'g-tag is-spec', c));
    }
    comboRow.append(comboWrap);
    const usageBox = el('div', 'usage-callout');
    usageBox.append(
      el('span', 'usage-callout-label', '通常怎麼使用（實戰循環）'),
      el('p', 'usage-callout-text', data.skillSpec.usage)
    );
    cSpec.append(comboRow, usageBox);

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

    // ④ 裝備附魔（S1 魔力賦予卷軸與詞條）
    const cEnc = el('article', 'growth-card');
    const enc = data.enchant;
    const encHead = el('div', 'growth-card-head');
    encHead.append(el('h3', '', '④ 裝備附魔（S1 卷軸與詞條）'));
    const encLink = el('button', 'job-jump-btn', '看卷軸全表 →');
    encLink.type = 'button';
    encLink.onclick = () => setSubTab('systems', true);
    encHead.append(encLink);
    cEnc.append(encHead);
    if (enc) {
      cEnc.append(makeTagRow('S1 武器充能卷', enc.weaponS1, 'is-t0'));
      const altRow = el('div', 'growth-kv');
      altRow.append(el('span', 'growth-k', '武器過渡選擇'), el('span', 'growth-inline-txt', enc.weaponAlt));
      const armRow = el('div', 'growth-kv');
      armRow.append(el('span', 'growth-k', '防具附魔'), el('span', 'growth-inline-txt', enc.armor));
      const accRow = el('div', 'growth-kv');
      accRow.append(el('span', 'growth-k', '飾品附魔'), el('span', 'growth-inline-txt', enc.accessory));
      cEnc.append(
        altRow,
        armRow,
        accRow,
        makeTagRow('隨機詞條優先', enc.randomStats, 'is-t1'),
        el('p', 'growth-tip', enc.tip)
      );
    }

    // ⑤ 等級卡（S1 1～85 級配置）
    const cLv = el('article', 'growth-card');
    const statOrderText = data.levelCards.endgameStats.join(' ＞ ');
    const statRow = el('div', 'growth-kv');
    statRow.append(el('span', 'growth-k', '主屬性優先'), el('strong', 'growth-stat-chain', statOrderText));
    cLv.append(
      el('h3', '', '⑤ 等級卡（S1 1～85 級配置）'),
      statRow,
      makeTagRow('65～85 特殊卡', data.levelCards.s1Milestones, 'is-t1'),
      el('p', 'growth-tip', data.levelCards.tip)
    );

    // ⑥ 進階養成可選項（2×3 第 6 格平衡呈現）
    const cExtra = el('article', 'growth-card');
    cExtra.append(el('h3', '', '⑥ 進階養成可選項（副屬性／強化／寵物）'));
    const stack = el('div', 'extras-stack');
    const extraItems = [
      { label: '戰鬥副屬性收益排序', val: data.extras.subStatOrder },
      { label: '裝備強化先後順序', val: data.extras.enhanceOrder },
      { label: '寵物與稱號挑選方向', val: data.extras.petTitle }
    ];
    for (const ex of extraItems) {
      const box = el('div', 'extra-subcard');
      box.append(el('span', 'extra-subcard-label', ex.label), el('p', 'extra-subcard-val', ex.val));
      stack.append(box);
    }
    cExtra.append(stack);

    grid.append(cGem, cSpec, cEng, cEnc, cLv, cExtra);
    panel.append(grid);
  }

  function openJob(job, updateHash = true) {
    if (!allJobs.includes(job)) return;
    app.setPrimaryTab('growth', false);
    setSubTab('guides', false);
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
    viewGuides = document.querySelector('#growth-view-guides');
    viewSystems = document.querySelector('#growth-view-systems');
    rulesGrid = document.querySelector('#growth-rules-grid');
    jobsNav = document.querySelector('#growth-jobs');
    panel = document.querySelector('#growth-panel');
    enchantBody = document.querySelector('#enchant-table-body');
    enchantRangesList = document.querySelector('#enchant-ranges-list');
    enchantPitfallsList = document.querySelector('#enchant-pitfalls-list');

    document.querySelectorAll('#tab-growth .mode-tab').forEach(btn => {
      btn.onclick = () => setSubTab(btn.dataset.growth);
    });

    // 繪製全職業通用養成法則速查卡
    for (const r of GROWTH_GENERAL_RULES) {
      const card = app.el('div', 'guide-card');
      card.append(app.el('h3', '', r.title));
      const ul = app.el('ul');
      for (const pt of r.points) ul.append(app.el('li', '', pt));
      card.append(ul);
      rulesGrid.append(card);
    }

    // 繪製 6 大職系均齊選擇器
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

    renderEnchantSystemView();
  }

  return {
    init,
    allJobs,
    openJob,
    setSubTab,
    getHashParams() {
      const p = new URLSearchParams();
      p.set('tab', 'growth');
      if (currentSub !== 'guides') {
        p.set('sub', currentSub);
      } else if (currentJob) {
        p.set('job', currentJob);
      }
      return p;
    },
    applyHashParams(params) {
      const sub = params.get('sub');
      const job = params.get('job');
      if (sub === 'systems') {
        setSubTab('systems', false);
      } else if (job && allJobs.includes(job)) {
        openJob(job, false);
      } else {
        setSubTab('guides', false);
      }
    }
  };
})();
