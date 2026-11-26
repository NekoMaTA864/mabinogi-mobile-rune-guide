// 台服《瑪奇 Mobile》固定排程與紫洞週期資料（台灣時間 UTC+8）
// 紫洞（通往深淵的黑色坑洞）：每次存在 15 分鐘、結束後 36 小時再生（循環週期 36 小時 15 分鐘）。
// 預設基準時間依 2026/11/26 實查 MMD / 星月酒館 / 愛爾琳網 之愛麗沙（台服）實測時刻：2026/11/27 04:14:10。

const SCHEDULE_CONFIG = {
  resetHour: 6, // 每日 06:00 台灣時間切換遊戲日（供週幾地下城判斷）
  fieldBossHours: [12, 18, 20, 22], // 每日 12:00 / 18:00 / 20:00 / 22:00
  fieldBossPreEntryMins: 10, // 出現前 10 分鐘開放預先入場
  fieldBossDurationMins: 30, // 出現後持續 30 分鐘
  summonBarrierPrepMins: 3, // 每小時整點出現，地面黑氣約 3 分鐘後召喚

  // 紫洞（深淵黑色坑洞）週期設定：預設記錄愛麗莎（台服）實測基準
  purpleHole: {
    serverLabel: "愛麗莎",
    defaultAnchorIso: "2026-11-27T04:14:10+08:00",
    defaultAnchorNote: "MMD／星月酒館實測基準（停機維護後可自行校準）",
    cycleMins: 36 * 60 + 15, // 36 小時 15 分鐘（2175 分）
    durationMins: 15, // 出現後持續 15 分鐘
    preAlertMins: 60 // 出現前 1 小時狩獵場廣播預告
  },

  // 週幾地下城（索引對應 JS getDay()：0=日, 1=一 ... 6=六）
  weekdayDungeons: [
    {
      dayIndex: 1,
      dayLabel: "星期一",
      name: "閃耀洞穴",
      reward: "金幣（強化、修理與合成大量金幣需求）",
      note: "週一／週四開放，每日限入場 1 次。"
    },
    {
      dayIndex: 2,
      dayLabel: "星期二",
      name: "璀璨宅邸",
      reward: "寶石（寶石合成與戰力提升必備）",
      note: "週二／週五開放，每日限入場 1 次。"
    },
    {
      dayIndex: 3,
      dayLabel: "星期三",
      name: "燦爛遺跡",
      reward: "鍊金術再燃燒催化劑（稀缺突破與強化材料）",
      note: "週三／週六開放，每日限入場 1 次。"
    },
    {
      dayIndex: 4,
      dayLabel: "星期四",
      name: "閃耀洞穴",
      reward: "金幣（強化、修理與合成大量金幣需求）",
      note: "週一／週四開放，每日限入場 1 次。"
    },
    {
      dayIndex: 5,
      dayLabel: "星期五",
      name: "璀璨宅邸",
      reward: "寶石（寶石合成與戰力提升必備）",
      note: "週二／週五開放，每日限入場 1 次。"
    },
    {
      dayIndex: 6,
      dayLabel: "星期六",
      name: "燦爛遺跡",
      reward: "鍊金術再燃燒催化劑（稀缺突破與強化材料）",
      note: "週三／週六開放，每日限入場 1 次。"
    },
    {
      dayIndex: 0,
      dayLabel: "星期日",
      name: "自選地下城（三選一）",
      reward: "可任選「閃耀洞穴（金幣）」「璀璨宅邸（寶石）」「燦爛遺跡（催化劑）」其一",
      note: "週日彈性補缺，依當週最缺資源挑選。"
    }
  ],

  // 動態黑洞需要玩家即時回報，維護後可對照下列專站快速校準基準時間
  blackHoleTrackers: [
    {
      name: "MMD 瑪奇M Dashboard",
      url: "https://mmd-tw.com/",
      desc: "深淵黑洞即時倒數與瀏覽器提醒、愛麗沙世界頻與市場物價。"
    },
    {
      name: "愛爾琳網・深淵黑色坑洞 (erinn.tw)",
      url: "https://erinn.tw/holes/abyss",
      desc: "深淵／深層黑洞即時紀錄與回報，附全服角色榜與客戶端符文圖鑑。"
    },
    {
      name: "星月酒館 (Starmoon Tavern)",
      url: "https://starmoon.game-db.tw/",
      desc: "深淵黑洞倒數、台韓時裝時間軸與多款生活製作計算機。"
    },
    {
      name: "符文配裝模擬器・傳送門頁 (mabi.lin3.net)",
      url: "https://mabi.lin3.net/portal",
      desc: "黑洞倒數與 10 格符文＋21 格寶石配裝模擬一站切換。"
    }
  ]
};
