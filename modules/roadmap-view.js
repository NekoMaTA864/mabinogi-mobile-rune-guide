// 模組 5：台韓版本未來視（改版時間軸對照、暗黑術士／騎士預覽、S1→S2 規劃與時裝入口）
window.RoadmapView = (() => {
  let app = null;
  let filterMode = 'all'; // 'all' | 'upcoming'

  let filterBar, timelineEl, classesGrid, tipsList, fashionGrid;

  const filters = [
    { id: 'all', label: '全部改版歷程' },
    { id: 'upcoming', label: '僅看台服尚未開放（未來視）' }
  ];

  function renderTimeline() {
    const { el } = app;
    const list = ROADMAP_MILESTONES.filter(m => filterMode === 'all' || m.status === 'upcoming');
    timelineEl.replaceChildren();

    for (const m of list) {
      const card = el('article', `roadmap-card is-${m.status}`);

      const head = el('div', 'rm-head');
      const badgeCls = m.status === 'current'
        ? 'rc-tag is-live'
        : m.status === 'released' ? 'rc-tag is-verified' : 'rc-tag is-draft';
      head.append(
        el('span', badgeCls, m.statusLabel),
        el('span', 'rm-dates', `台服：${m.twDate} ｜ ${m.krRef}`)
      );

      const title = el('h3', 'rm-title', m.title);
      const ul = el('ul', 'rm-list');
      for (const h of m.highlights) {
        ul.append(el('li', '', h));
      }

      card.append(head, title, ul);
      timelineEl.append(card);
    }
  }

  function init(ctx) {
    app = ctx;
    filterBar = document.querySelector('#roadmap-filters');
    timelineEl = document.querySelector('#roadmap-timeline');
    classesGrid = document.querySelector('#upcoming-classes');
    tipsList = document.querySelector('#s1-to-s2-tips');
    fashionGrid = document.querySelector('#fashion-links');

    for (const f of filters) {
      const b = app.el('button', 'filter-chip', f.label);
      b.type = 'button';
      b.dataset.filter = f.id;
      b.setAttribute('aria-pressed', String(f.id === filterMode));
      b.onclick = () => {
        filterMode = f.id;
        filterBar.querySelectorAll('.filter-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.filter === f.id)));
        renderTimeline();
      };
      filterBar.append(b);
    }

    // 未來視新職業卡（附一鍵跳轉符文中心 S1 四象限）
    for (const c of UPCOMING_CLASSES) {
      const card = app.el('article', 'rune-card');
      const head = app.el('div', 'rc-head');
      head.append(app.el('h3', 'rc-title', c.job), app.el('span', 'rc-kr', c.krDate));
      const tags = app.el('div', 'rc-tags');
      tags.append(app.el('span', 'rc-tag is-draft', c.family), app.el('span', 'rc-tag', c.role));
      const p = app.el('p', 'rc-effect', c.tip);
      const act = app.el('div', 'tool-card-actions');
      const btn = app.el('button', 'tool-btn is-primary', `查看「${c.job}」S1 推薦配裝`);
      btn.type = 'button';
      btn.onclick = () => {
        RuneCenter.setSeason('s1', false);
        RuneCenter.openJob(c.job, null, true);
      };
      act.append(btn);
      card.append(head, tags, p, act);
      classesGrid.append(card);
    }

    for (const tip of S1_TO_S2_TIPS) {
      tipsList.append(app.el('li', '', tip));
    }

    for (const site of FASHION_LINKS) {
      const a = app.el('a', 'quick-link-card');
      a.href = site.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.append(app.el('strong', '', `${site.name} ↗`), app.el('span', '', site.desc));
      fashionGrid.append(a);
    }

    renderTimeline();
  }

  return { init };
})();
