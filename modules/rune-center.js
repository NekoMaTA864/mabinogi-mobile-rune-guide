// 模組 1：符文中心（依職業查配裝四象限、雙職共用比對、150 顆反查圖鑑、懸停效果浮窗、S1 機制與符文之語）
window.RuneCenter = (() => {
  const families = {
    戰士系: ['戰士', '大劍戰士', '劍術士', '騎士'],
    法師系: ['魔法師', '火焰術士', '冰結術士', '電擊術士'],
    弓手系: ['弓箭手', '長弓兵', '弩弓手'],
    盜賊系: ['盜賊', '雙劍士', '格鬥家'],
    治癒系: ['治癒師', '祭司', '修道士', '暗黑術士'],
    吟遊系: ['吟遊詩人', '舞者', '樂師']
  };

  const allJobs = Object.values(families).flat();
  const jobToFamily = {};
  for (const [fam, names] of Object.entries(families)) {
    for (const name of names) jobToFamily[name] = fam;
  }

  // 四象限固定排版順序：左上武器(0)、右上徽章(1)、左下飾品(3)、右下防具(2)
  const quadrants = [
    { index: 0, label: '武器' },
    { index: 1, label: '徽章' },
    { index: 3, label: '飾品' },
    { index: 2, label: '防具' }
  ];

  const tiers = [
    { code: 'T0', sub: '主選', cls: 'tier-0' },
    { code: 'T1', sub: '次選', cls: 'tier-1' },
    { code: 'T2', sub: '備選', cls: 'tier-2' }
  ];

  const slotOrder = { 武器: 0, 徽章: 1, 防具: 2, 飾品: 3 };
  const slotFilterOpts = ['全部', '武器', '徽章', '防具', '飾品'];
  const traitFilterOpts = [
    { id: 'all', label: '全部特性' },
    { id: 'has-t0', label: '至少一職 T0' },
    { id: 'mythic', label: '8★ 神話' },
    { id: 'defect', label: '含缺陷副作用' },
    { id: 'awaken', label: '覺醒相關' },
    { id: 'raid', label: '團本唯一' }
  ];

  let app = null;
  let safeAliases = {};
  let safeRunewords = [];
  let runeKeys = [];
  let runePattern = null;
  const runeUsage = {};
  const jobRuneSets = {};
  const jobButtons = new Map();

  // DOM 節點
  let viewJobs, viewReverse, viewBuilder, viewGuide, panel, tooltip, quickSearch, catalogGrid, catalogCount, catalogSort, rwBody, rwSearch;

  // 狀態
  let currentSubMode = 'jobs';
  let selectedBtn = null;
  let currentJob = null;
  let currentFamily = null;
  let compareJob = null;
  let highlightRuneKey = null;
  let showKoreanInline = false;
  let pinnedChip = null;
  let activeChip = null;
  let reverseSlot = '全部';
  let reverseTrait = 'all';

  function buildIndexes() {
    safeAliases = (typeof runeAliases !== 'undefined' && runeAliases) ? runeAliases : {};
    safeRunewords = (typeof s1Runewords !== 'undefined' && s1Runewords) ? s1Runewords : [];
    runeKeys = Object.keys(runeInfo).sort((a, b) => b.length - a.length);
    runePattern = new RegExp(
      '(' + runeKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
      'g'
    );

    for (const key of runeKeys) {
      runeUsage[key] = { t0: [], t1: [], t2: [], noteRef: [] };
    }

    for (const job of allJobs) {
      const usedSet = new Set();
      runes[job].forEach((slotTiers) => {
        slotTiers.forEach((cell, tIdx) => {
          if (!cell) return;
          const tierKey = ['t0', 't1', 't2'][tIdx];
          const mainOnly = cell.replace(/（[^）]*）/g, '');
          const mainMatches = new Set(mainOnly.match(runePattern) || []);
          const allMatches = new Set(cell.match(runePattern) || []);
          for (const rk of allMatches) {
            if (mainMatches.has(rk)) {
              usedSet.add(rk);
              if (!runeUsage[rk][tierKey].includes(job)) runeUsage[rk][tierKey].push(job);
            } else {
              if (!runeUsage[rk].noteRef.includes(job)) runeUsage[rk].noteRef.push(job);
            }
          }
        });
      });
      jobRuneSets[job] = usedSet;
    }
  }

  function renderCellContent(container, rawText, sharedSet) {
    const { el } = app;
    if (!rawText) {
      container.append(el('span', 'empty-cell', '—'));
      return;
    }
    const parts = rawText.split(runePattern);
    for (const part of parts) {
      if (!part) continue;
      if (Object.prototype.hasOwnProperty.call(runeInfo, part)) {
        const info = runeInfo[part];
        const chip = el('button', 'rune-chip');
        chip.type = 'button';
        chip.dataset.rune = part;
        chip.setAttribute('aria-describedby', 'rune-tooltip');
        if (sharedSet && sharedSet.has(part)) chip.classList.add('is-shared');
        if (highlightRuneKey === part) chip.classList.add('is-highlighted');
        chip.append(document.createTextNode(info.zh));
        if (showKoreanInline) {
          chip.append(el('span', 'rune-kr-inline', `(${part})`));
        }
        container.append(chip);
      } else {
        const subParts = part.split(/(／|＋)/g);
        for (const sp of subParts) {
          if (!sp) continue;
          if (sp === '／') container.append(el('span', 'sep-slash', ' ／ '));
          else if (sp === '＋') container.append(el('span', 'sep-plus', '＋'));
          else container.append(el('span', 'note-text', sp));
        }
      }
    }
  }

  function getJobMeta(job) {
    if (job === '騎士') {
      return '韓服 S1 後期追加（2026/04/28 上線）· 已依後期 S1 資料覆核徽章與四部位配裝，台服開放進度請對照公告。';
    }
    if (job === '暗黑術士') {
      return '韓服 S1 開季後追加 · 以下為實裝後玩家問卷整理，台服開放進度請對照官方公告。';
    }
    if (job === '舞者') {
      return '韓服 S1 玩家問卷（2025/12–2026/01）· 已將同組技能改造併回 T0 並補上舊版過渡對照。';
    }
    return '韓服 S1 玩家問卷（2025/12–2026/01）與 S1 攻略覆核。';
  }

  function buildQuadrantGrid(job, sharedSet) {
    const { el } = app;
    const grid = el('div', 'quad-grid');
    const jobData = runes[job];
    for (const q of quadrants) {
      const card = el('section', 'slot-card');
      card.setAttribute('aria-label', `${job} ${q.label}符文`);

      const table = el('table', 'slot-table');
      const thead = table.createTHead();
      const hRow = thead.insertRow();
      const corner = el('th', 'corner', '');
      corner.scope = 'col';
      const slotTh = el('th', '', q.label);
      slotTh.scope = 'col';
      hRow.append(corner, slotTh);

      const tbody = table.createTBody();
      const slotTiers = jobData[q.index];
      tiers.forEach((tier, tIdx) => {
        const row = tbody.insertRow();
        const th = el('th');
        th.scope = 'row';
        th.append(el('span', `tier-badge ${tier.cls}`, tier.code));
        th.append(el('span', 'tier-sub', tier.sub));

        const td = el('td');
        renderCellContent(td, slotTiers[tIdx], sharedSet);

        row.append(th, td);
      });

      card.append(table);
      grid.append(card);
    }
    return grid;
  }

  function formatPlainTextBuild(job) {
    const lines = [`【瑪奇 Mobile S1 符文指南｜${job}】`];
    for (const q of quadrants) {
      lines.push(`\n■ ${q.label}`);
      runes[job][q.index].forEach((cell, idx) => {
        const text = cell
          ? cell.replace(runePattern, m => (runeInfo[m] ? runeInfo[m].zh : m))
          : '—';
        lines.push(`  T${idx}：${text}`);
      });
    }
    return lines.join('\n');
  }

  function renderPanel(job, family) {
    const { el, showToast, syncHash } = app;
    hideTooltip(true);
    panel.replaceChildren();

    const sharedSet = compareJob
      ? new Set([...jobRuneSets[job]].filter(k => jobRuneSets[compareJob].has(k)))
      : null;

    const head = el('div', 'panel-head');
    const titleWrap = el('div');
    titleWrap.append(el('h2', '', compareJob ? `${job} ⇄ ${compareJob}` : job));
    titleWrap.append(el('p', 'panel-meta', getJobMeta(job)));

    const tools = el('div', 'panel-tools');

    const cmpSelect = el('select', 'tool-select');
    cmpSelect.setAttribute('aria-label', '選擇另一職業進行並排比較');
    cmpSelect.append(new Option(compareJob ? '✕ 關閉雙職比較' : '＋ 與另一職比較', ''));
    for (const [fam, names] of Object.entries(families)) {
      const og = document.createElement('optgroup');
      og.label = fam;
      for (const name of names) {
        if (name === job) continue;
        og.append(new Option(`比較：${name}`, name, false, name === compareJob));
      }
      cmpSelect.append(og);
    }
    cmpSelect.onchange = () => {
      compareJob = cmpSelect.value || null;
      highlightRuneKey = null;
      renderPanel(currentJob, currentFamily);
      syncHash();
    };
    tools.append(cmpSelect);

    const krToggle = el('button', 'tool-btn', '並排顯示韓文');
    krToggle.type = 'button';
    krToggle.setAttribute('aria-pressed', String(showKoreanInline));
    krToggle.onclick = () => {
      showKoreanInline = !showKoreanInline;
      renderPanel(currentJob, currentFamily);
    };
    tools.append(krToggle);

    const copyBtn = el('button', 'tool-btn', '複製配裝');
    copyBtn.type = 'button';
    copyBtn.onclick = async () => {
      const text = compareJob
        ? formatPlainTextBuild(job) + '\n\n' + formatPlainTextBuild(compareJob)
        : formatPlainTextBuild(job);
      try {
        await navigator.clipboard.writeText(text);
        showToast(`已複製「${compareJob ? `${job}＋${compareJob}` : job}」配裝文字`);
      } catch (_) {
        showToast('瀏覽器未允許自動複製，請手動選取');
      }
    };
    tools.append(copyBtn);

    const shareBtn = el('button', 'tool-btn', '複製連結');
    shareBtn.type = 'button';
    shareBtn.onclick = async () => {
      syncHash();
      try {
        await navigator.clipboard.writeText(location.href);
        showToast('已複製本職業專屬分享連結');
      } catch (_) {
        showToast('已更新網址列，可直接複製網址分享');
      }
    };
    tools.append(shareBtn);

    head.append(titleWrap, tools);
    panel.append(head);

    panel.append(
      el(
        'p',
        'hover-hint',
        '提示：滑鼠移至（手機可點擊）任一符文可查看中文效果、對應技能與韓文原名；點擊鎖定後可「反查採用職業」。'
      )
    );

    if (compareJob) {
      const box = el('div', 'compare-summary');
      const sharedSorted = [...sharedSet].sort((a, b) => slotOrder[runeInfo[a].slot] - slotOrder[runeInfo[b].slot]);
      const summaryTitle = el('div');
      summaryTitle.append(
        el('strong', '', `共用符文標示（共 ${sharedSorted.length} 顆）`),
        document.createTextNode(`：下方兩職表格中以金框標示的符文，代表「${job}」與「${compareJob}」皆有推薦，優先強化可跨職共用。`)
      );
      box.append(summaryTitle);
      if (sharedSorted.length) {
        const list = el('div', 'shared-list');
        for (const rk of sharedSorted) {
          const chip = el('button', 'rune-chip is-shared');
          chip.type = 'button';
          chip.dataset.rune = rk;
          chip.textContent = `${runeInfo[rk].slot}・${runeInfo[rk].zh}`;
          list.append(chip);
        }
        box.append(list);
      }
      panel.append(box);
    }

    panel.append(buildQuadrantGrid(job, sharedSet));

    if (compareJob) {
      const divHead = el('div', 'compare-divider');
      divHead.append(el('h3', '', `${compareJob}（對照職業）`));
      divHead.append(el('span', 'panel-meta', getJobMeta(compareJob)));
      panel.append(divHead);
      panel.append(buildQuadrantGrid(compareJob, sharedSet));
    }

    const foot = el('div', 'panel-foot');
    foot.append(
      el(
        'p',
        '',
        '／ 表示擇一；＋ 表示飾品三件組；「—」表示缺少可核對候選。譯名為社群常用譯名或暫譯，請以懸停效果核對台服圖鑑。'
      )
    );
    const link = el('a', '', '查看韓服配裝來源 ↗');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.href =
      job === '騎士'
        ? 'https://www.kakao.gg/games/mabinogi-mobile/guide-69f021f4f43b96476f0eb5c5'
        : 'https://theqoo.net/mabinogi/' +
          (['戰士系', '法師系', '弓手系'].includes(family) ? '4087115736' : '4087117159');
    foot.append(link);
    panel.append(foot);
  }

  function setSubMode(mode, updateHash = true) {
    currentSubMode = mode;
    hideTooltip(true);
    document.querySelectorAll('#tab-runes .mode-tab').forEach(btn => {
      btn.setAttribute('aria-selected', String(btn.dataset.mode === mode));
    });
    viewJobs.hidden = mode !== 'jobs';
    viewReverse.hidden = mode !== 'reverse';
    viewBuilder.hidden = mode !== 'builder';
    viewGuide.hidden = mode !== 'guide';
    if (mode === 'reverse') renderCatalog();
    if (mode === 'guide') renderRunewords();
    if (mode === 'builder' && currentJob && window.BuildChecker) {
      BuildChecker.setJob(currentJob);
    }
    if (updateHash) app.syncHash();
  }

  function openJob(job, cmp = null, updateHash = true, highlightKey = null) {
    app.setPrimaryTab('runes', false);
    setSubMode('jobs', false);
    const btn = jobButtons.get(job);
    if (!btn) return;
    if (selectedBtn) selectedBtn.setAttribute('aria-pressed', 'false');
    selectedBtn = btn;
    currentJob = job;
    currentFamily = jobToFamily[job];
    compareJob = cmp;
    highlightRuneKey = highlightKey;
    btn.setAttribute('aria-pressed', 'true');
    panel.hidden = false;
    renderPanel(currentJob, currentFamily);
    if (updateHash) app.syncHash();
    if (highlightKey) {
      const targetChip = panel.querySelector(`.rune-chip[data-rune="${CSS.escape(highlightKey)}"]`);
      if (targetChip) targetChip.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function choose(button, job, family) {
    const close = selectedBtn === button;
    if (selectedBtn) selectedBtn.setAttribute('aria-pressed', 'false');
    selectedBtn = close ? null : button;
    currentJob = close ? null : job;
    currentFamily = close ? null : family;
    compareJob = null;
    highlightRuneKey = null;
    panel.hidden = close;
    if (close) {
      hideTooltip(true);
      panel.replaceChildren();
      app.syncHash();
      return;
    }
    button.setAttribute('aria-pressed', 'true');
    renderPanel(job, family);
    app.syncHash();
  }

  // ===== 反查圖鑑 =====
  function initCatalogFilters() {
    const { el } = app;
    const sf = document.querySelector('#slot-filters');
    for (const s of slotFilterOpts) {
      const cnt = s === '全部' ? runeKeys.length : runeKeys.filter(k => runeInfo[k].slot === s).length;
      const b = el('button', 'filter-chip', `${s} (${cnt})`);
      b.type = 'button';
      b.dataset.slot = s;
      b.setAttribute('aria-pressed', String(s === reverseSlot));
      b.onclick = () => {
        reverseSlot = s;
        sf.querySelectorAll('.filter-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.slot === s)));
        renderCatalog();
      };
      sf.append(b);
    }
    const tf = document.querySelector('#trait-filters');
    for (const t of traitFilterOpts) {
      const b = el('button', 'filter-chip', t.label);
      b.type = 'button';
      b.dataset.trait = t.id;
      b.setAttribute('aria-pressed', String(t.id === reverseTrait));
      b.onclick = () => {
        reverseTrait = t.id;
        tf.querySelectorAll('.filter-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.trait === t.id)));
        renderCatalog();
      };
      tf.append(b);
    }
  }

  function matchesTrait(info, usage) {
    if (reverseTrait === 'all') return true;
    if (reverseTrait === 'has-t0') return usage.t0.length > 0;
    if (reverseTrait === 'mythic') return (info.tierTag || '').includes('神話');
    if (reverseTrait === 'defect') return Boolean(info.defect) || (info.tierTag || '').includes('缺陷');
    if (reverseTrait === 'awaken') return (info.effect + (info.note || '')).includes('覺醒');
    if (reverseTrait === 'raid') return (info.tierTag || '').includes('團本');
    return true;
  }

  function renderCatalog() {
    const { el } = app;
    const q = quickSearch.value.trim().toLowerCase();
    const matched = runeKeys.filter(key => {
      const info = runeInfo[key];
      const usage = runeUsage[key];
      if (reverseSlot !== '全部' && info.slot !== reverseSlot) return false;
      if (!matchesTrait(info, usage)) return false;
      if (!q) return true;
      const aliases = (safeAliases[key] || []).join(' ');
      const hay = [
        key, info.zh, aliases, info.slot, info.tierTag || '',
        info.job || '', info.skill || '', info.effect || '', info.defect || '', info.note || ''
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });

    if (catalogSort.value === 'popular') {
      matched.sort((a, b) => {
        const ua = runeUsage[a], ub = runeUsage[b];
        if (ub.t0.length !== ua.t0.length) return ub.t0.length - ua.t0.length;
        const totA = ua.t0.length + ua.t1.length + ua.t2.length;
        const totB = ub.t0.length + ub.t1.length + ub.t2.length;
        if (totB !== totA) return totB - totA;
        return slotOrder[runeInfo[a].slot] - slotOrder[runeInfo[b].slot];
      });
    } else {
      matched.sort((a, b) => slotOrder[runeInfo[a].slot] - slotOrder[runeInfo[b].slot]);
    }

    catalogCount.textContent = `顯示 ${matched.length} / ${runeKeys.length} 顆符文（點擊下方職業徽章可直接跳轉該職四象限配裝）`;
    catalogGrid.replaceChildren();

    if (!matched.length) {
      catalogGrid.append(el('p', 'note-text', '找不到符合條件的符文，可試著改搜效果關鍵字（如「暴擊」「破防」「冷卻」「燃燒」）或清空篩選。'));
      return;
    }

    const frag = document.createDocumentFragment();
    for (const key of matched) {
      const info = runeInfo[key];
      const usage = runeUsage[key];
      const aliases = safeAliases[key] || [];
      const card = el('article', 'rune-card');

      const head = el('div', 'rc-head');
      head.append(el('h3', 'rc-title', info.zh));
      const krSpan = el('span', 'rc-kr', key);
      krSpan.setAttribute('translate', 'no');
      head.append(krSpan);
      card.append(head);

      if (aliases.length) card.append(el('p', 'rc-aliases', `社群常見別名：${aliases.join('、')}`));

      const tags = el('div', 'rc-tags');
      tags.append(el('span', 'rc-tag', info.slot));
      if (info.tierTag) tags.append(el('span', 'rc-tag', info.tierTag));
      if (info.job) tags.append(el('span', 'rc-tag', info.job));
      tags.append(
        el(
          'span',
          info.status === '社群譯名' ? 'rc-tag is-verified' : 'rc-tag is-draft',
          info.status === '社群譯名' ? '社群常用譯名' : '暫譯・以效果對照'
        )
      );
      card.append(tags);

      if (info.skill) card.append(el('p', 'rc-skill', `對應技能：${info.skill}`));
      card.append(el('p', 'rc-effect', info.effect));
      if (info.defect) card.append(el('p', 'rc-defect', `缺陷副作用：${info.defect}`));
      if (info.note) card.append(el('p', 'rc-note', info.note));

      const useBox = el('div', 'rc-usage');
      const tierDefs = [
        { k: 't0', label: 'T0 主選', cls: 'tier-0' },
        { k: 't1', label: 'T1 次選', cls: 'tier-1' },
        { k: 't2', label: 'T2 備選', cls: 'tier-2' },
        { k: 'noteRef', label: '搭配提及', cls: 'tier-2' }
      ];
      for (const td of tierDefs) {
        if (!usage[td.k].length) continue;
        const row = el('div', 'usage-row');
        row.append(el('span', `usage-tier ${td.cls}`, `${td.label} (${usage[td.k].length})`));
        for (const j of usage[td.k]) {
          const jb = el('button', 'job-jump-btn', j);
          jb.type = 'button';
          jb.onclick = () => openJob(j, null, true, key);
          row.append(jb);
        }
        useBox.append(row);
      }
      card.append(useBox);
      frag.append(card);
    }
    catalogGrid.append(frag);
  }

  // ===== S1 符文之語 =====
  function renderRunewords() {
    const { el } = app;
    const q = rwSearch.value.trim().toLowerCase();
    rwBody.replaceChildren();
    const list = safeRunewords.filter(item => {
      if (!q) return true;
      const hay = [item.name, item.family, item.bonus, ...item.runes].join(' ').toLowerCase();
      return hay.includes(q);
    });
    if (!list.length) {
      const tr = rwBody.insertRow();
      const td = tr.insertCell();
      td.colSpan = 4;
      td.textContent = '無符合條件的符文之語。';
      return;
    }
    for (const item of list) {
      const tr = rwBody.insertRow();
      tr.append(
        el('td', '', item.name),
        el('td', '', item.family),
        el('td', '', item.bonus),
        el('td', '', item.runes.join('、'))
      );
    }
  }

  // ===== 浮動效果提示窗 =====
  function fillTooltip(key) {
    const { el } = app;
    const info = runeInfo[key];
    if (!info) return false;
    const aliases = safeAliases[key] || [];
    const usage = runeUsage[key];

    tooltip.replaceChildren();

    const head = el('div', 'tt-head');
    head.append(el('span', 'tt-title', info.zh));
    const krSpan = el('span', 'tt-kr', key);
    krSpan.setAttribute('translate', 'no');
    head.append(krSpan);
    tooltip.append(head);

    if (aliases.length) tooltip.append(el('p', 'tt-aliases', `社群別名：${aliases.join('、')}`));

    const tags = el('div', 'tt-tags');
    tags.append(el('span', 'tt-tag', info.slot));
    if (info.tierTag) tags.append(el('span', 'tt-tag', info.tierTag));
    if (info.job) tags.append(el('span', 'tt-tag', info.job));
    const statusCls = info.status === '社群譯名' ? 'tt-tag is-verified' : 'tt-tag is-draft';
    tags.append(el('span', statusCls, info.status === '社群譯名' ? '社群常用譯名' : '暫譯・以效果對照'));
    tooltip.append(tags);

    if (info.skill) tooltip.append(el('p', 'tt-skill', `對應技能：${info.skill}`));
    tooltip.append(el('p', 'tt-effect', info.effect));
    if (info.defect) tooltip.append(el('p', 'tt-defect', `缺陷副作用：${info.defect}`));
    if (info.note) tooltip.append(el('p', 'tt-note', info.note));

    if (usage) {
      const uRow = el('div', 'tt-usage');
      const summaryParts = [];
      if (usage.t0.length) summaryParts.push(`T0 × ${usage.t0.length}`);
      if (usage.t1.length) summaryParts.push(`T1 × ${usage.t1.length}`);
      if (usage.t2.length) summaryParts.push(`T2 × ${usage.t2.length}`);
      if (!summaryParts.length && usage.noteRef.length) summaryParts.push(`搭配提及 × ${usage.noteRef.length}`);
      uRow.append(el('span', '', `全職採用：${summaryParts.join('｜') || '—'}`));

      const jumpBtn = el('button', 'tt-jump-btn', '反查採用職業');
      jumpBtn.type = 'button';
      jumpBtn.onclick = (e) => {
        e.stopPropagation();
        hideTooltip(true);
        quickSearch.value = info.zh;
        reverseSlot = '全部';
        reverseTrait = 'all';
        document.querySelectorAll('#slot-filters .filter-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.slot === '全部')));
        document.querySelectorAll('#trait-filters .filter-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.trait === 'all')));
        setSubMode('reverse');
      };
      uRow.append(jumpBtn);
      tooltip.append(uRow);
    }
    return true;
  }

  function positionTooltip(target) {
    const rect = target.getBoundingClientRect();
    const pad = 12;
    const gap = 8;

    tooltip.style.left = '0px';
    tooltip.style.top = '0px';
    tooltip.hidden = false;
    const ttRect = tooltip.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - ttRect.width / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - ttRect.width - pad));

    let top = rect.top - ttRect.height - gap;
    if (top < pad) top = rect.bottom + gap;
    if (top + ttRect.height > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - ttRect.height - pad);
    }

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;
  }

  function showTooltip(chip, pin = false) {
    const key = chip.dataset.rune;
    if (!fillTooltip(key)) return;
    if (activeChip && activeChip !== chip) activeChip.classList.remove('is-active');
    activeChip = chip;
    chip.classList.add('is-active');
    if (pin) {
      pinnedChip = chip;
      tooltip.classList.add('pinned');
    } else if (!pinnedChip) {
      tooltip.classList.remove('pinned');
    }
    positionTooltip(chip);
    tooltip.classList.add('visible');
  }

  function hideTooltip(force = false) {
    if (!force && pinnedChip) return;
    pinnedChip = null;
    if (activeChip) {
      activeChip.classList.remove('is-active');
      activeChip = null;
    }
    tooltip.classList.remove('visible', 'pinned');
    tooltip.hidden = true;
  }

  function attachTooltipContainer(container) {
    container.addEventListener('mouseover', (e) => {
      const chip = e.target.closest('.rune-chip');
      if (!chip || pinnedChip) return;
      if (activeChip === chip && !tooltip.hidden) return;
      showTooltip(chip, false);
    });

    container.addEventListener('mouseout', (e) => {
      const chip = e.target.closest('.rune-chip');
      if (!chip || pinnedChip) return;
      if (e.relatedTarget && chip.contains(e.relatedTarget)) return;
      hideTooltip(false);
    });

    container.addEventListener('focusin', (e) => {
      const chip = e.target.closest('.rune-chip');
      if (!chip || pinnedChip) return;
      showTooltip(chip, false);
    });

    container.addEventListener('focusout', (e) => {
      const chip = e.target.closest('.rune-chip');
      if (!chip || pinnedChip) return;
      hideTooltip(false);
    });

    container.addEventListener('click', (e) => {
      const chip = e.target.closest('.rune-chip');
      if (!chip) return;
      e.stopPropagation();
      if (pinnedChip === chip) hideTooltip(true);
      else showTooltip(chip, true);
    });
  }

  function bindEvents() {
    document.querySelectorAll('#tab-runes .mode-tab').forEach(btn => {
      btn.onclick = () => setSubMode(btn.dataset.mode);
    });

    quickSearch.addEventListener('input', () => {
      if (quickSearch.value.trim() && currentSubMode !== 'reverse') {
        setSubMode('reverse', false);
      }
      if (currentSubMode === 'reverse') renderCatalog();
    });

    catalogSort.onchange = renderCatalog;
    rwSearch.addEventListener('input', renderRunewords);

    attachTooltipContainer(panel);

    document.addEventListener('click', (e) => {
      if (pinnedChip && !tooltip.contains(e.target) && !e.target.closest('.rune-chip')) {
        hideTooltip(true);
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideTooltip(true);
    });

    window.addEventListener('scroll', () => {
      if (activeChip && !tooltip.hidden) positionTooltip(activeChip);
    }, true);

    window.addEventListener('resize', () => {
      if (activeChip && !tooltip.hidden) positionTooltip(activeChip);
    });
  }

  function init(ctx) {
    app = ctx;
    viewJobs = document.querySelector('#view-jobs');
    viewReverse = document.querySelector('#view-reverse');
    viewBuilder = document.querySelector('#view-builder');
    viewGuide = document.querySelector('#view-guide');
    panel = document.querySelector('#panel');
    tooltip = document.querySelector('#rune-tooltip');
    quickSearch = document.querySelector('#quick-search');
    catalogGrid = document.querySelector('#catalog-grid');
    catalogCount = document.querySelector('#catalog-count');
    catalogSort = document.querySelector('#catalog-sort');
    rwBody = document.querySelector('#rw-body');
    rwSearch = document.querySelector('#rw-search');

    buildIndexes();

    const nav = document.querySelector('#jobs');
    for (const [family, names] of Object.entries(families)) {
      const group = app.el('section', 'family');
      group.append(app.el('h2', '', family));
      for (const name of names) {
        const b = app.el('button', '', name);
        b.type = 'button';
        b.setAttribute('aria-controls', 'panel');
        b.setAttribute('aria-pressed', 'false');
        b.onclick = () => choose(b, name, family);
        jobButtons.set(name, b);
        group.append(b);
      }
      nav.append(group);
    }

    initCatalogFilters();
    bindEvents();

    if (window.BuildChecker) {
      BuildChecker.init(app, {
        allJobs,
        runePattern,
        safeRunewords,
        attachTooltipContainer
      });
    }
  }

  return {
    init,
    allJobs,
    setSubMode,
    openJob,
    hideTooltip,
    getHashParams() {
      if (currentSubMode === 'builder' && window.BuildChecker) {
        return BuildChecker.getHashParams();
      }
      const p = new URLSearchParams();
      if (currentSubMode === 'jobs') {
        if (currentJob) p.set('job', currentJob);
        if (currentJob && compareJob) p.set('cmp', compareJob);
      } else {
        p.set('mode', currentSubMode);
        if (currentSubMode === 'reverse' && quickSearch.value.trim()) {
          p.set('q', quickSearch.value.trim());
        }
      }
      return p;
    },
    applyHashParams(params) {
      const mode = params.get('mode');
      const job = params.get('job');
      const cmp = params.get('cmp');
      const q = params.get('q');
      if (mode === 'builder' && window.BuildChecker) {
        setSubMode('builder', false);
        BuildChecker.applyHashParams(params);
      } else if (mode === 'reverse') {
        if (q) quickSearch.value = q;
        setSubMode('reverse', false);
      } else if (mode === 'guide') {
        setSubMode('guide', false);
      } else if (job && allJobs.includes(job)) {
        openJob(job, cmp && allJobs.includes(cmp) && cmp !== job ? cmp : null, false);
      } else {
        setSubMode('jobs', false);
      }
    }
  };
})();
