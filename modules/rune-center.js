// 模組 1：符文中心（支援 S1／S0 賽季切換、6 職系整齊排版、四象限、雙職比對、反查全圖鑑、10 格試配檢核與 S1 指南）
window.RuneCenter = (() => {
  // 依使用者指定之確切標題與順序（2×3 整齊排列，每卡固定單排按鈕）
  const families = {
    戰士系列: ['戰士', '大劍戰士', '劍術士', '騎士'],
    弓手系列: ['弓箭手', '長弓兵', '弩弓手'],
    魔法師系列: ['魔法師', '火焰術士', '冰結術士', '電擊術士'],
    治癒師系列: ['治癒師', '祭司', '修道士', '暗黑術士'],
    吟遊詩人系列: ['吟遊詩人', '舞者', '樂師'],
    盜賊系列: ['盜賊', '雙劍士', '格鬥家']
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
  let safeStageDiffs = {};

  // 雙賽季索引（s1 / s1Early / s0）
  const seasonData = {};
  const jobButtons = new Map();

  // DOM 節點
  let viewJobs, viewReverse, viewBuilder, viewGuide, panel, tooltip, quickSearch;
  let catalogGrid, catalogCount, catalogSort, slotFiltersEl, traitFiltersEl, rwBody, rwSearch;

  // 狀態
  let currentSeason = 's1';
  let currentS1Stage = 'early'; // 'early'（開季／過渡，預設） | 'late'（季末／終局）
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

  function buildSeasonIndex(infoMap, jobMap) {
    const keys = Object.keys(infoMap).sort((a, b) => b.length - a.length);
    const pattern = new RegExp(
      '(' + keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
      'g'
    );
    const usage = {};
    const jobSets = {};
    for (const k of keys) usage[k] = { t0: [], t1: [], t2: [], noteRef: [] };

    for (const job of allJobs) {
      const usedSet = new Set();
      const slots = jobMap[job];
      if (!slots) {
        jobSets[job] = usedSet;
        continue;
      }
      slots.forEach((slotTiers) => {
        slotTiers.forEach((cell, tIdx) => {
          if (!cell) return;
          const tierKey = ['t0', 't1', 't2'][tIdx];
          const mainOnly = cell.replace(/（[^）]*）/g, '');
          const mainMatches = new Set(mainOnly.match(pattern) || []);
          const allMatches = new Set(cell.match(pattern) || []);
          for (const rk of allMatches) {
            // S0 飾品鍵本身含「（S0）」，主項判定改直接比對 allMatches
            if (mainMatches.has(rk) || rk.includes('（S0）')) {
              usedSet.add(rk);
              if (!usage[rk][tierKey].includes(job)) usage[rk][tierKey].push(job);
            } else {
              if (!usage[rk].noteRef.includes(job)) usage[rk].noteRef.push(job);
            }
          }
        });
      });
      jobSets[job] = usedSet;
    }

    return { infoMap, jobMap, keys, pattern, usage, jobSets };
  }

  function getActiveSeason() {
    return seasonData[currentSeason] || seasonData.s1;
  }

  function getActiveViewIndex() {
    if (currentSeason === 's1' && currentS1Stage === 'early' && seasonData.s1Early) {
      return seasonData.s1Early;
    }
    return getActiveSeason();
  }

  function buildIndexes() {
    safeAliases = (typeof runeAliases !== 'undefined' && runeAliases) ? runeAliases : {};
    safeRunewords = (typeof s1Runewords !== 'undefined' && s1Runewords) ? s1Runewords : [];
    safeStageDiffs = (typeof s1StageDiffs !== 'undefined' && s1StageDiffs) ? s1StageDiffs : {};
    seasonData.s1 = buildSeasonIndex(runeInfo, runes);
    if (typeof runesEarly !== 'undefined') {
      seasonData.s1Early = buildSeasonIndex(runeInfo, runesEarly);
    }
    if (typeof s0RuneInfo !== 'undefined' && typeof s0Runes !== 'undefined') {
      seasonData.s0 = buildSeasonIndex(s0RuneInfo, s0Runes);
    }
  }

  function updateSeasonUI() {
    document.querySelectorAll('.season-btn').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.season === currentSeason));
    });
    // S0 時期無暗黑術士／騎士，按鈕以柔化提示但不鎖死（點進去會提示可一鍵切 S1）
    const ds = getActiveSeason();
    for (const [job, btn] of jobButtons.entries()) {
      const unavailable = !ds.jobMap[job];
      btn.classList.toggle('is-s1-only', unavailable);
    }
    renderSlotFilterCounts();
  }

  function setSeason(season, updateHash = true) {
    if (!seasonData[season]) return;
    currentSeason = season;
    hideTooltip(true);
    updateSeasonUI();

    if (currentSubMode === 'jobs' && currentJob) {
      renderPanel(currentJob, currentFamily);
    } else if (currentSubMode === 'reverse') {
      renderCatalog();
    } else if (currentSubMode === 'builder' && season === 's0') {
      app.showToast('10 格試配檢核器以 S1 機制為準，切換檢核時將使用 S1 符文池');
    }
    if (updateHash) app.syncHash();
  }

  function setS1Stage(stage, updateHash = true) {
    if (stage !== 'early' && stage !== 'late') return;
    currentS1Stage = stage;
    hideTooltip(true);
    if (currentSeason === 's1' && currentSubMode === 'jobs' && currentJob) {
      renderPanel(currentJob, currentFamily);
    }
    if (updateHash) app.syncHash();
  }

  function renderCellContent(container, rawText, sharedSet, job) {
    const { el } = app;
    const ds = getActiveSeason();
    if (!rawText) {
      container.append(el('span', 'empty-cell', '—'));
      return;
    }
    const showDiffs = currentSeason === 's1' && currentS1Stage === 'late';
    const jobDiffs = (showDiffs && job && safeStageDiffs[job]) ? safeStageDiffs[job] : null;
    const badgeSymbols = { up: '▲', new: '★', down: '▼' };

    const parts = rawText.split(ds.pattern);
    for (const part of parts) {
      if (!part) continue;
      if (Object.prototype.hasOwnProperty.call(ds.infoMap, part)) {
        const info = ds.infoMap[part];
        const chip = el('button', 'rune-chip');
        chip.type = 'button';
        chip.dataset.rune = part;
        chip.dataset.season = currentSeason;
        chip.setAttribute('aria-describedby', 'rune-tooltip');
        if (sharedSet && sharedSet.has(part)) chip.classList.add('is-shared');
        if (highlightRuneKey === part) chip.classList.add('is-highlighted');
        chip.append(document.createTextNode(info.zh));
        if (jobDiffs && jobDiffs[part]) {
          const d = jobDiffs[part];
          chip.dataset.diffNote = d.note;
          chip.dataset.diffBadge = d.badge;
          const bSpan = el('span', `stage-badge is-${d.badge}`, badgeSymbols[d.badge] || '');
          bSpan.setAttribute('aria-label', d.badge === 'up' ? '季末升格' : d.badge === 'new' ? '季末新入榜' : '退為過渡');
          chip.append(bSpan);
        }
        if (currentSeason === 's1' && showKoreanInline) {
          const kr = el('span', 'rune-kr-inline', `(${part})`);
          kr.setAttribute('translate', 'no');
          chip.append(kr);
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
    if (currentSeason === 's0') {
      return '台服 S0（白星 6★ 傳說）畢業與過渡配裝，對照 TMS S0 攻略與愛爾琳網採用排行。';
    }
    if (currentS1Stage === 'early') {
      if (job === '騎士' || job === '暗黑術士') {
        return '台服尚未開放之 S1 新轉職（以下為韓服開季初期過渡參考，切「季末／終局」看後期實測）。';
      }
      return 'S1 開季／過渡視角：聚焦台服開季首 1～2 個月易入手傳說武器與覺醒三件套（盲眼預言者＋壓倒＋細膩）。';
    }
    if (job === '騎士') {
      return 'S1 季末／終局：依韓服 2026/05 實測採用率（波紋之刃 51.6%、遙遠的光、解決師＋蒼白閃光）覆核。';
    }
    if (job === '暗黑術士') {
      return 'S1 季末／終局：韓服實測與永恆缺陷混搭覆核，台服開放進度請依官方公告為準。';
    }
    return 'S1 季末／終局：依韓服 2026/04～05 遊戲內「冒險家意見系統」真實採用率普查與多來源攻略覆核。';
  }

  function buildQuadrantGrid(job, sharedSet) {
    const { el } = app;
    const ds = getActiveViewIndex();
    const jobData = ds.jobMap[job];
    if (!jobData) {
      const box = el('div', 'compare-summary');
      const p = el('div');
      p.append(
        el('strong', '', `「${job}」於 S1 賽季才正式實裝，無 S0 白星配裝。`),
        document.createTextNode(' 可直接切換至 S1 查看完整四象限推薦。')
      );
      const sw = el('button', 'tool-btn is-primary', '切換至 S1 查看配裝');
      sw.type = 'button';
      sw.style.marginTop = '10px';
      sw.onclick = () => setSeason('s1');
      box.append(p, sw);
      return box;
    }

    const grid = el('div', 'quad-grid');
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
        renderCellContent(td, slotTiers[tIdx], sharedSet, job);

        row.append(th, td);
      });

      card.append(table);
      grid.append(card);
    }
    return grid;
  }

  function formatPlainTextBuild(job) {
    const ds = getActiveViewIndex();
    if (!ds.jobMap[job]) return `【瑪奇 Mobile ${currentSeason.toUpperCase()}｜${job}】此職業於 S1 才實裝。`;
    const stageTxt = currentSeason === 's1' ? (currentS1Stage === 'early' ? ' 開季過渡' : ' 季末終局') : '';
    const lines = [`【瑪奇 Mobile ${currentSeason.toUpperCase()}${stageTxt} 符文指南｜${job}】`];
    for (const q of quadrants) {
      lines.push(`\n■ ${q.label}`);
      ds.jobMap[job][q.index].forEach((cell, idx) => {
        const text = cell
          ? cell.replace(ds.pattern, m => (ds.infoMap[m] ? ds.infoMap[m].zh : m))
          : '—';
        lines.push(`  T${idx}：${text}`);
      });
    }
    return lines.join('\n');
  }

  function renderPanel(job, family) {
    const { el, showToast, syncHash } = app;
    const ds = getActiveViewIndex();
    hideTooltip(true);
    panel.replaceChildren();

    const hasMainData = Boolean(ds.jobMap[job]);
    const validCompare = compareJob && ds.jobMap[compareJob] ? compareJob : null;
    const sharedSet = (hasMainData && validCompare)
      ? new Set([...ds.jobSets[job]].filter(k => ds.jobSets[validCompare].has(k)))
      : null;

    const head = el('div', 'panel-head');
    const titleWrap = el('div');
    const seasonTag = currentSeason === 's0'
      ? '（S0 白星 6★）'
      : currentS1Stage === 'early' ? '（S1 開季／過渡）' : '（S1 季末／終局）';
    titleWrap.append(el('h2', '', validCompare ? `${job} ⇄ ${validCompare} ${seasonTag}` : `${job} ${seasonTag}`));
    titleWrap.append(el('p', 'panel-meta', getJobMeta(job)));

    const tools = el('div', 'panel-tools');

    if (window.ClassGuide) {
      const growthBtn = el('button', 'tool-btn is-primary', `養成指南 →`);
      growthBtn.type = 'button';
      growthBtn.title = `查看「${job}」寶石雕琢、技能特化、刻印重設與等級卡建議`;
      growthBtn.onclick = () => ClassGuide.openJob(job, true);
      tools.append(growthBtn);
    }

    if (hasMainData) {
      const cmpSelect = el('select', 'tool-select');
      cmpSelect.setAttribute('aria-label', '選擇另一職業進行並排比較');
      cmpSelect.append(new Option(validCompare ? '✕ 關閉雙職比較' : '＋ 與另一職比較', ''));
      for (const [fam, names] of Object.entries(families)) {
        const og = document.createElement('optgroup');
        og.label = fam;
        for (const name of names) {
          if (name === job || !ds.jobMap[name]) continue;
          og.append(new Option(`比較：${name}`, name, false, name === validCompare));
        }
        if (og.children.length) cmpSelect.append(og);
      }
      cmpSelect.onchange = () => {
        compareJob = cmpSelect.value || null;
        highlightRuneKey = null;
        renderPanel(currentJob, currentFamily);
        syncHash();
      };
      tools.append(cmpSelect);

      if (currentSeason === 's1') {
        const krToggle = el('button', 'tool-btn', '並排顯示韓文');
        krToggle.type = 'button';
        krToggle.setAttribute('aria-pressed', String(showKoreanInline));
        krToggle.onclick = () => {
          showKoreanInline = !showKoreanInline;
          renderPanel(currentJob, currentFamily);
        };
        tools.append(krToggle);
      }

      const copyBtn = el('button', 'tool-btn', '複製配裝');
      copyBtn.type = 'button';
      copyBtn.onclick = async () => {
        const text = validCompare
          ? formatPlainTextBuild(job) + '\n\n' + formatPlainTextBuild(validCompare)
          : formatPlainTextBuild(job);
        try {
          await navigator.clipboard.writeText(text);
          showToast(`已複製「${validCompare ? `${job}＋${validCompare}` : job}」配裝文字`);
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
    }

    head.append(titleWrap, tools);
    panel.append(head);

    if (hasMainData && currentSeason === 's1') {
      const stageBar = el('div', 'stage-bar');
      const sw = el('div', 'stage-switch');
      sw.setAttribute('role', 'group');
      sw.setAttribute('aria-label', '切換 S1 開季過渡或季末終局推薦');

      const btnEarly = el('button', 'stage-btn', 'S1 開季／過渡');
      btnEarly.type = 'button';
      btnEarly.dataset.stage = 'early';
      btnEarly.setAttribute('aria-pressed', String(currentS1Stage === 'early'));
      btnEarly.onclick = () => setS1Stage('early');

      const btnLate = el('button', 'stage-btn', 'S1 季末／終局');
      btnLate.type = 'button';
      btnLate.dataset.stage = 'late';
      btnLate.setAttribute('aria-pressed', String(currentS1Stage === 'late'));
      btnLate.onclick = () => setS1Stage('late');

      sw.append(btnEarly, btnLate);

      const hint = el('div', 'stage-hint');
      if (currentS1Stage === 'early') {
        hint.textContent = '目前顯示開季易入手傳說與覺醒三件套；切右側「季末／終局」可看韓服 2026/04–05 長線定裝。';
      } else {
        hint.append(
          document.createTextNode('季末微標：'),
          el('span', 'stage-badge is-up', '▲'),
          document.createTextNode('升格　'),
          el('span', 'stage-badge is-new', '★'),
          document.createTextNode('新入榜／神話　'),
          el('span', 'stage-badge is-down', '▼'),
          document.createTextNode('退為過渡（懸停看原因）')
        );
      }
      stageBar.append(sw, hint);
      panel.append(stageBar);
    }

    if (hasMainData) {
      panel.append(
        el(
          'p',
          'hover-hint',
          currentSeason === 's0'
            ? '提示：滑鼠移至（手機點擊）任一 S0 符文可查看效果說明與全職採用數；S0 白星 6★ 傳說於 S1 前期可先保留過渡。'
            : '提示：滑鼠移至（手機點擊）任一 S1 符文可查看中文效果、對應技能與韓文原名；點擊鎖定後可反查採用職業。'
        )
      );

      if (typeof CLASS_GROWTH_GUIDES !== 'undefined' && CLASS_GROWTH_GUIDES[job]) {
        const g = CLASS_GROWTH_GUIDES[job];
        const bar = el('div', 'spec-banner');
        const info = el('div', 'spec-banner-text');
        info.append(
          el('strong', '', '飾品與技能特化速查：'),
          document.createTextNode(`飾品「${g.skillSpec.runes.join(' ＋ ')}」→ ${g.skillSpec.specCombos.join(' ／ ')}`)
        );
        const goBtn = el('button', 'job-jump-btn', '看循環用法與 85 級養成 →');
        goBtn.type = 'button';
        goBtn.onclick = () => {
          if (window.ClassGuide) ClassGuide.openJob(job, true);
        };
        bar.append(info, goBtn);
        panel.append(bar);
      }
    }

    if (validCompare && sharedSet) {
      const box = el('div', 'compare-summary');
      const sharedSorted = [...sharedSet].sort((a, b) => slotOrder[ds.infoMap[a].slot] - slotOrder[ds.infoMap[b].slot]);
      const summaryTitle = el('div');
      summaryTitle.append(
        el('strong', '', `共用符文標示（共 ${sharedSorted.length} 顆）`),
        document.createTextNode(`：下方兩職表格中以金框標示的符文，代表「${job}」與「${validCompare}」皆有推薦。`)
      );
      box.append(summaryTitle);
      if (sharedSorted.length) {
        const list = el('div', 'shared-list');
        for (const rk of sharedSorted) {
          const chip = el('button', 'rune-chip is-shared');
          chip.type = 'button';
          chip.dataset.rune = rk;
          chip.dataset.season = currentSeason;
          chip.textContent = `${ds.infoMap[rk].slot}・${ds.infoMap[rk].zh}`;
          list.append(chip);
        }
        box.append(list);
      }
      panel.append(box);
    }

    panel.append(buildQuadrantGrid(job, sharedSet));

    if (validCompare) {
      const divHead = el('div', 'compare-divider');
      divHead.append(el('h3', '', `${validCompare}（對照職業）`));
      divHead.append(el('span', 'panel-meta', getJobMeta(validCompare)));
      panel.append(divHead);
      panel.append(buildQuadrantGrid(validCompare, sharedSet));
    }

    const foot = el('div', 'panel-foot');
    foot.append(
      el(
        'p',
        '',
        currentSeason === 's0'
          ? '／ 表示擇一；＋ 表示飾品三件組。S0 採用率與名稱依台服 S0 攻略與愛爾琳網對照整理。'
          : '／ 表示擇一；＋ 表示飾品三件組；「—」表示缺少可核對候選。S1 譯名為社群譯名或暫譯，請以懸停效果核對圖鑑。'
      )
    );
    const link = el('a', '', currentSeason === 's0' ? '查看愛爾琳網 S0 採用排行 ↗' : '查看韓服 S1 配裝來源 ↗');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    if (currentSeason === 's0') {
      link.href = 'https://erinn.tw/runes';
    } else {
      link.href =
        job === '騎士'
          ? 'https://www.kakao.gg/games/mabinogi-mobile/guide-69f021f4f43b96476f0eb5c5'
          : 'https://theqoo.net/mabinogi/' +
            (['戰士系列', '魔法師系列', '弓手系列'].includes(family) ? '4087115736' : '4087117159');
    }
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
  function renderSlotFilterCounts() {
    if (!slotFiltersEl) return;
    const ds = getActiveSeason();
    slotFiltersEl.querySelectorAll('.filter-chip').forEach(btn => {
      const s = btn.dataset.slot;
      const cnt = s === '全部' ? ds.keys.length : ds.keys.filter(k => ds.infoMap[k].slot === s).length;
      btn.textContent = `${s} (${cnt})`;
    });
  }

  function initCatalogFilters() {
    const { el } = app;
    for (const s of slotFilterOpts) {
      const b = el('button', 'filter-chip', s);
      b.type = 'button';
      b.dataset.slot = s;
      b.setAttribute('aria-pressed', String(s === reverseSlot));
      b.onclick = () => {
        reverseSlot = s;
        slotFiltersEl.querySelectorAll('.filter-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.slot === s)));
        renderCatalog();
      };
      slotFiltersEl.append(b);
    }
    renderSlotFilterCounts();

    for (const t of traitFilterOpts) {
      const b = el('button', 'filter-chip', t.label);
      b.type = 'button';
      b.dataset.trait = t.id;
      b.setAttribute('aria-pressed', String(t.id === reverseTrait));
      b.onclick = () => {
        reverseTrait = t.id;
        traitFiltersEl.querySelectorAll('.filter-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.trait === t.id)));
        renderCatalog();
      };
      traitFiltersEl.append(b);
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
    const ds = getActiveSeason();
    const q = quickSearch.value.trim().toLowerCase();
    const matched = ds.keys.filter(key => {
      const info = ds.infoMap[key];
      const usage = ds.usage[key];
      if (reverseSlot !== '全部' && info.slot !== reverseSlot) return false;
      if (!matchesTrait(info, usage)) return false;
      if (!q) return true;
      const aliases = currentSeason === 's1' ? (safeAliases[key] || []).join(' ') : '';
      const hay = [
        key, info.zh, aliases, info.slot, info.tierTag || '',
        info.job || '', info.skill || '', info.effect || '', info.defect || '', info.note || ''
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });

    if (catalogSort.value === 'popular') {
      matched.sort((a, b) => {
        const ua = ds.usage[a], ub = ds.usage[b];
        if (ub.t0.length !== ua.t0.length) return ub.t0.length - ua.t0.length;
        const totA = ua.t0.length + ua.t1.length + ua.t2.length;
        const totB = ub.t0.length + ub.t1.length + ub.t2.length;
        if (totB !== totA) return totB - totA;
        return slotOrder[ds.infoMap[a].slot] - slotOrder[ds.infoMap[b].slot];
      });
    } else {
      matched.sort((a, b) => slotOrder[ds.infoMap[a].slot] - slotOrder[ds.infoMap[b].slot]);
    }

    const sLabel = currentSeason === 's0' ? 'S0 白星 6★' : 'S1 黃星 8★';
    catalogCount.textContent = `【${sLabel}】顯示 ${matched.length} / ${ds.keys.length} 顆符文（點擊下方職業徽章可直接跳轉該職配裝）`;
    catalogGrid.replaceChildren();

    if (!matched.length) {
      catalogGrid.append(el('p', 'note-text', '找不到符合條件的符文，可切換賽季（S1／S0）或改搜效果關鍵字（如「暴擊」「破防」「冷卻」）。'));
      return;
    }

    const frag = document.createDocumentFragment();
    for (const key of matched) {
      const info = ds.infoMap[key];
      const usage = ds.usage[key];
      const aliases = currentSeason === 's1' ? (safeAliases[key] || []) : [];
      const card = el('article', 'rune-card');

      const head = el('div', 'rc-head');
      head.append(el('h3', 'rc-title', info.zh));
      if (currentSeason === 's1') {
        const krSpan = el('span', 'rc-kr', key);
        krSpan.setAttribute('translate', 'no');
        head.append(krSpan);
      }
      card.append(head);

      if (aliases.length) card.append(el('p', 'rc-aliases', `社群常見別名：${aliases.join('、')}`));

      const tags = el('div', 'rc-tags');
      tags.append(el('span', 'rc-tag', info.slot));
      if (info.tierTag) tags.append(el('span', 'rc-tag', info.tierTag));
      if (info.job) tags.append(el('span', 'rc-tag', info.job));
      const isVerified = info.status === '社群譯名' || info.status === '台服 S0 正式名';
      tags.append(
        el(
          'span',
          isVerified ? 'rc-tag is-verified' : 'rc-tag is-draft',
          info.status === '台服 S0 正式名' ? '台服 S0 正式名'
            : info.status === '社群譯名' ? '社群常用譯名' : '暫譯・以效果對照'
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

  // ===== 浮動效果提示窗（同時支援 S1 與 S0，含 S1 季末演變說明） =====
  function fillTooltip(key, seasonKey, diffNote = '') {
    const { el } = app;
    const targetSeason = seasonKey && seasonData[seasonKey] ? seasonKey : currentSeason;
    const ds = seasonData[targetSeason] || seasonData.s1;
    const info = ds.infoMap[key];
    if (!info) return false;
    const aliases = targetSeason === 's1' ? (safeAliases[key] || []) : [];
    const usage = ds.usage[key];

    tooltip.replaceChildren();

    const head = el('div', 'tt-head');
    head.append(el('span', 'tt-title', info.zh));
    if (targetSeason === 's1') {
      const krSpan = el('span', 'tt-kr', key);
      krSpan.setAttribute('translate', 'no');
      head.append(krSpan);
    } else {
      head.append(el('span', 'tt-kr', 'S0 賽季零'));
    }
    tooltip.append(head);

    if (aliases.length) tooltip.append(el('p', 'tt-aliases', `社群別名：${aliases.join('、')}`));

    const tags = el('div', 'tt-tags');
    tags.append(el('span', 'tt-tag', info.slot));
    if (info.tierTag) tags.append(el('span', 'tt-tag', info.tierTag));
    if (info.job) tags.append(el('span', 'tt-tag', info.job));
    const isVerified = info.status === '社群譯名' || info.status === '台服 S0 正式名';
    tags.append(
      el(
        'span',
        isVerified ? 'tt-tag is-verified' : 'tt-tag is-draft',
        info.status === '台服 S0 正式名' ? '台服 S0 正式名'
          : info.status === '社群譯名' ? '社群常用譯名' : '暫譯・以效果對照'
      )
    );
    tooltip.append(tags);

    if (info.skill) tooltip.append(el('p', 'tt-skill', `對應技能：${info.skill}`));
    tooltip.append(el('p', 'tt-effect', info.effect));
    if (info.defect) tooltip.append(el('p', 'tt-defect', `缺陷副作用：${info.defect}`));
    if (diffNote) tooltip.append(el('p', 'tt-stage-diff', `S1 季末演變：${diffNote}`));
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
        if (targetSeason !== currentSeason) setSeason(targetSeason, false);
        quickSearch.value = info.zh;
        reverseSlot = '全部';
        reverseTrait = 'all';
        slotFiltersEl.querySelectorAll('.filter-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.slot === '全部')));
        traitFiltersEl.querySelectorAll('.filter-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.trait === 'all')));
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
    const seasonKey = chip.dataset.season || 's1';
    const diffNote = chip.dataset.diffNote || '';
    if (!fillTooltip(key, seasonKey, diffNote)) return;
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
    document.querySelectorAll('.season-btn').forEach(btn => {
      btn.onclick = () => setSeason(btn.dataset.season);
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
    slotFiltersEl = document.querySelector('#slot-filters');
    traitFiltersEl = document.querySelector('#trait-filters');
    rwBody = document.querySelector('#rw-body');
    rwSearch = document.querySelector('#rw-search');

    buildIndexes();

    const nav = document.querySelector('#jobs');
    for (const [family, names] of Object.entries(families)) {
      const group = app.el('section', 'family');
      group.append(app.el('h2', '', family));
      const row = app.el('div', 'job-btn-row');
      for (const name of names) {
        const b = app.el('button', '', name);
        b.type = 'button';
        b.setAttribute('aria-controls', 'panel');
        b.setAttribute('aria-pressed', 'false');
        b.onclick = () => choose(b, name, family);
        jobButtons.set(name, b);
        row.append(b);
      }
      group.append(row);
      nav.append(group);
    }

    initCatalogFilters();
    updateSeasonUI();
    bindEvents();

    if (window.BuildChecker) {
      BuildChecker.init(app, {
        allJobs,
        runePattern: seasonData.s1.pattern,
        safeRunewords,
        attachTooltipContainer
      });
    }
  }

  return {
    init,
    allJobs,
    setSeason,
    setSubMode,
    openJob,
    hideTooltip,
    getHashParams() {
      if (currentSubMode === 'builder' && window.BuildChecker) {
        const bp = BuildChecker.getHashParams();
        bp.set('tab', 'runes');
        return bp;
      }
      const p = new URLSearchParams();
      p.set('tab', 'runes');
      if (currentSeason !== 's1') p.set('season', currentSeason);
      if (currentSeason === 's1' && currentS1Stage === 'late') p.set('stage', 'late');
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
      const season = params.get('season');
      if (season === 's0' || season === 's1') setSeason(season, false);
      const stage = params.get('stage');
      currentS1Stage = stage === 'late' ? 'late' : 'early';
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
