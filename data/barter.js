// 台服《瑪奇 Mobile》以物易物雙向查詢與 NPC 限購參考表（純查表與試算，不存個人庫存）
// 資料來源：巴哈姆特精華整理與台服實測，實際限購數量與活動調整請以遊戲內 NPC 介面為準。

const BARTER_DATA = [
  // ===== 提爾克納 =====
  {
    id: "tir-ferghus-iron",
    town: "提爾克納",
    npc: "佛格斯（鐵匠鋪）",
    give: "分解的裝備零件",
    giveQty: 10,
    get: "鐵礦石",
    getQty: 1,
    limit: "依遊戲內限購",
    category: "生活材料",
    note: "多餘分解零件直接換礦石，省下挖礦時間。"
  },
  {
    id: "tir-ferghus-coal",
    town: "提爾克納",
    npc: "佛格斯（鐵匠鋪）",
    give: "分解的裝備零件",
    giveQty: 3,
    get: "煤炭",
    getQty: 1,
    limit: "依遊戲內限購",
    category: "生活材料",
    note: "冶煉基礎燃料穩定補貨來源。"
  },
  {
    id: "tir-ferghus-alloy",
    town: "提爾克納",
    npc: "佛格斯（鐵匠鋪）",
    give: "鋼錠",
    giveQty: 2,
    get: "合金鋼錠",
    getQty: 1,
    limit: "限購 4 次",
    category: "生活材料",
    note: "金屬加工跳級關鍵，常先換完再去杜巴頓銜接。"
  },
  {
    id: "tir-deian-wool",
    town: "提爾克納",
    npc: "迪恩（學校附近）",
    give: "寵物飼料",
    giveQty: 1,
    get: "高級羊毛",
    getQty: 1,
    limit: "限購 10 次",
    category: "生活材料",
    note: "布料加工高效率直換高級羊毛。"
  },
  {
    id: "tir-alissa-alchemy-egg",
    town: "提爾克納",
    npc: "愛麗沙",
    give: "雞蛋",
    giveQty: 10,
    get: "煉金術碎屑",
    getQty: 1,
    limit: "依遊戲內限購",
    category: "催化劑與聖水",
    note: "亦可用薰衣草花 ×1 兌換，供麗莎換催化劑。"
  },
  {
    id: "tir-alissa-alchemy-lav",
    town: "提爾克納",
    npc: "愛麗沙",
    give: "薰衣草花",
    giveQty: 1,
    get: "煉金術碎屑",
    getQty: 1,
    limit: "依遊戲內限購",
    category: "催化劑與聖水",
    note: "薰衣草花直接換碎屑，快速銜接再燃燒催化劑。"
  },
  {
    id: "tir-alissa-flour",
    town: "提爾克納",
    npc: "愛麗沙",
    give: "雞蛋（或薰衣草花 ×1）",
    giveQty: 3,
    get: "麵粉",
    getQty: 1,
    limit: "依遊戲內限購",
    category: "生活材料",
    note: "料理與凱琳 3 級食材加工設計圖的前置素材。"
  },
  {
    id: "tir-ranald-crit",
    town: "提爾克納",
    npc: "雷納德",
    give: "美乃滋炒肉",
    giveQty: 2,
    get: "暴擊秘藥",
    getQty: 1,
    limit: "限購 1 次",
    category: "戰鬥消耗品",
    note: "團本／高難深淵爆發必備消耗品。"
  },
  {
    id: "tir-lasa-cat-hi",
    town: "提爾克納",
    npc: "麗莎（學校）",
    give: "蘋果汁 ×3＋煉金術碎屑 ×3",
    giveQty: 3,
    get: "高級鍊金術再燃燒催化劑",
    getQty: 1,
    limit: "依遊戲內限購",
    category: "催化劑與聖水",
    note: "稀缺突破與強化催化劑的重要穩定來源。"
  },
  {
    id: "tir-lasa-cat-rare",
    town: "提爾克納",
    npc: "麗莎（學校）",
    give: "高級鍊金術再燃燒催化劑",
    giveQty: 15,
    get: "稀有鍊金術再燃燒催化劑",
    getQty: 1,
    limit: "限購 1 次",
    category: "催化劑與聖水",
    note: "高階催化劑向上兌換路線。"
  },
  {
    id: "tir-endelyon-holywater",
    town: "提爾克納",
    npc: "安黛莉／梅文",
    give: "凱琳特製全麥麵包",
    giveQty: 1,
    get: "聖水",
    getQty: 1,
    limit: "依遊戲內限購",
    category: "催化劑與聖水",
    note: "高優先常換項目，先找凱琳用牛奶換麵包再轉換。"
  },
  {
    id: "tir-caitin-bread",
    town: "提爾克納",
    npc: "凱琳",
    give: "牛奶",
    giveQty: 10,
    get: "凱琳特製全麥麵包",
    getQty: 1,
    limit: "限購 1 次",
    category: "催化劑與聖水",
    note: "用於找安黛莉／梅文兌換聖水。"
  },
  {
    id: "tir-caitin-bp",
    town: "提爾克納",
    npc: "凱琳",
    give: "麵粉",
    giveQty: 10,
    get: "食材加工設備設計圖（3 級）",
    getQty: 1,
    limit: "限購 1 次",
    category: "3 級設計圖",
    note: "前期優先入手的 3 級生活設施設計圖。"
  },
  {
    id: "tir-malcolm-bp",
    town: "提爾克納",
    npc: "麥爾坎",
    give: "蜘蛛網",
    giveQty: 5,
    get: "多用途製作台設計圖（3 級）／營火套組",
    getQty: 1,
    limit: "限購 1 次",
    category: "3 級設計圖",
    note: "蜘蛛網可換多用途製作台設計圖、專業營火套組與羊毛枕頭。"
  },
  {
    id: "tir-malcolm-score",
    town: "提爾克納",
    npc: "麥爾坎",
    give: "羊毛",
    giveQty: 50,
    get: "空白樂譜",
    getQty: 1,
    limit: "依遊戲內限購",
    category: "生活材料",
    note: "演奏與 MML 寫譜玩家常用兌換。"
  },
  {
    id: "tir-dilys-clover",
    town: "提爾克納",
    npc: "迪莉絲",
    give: "咻咻蘑菇",
    giveQty: 3,
    get: "四葉草",
    getQty: 1,
    limit: "限購 1 次",
    category: "生活材料",
    note: "藥品與特殊製作常用稀缺草藥。"
  },

  // ===== 杜巴頓 =====
  {
    id: "dun-simon-cloth-bp",
    town: "杜巴頓",
    npc: "西蒙（裁縫店）",
    give: "幽靈螢火蟲",
    giveQty: 2,
    get: "布料加工設備設計圖（3 級）",
    getQty: 1,
    limit: "限購 1 次",
    category: "3 級設計圖",
    note: "布料專精必換 3 級設施設計圖。"
  },
  {
    id: "dun-simon-armor-bp",
    town: "杜巴頓",
    npc: "西蒙（裁縫店）",
    give: "雕琢橄欖石 S",
    giveQty: 1,
    get: "防具製作台設計圖（3 級）",
    getQty: 1,
    limit: "限購 1 次",
    category: "3 級設計圖",
    note: "防具製作進階核心設計圖。"
  },
  {
    id: "dun-simon-dye",
    town: "杜巴頓",
    npc: "西蒙（裁縫店）",
    give: "高級絲綢",
    giveQty: 10,
    get: "染色劑基底",
    getQty: 1,
    limit: "限購 1 次",
    category: "生活材料",
    note: "外觀染色製作材料。"
  },
  {
    id: "dun-walter-leather",
    town: "杜巴頓",
    npc: "瓦爾特（雜貨店）",
    give: "特蕾西的原木音樂盒",
    giveQty: 6,
    get: "皮革",
    getQty: 1,
    limit: "限購 2 次",
    category: "生活材料",
    note: "皮革加工補料路線。"
  },
  {
    id: "dun-walter-heart",
    town: "杜巴頓",
    npc: "瓦爾特（雜貨店）",
    give: "真愛魚",
    giveQty: 5,
    get: "愛心幣",
    getQty: 1,
    limit: "限購 2 次",
    category: "戰鬥消耗品",
    note: "釣魚產物轉愛心幣途徑。"
  },
  {
    id: "dun-walter-grenade",
    town: "杜巴頓",
    npc: "瓦爾特（雜貨店）",
    give: "暗影幽靈魚",
    giveQty: 5,
    get: "火焰／閃電／風／酸蝕魔法榴彈",
    getQty: 1,
    limit: "依遊戲內限購",
    category: "戰鬥消耗品",
    note: "四屬性戰鬥道具，適合補異常或破防機制。"
  },
  {
    id: "dun-glennis-tea",
    town: "杜巴頓",
    npc: "格莉娜（食品店）",
    give: "鮮奶油",
    giveQty: 4,
    get: "格莉娜的蘋果奶茶",
    getQty: 1,
    limit: "限購 1 次",
    category: "戰鬥消耗品",
    note: "格莉娜另可兌換 3 級食物製作台設計圖與進階料理。"
  },
  {
    id: "dun-manus-stone",
    town: "杜巴頓",
    npc: "馬努斯（醫療所）",
    give: "寵物飼料",
    giveQty: 10,
    get: "生命的魔力石",
    getQty: 1,
    limit: "限購 2 次",
    category: "催化劑與聖水",
    note: "穩定消耗飼料換取魔力石。"
  }
];

