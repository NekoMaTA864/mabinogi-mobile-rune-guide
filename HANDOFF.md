# 交接說明｜瑪奇 Mobile 多功能工具站

最新更新日期：2026-11-26（Phase 1～3 全部實作完成並部署至 GitHub Pages；維持免登入、零個人庫存／配裝／打卡之純功能性工具站定位）。

## 入口與檔案結構

- [線上工具站](https://nekomata864.github.io/mabinogi-mobile-rune-guide/) · [GitHub 專案](https://github.com/NekoMaTA864/mabinogi-mobile-rune-guide)
- Windows 工作目錄：`C:\Users\porsh\Desktop\桌面\agent\projects\mabinogi-mobile-rune-guide`
- 五大主分頁：`即時排程`（首頁）、`符文中心`（S1／S0）、`物資與計算`（以物易物／寶石計算／交易所德卡）、`版本未來視`、`社群工具箱`。
- 模組與資料清單：
  - `index.html`、`styles.css`
  - `runes.js`（S1 150 顆＋21 職＋30 別名＋16 符文之語）、`data/runes-s0.js`（S0 104 顆＋19 職）
  - `data/schedule.js`、`data/barter.js`、`data/roadmap.js`、`data/tools-catalog.js`
  - `modules/timer-board.js`、`modules/rune-center.js`、`modules/build-checker.js`、`modules/barter-finder.js`、`modules/calculators.js`、`modules/roadmap-view.js`、`modules/toolbox.js`

## 後續可持續維護

- 待台服客戶端或 `erinn.tw` 釋出完整 S1 官方中文圖鑑後，批次將 `runes.js` 內標註 `暫譯` 的名稱對齊官方定名，並把原暫譯移入 `runeAliases`。
- 隨台服後續開放暗黑術士、騎士與 S2，於 `data/roadmap.js` 將對應里程碑由 `upcoming` 更新為 `current` / `released`。
