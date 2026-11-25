# 交接說明｜瑪奇 Mobile S1 多功能工具站

最新更新日期：2026-11-26（已完成 Phase 2 實作與全站視覺美編重塑，並安裝 `frontend-design`、`web-design-guidelines` 至工作區 `.agents/skills/`）。

## 入口與檔案結構

- [線上工具站](https://nekomata864.github.io/mabinogi-mobile-rune-guide/) · [GitHub 專案](https://github.com/NekoMaTA864/mabinogi-mobile-rune-guide)
- Windows 工作目錄：`C:\Users\porsh\Desktop\桌面\agent\projects\mabinogi-mobile-rune-guide`
- 模組化純靜態架構（免建置工具，GitHub Pages 秒部署）：
  - `index.html`、`styles.css`：採《瑪奇》聖騎士「愛爾琳石碑與青金石典籍（Emain Macha Marble & Arcane Lapis）」淺／深色雙主題、Noto Serif TC + Noto Sans TC 字體階層、無障礙 skip link、`color-scheme`、`prefers-reduced-motion` 與四主分頁底線導覽。
  - `runes.js`：150 顆符文資料庫、21 職推薦表、30 組跨站別名、16 組 8★ 飾品符文之語。
  - `data/barter.js` + `modules/barter-finder.js`：以物易物雙向查詢器（24 條提爾克納／杜巴頓常用路線）＋每日／每週 NPC 限購倍數金幣試算（零個人庫存）。
  - `modules/build-checker.js` + `modules/rune-center.js`：10 格符文試配檢核器（缺陷與「永恆」抵銷、團本唯一衝突、覺醒覆蓋、異常聯動、T0–T2 統計與符文之語對照＋URL 分享）＋既有四象限／雙職比對／反查圖鑑。
  - `data/schedule.js` + `modules/timer-board.js`：台北時間（UTC+8）即時排程與週幾地下城表。
  - `data/tools-catalog.js` + `modules/toolbox.js`：20 個中文社群工具分類目錄＋5 款沙盒預覽工作台。

## 後續 Phase 3 規劃

- 台韓版本改版進度與時裝排程對照頁、寶石合成／交易所稅後速算器。
- 待台服遊戲客戶端或 `erinn.tw` 更新完整 S1 正式定名後，批次校對 150 顆譯名並將原暫譯移入 `runeAliases`。
