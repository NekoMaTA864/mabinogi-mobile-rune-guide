// 台服《瑪奇 Mobile》固定排程資料（台灣時間 UTC+8）
// 依據 Nexon 官方說明與台服實測：每日 06:00 重置、每週一 06:00 重置。

const SCHEDULE_CONFIG = {
  resetHour: 6, // 每日 06:00 台灣時間
  weeklyResetDay: 1, // 星期一（0=日, 1=一 ... 6=六）
  fieldBossHours: [12, 18, 20, 22], // 每日 12:00 / 18:00 / 20:00 / 22:00
  fieldBossPreEntryMins: 10, // 出現前 10 分鐘開放預先入場
  fieldBossDurationMins: 30, // 出現後持續 30 分鐘
  summonBarrierPrepMins: 3, // 每小時整點出現，地面黑氣約 3 分鐘後召喚

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

  // 動態黑洞需要玩家即時回報或伺服器端監測，提供純靜態站外連快通
  blackHoleTrackers: [
    {
      name: "MMD 瑪奇M Dashboard",
      url: "https://mmd-tw.com/",
      desc: "各伺服器深淵黑洞即時倒數與瀏覽器通知、世界頻與市場物價。"
    },
    {
      name: "愛爾琳網 (erinn.tw)",
      url: "https://erinn.tw/",
      desc: "黑洞追蹤、即時排程、42 萬+ 角色戰力榜與台服客戶端符文圖鑑。"
    },
    {
      name: "星月酒館 (Starmoon Tavern)",
      url: "https://starmoon.game-db.tw/",
      desc: "黑洞倒數、時裝時間軸與多款生活製作計算機。"
    },
    {
      name: "符文配裝模擬器・傳送門頁 (mabi.lin3.net)",
      url: "https://mabi.lin3.net/portal",
      desc: "黑洞倒數與 S1 配裝戰力模擬一站切換。"
    }
  ]
};
