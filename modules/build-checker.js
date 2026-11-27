// 模組 1B：符文 10 格試配檢核器（1 武器＋1 徽章＋3 飾品＋5 防具）
// 純前端即時檢核：缺陷與「永恆」抵銷、團本巨神碎片唯一衝突、覺醒套組覆蓋、異常聯動、T0–T2 吻合度與 8★ 飾品符文之語。
window.BuildChecker = (() => {
  const AWAKEN_EMBLEMS = new Set([
    '아득한 빛', '갈라진 땅', '산맥 군주', '부서진 하늘',
    '대마법사', '흩날리는 검', '무자비한 포식자', '녹아내리는 대지'
  ]);
  const AWAKEN_ARMORS = new Set(['압도적인 힘', '섬세한 손놀림']);
  const RAID_UNIQUE_ARMORS = new Set(['창백한 섬광', '일렁이는 불꽃']);

  let app = null;
  let allJobs = [];
  let runePattern = null;
  let safeRunewords = [];
  let getS1Stage = () => 'early';
  let setS1Stage = () => {};

  // DOM 節點
  let builderStageBar, jobSelect, fillT0Btn, clearBtn, copyBtn, shareBtn;
  let slotsGrid, reportBox, previewList;

  // 狀態：10 格（全部以韓文鍵存值，空字串代表未選）
  const state = {
    job: '魔法師',
    weapon: '',
    emblem: '',
    accessories: ['', '', ''],
    armors: ['', '', '', '', '']
  };

  function getKeysBySlot(slot, jobFilter = null) {
    return Object.keys(runeInfo).filter(k => {
      const info = runeInfo[k];
      if (info.slot !== slot) return false;
      if (jobFilter && info.job !== jobFilter) return false;
      return true;
    });
  }

  function getActiveStageTable() {
    const st = getS1Stage();
    if (st === 'early' && typeof runesEarly !== 'undefined') return runesEarly;
    return runes;
  }

  function getStageLabel() {
    return getS1Stage() === 'early' ? 'S1 開季／過渡' : 'S1 季末／終局';
  }

  function renderStageBar() {
    if (!builderStageBar || !app) return;
    const { el } = app;
    const st = getS1Stage();
    builderStageBar.replaceChildren();

    const sw = el('div', 'stage-switch');
    sw.setAttribute('role', 'group');
    sw.setAttribute('aria-label', '切換 10 格試配對照之 S1 階段');
    const opts = [
      { id: 'early', label: 'S1 開季／過渡（台服現況）' },
      { id: 'late', label: 'S1 季末／終局（韓服後期）' }
    ];
    for (const opt of opts) {
      const b = el('button', 'stage-btn', opt.label);
      b.type = 'button';
      b.dataset.builderStage = opt.id;
      b.setAttribute('aria-pressed', String(st === opt.id));
      b.onclick = () => {
        setS1Stage(opt.id);
        renderStageBar();
        renderReport();
      };
      sw.append(b);
    }

    const hint = el(
      'div',
      'stage-hint',
      st === 'early'
        ? '「套用該職 T0 預設」與吻合度對照台服 11/25 開季已實裝符文（不含未開放團本防具）。'
        : '「套用該職 T0 預設」與吻合度對照韓服 S1 季末定裝（含後續塔巴勒塔斯團本唯一防具）。'
    );
    builderStageBar.append(sw, hint);
  }

  function extractTierKeys(job, slotIndex) {
    const res = [[], [], []];
    const tbl = getActiveStageTable();
    const slotTiers = tbl[job][slotIndex];
    slotTiers.forEach((cell, idx) => {
      if (!cell) return;
      const mainOnly = cell.replace(/（[^）]*）/g, '');
      const matches = mainOnly.match(runePattern) || [];
      for (const m of matches) {
        if (!res[idx].includes(m)) res[idx].push(m);
      }
    });
    return res;
  }

  function fillRecommendedT0() {
    const wTiers = extractTierKeys(state.job, 0);
    const eTiers = extractTierKeys(state.job, 1);
    const aTiers = extractTierKeys(state.job, 2);
    const accTiers = extractTierKeys(state.job, 3);

    state.weapon = wTiers[0][0] || wTiers[1][0] || '';
    state.emblem = eTiers[0][0] || eTiers[1][0] || '';

    // 飾品依序填入 T0 前 3 顆（不足補 T1）
    const accPool = [...accTiers[0], ...accTiers[1], ...accTiers[2]];
    const accPicked = [];
    for (const k of accPool) {
      if (runeInfo[k] && runeInfo[k].slot === '飾品' && !accPicked.includes(k)) {
        accPicked.push(k);
        if (accPicked.length === 3) break;
      }
    }
    state.accessories = [accPicked[0] || '', accPicked[1] || '', accPicked[2] || ''];

    // 防具優先填滿 5 格，自動避開團本唯一雙裝衝突；開季模式對台服實裝職亦避開未實裝防具
    const isEarlyTwJob = getS1Stage() === 'early' && state.job !== '騎士' && state.job !== '暗黑術士';
    const armPool = [...aTiers[0], ...aTiers[1], ...aTiers[2]];
    const armPicked = [];
    let hasRaidUnique = false;
    for (const k of armPool) {
      if (!runeInfo[k] || runeInfo[k].slot !== '防具' || armPicked.includes(k)) continue;
      if (isEarlyTwJob && runeInfo[k].status !== '台服正式名') continue;
      if (RAID_UNIQUE_ARMORS.has(k)) {
        if (hasRaidUnique) continue;
        hasRaidUnique = true;
      }
      armPicked.push(k);
      if (armPicked.length === 5) break;
    }
    state.armors = [
      armPicked[0] || '', armPicked[1] || '', armPicked[2] || '',
      armPicked[3] || '', armPicked[4] || ''
    ];

    render();
    app.syncHash();
    app.showToast(`已帶入「${state.job}」${getStageLabel()} 建議參考配裝`);
  }

  function clearSlots() {
    state.weapon = '';
    state.emblem = '';
    state.accessories = ['', '', ''];
    state.armors = ['', '', '', '', ''];
    render();
    app.syncHash();
  }

  function makeSelect(options, currentVal, ariaLabel, onChange) {
    const sel = document.createElement('select');
    sel.className = 'slot-select';
    sel.setAttribute('aria-label', ariaLabel);
    sel.append(new Option('— 尚未選擇 —', ''));
    for (const k of options) {
      const info = runeInfo[k];
      const tag = info.tierTag && info.tierTag.includes('神話') ? ' [神話]'
        : info.defect ? ' [缺陷]'
        : info.tierTag && info.tierTag.includes('團本') ? ' [唯一]' : '';
      sel.append(new Option(`${info.zh}（${k}）${tag}`, k, false, k === currentVal));
    }
    sel.onchange = () => {
      onChange(sel.value);
      renderReport();
      renderPreviewChips();
      app.syncHash();
    };
    return sel;
  }

  function renderSlots() {
    const { el } = app;
    slotsGrid.replaceChildren();

    const weapons = getKeysBySlot('武器');
    const emblems = getKeysBySlot('徽章');
    const jobAccs = getKeysBySlot('飾品', state.job);
    const armors = getKeysBySlot('防具');

    // 左上：武器 (1)
    const wCard = el('section', 'builder-card');
    wCard.append(el('h3', '', '武器（1 格）'));
    const wRow = el('div', 'builder-slot-row');
    wRow.append(el('span', 'builder-slot-idx', '主手'));
    wRow.append(makeSelect(weapons, state.weapon, '選擇武器符文', v => { state.weapon = v; }));
    wCard.append(wRow);
    slotsGrid.append(wCard);

    // 右上：徽章 (1)
    const eCard = el('section', 'builder-card');
    eCard.append(el('h3', '', '徽章（1 格）'));
    const eRow = el('div', 'builder-slot-row');
    eRow.append(el('span', 'builder-slot-idx', '徽章'));
    eRow.append(makeSelect(emblems, state.emblem, '選擇徽章符文', v => { state.emblem = v; }));
    eCard.append(eRow);
    slotsGrid.append(eCard);

    // 左下：飾品 (3)
    const accCard = el('section', 'builder-card');
    accCard.append(el('h3', '', `${state.job} 專屬飾品（3 格）`));
    state.accessories.forEach((val, idx) => {
      const r = el('div', 'builder-slot-row');
      r.append(el('span', 'builder-slot-idx', `飾品 ${idx + 1}`));
      r.append(makeSelect(jobAccs, val, `選擇飾品 ${idx + 1}`, v => { state.accessories[idx] = v; }));
      accCard.append(r);
    });
    slotsGrid.append(accCard);

    // 右下：防具 (5)
    const armCard = el('section', 'builder-card');
    armCard.append(el('h3', '', '防具（5 格）'));
    state.armors.forEach((val, idx) => {
      const r = el('div', 'builder-slot-row');
      r.append(el('span', 'builder-slot-idx', `防具 ${idx + 1}`));
      r.append(makeSelect(armors, val, `選擇防具 ${idx + 1}`, v => { state.armors[idx] = v; }));
      armCard.append(r);
    });
    slotsGrid.append(armCard);
  }

  function renderPreviewChips() {
    const { el } = app;
    previewList.replaceChildren();
    const chosen = [
      state.weapon,
      state.emblem,
      ...state.accessories,
      ...state.armors
    ].filter(Boolean);

    if (!chosen.length) {
      previewList.append(el('span', 'note-text', '選擇任一格符文後，這裡會出現可懸停／點擊檢視完整效果的標籤。'));
      return;
    }
    for (const key of chosen) {
      const info = runeInfo[key];
      const chip = el('button', 'rune-chip', `${info.slot}・${info.zh}`);
      chip.type = 'button';
      chip.dataset.rune = key;
      chip.setAttribute('aria-describedby', 'rune-tooltip');
      previewList.append(chip);
    }
  }

  function renderReport() {
    const { el } = app;
    reportBox.replaceChildren();

    const chosenAcc = state.accessories.filter(Boolean);
    const chosenArm = state.armors.filter(Boolean);
    const allChosen = [state.weapon, state.emblem, ...chosenAcc, ...chosenArm].filter(Boolean);

    if (!allChosen.length) {
      reportBox.append(el('p', 'note-text', '先從下方填入符文，或點「帶入該職 T0 預設」即可即時執行 6 項聯動與衝突檢核。'));
      return;
    }

    const alerts = []; // { level: 'warn' | 'ok' | 'info', title, desc }

    // 1. 重複符文檢查
    const dupAcc = chosenAcc.filter((v, i) => chosenAcc.indexOf(v) !== i);
    const dupArm = chosenArm.filter((v, i) => chosenArm.indexOf(v) !== i);
    if (dupAcc.length || dupArm.length) {
      const names = [...new Set([...dupAcc, ...dupArm])].map(k => runeInfo[k].zh).join('、');
      alerts.push({
        level: 'warn',
        title: '重複裝備相同符文',
        desc: `偵測到重複放入「${names}」，同名符文無法疊加效果，建議替換其中一格。`
      });
    }

    // 2. 團本巨神碎片「唯一」防具衝突
    const raidEquipped = [...new Set(chosenArm.filter(k => RAID_UNIQUE_ARMORS.has(k)))];
    if (raidEquipped.length > 1) {
      alerts.push({
        level: 'warn',
        title: '團本「唯一」防具衝突',
        desc: '同時裝備了「蒼白閃光」與「搖曳之火」，兩者屬巨神碎片唯一系列僅能生效 1 顆，請擇一保留。'
      });
    } else if (raidEquipped.length === 1) {
      alerts.push({
        level: 'ok',
        title: `團本過載核心：${runeInfo[raidEquipped[0]].zh}`,
        desc: '已裝備 1 顆巨神碎片唯一防具（無衝突），實戰記得搭配充能附魔觸發過載爆發。'
      });
    }

    // 3. 缺陷裝與神話「永恆」抵銷檢核
    const defectRunes = [...new Set(allChosen.filter(k => runeInfo[k].defect))];
    const hasEternity = chosenArm.includes('영원');
    if (defectRunes.length && hasEternity) {
      alerts.push({
        level: 'ok',
        title: '缺陷流成形（已由「永恆」完全消除負面效果）',
        desc: `神話防具「永恆」已抵銷「${defectRunes.map(k => runeInfo[k].zh).join('、')}」的缺陷，並額外提供技能與普攻傷害 +15%。`
      });
    } else if (defectRunes.length && !hasEternity) {
      const detail = defectRunes.map(k => `${runeInfo[k].zh}（${runeInfo[k].defect}）`).join('；');
      alerts.push({
        level: 'warn',
        title: `含有 ${defectRunes.length} 項缺陷副作用`,
        desc: `${detail}。若欲消除副作用，可在防具格搭配神話符文「永恆」。`
      });
    } else if (hasEternity && !defectRunes.length) {
      alerts.push({
        level: 'info',
        title: '已裝備神話「永恆」，目前無搭配缺陷符文',
        desc: '「永恆」單穿仍有技傷／普攻 +15%，但搭配隱士+、暴君、角鬥士+、古代守護者、近衛兵+、無法者、神殿騎士或執政官可進一步放大上限。'
      });
    }

    // 4. 覺醒防具與徽章檢核
    const eqAwakenArm = [...new Set(chosenArm.filter(k => AWAKEN_ARMORS.has(k)))];
    if (eqAwakenArm.length) {
      if (state.emblem && AWAKEN_EMBLEMS.has(state.emblem)) {
        alerts.push({
          level: 'ok',
          title: '覺醒套組聯動生效',
          desc: `徽章「${runeInfo[state.emblem].zh}」可觸發覺醒，讓「${eqAwakenArm.map(k => runeInfo[k].zh).join('、')}」在覺醒期間數值翻倍。`
        });
      } else {
        alerts.push({
          level: 'warn',
          title: '覺醒防具缺少覺醒徽章',
          desc: `防具放了「${eqAwakenArm.map(k => runeInfo[k].zh).join('、')}」，但目前${state.emblem ? `徽章「${runeInfo[state.emblem].zh}」不具覺醒爆發` : '尚未選擇 8★ 覺醒徽章'}，會吃不到翻倍加成。`
        });
      }
    }

    // 5. 異常狀態聯動（野火／雪山）
    if (chosenArm.includes('들불')) {
      const hasBurn = state.weapon === '불길' || state.weapon === '메아리치는 진노' || state.job === '火焰術士';
      alerts.push({
        level: hasBurn ? 'ok' : 'info',
        title: hasBurn ? '燃燒聯動到位（野火）' : '野火需確認燃燒來源',
        desc: hasBurn
          ? '自身配置或職業可穩定上燃燒，能吃滿「野火」暴擊率 +14%。'
          : '「野火」需目標處於燃燒狀態才生效，確認武器改帶「烈焰」或隊伍有火系成員。'
      });
    }
    if (chosenArm.includes('설산')) {
      const hasFreeze = state.weapon === '결정' || state.weapon === '메아리치는 진노' || state.job === '冰結術士';
      alerts.push({
        level: hasFreeze ? 'ok' : 'info',
        title: hasFreeze ? '冰凍聯動到位（雪山）' : '雪山需確認冰凍來源',
        desc: hasFreeze
          ? '自身配置或職業可穩定上冰凍，能吃滿「雪山」追加打擊機率 +16%。'
          : '「雪山」需目標處於冰凍狀態才生效，確認武器改帶「結晶」或隊伍有冰系成員。'
      });
    }

    // 6. 職業推薦吻合度、台服實裝提醒與飾品符文之語命中
    const unreleasedChosen = [...new Set(allChosen.filter(k => runeInfo[k].status !== '台服正式名'))];
    if (unreleasedChosen.length) {
      alerts.push({
        level: 'info',
        title: `含 ${unreleasedChosen.length} 顆台服 11/25 尚未實裝之未來視符文`,
        desc: `${unreleasedChosen.map(k => runeInfo[k].zh).join('、')} 目前尚未收錄於台服 8★ 圖鑑（屬後續塔巴勒塔斯團本或未開放職業），僅供未來視規劃參考。`
      });
    }

    const t0Set = new Set([
      ...extractTierKeys(state.job, 0)[0],
      ...extractTierKeys(state.job, 1)[0],
      ...extractTierKeys(state.job, 2)[0],
      ...extractTierKeys(state.job, 3)[0]
    ]);
    const t12Set = new Set([
      ...extractTierKeys(state.job, 0)[1], ...extractTierKeys(state.job, 0)[2],
      ...extractTierKeys(state.job, 1)[1], ...extractTierKeys(state.job, 1)[2],
      ...extractTierKeys(state.job, 2)[1], ...extractTierKeys(state.job, 2)[2],
      ...extractTierKeys(state.job, 3)[1], ...extractTierKeys(state.job, 3)[2]
    ]);
    const uniqAll = [...new Set(allChosen)];
    const hitT0 = uniqAll.filter(k => t0Set.has(k)).length;
    const hitT12 = uniqAll.filter(k => !t0Set.has(k) && t12Set.has(k)).length;
    alerts.push({
      level: 'info',
      title: `已填入 ${allChosen.length} / 10 格（符合「${state.job}・${getStageLabel()}」T0：${hitT0} 顆、T1／T2：${hitT12} 顆）`,
      desc: `此統計對照「${getStageLabel()}」推薦表，實戰仍可視手邊高星符文靈活混搭。`
    });

    // 8★ 飾品符文之語對照
    if (chosenAcc.length) {
      const chosenAccNames = chosenAcc.map(k => runeInfo[k].zh);
      const rwMatches = safeRunewords
        .filter(rw => rw.family.includes(state.job))
        .map(rw => {
          const hits = rw.runes.filter(rn => chosenAccNames.some(cn => rn.includes(cn) || cn.includes(rn.replace(/（.*）/, ''))));
          return { rw, hits };
        })
        .filter(x => x.hits.length > 0);
      if (rwMatches.length) {
        const desc = rwMatches
          .map(x => `「${x.rw.name}」（${x.rw.bonus}）已含 ${x.hits.length}/5 顆：${x.hits.join('、')}`)
          .join('；');
        alerts.push({
          level: 'ok',
          title: '8★ 飾品符文之語收藏對照',
          desc
        });
      }
    }

    const list = el('div', 'check-list');
    for (const a of alerts) {
      const item = el('div', `check-item is-${a.level}`);
      item.append(el('strong', '', a.title), el('p', '', a.desc));
      list.append(item);
    }
    reportBox.append(list);
  }

  function formatPlainSummary() {
    const fmt = k => (k && runeInfo[k]) ? `${runeInfo[k].zh} (${k})` : '—';
    return [
      `【瑪奇 Mobile S1 10 格試配｜${state.job}】`,
      `■ 武器：${fmt(state.weapon)}`,
      `■ 徽章：${fmt(state.emblem)}`,
      `■ 飾品：${state.accessories.map(fmt).join(' ＋ ')}`,
      `■ 防具：${state.armors.map(fmt).join(' ／ ')}`
    ].join('\n');
  }

  function render() {
    renderStageBar();
    jobSelect.value = state.job;
    renderSlots();
    renderPreviewChips();
    renderReport();
  }

  function init(ctx, shared) {
    app = ctx;
    allJobs = shared.allJobs;
    runePattern = shared.runePattern;
    safeRunewords = shared.safeRunewords;
    if (shared.getS1Stage) getS1Stage = shared.getS1Stage;
    if (shared.setS1Stage) setS1Stage = shared.setS1Stage;

    builderStageBar = document.querySelector('#builder-stage-bar');
    jobSelect = document.querySelector('#builder-job');
    fillT0Btn = document.querySelector('#builder-fill-t0');
    clearBtn = document.querySelector('#builder-clear');
    copyBtn = document.querySelector('#builder-copy');
    shareBtn = document.querySelector('#builder-share');
    slotsGrid = document.querySelector('#builder-slots');
    reportBox = document.querySelector('#builder-report');
    previewList = document.querySelector('#builder-preview-chips');

    for (const j of allJobs) {
      jobSelect.append(new Option(j, j, false, j === state.job));
    }
    jobSelect.onchange = () => {
      state.job = jobSelect.value;
      // 切換職業時清空專屬飾品，保留通用武器／徽章／防具方便比較跨職共用
      state.accessories = ['', '', ''];
      render();
      app.syncHash();
    };

    fillT0Btn.onclick = fillRecommendedT0;
    clearBtn.onclick = clearSlots;
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(formatPlainSummary());
        app.showToast(`已複製「${state.job}」10 格試配摘要`);
      } catch (_) {
        app.showToast('瀏覽器未允許自動複製，請手動選取');
      }
    };
    shareBtn.onclick = async () => {
      app.syncHash();
      try {
        await navigator.clipboard.writeText(location.href);
        app.showToast('已複製 10 格試配專屬分享連結');
      } catch (_) {
        app.showToast('已更新網址列，可直接複製網址分享');
      }
    };

    // 讓試配區預覽標籤同樣支援共用懸停效果浮窗
    shared.attachTooltipContainer(previewList);
    render();
  }

  return {
    init,
    syncStageUI() {
      renderStageBar();
      renderReport();
    },
    setJob(job) {
      if (allJobs.includes(job) && state.job !== job) {
        state.job = job;
        state.accessories = ['', '', ''];
        render();
      }
    },
    getHashParams() {
      const p = new URLSearchParams();
      if (getS1Stage() === 'late') p.set('stage', 'late');
      p.set('mode', 'builder');
      p.set('job', state.job);
      if (state.weapon) p.set('w', state.weapon);
      if (state.emblem) p.set('e', state.emblem);
      if (state.accessories.some(Boolean)) p.set('acc', state.accessories.join(','));
      if (state.armors.some(Boolean)) p.set('arm', state.armors.join(','));
      return p;
    },
    applyHashParams(params) {
      const job = params.get('job');
      if (job && allJobs.includes(job)) state.job = job;
      const w = params.get('w');
      state.weapon = (w && runeInfo[w] && runeInfo[w].slot === '武器') ? w : '';
      const e = params.get('e');
      state.emblem = (e && runeInfo[e] && runeInfo[e].slot === '徽章') ? e : '';
      const accRaw = (params.get('acc') || '').split(',');
      state.accessories = [0, 1, 2].map(i => {
        const k = accRaw[i] || '';
        return (k && runeInfo[k] && runeInfo[k].slot === '飾品' && runeInfo[k].job === state.job) ? k : '';
      });
      const armRaw = (params.get('arm') || '').split(',');
      state.armors = [0, 1, 2, 3, 4].map(i => {
        const k = armRaw[i] || '';
        return (k && runeInfo[k] && runeInfo[k].slot === '防具') ? k : '';
      });
      render();
    }
  };
})();
