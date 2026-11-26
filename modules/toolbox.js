// 模組 3：社群工具箱（移除「全部」與搜尋框，直接以 6 大分類按鈕挑選＋沙盒預覽工作台）
window.Toolbox = (() => {
  let app = null;
  let activeCategory = '符文與配裝';
  let activeEmbedId = null;
  let workbenchLoaded = false;

  let wbTabs, wbTitle, wbLink, wbFrame, wbReload, wbToggle, wbBody;
  let shortcutsBox, catFilters, toolCount, toolGrid;

  const categories = ['符文與配裝', '即時與黑洞', '物資與製作', 'MML 音樂', '新手與日常', '桌面工具'];

  function renderFeaturedShortcuts() {
    if (!shortcutsBox || typeof FEATURED_SHORTCUTS === 'undefined') return;
    const { el } = app;
    shortcutsBox.replaceChildren();
    for (const grp of FEATURED_SHORTCUTS) {
      const wrap = el('div', 'shortcut-group');
      wrap.append(el('div', 'shortcut-group-title', grp.group));
      const grid = el('div', `shortcut-grid cols-${grp.items.length}`);
      for (const item of grp.items) {
        const a = el('a', 'shortcut-btn');
        a.href = item.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        const top = el('div', 'shortcut-top');
        top.append(el('strong', 'shortcut-title', `${item.title} ↗`), el('span', 'rc-tag is-live', item.source));
        a.append(top, el('span', 'shortcut-desc', item.desc));
        grid.append(a);
      }
      wrap.append(grid);
      shortcutsBox.append(wrap);
    }
  }

  function getEmbeddableTools() {
    return COMMUNITY_TOOLS.filter(t => t.embeddable);
  }

  function loadEmbedTool(toolId, scrollToBox = false) {
    const tool = COMMUNITY_TOOLS.find(t => t.id === toolId && t.embeddable);
    if (!tool) return;
    activeEmbedId = tool.id;
    workbenchLoaded = true;
    wbBody.hidden = false;
    wbToggle.textContent = '收合預覽視窗';
    wbToggle.setAttribute('aria-pressed', 'true');

    wbTabs.querySelectorAll('.filter-chip').forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.dataset.toolId === tool.id));
    });
    wbTitle.textContent = `來源：${tool.name}（${tool.url}）`;
    wbLink.href = tool.url;
    wbFrame.title = tool.name;
    wbFrame.src = tool.url;

    if (scrollToBox) {
      document.querySelector('#workbench-box').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderWorkbenchTabs() {
    const { el } = app;
    const embeds = getEmbeddableTools();
    wbTabs.replaceChildren();
    for (const tool of embeds) {
      const b = el('button', 'filter-chip', tool.workbenchLabel || tool.name);
      b.type = 'button';
      b.dataset.toolId = tool.id;
      b.setAttribute('aria-pressed', String(tool.id === activeEmbedId));
      b.onclick = () => loadEmbedTool(tool.id, false);
      wbTabs.append(b);
    }
  }

  function renderDirectory() {
    const { el } = app;
    const list = COMMUNITY_TOOLS.filter(t => t.category === activeCategory);

    toolCount.textContent = `目前分類「${activeCategory}」共 ${list.length} 個網站（所有工具版權均歸原開發者所有）`;
    toolGrid.replaceChildren();

    const frag = document.createDocumentFragment();
    for (const t of list) {
      const card = el('article', 'rune-card');

      const head = el('div', 'rc-head');
      head.append(el('h3', 'rc-title', t.name));
      card.append(head);

      const tags = el('div', 'rc-tags');
      if (t.s1Status) {
        const cls = t.s1Status.includes('S1 支援') || t.s1Status.includes('即時')
          ? 'rc-tag is-verified'
          : t.s1Status.includes('S1') ? 'rc-tag is-draft' : 'rc-tag';
        tags.append(el('span', cls, t.s1Status));
      }
      for (const tg of (t.tags || [])) {
        tags.append(el('span', tg === '可站內預覽' ? 'rc-tag is-live' : 'rc-tag', tg));
      }
      card.append(tags);

      card.append(el('p', 'rc-effect', t.desc));

      const actions = el('div', 'tool-card-actions');
      const openA = el('a', 'action-link', '開啟網站 ↗');
      openA.href = t.url;
      openA.target = '_blank';
      openA.rel = 'noopener noreferrer';
      actions.append(openA);

      if (t.embeddable) {
        const prevBtn = el('button', 'tool-btn', '站內預覽');
        prevBtn.type = 'button';
        prevBtn.onclick = () => loadEmbedTool(t.id, true);
        actions.append(prevBtn);
      }
      card.append(actions);
      frag.append(card);
    }
    toolGrid.append(frag);
  }

  function init(ctx) {
    app = ctx;
    wbTabs = document.querySelector('#wb-tabs');
    wbTitle = document.querySelector('#wb-title');
    wbLink = document.querySelector('#wb-open-link');
    wbFrame = document.querySelector('#wb-frame');
    wbReload = document.querySelector('#wb-reload');
    wbToggle = document.querySelector('#wb-toggle');
    wbBody = document.querySelector('#wb-body');
    shortcutsBox = document.querySelector('#featured-shortcuts');
    catFilters = document.querySelector('#tool-cat-filters');
    toolCount = document.querySelector('#tool-count');
    toolGrid = document.querySelector('#tool-grid');

    renderFeaturedShortcuts();
    renderWorkbenchTabs();

    wbToggle.onclick = () => {
      const opening = wbBody.hidden;
      if (opening) {
        if (!workbenchLoaded) {
          const first = getEmbeddableTools()[0];
          if (first) loadEmbedTool(first.id, false);
        } else {
          wbBody.hidden = false;
          wbToggle.textContent = '收合預覽視窗';
          wbToggle.setAttribute('aria-pressed', 'true');
        }
      } else {
        wbBody.hidden = true;
        wbToggle.textContent = '展開站內預覽';
        wbToggle.setAttribute('aria-pressed', 'false');
      }
    };

    wbReload.onclick = () => {
      if (activeEmbedId) {
        const cur = wbFrame.src;
        wbFrame.src = 'about:blank';
        setTimeout(() => { wbFrame.src = cur; }, 40);
      }
    };

    for (const c of categories) {
      const cnt = COMMUNITY_TOOLS.filter(t => t.category === c).length;
      const b = app.el('button', 'filter-chip', `${c} (${cnt})`);
      b.type = 'button';
      b.dataset.cat = c;
      b.setAttribute('aria-pressed', String(c === activeCategory));
      b.onclick = () => {
        activeCategory = c;
        catFilters.querySelectorAll('.filter-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.cat === c)));
        renderDirectory();
      };
      catFilters.append(b);
    }

    renderDirectory();
  }

  return { init };
})();
