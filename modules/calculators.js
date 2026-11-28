// 模組 4B：寶石合成計算機（同階晉階＋星光稜晶 S）與交易所德卡手續費正反算
// 純前端即時計算，不寫入任何個人資料或庫存。
window.Calculators = (() => {
  let app = null;
  const numFmt = new Intl.NumberFormat('zh-Hant');

  // 寶石計算 DOM
  let gemFromEl, gemToEl, gemQtyEl, gemRatioEl, gemSummaryEl, gemStepsBody;
  let prismQtyEl, prismDarkstoneEl, prismQuartzEl, prismOutputEl;

  // 交易所計算 DOM
  let exPriceEl, exQtyEl, exCostEl, exFeeEl, exForwardOut;
  let exTargetEl, exRevFeeEl, exReverseOut;

  function clampInt(val, min, max, fallback) {
    const n = parseInt(val, 10);
    if (Number.isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function clampNum(val, min, max, fallback) {
    const n = parseFloat(val);
    if (Number.isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  // ===== 1. 寶石同階晉階展開計算 =====
  function renderGemTierCalc() {
    const { el } = app;
    const fromTier = clampInt(gemFromEl.value, 1, 6, 1);
    let toTier = clampInt(gemToEl.value, 2, 7, 5);
    if (toTier <= fromTier) {
      toTier = fromTier + 1;
      gemToEl.value = String(toTier);
    }
    const targetQty = clampInt(gemQtyEl.value, 1, 100, 1);
    const ratio = clampInt(gemRatioEl.value, 2, 5, 3);

    const steps = toTier - fromTier;
    const totalBase = targetQty * Math.pow(ratio, steps);

    // 計算總合成次數：從目標往下每升 1 階的合成次數加總
    let totalCrafts = 0;
    const rows = [];
    for (let t = toTier; t >= fromTier; t--) {
      const diff = toTier - t;
      const needed = targetQty * Math.pow(ratio, diff);
      const craftsHere = t > fromTier ? needed : 0;
      totalCrafts += craftsHere;
      rows.push({
        tier: t,
        needed,
        crafts: craftsHere,
        role: t === toTier ? '最終目標' : t === fromTier ? '起始原料' : '中間階級'
      });
    }

    gemSummaryEl.replaceChildren();
    const kpi1 = el('div', 'calc-kpi');
    kpi1.append(el('span', 'calc-kpi-label', `所需 ${fromTier} 階基礎寶石`), el('strong', 'calc-kpi-val', `${numFmt.format(totalBase)} 顆`));
    const kpi2 = el('div', 'calc-kpi');
    kpi2.append(el('span', 'calc-kpi-label', '累計合成次數'), el('strong', 'calc-kpi-val', `${numFmt.format(totalCrafts)} 次`));
    gemSummaryEl.append(kpi1, kpi2);

    gemStepsBody.replaceChildren();
    for (const r of rows) {
      const tr = gemStepsBody.insertRow();
      tr.append(
        el('td', '', `${r.tier} 階寶石`),
        el('td', '', r.role),
        el('td', 'num-col', `${numFmt.format(r.needed)} 顆`),
        el('td', 'num-col', r.crafts > 0 ? `${numFmt.format(r.crafts)} 次` : '—')
      );
    }
  }

  // ===== 2. 粗糙的星光稜晶 S 直合材料展開（9/9 改版規則）=====
  function renderPrismCalc() {
    const { el } = app;
    const targetPrism = clampInt(prismQtyEl.value, 1, 50, 1);
    const darkstoneOwned = clampInt(prismDarkstoneEl.value, 0, 50, 0);
    const quartzOwned = clampInt(prismQuartzEl.value, 0, 50, 0);
    const paired = Math.min(targetPrism, darkstoneOwned, quartzOwned);
    const darkstoneOnly = Math.min(targetPrism - paired, darkstoneOwned - paired);
    const quartzOnly = Math.min(targetPrism - paired - darkstoneOnly, quartzOwned - paired);
    const direct = targetPrism - paired - darkstoneOnly - quartzOnly;
    const colorsPerType = darkstoneOnly + direct;
    const obsidianAndDiamond = quartzOnly + direct;

    prismOutputEl.replaceChildren();
    const list = el('div', 'calc-breakdown');

    const items = [
      { label: '暗光石 S＋三重石英 S', val: `${paired} 次` },
      { label: '暗光石 S＋三種不同有色寶石 S', val: `${darkstoneOnly} 次` },
      { label: '三重石英 S＋黑曜石 S＋鑽石 S', val: `${quartzOnly} 次` },
      { label: '三種不同有色寶石 S＋黑曜石 S＋鑽石 S', val: `${direct} 次` },
      { label: '待備粗糙有色寶石 S（三種不同顏色，每色各）', val: `${colorsPerType} 顆（共 ${colorsPerType * 3} 顆）` },
      { label: '待備粗糙的黑曜石 S', val: `${obsidianAndDiamond} 顆` },
      { label: '待備粗糙的鑽石 S', val: `${obsidianAndDiamond} 顆` }
    ];
    for (const it of items) {
      const row = el('div', 'calc-line');
      row.append(el('span', '', it.label), el('strong', 'num-col', it.val));
      list.append(row);
    }
    prismOutputEl.append(list);
  }

  // ===== 3. 交易所德卡正算（售價 → 實領與淨利）=====
  function readExchangeFee(input) {
    return Math.round(clampNum(input.value, 0, 50, 15) * 2) / 2;
  }

  function exchangeSettlement(gross, feePct) {
    // 費率以 0.5% 為一步，拆成每 200 德卡的整數費用與餘額。
    const fee = Math.floor(gross / 200) * (feePct * 2) + Math.floor((gross % 200) * feePct / 100);
    return { fee, net: gross - fee };
  }

  function renderExchangeForward() {
    const { el } = app;
    const price = clampInt(exPriceEl.value, 0, 1999999998, 0);
    const qty = clampInt(exQtyEl.value, 1, 99999, 1);
    const cost = clampInt(exCostEl.value, 0, 999999999, 0);
    const feePct = readExchangeFee(exFeeEl);

    const gross = price * qty;
    const { fee, net } = exchangeSettlement(gross, feePct);
    const profit = net - cost;
    const margin = cost > 0 ? ((profit / cost) * 100).toFixed(1) : null;

    exForwardOut.replaceChildren();
    const kpiRow = el('div', 'calc-kpi-grid');
    const k1 = el('div', 'calc-kpi');
    k1.append(el('span', 'calc-kpi-label', '總成交額'), el('strong', 'calc-kpi-val', `${numFmt.format(gross)} 德卡`));
    const k2 = el('div', 'calc-kpi');
    k2.append(el('span', 'calc-kpi-label', `預估手續費（${feePct}%）`), el('strong', 'calc-kpi-val', `-${numFmt.format(fee)} 德卡`));
    const k3 = el('div', 'calc-kpi is-accent');
    k3.append(el('span', 'calc-kpi-label', '信箱預估實領'), el('strong', 'calc-kpi-val', `${numFmt.format(net)} 德卡`));
    kpiRow.append(k1, k2, k3);
    exForwardOut.append(kpiRow);

    if (cost > 0) {
      const status = profit >= 0 ? 'is-ok' : 'is-warn';
      const box = el('div', `check-item ${status}`);
      box.style.marginTop = '10px';
      const sign = profit >= 0 ? '+' : '';
      box.append(
        el('strong', '', profit >= 0 ? `預估淨賺：${sign}${numFmt.format(profit)} 德卡（報酬率 ${margin}%）` : `預估虧損：${numFmt.format(profit)} 德卡（${margin}%）`),
        el('p', '', profit >= 0
          ? `扣除總成本 ${numFmt.format(cost)} 德卡與 ${feePct}% 手續費後仍有盈餘。`
          : `目前售價扣完 ${feePct}% 手續費後低於成本，建議拉高單價或改用右側反推損益兩平價。`)
      );
      exForwardOut.append(box);
    }
  }

  // ===== 4. 交易所德卡反推（目標實領 → 最低掛單價）=====
  function renderExchangeReverse() {
    const { el } = app;
    const targetNet = clampInt(exTargetEl.value, 0, 999999999, 0);
    const feePct = readExchangeFee(exRevFeeEl);
    let minListPrice = targetNet;
    // 費率最高 50%，兩倍目標一定能達標。以同一套結算二分搜尋第一個達標價。
    let upper = targetNet * 2;
    while (minListPrice < upper) {
      const mid = Math.floor((minListPrice + upper) / 2);
      if (exchangeSettlement(mid, feePct).net >= targetNet) upper = mid;
      else minListPrice = mid + 1;
    }
    const { fee: actualFee, net: actualNet } = exchangeSettlement(minListPrice, feePct);

    exReverseOut.replaceChildren();
    const kpiRow = el('div', 'calc-kpi-grid');
    const k1 = el('div', 'calc-kpi is-accent');
    k1.append(el('span', 'calc-kpi-label', '損益兩平最低掛單價'), el('strong', 'calc-kpi-val', `${numFmt.format(minListPrice)} 德卡`));
    const k2 = el('div', 'calc-kpi');
    k2.append(el('span', 'calc-kpi-label', `預估扣除手續費（${feePct}%）`), el('strong', 'calc-kpi-val', `${numFmt.format(actualFee)} 德卡`));
    const k3 = el('div', 'calc-kpi');
    k3.append(el('span', 'calc-kpi-label', '實際預估實領'), el('strong', 'calc-kpi-val', `${numFmt.format(actualNet)} 德卡`));
    kpiRow.append(k1, k2, k3);
    exReverseOut.append(kpiRow);
  }

  function init(ctx) {
    app = ctx;
    gemFromEl = document.querySelector('#gem-from');
    gemToEl = document.querySelector('#gem-to');
    gemQtyEl = document.querySelector('#gem-qty');
    gemRatioEl = document.querySelector('#gem-ratio');
    gemSummaryEl = document.querySelector('#gem-summary');
    gemStepsBody = document.querySelector('#gem-steps-body');

    prismQtyEl = document.querySelector('#prism-qty');
    prismDarkstoneEl = document.querySelector('#prism-darkstone');
    prismQuartzEl = document.querySelector('#prism-quartz');
    prismOutputEl = document.querySelector('#prism-output');

    exPriceEl = document.querySelector('#ex-price');
    exQtyEl = document.querySelector('#ex-qty');
    exCostEl = document.querySelector('#ex-cost');
    exFeeEl = document.querySelector('#ex-fee');
    exForwardOut = document.querySelector('#ex-forward-out');

    exTargetEl = document.querySelector('#ex-target');
    exRevFeeEl = document.querySelector('#ex-rev-fee');
    exReverseOut = document.querySelector('#ex-reverse-out');

    [gemFromEl, gemToEl, gemQtyEl, gemRatioEl].forEach(el => el.addEventListener('input', renderGemTierCalc));
    [prismQtyEl, prismDarkstoneEl, prismQuartzEl].forEach(el => el.addEventListener('input', renderPrismCalc));
    [exPriceEl, exQtyEl, exCostEl, exFeeEl].forEach(el => el.addEventListener('input', renderExchangeForward));
    [exTargetEl, exRevFeeEl].forEach(el => el.addEventListener('input', renderExchangeReverse));

    renderGemTierCalc();
    renderPrismCalc();
    renderExchangeForward();
    renderExchangeReverse();
  }

  return { init };
})();
