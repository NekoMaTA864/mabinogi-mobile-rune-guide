// 瑪奇 Mobile 中文社群工具箱目錄（2026-11-26 實地驗證各站子頁 URL）
// FEATURED_SHORTCUTS: 精選 5 大熱門特色功能一鍵直達（外觀紙娃娃 3＋配裝模擬 2）
// embeddable: true 代表可於「站內沙盒工作台」嘗試 iframe 載入，一律附原作者網址與新分頁降級按鈕。

const FEATURED_SHORTCUTS = [
  {
    group: "外觀與紙娃娃",
    items: [
      {
        title: "MMD 3D 試衣間（即時角色生成）",
        source: "MMD 瑪奇M Dashboard",
        url: "https://mmd-tw.com/dress-up",
        desc: "網頁 3D 捏臉、身形、分部位時裝試穿、HEX 色碼染色與動作預覽。"
      },
      {
        title: "愛爾琳網・時裝紙娃娃",
        source: "愛爾琳網 (erinn.tw)",
        url: "https://erinn.tw/dressroom",
        desc: "全部位裝備與時裝線上試穿、造型配色與穿搭保存。"
      },
      {
        title: "台韓時裝未來視時間軸",
        source: "星月酒館 (Starmoon)",
        url: "https://starmoon.game-db.tw/game-data/fashion-timeline/",
        desc: "韓服與台港澳服時裝、通行證、傳說外觀上架順序對照。"
      }
    ]
  },
  {
    group: "配裝模擬與榜單",
    items: [
      {
        title: "10 格符文＋21 格寶石模擬器",
        source: "mabi.lin3.net",
        url: "https://mabi.lin3.net/",
        desc: "透明戰力公式精算、完整配裝試算與一鍵分享連結。"
      },
      {
        title: "S1／S2 全職業符文 Tier 表",
        source: "模賓報 (mobinogi.info)",
        url: "https://mobinogi.info/zh/rune",
        desc: "跨賽季（S0／S1／S2）各職業強度評價與中韓對照速查。"
      }
    ]
  }
];

