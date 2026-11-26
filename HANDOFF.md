# 交接說明｜瑪奇 Mobile 多功能工具站

最新更新日期：2026-11-26（Phase 1～5A、Phase 6A/6B 全部部署至 GitHub Pages；Phase 5B 貓咪／桃香風格網頁圖示保留待台服符文正式名稱核對完成後一併上線）。

## 入口與檔案結構

- [線上工具站](https://nekomata864.github.io/mabinogi-mobile-rune-guide/) · [GitHub 專案](https://github.com/NekoMaTA864/mabinogi-mobile-rune-guide)
- Windows 工作目錄：`C:\Users\porsh\Desktop\桌面\agent\projects\mabinogi-mobile-rune-guide`
- 六大主分頁：`即時排程`（首頁，愛麗莎紫洞計時）、`符文中心`（S1 開季／季末兩段切換＋S0）、`職業養成`（21 職 2×3 六卡含台服 16 卷附魔＋S1 核心系統攻略）、`物資與計算`、`版本未來視`、`社群工具箱`（5 大熱門特色直達）。
- 模組與資料清單：
  - `index.html`、`styles.css`
  - `runes.js`（S1 160 顆＋開季／季末兩套 21 職表＋`s1StageDiffs`＋40 別名＋16 符文之語）、`data/runes-s0.js`（S0 104 顆＋19 職）
  - `data/class-guides.js`（全 21 職 S1 Lv.85 六大養成模組，含台服現有 16 張附魔卷軸）
  - `data/s1-systems.js`（S1 核心系統攻略：聖騎士變身＆5 格聖物、8★ 超越＆記憶刻印、職業大師徽章＆精靈痕跡／秘藥）
  - `data/schedule.js`、`data/barter.js`、`data/roadmap.js`、`data/tools-catalog.js`
  - `modules/timer-board.js`、`modules/rune-center.js`、`modules/class-guide.js`、`modules/build-checker.js`、`modules/barter-finder.js`、`modules/calculators.js`、`modules/roadmap-view.js`、`modules/toolbox.js`

## 後續待辦

- 使用者核對本機 `s1-rune-name-checklist.md`（160 顆 S1 符文＋16 張附魔卷軸）之台服正式名稱後，批次對齊 `runes.js` 與 `data/class-guides.js` 並將原暫譯移入別名。
- 執行 Phase 5B：先產製貓咪／河原木桃香風格原創網頁圖示供使用者挑選，確認後製成 Favicon 與頁首紋章上線。
