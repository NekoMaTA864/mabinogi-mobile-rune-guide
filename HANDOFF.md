# 交接說明｜瑪奇 Mobile 多功能工具站

最新更新日期：2026-11-26（Phase 1～4A/4B/4C 全部實作完成並部署至 GitHub Pages；維持免登入、零個人庫存／配裝／打卡之純功能性工具站定位）。

## 入口與檔案結構

- [線上工具站](https://nekomata864.github.io/mabinogi-mobile-rune-guide/) · [GitHub 專案](https://github.com/NekoMaTA864/mabinogi-mobile-rune-guide)
- Windows 工作目錄：`C:\Users\porsh\Desktop\桌面\agent\projects\mabinogi-mobile-rune-guide`
- 六大主分頁：`即時排程`（首頁，含愛麗莎紫洞 `+36h15m` 倒數與校準）、`符文中心`（S1／S0）、`職業養成`（全 21 職 S1 Lv.85 五模組）、`物資與計算`（以物易物／寶石計算／交易所德卡）、`版本未來視`、`社群工具箱`（含 5 大熱門特色直達）。
- 模組與資料清單：
  - `index.html`、`styles.css`
  - `runes.js`（S1 150 顆＋21 職＋30 別名＋16 符文之語）、`data/runes-s0.js`（S0 104 顆＋19 職）
  - `data/class-guides.js`（全 21 職 S1 Lv.85 寶石雕琢、飾品技能特化與循環、刻印重設、等級卡、進階可選項）
  - `data/schedule.js`、`data/barter.js`、`data/roadmap.js`、`data/tools-catalog.js`
  - `modules/timer-board.js`、`modules/rune-center.js`、`modules/class-guide.js`、`modules/build-checker.js`、`modules/barter-finder.js`、`modules/calculators.js`、`modules/roadmap-view.js`、`modules/toolbox.js`

## 後續可持續維護

- 待台服客戶端或 `erinn.tw` 釋出完整 S1 官方中文圖鑑後，批次將 `runes.js` 內標註 `暫譯` 的名稱對齊官方定名，並把原暫譯移入 `runeAliases`。
- 官方停機維護導致愛麗莎紫洞時間軸順延時，可更新 `data/schedule.js` 內 `purpleHole.defaultAnchorIso`（使用者端亦可隨時點「剛開洞！設為現在」即時本機校準）。
- 隨台服後續開放暗黑術士、騎士與 S2，於 `data/roadmap.js` 與 `data/class-guides.js` 更新開放狀態。