const COMMUNITY_TOOLS = [
  // ===== 符文與配裝 =====
  {
    id: "erinn-tw",
    name: "愛爾琳網 (erinn.tw)",
    url: "https://erinn.tw/",
    category: "符文與配裝",
    s1Status: "S0 客戶端校對（待更 S1）",
    tags: ["客戶端圖鑑", "採用率", "戰力榜", "黑洞"],
    desc: "台服最完整的綜合入口：逐字符文圖鑑、30 天職業採用趨勢、42 萬+ 角色排行、市場、紙娃娃與 MML 搜尋。",
    embeddable: false
  },
  {
    id: "mobinogi-info",
    name: "模賓報 (mobinogi.info)",
    url: "https://mobinogi.info/zh/rune",
    category: "符文與配裝",
    s1Status: "S1 支援（韓翻中）",
    tags: ["Tier 表", "S0/S1/S2", "韓中切換"],
    desc: "收錄 S0／S1／S2 全賽季符文與各職業 Tier 表，支援部位、品階篩選與翻譯錯誤回報。",
    embeddable: false
  },
  {
    id: "mabi-lin3",
    name: "符文配裝模擬器 (mabi.lin3.net)",
    url: "https://mabi.lin3.net/",
    category: "符文與配裝",
    s1Status: "S1 預覽（暫譯）",
    tags: ["10 格模擬", "戰力精算", "分享連結"],
    desc: "10 格符文＋21 格寶石配裝戰力模擬器，支援透明公式明細、社群榜單、傳送門倒數與 S1 機制指南。",
    embeddable: false
  },
  {
    id: "rune-memo",
    name: "符文配置規劃表 (Rune Memo)",
    url: "https://blog.dryverstudio.com/mabinogi-mobile/rune-memo",
    category: "符文與配裝",
    s1Status: "S0（待更 S1）",
    tags: ["多角並排", "中韓快搜", "總覽去重"],
    desc: "DryverStudio 製作的多角色多職業配置規劃表，支援中／韓／效果自動補全與跨角總覽匯出。",
    embeddable: false
  },
  {
    id: "starmoon-runes",
    name: "星月酒館 (Starmoon Tavern)",
    url: "https://starmoon.game-db.tw/game-data/runes/",
    category: "符文與配裝",
    s1Status: "S1 預收錄（未校對）",
    tags: ["符文表", "時裝時間軸", "生活計算機"],
    desc: "繁中綜合資料庫，涵蓋符文表、黑洞倒數、時裝時間軸、生活計算機與樂譜播放。",
    embeddable: false
  },
  {
    id: "alice-wiki",
    name: "瑪奇Mobile Wiki DB (A.L.I.C.E)",
    url: "https://mabinogimobile.nipponhashi.com/runes/",
    category: "符文與配裝",
    s1Status: "S1 支援（韓翻中）",
    tags: ["多語 Wiki", "機率 DB", "S1 專區"],
    desc: "四語（繁中／韓／英／日）資料百科，含台北時間事件面板、S1 聖騎士專區、機率表與收益工具。",
    embeddable: false
  },

  // ===== 即時與黑洞 =====
  {
    id: "mmd-tw",
    name: "MMD 瑪奇M Dashboard",
    url: "https://mmd-tw.com/",
    category: "即時與黑洞",
    s1Status: "即時連線站",
    tags: ["黑洞推播", "世界頻", "市場物價", "音樂廳"],
    desc: "主打各伺服器深淵黑洞即時倒數與瀏覽器提醒，另附活動看板、世界頻、市場物價與 Music Hall。",
    embeddable: false
  },

  // ===== 物資與製作（多款純靜態工具支援站內沙盒預覽） =====
  {
    id: "exchange-guide",
    name: "瑪奇mobile物資兌換手冊",
    url: "https://carey1029.github.io/mabinogimobile-exchange/",
    category: "物資與製作",
    s1Status: "純查表工具",
    tags: ["以物易物", "雙向查詢", "可站內預覽"],
    desc: "carey1029 製作的雙向 NPC 以物易物手冊，可查「要換這個需要什麼」或「手上有這個能換什麼」。",
    embeddable: true,
    workbenchLabel: "物資兌換手冊"
  },
  {
    id: "mabim-guide",
    name: "製作道具關聯小工具 (MabiMGuide)",
    url: "https://kingex1124.github.io/MabiMGuide/",
    category: "物資與製作",
    s1Status: "純查表工具",
    tags: ["道具上下游", "配方樹", "可站內預覽"],
    desc: "kingex1124 製作的巢狀道具關聯查表，快速展開裝備／材料上下游原料與用途。",
    embeddable: true,
    workbenchLabel: "道具上下游 (MabiMGuide)"
  },
  {
    id: "starmoon-spirit",
    name: "星月酒館・精靈痕跡計算機",
    url: "https://starmoon.game-db.tw/tools/spirit-trace/",
    category: "物資與製作",
    s1Status: "試算工具",
    tags: ["精靈痕跡", "計算機", "可站內預覽"],
    desc: "星月酒館提供的精靈痕跡消耗與成長試算工具。",
    embeddable: true,
    workbenchLabel: "精靈痕跡計算機"
  },
  {
    id: "starmoon-crafting",
    name: "星月酒館・製造時間與成本計算機",
    url: "https://starmoon.game-db.tw/tools/crafting/",
    category: "物資與製作",
    s1Status: "試算工具",
    tags: ["加工製造", "時間試算", "可站內預覽"],
    desc: "星月酒館提供的生活加工時間與材料計算機。",
    embeddable: true,
    workbenchLabel: "製造時間計算機"
  },
  {
    id: "starmoon-cooking",
    name: "星月酒館・料理採購規劃器",
    url: "https://starmoon.game-db.tw/tools/cooking-planner/",
    category: "物資與製作",
    s1Status: "試算工具",
    tags: ["料理採購", "材料清單", "可站內預覽"],
    desc: "星月酒館提供的料理食譜與食材採購數量計算工具。",
    embeddable: true,
    workbenchLabel: "料理採購規劃"
  },
  {
    id: "backpack-helper",
    name: "瑪奇M背包小救星 1.1",
    url: "https://pokeasou.github.io/mabi-backpack-helper/index.html",
    category: "物資與製作",
    s1Status: "純前端工具",
    tags: ["配方反查", "倉庫試算"],
    desc: "輸入手上材料反查可製作配方、倉庫空間試算與常用浮動視窗。",
    embeddable: false
  },

  // ===== MML 音樂 =====
  {
    id: "mml-mabi",
    name: "夜光 MML 工坊",
    url: "https://mml.mabi.tw/",
    category: "MML 音樂",
    s1Status: "音樂編輯器",
    tags: ["MML 編輯", "多軌試聽", "移調優化"],
    desc: "完整的瀏覽器多軌鋼琴捲簾 MML 樂譜工坊，支援即時試聽、移調、字數優化、合併與分享。",
    embeddable: false
  },

  // ===== 新手與日常 =====
  {
    id: "mabi-life",
    name: "Mabi-Life 新手冒險手冊",
    url: "https://tw.mabi-life.workers.dev/",
    category: "新手與日常",
    s1Status: "攻略手冊",
    tags: ["新手避坑", "系統入門", "隱藏設定"],
    desc: "新手必看避坑清單、裝備與符文基礎觀念、容易漏領的獎勵與介面設定提醒。",
    embeddable: false
  },
  {
    id: "mabitw-tracker",
    name: "韓服前輩工具箱",
    url: "https://mabitw-tracker.pages.dev/",
    category: "新手與日常",
    s1Status: "綜合工具箱",
    tags: ["寶石計算", "交易所損益", "合奏規劃", "韓服時間軸"],
    desc: "含寶石合成計算機、交易所損益計算、6 軌合奏規劃、職業總覽與韓服改版時間軸（另含個人打卡）。",
    embeddable: false
  },
  {
    id: "mabiroutine",
    name: "MabiRoutine / 以物易物進度表",
    url: "https://mabiroutine.vercel.app/",
    category: "新手與日常",
    s1Status: "個人追蹤站",
    tags: ["多角日常", "黑洞倒數", "以物易物"],
    desc: "專注多角色日週打卡與黑洞倒數的追蹤網站（本站不放個人進度，有需要可直接使用此類專站）。",
    embeddable: false
  },

  // ===== 桌面輔助工具（需本機安裝） =====
  {
    id: "mobilay",
    name: "Mobilay（DPS／戰績／雷達）",
    url: "https://mobilay.kr/tw/",
    category: "桌面工具",
    s1Status: "Windows / Android",
    tags: ["封包解析", "DPS 統計", "染色盤"],
    desc: "韓／台／日服通用外置輔助工具，提供即時團隊 DPS 浮動窗、雲端戰績排行、地圖雷達與加工通知。",
    embeddable: false
  },
  {
    id: "mabi-pudding",
    name: "瑪奇M布丁 (Pudding)",
    url: "https://mabinogi.amibon.app/pudding",
    category: "桌面工具",
    s1Status: "Windows (Npcap)",
    tags: ["傷害佔比", "技能時間軸", "黃金箱提醒"],
    desc: "台服 Windows 封包輔助工具，支援詳細傷害佔比、技能時間軸、黃金箱靠近提示與跨角材料搜尋。",
    embeddable: false
  },
  {
    id: "mmh-helper",
    name: "米列西安 Mobile 小助手 (MMH)",
    url: "https://milletian-mobile-helper.pages.dev/",
    category: "桌面工具",
    s1Status: "Windows 工具",
    tags: ["輕量數據", "跨倉搜尋", "日常作業簿"],
    desc: "輕量化 Windows 桌面小助手，主打背包／倉庫／共用倉即時搜尋與多角作業簿追蹤。",
    embeddable: false
  }
];