// 每日／每週商店必買與金幣試算參考（純試算，不存個人進度）
const NPC_SHOP_CHECKLIST = [
  {
    name: "商城精選・每日免費商品",
    cadence: "每日 06:00",
    costLabel: "免費",
    unitGold: 0,
    defaultQty: 1,
    priority: "必拿",
    note: "約主線第一章 54–57 級開啟，每日可免費任選一項（角色／帳號記得領取）。"
  },
  {
    name: "道具商店・銀幣箱",
    cadence: "每日 06:00",
    costLabel: "依商店標價",
    unitGold: 0,
    defaultQty: 1,
    priority: "推薦",
    note: "維持地下城與狩獵場日常挑戰不斷糧。"
  },
  {
    name: "道具商店・魔族貢品箱",
    cadence: "每週一 06:00",
    costLabel: "依商店標價",
    unitGold: 0,
    defaultQty: 1,
    priority: "必拿",
    note: "挑戰深層地下城、獲取高階裝備與大量經驗值的關鍵門票。"
  },
  {
    name: "班克爾・吉爾摩（最高級生皮／最高級蜘蛛網）",
    cadence: "每週限購",
    costLabel: "900 金幣／個（參考）",
    unitGold: 900,
    defaultQty: 60,
    priority: "生活優先",
    note: "生活加工必囤稀缺素材，上方單價供快速試算多角或批量採購金幣（單角各 30＝60 個）。"
  },
  {
    name: "各村官廳／村長代幣兌換（鄧肯／伊文／凱雅拉）",
    cadence: "每週限購",
    costLabel: "討伐／村莊代幣",
    unitGold: 0,
    defaultQty: 1,
    priority: "推薦",
    note: "定期兌換遙遠的星辰印章等欄位強化稀有素材。"
  },
  {
    name: "道具商店・破碎的寶石寶箱",
    cadence: "每日限購",
    costLabel: "金幣購買",
    unitGold: 0,
    defaultQty: 1,
    priority: "量力而為",
    note: "S1 強化、洗特化與符文合成金幣消耗大，前期手頭緊可先跳過。"
  }
];
