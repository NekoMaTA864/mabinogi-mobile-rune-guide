# 交接說明｜瑪奇 Mobile S1 多功能工具站

最新更新日期：2026-11-25（已完成 Phase 1 多功能站模組化升級並部署至 GitHub Pages，維持零登入、零個人配裝／庫存／日週資料之純功能性定位）。

## 入口與檔案結構

- [線上指南](https://nekomata864.github.io/mabinogi-mobile-rune-guide/) · [GitHub 專案](https://github.com/NekoMaTA864/mabinogi-mobile-rune-guide)
- Windows 工作目錄：`C:\Users\porsh\Desktop\桌面\agent\projects\mabinogi-mobile-rune-guide`
- 模組化結構（零建置工具、純靜態 HTML/CSS/JS，支援 `?v=` 防快取）：
  - `index.html`、`styles.css`：頂部三大主分頁外殼（`符文中心`、`即時排程`、`社群工具箱`）、深色模式與 Hash 路由（完全向下相容 `#魔法師`、`#job=...`、`#mode=...`、`#tab=schedule`、`#tab=toolbox`）。
  - `runes.js`：保留於根目錄，含 `runeInfo`（150 顆）、`runes`（21 職）、`runeAliases`（30 組跨站別名）與 `s1Runewords`（16 組 8★ 飾品符文之語）。
  - `data/schedule.js` + `modules/timer-board.js`：以 UTC+8 計算台北時間即時時鐘、06:00 日週重置、每日 12/18/20/22 點野外首領、每小時整點不詳的召喚結界、週幾地下城（閃耀洞穴／璀璨宅邸／燦爛遺跡／週日自選）與動態黑洞追蹤站快連。
  - `data/tools-catalog.js` + `modules/toolbox.js`：收錄 20 個中文社群工具分類目錄，並提供 5 款輕量靜態工具之沙盒 `<iframe>` 預覽工作台（預設收合、附原作者出處與新分頁降級鈕）。
  - `modules/rune-center.js`：符文中心完整功能（四象限、雙職共用高亮、反查全圖鑑、懸停浮窗防快取／防誤關、S1 指南）。

## 後續階段規劃（待使用者確認後啟動）

- **Phase 2**：於符文中心新增「10 格符文試配檢核器」（檢查缺陷／永恆抵銷、團本唯一防具衝突、異常聯動與符文之語），並新增純查詢版「以物易物雙向快查」（不含個人庫存）；待台服官方／`erinn.tw` 釋出 S1 客戶端定名後批次校對 150 顆譯名。
- **Phase 3**：進階生活／寶石／交易所計算機與台韓改版／時裝排程對照頁。
