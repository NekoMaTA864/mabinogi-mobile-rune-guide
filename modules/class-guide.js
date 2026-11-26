// 模組 6：全 21 職業養成指南（S1 Lv.85，2×3 六卡整併台服 16 卷附魔）＋ S1 核心系統攻略（聖騎士／超越刻印／大師徽章）
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
  let viewGuides, viewSystems, rulesGrid, jobsNav, panel, systemsRoot;

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

  function makeTextRow(labelText, text) {
    const { el } = app;
    const row = el('div', 'growth-kv');
    row.append(el('span', 'growth-k', labelText), el('span', 'growth-inline-txt', text));
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

  function renderS1Systems() {
    if (!systemsRoot || typeof S1_SYSTEM_GUIDES === 'undefined') return;
    const { el } = app;
    const data = S1_SYSTEM_GUIDES;
    systemsRoot.replaceChildren();

    // ① 聖騎士變身與 5 格聖物
    const sec1 = el('section', 'sys-section');
    const h1 = el('div', 'sys-section-head');
    h1.append(el('h2', '', data.paladin.title), el('p', 'panel-meta', data.paladin.subtitle));
    const g1 = el('div', 'two-col-cards');
    g1.style.marginBottom = '0';
    for (const c of data.paladin.cards) {
      const card = el('div', 'guide-card');
      card.append(el('h3', '', c.heading));
      const ul = el('ul');
      for (const item of c.items) ul.append(el('li', '', item));
      card.append(ul);
      g1.append(card);
    }
    sec1.append(h1, g1);

    // ② 8★ 超越刻印與記憶刻印防呆
    const sec2 = el('section', 'sys-section');
    const h2 = el('div', 'sys-section-head');
    h2.append(el('h2', '', data.transcendence.title), el('p', 'panel-meta', data.transcendence.subtitle));

    const priGrid = el('div', 'priority-grid');
    for (const p of data.transcendence.priorityOrder) {
      const pc = el('div', 'priority-card');
      const pt = el('div', 'priority-top');
      pt.append(el('span', 'spec-rank', p.rank), el('strong', '', p.slot));
      pc.append(pt, el('p', 'priority-desc', p.reason));
      priGrid.append(pc);
    }

    const tblWrap = el('div', 'rw-table-wrap');
    const tbl = el('table', 'rw-table');
    const thead = tbl.createTHead();
    const hr = thead.insertRow();
    for (const col of ['超越階段', '適用部位', '所需精華', '所需裝飾', '消耗金幣']) {
      const th = el('th', '', col);
      th.scope = 'col';
      hr.append(th);
    }
    const tb = tbl.createTBody();
    for (const r of data.transcendence.costRows) {
      const tr = tb.insertRow();
      tr.append(
        el('td', '', r.stage),
        el('td', '', r.target),
        el('td', 'num-col', r.essence),
        el('td', '', r.ornament),
        el('td', 'num-col', r.gold)
      );
    }
    tblWrap.append(tbl);

    const memCard = el('div', 'guide-card');
    memCard.append(el('h3', '', '記憶刻印換裝防呆與符文之語連動'));
    const memUl = el('ul');
    for (const tip of data.transcendence.memoryTips) memUl.append(el('li', '', tip));
    memCard.append(memUl);

    sec2.append(h2, priGrid, tblWrap, memCard);

    // ③ 職業大師徽章與精靈痕跡／秘藥
    const sec3 = el('section', 'sys-section');
    const h3 = el('div', 'sys-section-head');
    h3.append(el('h2', '', data.mastery.title), el('p', 'panel-meta', data.mastery.subtitle));
    const g3 = el('div', 'sys-three-grid');
    for (const c of data.mastery.cards) {
      const card = el('div', 'guide-card sys-flex-card');
      card.append(el('h3', '', c.heading));
      const ul = el('ul');
      for (const item of c.items) ul.append(el('li', '', item));
      card.append(ul);
      if (c.link) {
        const aWrap = el('div', 'tool-card-actions');
        aWrap.style.marginTop = 'auto';
        aWrap.style.paddingTop = '10px';
        const a = el('a', 'action-link', c.link.label);
        a.href = c.link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        aWrap.append(a);
        card.append(aWrap);
      }
      g3.append(card);
    }
    sec3.append(h3, g3);

    systemsRoot.append(sec1, sec2, sec3);
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

    // ④ 裝備附魔（台服 S1 現有 16 卷）
    const cEnc = el('article', 'growth-card');
    const enc = data.enchant;
    cEnc.append(el('h3', '', '④ 裝備附魔（台服 S1 現有卷軸）'));
    if (enc) {
      cEnc.append(
        makeTextRow('武器（★6）', enc.weapon),
        makeTextRow('防具（★8）', enc.armor),
        makeTextRow('徽章（★8）', enc.emblem),
        makeTextRow('飾品（★8）', enc.accessory),
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

    // ⑥ 進階養成可選項
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
    systemsRoot = document.querySelector('#s1-systems-root');

    document.querySelectorAll('#tab-growth .mode-tab').forEach(btn => {
      btn.onclick = () => setSubTab(btn.dataset.growth);
    });

    for (const r of GROWTH_GENERAL_RULES) {
      const card = app.el('div', 'guide-card');
      card.append(app.el('h3', '', r.title));
      const ul = app.el('ul');
      for (const pt of r.points) ul.append(app.el('li', '', pt));
      card.append(ul);
      rulesGrid.append(card);
    }

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

    renderS1Systems();
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
