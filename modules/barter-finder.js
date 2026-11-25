// 模組 4：以物易物雙向快查與 NPC 限購金幣試算（純查詢工具，不存個人庫存與進度）
window.BarterFinder = (() => {
  let app = null;
  let activeTown = '全部';
  let activeCat = '全部';
  let direction = 'all'; // 'all' | 'give' | 'get'

  let searchInput, dirGroup, townGroup, catGroup, countEl, tableBody;
  let multInput, shopBody, goldTotalEl;

  const towns = ['全部', '提爾克納', '杜巴頓'];
  const cats = ['全部', '3 級設計圖', '催化劑與聖水', '生活材料', '戰鬥消耗品'];
  const dirs = [
    { id: 'all', label: '搜尋全部欄位' },
    { id: 'give', label: '手上有材料（查投入）' },
    { id: 'get', label: '想換此產物（查目標）' }
  ];

  const numFmt = new Intl.NumberFormat('zh-Hant');

  function renderTable() {
    const { el } = app;
    const q = searchInput.value.trim().toLowerCase();
    const list = BARTER_DATA.filter(item => {
      if (activeTown !== '全部' && item.town !== activeTown) return false;
      if (activeCat !== '全部' && item.category !== activeCat) return false;
      if (!q) return true;
      if (direction === 'give') return item.give.toLowerCase().includes(q);
      if (direction === 'get') return item.get.toLowerCase().includes(q);
      return [item.town, item.npc, item.give, item.get, item.category, item.note]
        .join(' ').toLowerCase().includes(q);
    });

    countEl.textContent = `符合 ${list.length} / ${BARTER_DATA.length} 條常用交換路線（更多冷門城鎮路線可點右側開啟完整外部手冊）`;
    tableBody.replaceChildren();

    if (!list.length) {
      const tr = tableBody.insertRow();
      const td = tr.insertCell();
      td.colSpan = 5;
      td.className = 'note-text';
      td.textContent = '找不到符合條件的交換路線，試著切換「搜尋全部欄位」或清空城鎮篩選。';
      return;
    }

    for (const item of list) {
      const tr = tableBody.insertRow();
      const locTd = el('td');
      locTd.append(el('strong', '', item.town), el('div', 'cell-sub', item.npc));

      const giveTd = el('td', '', `${item.give} × ${item.giveQty}`);
      const getTd = el('td');
      getTd.append(el('strong', '', `${item.get} × ${item.getQty}`), el('div', 'cell-sub', item.category));

      const limTd = el('td', '', item.limit);
      const noteTd = el('td', 'note-text', item.note);
      tr.append(locTd, giveTd, getTd, limTd, noteTd);
    }
  }

  function renderShopCalc() {
    const { el } = app;
    const mult = Math.max(1, Math.min(20, parseInt(multInput.value, 10) || 1));
    shopBody.replaceChildren();
    let totalGold = 0;

    for (const item of NPC_SHOP_CHECKLIST) {
      const qty = item.defaultQty * mult;
      const subtotal = item.unitGold * qty;
      totalGold += subtotal;

      const tr = shopBody.insertRow();
      const nameTd = el('td');
      nameTd.append(el('strong', '', item.name), el('div', 'cell-sub', item.note));

      const priTd = el('td');
      const priCls = item.priority === '必拿' ? 'rc-tag is-verified'
        : item.priority === '生活優先' ? 'rc-tag is-draft' : 'rc-tag';
      priTd.append(el('span', priCls, item.priority));

      const cadTd = el('td', '', item.cadence);
      const costTd = el('td', 'num-col',
        subtotal > 0
          ? `${numFmt.format(qty)} 個 ≈ ${numFmt.format(subtotal)} 金幣`
          : item.costLabel
      );
      tr.append(nameTd, priTd, cadTd, costTd);
    }

    goldTotalEl.textContent = `以 ${mult} 角色／份數試算，已知標價項目合計約 ${numFmt.format(totalGold)} 金幣（僅供採購預算參考，不記錄任何個人進度）。`;
  }

  function init(ctx) {
    app = ctx;
    searchInput = document.querySelector('#barter-search');
    dirGroup = document.querySelector('#barter-dir-filters');
    townGroup = document.querySelector('#barter-town-filters');
    catGroup = document.querySelector('#barter-cat-filters');
    countEl = document.querySelector('#barter-count');
    tableBody = document.querySelector('#barter-body');
    multInput = document.querySelector('#shop-multiplier');
    shopBody = document.querySelector('#shop-body');
    goldTotalEl = document.querySelector('#shop-gold-total');

    for (const d of dirs) {
      const b = app.el('button', 'filter-chip', d.label);
      b.type = 'button';
      b.dataset.dir = d.id;
      b.setAttribute('aria-pressed', String(d.id === direction));
      b.onclick = () => {
        direction = d.id;
        dirGroup.querySelectorAll('.filter-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.dir === d.id)));
        renderTable();
      };
      dirGroup.append(b);
    }

    for (const t of towns) {
      const cnt = t === '全部' ? BARTER_DATA.length : BARTER_DATA.filter(x => x.town === t).length;
      const b = app.el('button', 'filter-chip', `${t} (${cnt})`);
      b.type = 'button';
      b.dataset.town = t;
      b.setAttribute('aria-pressed', String(t === activeTown));
      b.onclick = () => {
        activeTown = t;
        townGroup.querySelectorAll('.filter-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.town === t)));
        renderTable();
      };
      townGroup.append(b);
    }

    for (const c of cats) {
      const b = app.el('button', 'filter-chip', c);
      b.type = 'button';
      b.dataset.cat = c;
      b.setAttribute('aria-pressed', String(c === activeCat));
      b.onclick = () => {
        activeCat = c;
        catGroup.querySelectorAll('.filter-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.cat === c)));
        renderTable();
      };
      catGroup.append(b);
    }

    searchInput.addEventListener('input', renderTable);
    multInput.addEventListener('input', renderShopCalc);

    renderTable();
    renderShopCalc();
  }

  return { init };
})();
