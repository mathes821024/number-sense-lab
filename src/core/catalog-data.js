/** Auto-synced from content/v0.1 + content/v0.2c *.core.json — do not edit by hand. */
export const CORE_RELATIONS = [
  {
    "id": "square-6",
    "domain": "squares",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "retrieval_anchor",
    "prompt": "6² = ?",
    "canonical_answer": "36",
    "answer_type": "integer",
    "relation": "6² = 36",
    "hook": "六六三十六，小九九里的老朋友。",
    "pattern": {
      "check": "36 在 25（5²）和 49（7²）之间。",
      "family": [
        "7² = 49",
        "8² = 64"
      ]
    },
    "frames": [
      {
        "title": "6 × 6",
        "detail": "小九九里的六六三十六"
      },
      {
        "title": "36",
        "detail": "6² = 36"
      }
    ],
    "families": [
      {
        "id": "sq-6",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-6"
      }
    ]
  },
  {
    "id": "square-7",
    "domain": "squares",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "retrieval_anchor",
    "prompt": "7² = ?",
    "canonical_answer": "49",
    "answer_type": "integer",
    "relation": "7² = 49",
    "hook": "七七四十九，小九九里的老朋友。",
    "pattern": {
      "check": "49 在 36（6²）和 64（8²）之间。",
      "family": [
        "6² = 36",
        "8² = 64"
      ]
    },
    "frames": [
      {
        "title": "7 × 7",
        "detail": "小九九里的七七四十九"
      },
      {
        "title": "49",
        "detail": "7² = 49"
      }
    ],
    "families": [
      {
        "id": "sq-7",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-7"
      }
    ]
  },
  {
    "id": "square-8",
    "domain": "squares",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "retrieval_anchor",
    "prompt": "8² = ?",
    "canonical_answer": "64",
    "answer_type": "integer",
    "relation": "8² = 64",
    "hook": "八八六十四，小九九里的老朋友。",
    "pattern": {
      "check": "64 在 49（7²）和 81（9²）之间。",
      "family": [
        "2⁶ = 64",
        "16² = 256"
      ]
    },
    "frames": [
      {
        "title": "8 × 8",
        "detail": "八八六十四"
      },
      {
        "title": "64 = 2⁶",
        "detail": "2 连乘 6 次也是 64"
      },
      {
        "title": "64",
        "detail": "8² = 64"
      }
    ],
    "families": [
      {
        "id": "sq-8",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-8"
      }
    ]
  },
  {
    "id": "square-9",
    "domain": "squares",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "retrieval_anchor",
    "prompt": "9² = ?",
    "canonical_answer": "81",
    "answer_type": "integer",
    "relation": "9² = 81",
    "hook": "九九八十一，小九九里的老朋友。",
    "pattern": {
      "check": "81 在 64（8²）和 100（10²）之间。",
      "family": [
        "8² = 64",
        "10² = 100"
      ]
    },
    "frames": [
      {
        "title": "9 × 9",
        "detail": "小九九里的九九八十一"
      },
      {
        "title": "81",
        "detail": "9² = 81"
      }
    ],
    "families": [
      {
        "id": "sq-9",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-9"
      }
    ]
  },
  {
    "id": "square-10",
    "domain": "squares",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "structure",
    "prompt": "10² = ?",
    "canonical_answer": "100",
    "answer_type": "integer",
    "relation": "10² = 100",
    "hook": "整十平方：1 后面接两个 0。",
    "pattern": {
      "check": "整十的平方一定是整百。",
      "family": [
        "20² = 400",
        "30² = 900"
      ]
    },
    "frames": [
      {
        "title": "1² = 1",
        "detail": "先算十位的平方"
      },
      {
        "title": "1 | 00",
        "detail": "后面接两个 0"
      },
      {
        "title": "100",
        "detail": "10² = 100"
      }
    ],
    "families": [
      {
        "id": "sq-10",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-10"
      }
    ]
  },
  {
    "id": "square-11",
    "domain": "squares",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "11² = ?",
    "canonical_answer": "121",
    "answer_type": "integer",
    "relation": "11² = 121",
    "hook": "(10+1)² = 100 + 20 + 1 = 121。",
    "pattern": {
      "check": "离 10 很近的数，借 10² 来算。",
      "family": [
        "12² = 144",
        "21² = 441"
      ]
    },
    "frames": [
      {
        "title": "10² = 100",
        "detail": "先借整十"
      },
      {
        "title": "+20 +1",
        "detail": "加上 2×10×1 和 1²"
      },
      {
        "title": "121",
        "detail": "11² = 121"
      }
    ],
    "families": [
      {
        "id": "sq-11",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-11"
      }
    ]
  },
  {
    "id": "square-12",
    "domain": "squares",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "retrieval_anchor",
    "prompt": "12² = ?",
    "canonical_answer": "144",
    "answer_type": "integer",
    "relation": "12² = 144",
    "hook": "12² = 144，没有好口诀，直接记住这个锚点。",
    "pattern": {
      "check": "144 在 121（11²）和 169（13²）之间。",
      "family": [
        "11² = 121",
        "13² = 169"
      ]
    },
    "frames": [
      {
        "title": "12 × 12",
        "detail": "没有捷径，直接提取"
      },
      {
        "title": "144",
        "detail": "12² = 144"
      }
    ],
    "families": [
      {
        "id": "sq-12",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-12"
      }
    ]
  },
  {
    "id": "square-13",
    "domain": "squares",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "reasonableness",
    "prompt": "13² = ?",
    "canonical_answer": "169",
    "answer_type": "integer",
    "relation": "13² = 169",
    "hook": "个位 3²=9，所以 13² 的个位一定是 9。",
    "pattern": {
      "check": "169 在 144（12²）和 196（14²）之间；注意别和 14²=196 混淆。",
      "family": [
        "12² = 144",
        "14² = 196"
      ]
    },
    "frames": [
      {
        "title": "13 × 13",
        "detail": "直接提取"
      },
      {
        "title": "个位是 9",
        "detail": "3×3=9，个位一定是 9"
      },
      {
        "title": "169",
        "detail": "13² = 169"
      }
    ],
    "families": [
      {
        "id": "sq-13",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-13"
      }
    ]
  },
  {
    "id": "square-14",
    "domain": "squares",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "reasonableness",
    "prompt": "14² = ?",
    "canonical_answer": "196",
    "answer_type": "integer",
    "relation": "14² = 196",
    "hook": "个位 4²=16，所以 14² 的个位一定是 6。",
    "pattern": {
      "check": "196 接近 200；注意别和 13²=169 混淆。",
      "family": [
        "13² = 169",
        "15² = 225"
      ]
    },
    "frames": [
      {
        "title": "14 × 14",
        "detail": "接近 200"
      },
      {
        "title": "个位是 6",
        "detail": "4×4=16，个位一定是 6"
      },
      {
        "title": "196",
        "detail": "14² = 196"
      }
    ],
    "families": [
      {
        "id": "sq-14",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-14"
      }
    ]
  },
  {
    "id": "square-15",
    "domain": "squares",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "structure",
    "prompt": "15² = ?",
    "canonical_answer": "225",
    "answer_type": "integer",
    "relation": "15² = 225",
    "hook": "1 × 2 = 2，后面接 25。",
    "pattern": {
      "check": "末位是 5 的整数平方，一定以 25 结尾。225 在 100 和 400 之间。",
      "family": [
        "25² = 625",
        "35² = 1225"
      ]
    },
    "frames": [
      {
        "title": "1 × 2",
        "detail": "先看 5 前面的 1"
      },
      {
        "title": "2",
        "detail": "1 × 2 得到前面这一截"
      },
      {
        "title": "2 | 25",
        "detail": "后面接上 25"
      },
      {
        "title": "225",
        "detail": "15² = 225"
      }
    ],
    "families": [
      {
        "id": "sq-15",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-15"
      }
    ]
  },
  {
    "id": "square-16",
    "domain": "squares",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "retrieval_anchor",
    "prompt": "16² = ?",
    "canonical_answer": "256",
    "answer_type": "integer",
    "relation": "16² = 256",
    "hook": "16² = 256，先直接记住这个锚点。",
    "pattern": {
      "check": "256 在 225（15²）和 289（17²）之间。",
      "family": [
        "2⁸ = 256",
        "8² = 64"
      ]
    },
    "frames": [
      {
        "title": "16 = 2⁴",
        "detail": "16 是 2 连乘 4 次"
      },
      {
        "title": "(2⁴)² = 2⁸",
        "detail": "平方就是指数翻倍"
      },
      {
        "title": "256",
        "detail": "16² = 256"
      }
    ],
    "families": [
      {
        "id": "sq-16",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-16"
      }
    ]
  },
  {
    "id": "square-17",
    "domain": "squares",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "retrieval_anchor",
    "prompt": "17² = ?",
    "canonical_answer": "289",
    "answer_type": "integer",
    "relation": "17² = 289",
    "hook": "289 没有好口诀，是值得反复提取的锚点。",
    "pattern": {
      "check": "289 在 256（16²）和 324（18²）之间，个位是 9。",
      "family": [
        "16² = 256",
        "18² = 324"
      ]
    },
    "frames": [
      {
        "title": "17 × 17",
        "detail": "夹在 256 和 324 之间"
      },
      {
        "title": "个位是 9",
        "detail": "7×7=49，个位一定是 9"
      },
      {
        "title": "289",
        "detail": "17² = 289"
      }
    ],
    "families": [
      {
        "id": "sq-17",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-17"
      }
    ]
  },
  {
    "id": "square-18",
    "domain": "squares",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "18² = ?",
    "canonical_answer": "324",
    "answer_type": "integer",
    "relation": "18² = 324",
    "hook": "(20−2)² = 400 − 80 + 4 = 324。",
    "pattern": {
      "check": "离 20 很近的数，借 20² 往回算。",
      "family": [
        "19² = 361",
        "20² = 400"
      ]
    },
    "frames": [
      {
        "title": "20² = 400",
        "detail": "先借 20²"
      },
      {
        "title": "−80 +4",
        "detail": "减去 2×20×2，加回 2²"
      },
      {
        "title": "324",
        "detail": "18² = 324"
      }
    ],
    "families": [
      {
        "id": "sq-18",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-18"
      }
    ]
  },
  {
    "id": "square-19",
    "domain": "squares",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "19² = ?",
    "canonical_answer": "361",
    "answer_type": "integer",
    "relation": "19² = 361",
    "hook": "(20−1)² = 400 − 40 + 1 = 361。",
    "pattern": {
      "check": "离 20 最近的数，借 20² 往回算。",
      "family": [
        "18² = 324",
        "20² = 400"
      ]
    },
    "frames": [
      {
        "title": "20² = 400",
        "detail": "先借 20²"
      },
      {
        "title": "−40 +1",
        "detail": "减去 2×20×1，加回 1²"
      },
      {
        "title": "361",
        "detail": "19² = 361"
      }
    ],
    "families": [
      {
        "id": "sq-19",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-19"
      }
    ]
  },
  {
    "id": "square-20",
    "domain": "squares",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "structure",
    "prompt": "20² = ?",
    "canonical_answer": "400",
    "answer_type": "integer",
    "relation": "20² = 400",
    "hook": "整十平方：2²=4，后面接两个 0。",
    "pattern": {
      "check": "整十的平方一定是整百。",
      "family": [
        "10² = 100",
        "30² = 900"
      ]
    },
    "frames": [
      {
        "title": "2² = 4",
        "detail": "先算十位的平方"
      },
      {
        "title": "4 | 00",
        "detail": "后面接两个 0"
      },
      {
        "title": "400",
        "detail": "20² = 400"
      }
    ],
    "families": [
      {
        "id": "sq-20",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-20"
      }
    ]
  },
  {
    "id": "square-25",
    "domain": "squares",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "25² = ?",
    "canonical_answer": "625",
    "answer_type": "integer",
    "relation": "25² = 625",
    "hook": "2 × 3 = 6，后面接 25。",
    "pattern": {
      "check": "末位是 5 的整数平方，一定以 25 结尾。625 在 400 和 900 之间。",
      "family": [
        "15² = 225",
        "35² = 1225"
      ]
    },
    "frames": [
      {
        "title": "2 × 3",
        "detail": "先看 5 前面的 2"
      },
      {
        "title": "6",
        "detail": "2 × 3 得到前面这一截"
      },
      {
        "title": "6 | 25",
        "detail": "后面接上 25"
      },
      {
        "title": "625",
        "detail": "25² = 625"
      }
    ],
    "families": [
      {
        "id": "sq-25",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "isquare-25"
      }
    ]
  },
  {
    "id": "product-11-12",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "11 × 12 = ?",
    "canonical_answer": "132",
    "answer_type": "integer",
    "relation": "11 × 12 = 132",
    "hook": "12 的两头 1 和 2 拉开，中间放 1+2=3 → 132。",
    "pattern": {
      "check": "×11 的两头拉中间加，用于两位乘数；132 比 12²=144 小一点，合理。",
      "family": [
        "11 × 13 = 143",
        "12² = 144"
      ]
    },
    "frames": [
      {
        "title": "1 _ 2",
        "detail": "把 12 的两头拉开"
      },
      {
        "title": "1+2 = 3",
        "detail": "中间放两数之和"
      },
      {
        "title": "132",
        "detail": "11 × 12 = 132"
      }
    ]
  },
  {
    "id": "product-11-13",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "11 × 13 = ?",
    "canonical_answer": "143",
    "answer_type": "integer",
    "relation": "11 × 13 = 143",
    "hook": "13 的两头 1 和 3 拉开，中间放 1+3=4 → 143。",
    "pattern": {
      "check": "中间之和 4 小于 10，不需要进位。",
      "family": [
        "11 × 12 = 132",
        "11 × 14 = 154"
      ]
    },
    "frames": [
      {
        "title": "1 _ 3",
        "detail": "把 13 的两头拉开"
      },
      {
        "title": "1+3 = 4",
        "detail": "中间放两数之和"
      },
      {
        "title": "143",
        "detail": "11 × 13 = 143"
      }
    ]
  },
  {
    "id": "product-11-15",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "11 × 15 = ?",
    "canonical_answer": "165",
    "answer_type": "integer",
    "relation": "11 × 15 = 165",
    "hook": "15 的两头 1 和 5 拉开，中间放 1+5=6 → 165。",
    "pattern": {
      "check": "165 也等于 15 × 11 = 150 + 15，两种算法互相印证。",
      "family": [
        "15 × 6 = 90",
        "11 × 16 = 176"
      ]
    },
    "frames": [
      {
        "title": "1 _ 5",
        "detail": "把 15 的两头拉开"
      },
      {
        "title": "1+5 = 6",
        "detail": "中间放两数之和"
      },
      {
        "title": "165",
        "detail": "11 × 15 = 165"
      }
    ]
  },
  {
    "id": "product-11-16",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "11 × 16 = ?",
    "canonical_answer": "176",
    "answer_type": "integer",
    "relation": "11 × 16 = 176",
    "hook": "16 的两头 1 和 6 拉开，中间放 1+6=7 → 176。",
    "pattern": {
      "check": "中间之和 7 小于 10，不需要进位。",
      "family": [
        "11 × 15 = 165",
        "11 × 19 = 209"
      ]
    },
    "frames": [
      {
        "title": "1 _ 6",
        "detail": "把 16 的两头拉开"
      },
      {
        "title": "1+6 = 7",
        "detail": "中间放两数之和"
      },
      {
        "title": "176",
        "detail": "11 × 16 = 176"
      }
    ]
  },
  {
    "id": "product-11-19",
    "domain": "products",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "11 × 19 = ?",
    "canonical_answer": "209",
    "answer_type": "integer",
    "relation": "11 × 19 = 209",
    "hook": "中间 1+9=10，写 0 进 1 → 209。这条专门练进位。",
    "pattern": {
      "check": "×11 的中间和 ≥10 时要进位：19 → 1|10|9 → 209。",
      "family": [
        "11 × 16 = 176",
        "19² = 361"
      ]
    },
    "frames": [
      {
        "title": "1 _ 9",
        "detail": "把 19 的两头拉开"
      },
      {
        "title": "1+9 = 10",
        "detail": "中间满十，写 0 进 1"
      },
      {
        "title": "209",
        "detail": "11 × 19 = 209"
      }
    ]
  },
  {
    "id": "product-15-6",
    "domain": "products",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "transformation",
    "prompt": "6 × 15 = ?",
    "canonical_answer": "90",
    "answer_type": "integer",
    "relation": "6 × 15 = 90",
    "hook": "6 减半得 3，3 × 30 = 90。",
    "pattern": {
      "check": "偶数 × 15：偶数减半再 ×30，积的个位一定是 0。",
      "family": [
        "15 × 8 = 120",
        "6² = 36"
      ]
    },
    "frames": [
      {
        "title": "6 ÷ 2 = 3",
        "detail": "偶数先减半"
      },
      {
        "title": "3 × 30",
        "detail": "减半后乘 30"
      },
      {
        "title": "90",
        "detail": "15 × 6 = 90"
      }
    ]
  },
  {
    "id": "product-15-8",
    "domain": "products",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "transformation",
    "prompt": "8 × 15 = ?",
    "canonical_answer": "120",
    "answer_type": "integer",
    "relation": "8 × 15 = 120",
    "hook": "8 减半得 4，4 × 30 = 120。",
    "pattern": {
      "check": "也可以 8×15 = 80 + 40 = 120，两种算法互相印证。",
      "family": [
        "15 × 6 = 90",
        "8² = 64"
      ]
    },
    "frames": [
      {
        "title": "8 ÷ 2 = 4",
        "detail": "偶数先减半"
      },
      {
        "title": "4 × 30",
        "detail": "减半后乘 30"
      },
      {
        "title": "120",
        "detail": "15 × 8 = 120"
      }
    ]
  },
  {
    "id": "product-15-12",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "transformation",
    "prompt": "12 × 15 = ?",
    "canonical_answer": "180",
    "answer_type": "integer",
    "relation": "12 × 15 = 180",
    "hook": "12 减半得 6，6 × 30 = 180。",
    "pattern": {
      "check": "180 是 18 × 10，三角形的内角和，高频数。",
      "family": [
        "15 × 14 = 210",
        "12² = 144"
      ]
    },
    "frames": [
      {
        "title": "12 ÷ 2 = 6",
        "detail": "偶数先减半"
      },
      {
        "title": "6 × 30",
        "detail": "减半后乘 30"
      },
      {
        "title": "180",
        "detail": "15 × 12 = 180"
      }
    ]
  },
  {
    "id": "product-15-14",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "transformation",
    "prompt": "14 × 15 = ?",
    "canonical_answer": "210",
    "answer_type": "integer",
    "relation": "14 × 15 = 210",
    "hook": "14 减半得 7，7 × 30 = 210。",
    "pattern": {
      "check": "积的个位一定是 0；210 = 21 × 10。",
      "family": [
        "15 × 12 = 180",
        "15 × 16 = 240"
      ]
    },
    "frames": [
      {
        "title": "14 ÷ 2 = 7",
        "detail": "偶数先减半"
      },
      {
        "title": "7 × 30",
        "detail": "减半后乘 30"
      },
      {
        "title": "210",
        "detail": "15 × 14 = 210"
      }
    ]
  },
  {
    "id": "product-15-16",
    "domain": "products",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "15 × 16 = ?",
    "canonical_answer": "240",
    "answer_type": "integer",
    "relation": "15 × 16 = 240",
    "hook": "16 减半得 8，8 × 30 = 240。",
    "pattern": {
      "check": "240 = 24 × 10；与 15²=225 很接近，别混。",
      "family": [
        "15² = 225",
        "15 × 14 = 210"
      ]
    },
    "frames": [
      {
        "title": "16 ÷ 2 = 8",
        "detail": "偶数先减半"
      },
      {
        "title": "8 × 30",
        "detail": "减半后乘 30"
      },
      {
        "title": "240",
        "detail": "15 × 16 = 240"
      }
    ]
  },
  {
    "id": "product-12-6",
    "domain": "products",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "structure",
    "prompt": "6 × 12 = ?",
    "canonical_answer": "72",
    "answer_type": "integer",
    "relation": "6 × 12 = 72",
    "hook": "12 × 6 = 60 + 12 = 72。",
    "pattern": {
      "check": "十几 × 一位数：拆成 10×n + 几×n。",
      "family": [
        "12 × 7 = 84",
        "6² = 36"
      ]
    },
    "frames": [
      {
        "title": "10 × 6 = 60",
        "detail": "先算整十部分"
      },
      {
        "title": "2 × 6 = 12",
        "detail": "再算零头"
      },
      {
        "title": "72",
        "detail": "12 × 6 = 72"
      }
    ]
  },
  {
    "id": "product-12-7",
    "domain": "products",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "structure",
    "prompt": "7 × 12 = ?",
    "canonical_answer": "84",
    "answer_type": "integer",
    "relation": "7 × 12 = 84",
    "hook": "12 × 7 = 70 + 14 = 84。",
    "pattern": {
      "check": "84 是初中因式分解的高频数（84 = 12×7 = 2²×3×7）。",
      "family": [
        "12 × 6 = 72",
        "7² = 49"
      ]
    },
    "frames": [
      {
        "title": "10 × 7 = 70",
        "detail": "先算整十部分"
      },
      {
        "title": "2 × 7 = 14",
        "detail": "再算零头"
      },
      {
        "title": "84",
        "detail": "12 × 7 = 84"
      }
    ]
  },
  {
    "id": "product-12-8",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "8 × 12 = ?",
    "canonical_answer": "96",
    "answer_type": "integer",
    "relation": "8 × 12 = 96",
    "hook": "12 × 8 = 80 + 16 = 96。",
    "pattern": {
      "check": "96 = 100 − 4，接近整百。",
      "family": [
        "12 × 9 = 108",
        "8² = 64"
      ]
    },
    "frames": [
      {
        "title": "10 × 8 = 80",
        "detail": "先算整十部分"
      },
      {
        "title": "2 × 8 = 16",
        "detail": "再算零头"
      },
      {
        "title": "96",
        "detail": "12 × 8 = 96"
      }
    ]
  },
  {
    "id": "product-12-9",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "9 × 12 = ?",
    "canonical_answer": "108",
    "answer_type": "integer",
    "relation": "9 × 12 = 108",
    "hook": "12 × 9 = 90 + 18 = 108。",
    "pattern": {
      "check": "108 = 100 + 8；也是 9 的倍数（1+0+8=9）。",
      "family": [
        "12 × 8 = 96",
        "9² = 81"
      ]
    },
    "frames": [
      {
        "title": "10 × 9 = 90",
        "detail": "先算整十部分"
      },
      {
        "title": "2 × 9 = 18",
        "detail": "再算零头"
      },
      {
        "title": "108",
        "detail": "12 × 9 = 108"
      }
    ]
  },
  {
    "id": "product-12-13",
    "domain": "products",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "12 × 13 = ?",
    "canonical_answer": "156",
    "answer_type": "integer",
    "relation": "12 × 13 = 156",
    "hook": "12 × 13 = 12×10 + 12×3 = 120 + 36 = 156。",
    "pattern": {
      "check": "十几 × 十几：固定一个，拆另一个。",
      "family": [
        "13 × 14 = 182",
        "12² = 144"
      ]
    },
    "frames": [
      {
        "title": "12 × 10 = 120",
        "detail": "先乘整十"
      },
      {
        "title": "12 × 3 = 36",
        "detail": "再乘零头"
      },
      {
        "title": "156",
        "detail": "12 × 13 = 156"
      }
    ]
  },
  {
    "id": "product-12-14",
    "domain": "products",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "12 × 14 = ?",
    "canonical_answer": "168",
    "answer_type": "integer",
    "relation": "12 × 14 = 168",
    "hook": "12 × 14 = 120 + 48 = 168。",
    "pattern": {
      "check": "168 = 24 × 7，因式分解高频数。",
      "family": [
        "12 × 13 = 156",
        "14² = 196"
      ]
    },
    "frames": [
      {
        "title": "12 × 10 = 120",
        "detail": "先乘整十"
      },
      {
        "title": "12 × 4 = 48",
        "detail": "再乘零头"
      },
      {
        "title": "168",
        "detail": "12 × 14 = 168"
      }
    ]
  },
  {
    "id": "product-13-6",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "6 × 13 = ?",
    "canonical_answer": "78",
    "answer_type": "integer",
    "relation": "6 × 13 = 78",
    "hook": "13 × 6 = 60 + 18 = 78。",
    "pattern": {
      "check": "78 = 6 × 13 = 2 × 3 × 13。",
      "family": [
        "12 × 6 = 72",
        "13 × 7 = 91"
      ]
    },
    "frames": [
      {
        "title": "10 × 6 = 60",
        "detail": "先算整十部分"
      },
      {
        "title": "3 × 6 = 18",
        "detail": "再算零头"
      },
      {
        "title": "78",
        "detail": "13 × 6 = 78"
      }
    ]
  },
  {
    "id": "product-13-7",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "relation_network",
    "prompt": "7 × 13 = ?",
    "canonical_answer": "91",
    "answer_type": "integer",
    "relation": "7 × 13 = 91",
    "hook": "91 = 7 × 13，质因数分解的经典例子。",
    "pattern": {
      "check": "91 看着像质数，其实是 7 × 13——初中最爱考的「假质数」。",
      "family": [
        "7² = 49",
        "13² = 169"
      ]
    },
    "frames": [
      {
        "title": "91",
        "detail": "先记住这个数"
      },
      {
        "title": "7 × 13",
        "detail": "它能拆成 7 × 13"
      },
      {
        "title": "91",
        "detail": "13 × 7 = 91"
      }
    ]
  },
  {
    "id": "product-13-8",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "8 × 13 = ?",
    "canonical_answer": "104",
    "answer_type": "integer",
    "relation": "8 × 13 = 104",
    "hook": "13 × 8 = 80 + 24 = 104。",
    "pattern": {
      "check": "104 = 8 × 13 = 2³ × 13。",
      "family": [
        "13 × 7 = 91",
        "8² = 64"
      ]
    },
    "frames": [
      {
        "title": "10 × 8 = 80",
        "detail": "先算整十部分"
      },
      {
        "title": "3 × 8 = 24",
        "detail": "再算零头"
      },
      {
        "title": "104",
        "detail": "13 × 8 = 104"
      }
    ]
  },
  {
    "id": "product-13-9",
    "domain": "products",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "9 × 13 = ?",
    "canonical_answer": "117",
    "answer_type": "integer",
    "relation": "9 × 13 = 117",
    "hook": "13 × 9 = 90 + 27 = 117。",
    "pattern": {
      "check": "117 是 9 的倍数（1+1+7=9）。",
      "family": [
        "13 × 8 = 104",
        "9² = 81"
      ]
    },
    "frames": [
      {
        "title": "10 × 9 = 90",
        "detail": "先算整十部分"
      },
      {
        "title": "3 × 9 = 27",
        "detail": "再算零头"
      },
      {
        "title": "117",
        "detail": "13 × 9 = 117"
      }
    ]
  },
  {
    "id": "product-14-7",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "7 × 14 = ?",
    "canonical_answer": "98",
    "answer_type": "integer",
    "relation": "7 × 14 = 98",
    "hook": "14 × 7 = 2 × 7 × 7 = 2 × 49 = 98。",
    "pattern": {
      "check": "看到 14 拆出 2×7，就能借 7²=49。",
      "family": [
        "7² = 49",
        "14² = 196"
      ]
    },
    "frames": [
      {
        "title": "14 = 2 × 7",
        "detail": "先把 14 拆开"
      },
      {
        "title": "2 × 49",
        "detail": "7×7=49，再乘 2"
      },
      {
        "title": "98",
        "detail": "14 × 7 = 98"
      }
    ]
  },
  {
    "id": "product-14-8",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "8 × 14 = ?",
    "canonical_answer": "112",
    "answer_type": "integer",
    "relation": "8 × 14 = 112",
    "hook": "14 × 8 = 80 + 32 = 112。",
    "pattern": {
      "check": "112 = 16 × 7，因式分解高频数。",
      "family": [
        "14 × 7 = 98",
        "8² = 64"
      ]
    },
    "frames": [
      {
        "title": "10 × 8 = 80",
        "detail": "先算整十部分"
      },
      {
        "title": "4 × 8 = 32",
        "detail": "再算零头"
      },
      {
        "title": "112",
        "detail": "14 × 8 = 112"
      }
    ]
  },
  {
    "id": "product-14-9",
    "domain": "products",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "9 × 14 = ?",
    "canonical_answer": "126",
    "answer_type": "integer",
    "relation": "9 × 14 = 126",
    "hook": "14 × 9 = 90 + 36 = 126。",
    "pattern": {
      "check": "126 是 9 的倍数（1+2+6=9）。",
      "family": [
        "14 × 8 = 112",
        "9² = 81"
      ]
    },
    "frames": [
      {
        "title": "10 × 9 = 90",
        "detail": "先算整十部分"
      },
      {
        "title": "4 × 9 = 36",
        "detail": "再算零头"
      },
      {
        "title": "126",
        "detail": "14 × 9 = 126"
      }
    ]
  },
  {
    "id": "product-16-8",
    "domain": "products",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "8 × 16 = ?",
    "canonical_answer": "128",
    "answer_type": "integer",
    "relation": "8 × 16 = 128",
    "hook": "16 × 8 = 80 + 48 = 128。",
    "pattern": {
      "check": "128 在 112（14×8）和 144（12²）之间。",
      "family": [
        "2⁷ = 128",
        "8² = 64"
      ]
    },
    "frames": [
      {
        "title": "10 × 8 = 80",
        "detail": "先算整十部分"
      },
      {
        "title": "6 × 8 = 48",
        "detail": "再算零头"
      },
      {
        "title": "128",
        "detail": "16 × 8 = 128"
      }
    ]
  },
  {
    "id": "product-17-8",
    "domain": "products",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "retrieval_anchor",
    "prompt": "8 × 17 = ?",
    "canonical_answer": "136",
    "answer_type": "integer",
    "relation": "8 × 17 = 136",
    "hook": "17 × 8 = 80 + 56 = 136，值得反复提取的锚点。",
    "pattern": {
      "check": "136 在 128（2⁷）和 144（12²）之间。",
      "family": [
        "16 × 8 = 128",
        "17² = 289"
      ]
    },
    "frames": [
      {
        "title": "10 × 8 = 80",
        "detail": "先算整十部分"
      },
      {
        "title": "7 × 8 = 56",
        "detail": "再算零头"
      },
      {
        "title": "136",
        "detail": "17 × 8 = 136"
      }
    ]
  },
  {
    "id": "product-18-9",
    "domain": "products",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "9 × 18 = ?",
    "canonical_answer": "162",
    "answer_type": "integer",
    "relation": "9 × 18 = 162",
    "hook": "18 × 9 = 2 × 9 × 9 = 2 × 81 = 162。",
    "pattern": {
      "check": "看到 18 拆出 2×9，就能借 9²=81。",
      "family": [
        "9² = 81",
        "18² = 324"
      ]
    },
    "frames": [
      {
        "title": "18 = 2 × 9",
        "detail": "先把 18 拆开"
      },
      {
        "title": "2 × 81",
        "detail": "9×9=81，再乘 2"
      },
      {
        "title": "162",
        "detail": "18 × 9 = 162"
      }
    ]
  },
  {
    "id": "product-19-8",
    "domain": "products",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "8 × 19 = ?",
    "canonical_answer": "152",
    "answer_type": "integer",
    "relation": "8 × 19 = 152",
    "hook": "19 × 8 = (20−1) × 8 = 160 − 8 = 152。",
    "pattern": {
      "check": "靠近 20 就借 20：先算 20×8，再减一个 8。",
      "family": [
        "19² = 361",
        "8² = 64"
      ]
    },
    "frames": [
      {
        "title": "20 × 8 = 160",
        "detail": "先借 20 来算"
      },
      {
        "title": "160 − 8",
        "detail": "多算了一个 8，减掉"
      },
      {
        "title": "152",
        "detail": "19 × 8 = 152"
      }
    ]
  },
  {
    "id": "product-13-14",
    "domain": "products",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "13 × 14 = ?",
    "canonical_answer": "182",
    "answer_type": "integer",
    "relation": "13 × 14 = 182",
    "hook": "13 × 14 = 13×10 + 13×4 = 130 + 52 = 182。",
    "pattern": {
      "check": "182 = 2 × 7 × 13，因式分解高频数。",
      "family": [
        "13² = 169",
        "14² = 196"
      ]
    },
    "frames": [
      {
        "title": "13 × 10 = 130",
        "detail": "先乘整十"
      },
      {
        "title": "13 × 4 = 52",
        "detail": "再乘零头"
      },
      {
        "title": "182",
        "detail": "13 × 14 = 182"
      }
    ]
  },
  {
    "id": "product-13-15",
    "domain": "products",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "13 × 15 = ?",
    "canonical_answer": "195",
    "answer_type": "integer",
    "relation": "13 × 15 = 195",
    "hook": "13 × 15 = 130 + 65 = 195。",
    "pattern": {
      "check": "195 接近 200；13×15 = 13×(10+5)。",
      "family": [
        "15² = 225",
        "13 × 14 = 182"
      ]
    },
    "frames": [
      {
        "title": "13 × 10 = 130",
        "detail": "先乘整十"
      },
      {
        "title": "13 × 5 = 65",
        "detail": "15 的零头是 5"
      },
      {
        "title": "195",
        "detail": "13 × 15 = 195"
      }
    ]
  },
  {
    "id": "product-14-16",
    "domain": "products",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "relation_network",
    "prompt": "14 × 16 = ?",
    "canonical_answer": "224",
    "answer_type": "integer",
    "relation": "14 × 16 = 224",
    "hook": "14 × 16 = 15² − 1 = 225 − 1 = 224。",
    "pattern": {
      "check": "平方差：(15−1)(15+1) = 15² − 1，代数恒等式的预演。",
      "family": [
        "15² = 225",
        "13 × 15 = 195"
      ]
    },
    "frames": [
      {
        "title": "15² = 225",
        "detail": "14 和 16 正好像 15 的两翼"
      },
      {
        "title": "225 − 1",
        "detail": "(15−1)(15+1) = 15²−1"
      },
      {
        "title": "224",
        "detail": "14 × 16 = 224"
      }
    ]
  },
  {
    "id": "product-17-6",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "6 × 17 = ?",
    "canonical_answer": "102",
    "answer_type": "integer",
    "relation": "6 × 17 = 102",
    "hook": "17 × 6 = 60 + 42 = 102。",
    "pattern": {
      "check": "102 = 6 × 17 = 2 × 3 × 17。",
      "family": [
        "13 × 6 = 78",
        "17² = 289"
      ]
    },
    "frames": [
      {
        "title": "10 × 6 = 60",
        "detail": "先算整十部分"
      },
      {
        "title": "7 × 6 = 42",
        "detail": "再算零头"
      },
      {
        "title": "102",
        "detail": "17 × 6 = 102"
      }
    ]
  },
  {
    "id": "product-19-6",
    "domain": "products",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "6 × 19 = ?",
    "canonical_answer": "114",
    "answer_type": "integer",
    "relation": "6 × 19 = 114",
    "hook": "19 × 6 = 60 + 54 = 114。",
    "pattern": {
      "check": "也可以 (20−1)×6 = 120 − 6 = 114，互相印证。",
      "family": [
        "19 × 8 = 152",
        "19² = 361"
      ]
    },
    "frames": [
      {
        "title": "10 × 6 = 60",
        "detail": "先算整十部分"
      },
      {
        "title": "9 × 6 = 54",
        "detail": "再算零头"
      },
      {
        "title": "114",
        "detail": "19 × 6 = 114"
      }
    ]
  },
  {
    "id": "fraction-1-2",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "retrieval_anchor",
    "prompt": "1/2 = ?",
    "canonical_answer": "0.5",
    "answer_type": "decimal",
    "relation": "1/2 = 0.5",
    "hook": "一半就是 0.5。",
    "pattern": {
      "check": "0.5 × 2 = 1，正好回到 1。",
      "family": [
        "1/4 = 0.25",
        "2/4 = 1/2"
      ]
    },
    "frames": [
      {
        "title": "1 平均分成 2 份",
        "detail": "每份是一半"
      },
      {
        "title": "0.5",
        "detail": "1/2 = 0.5"
      }
    ],
    "families": [
      {
        "id": "fr-1-2",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-1-2"
      }
    ]
  },
  {
    "id": "fraction-1-4",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "anchor",
    "prompt": "1/4 = ?",
    "canonical_answer": "0.25",
    "answer_type": "decimal",
    "relation": "1/4 = 0.25",
    "hook": "1/2 的一半：0.5 ÷ 2 = 0.25。",
    "pattern": {
      "check": "0.25 × 4 = 1；0.25 就是 25 分（1 元的 1/4）。",
      "family": [
        "1/2 = 0.5",
        "3/4 = 0.75"
      ]
    },
    "frames": [
      {
        "title": "1/2 = 0.5",
        "detail": "先想一半"
      },
      {
        "title": "再一半",
        "detail": "0.5 ÷ 2"
      },
      {
        "title": "0.25",
        "detail": "1/4 = 0.25"
      }
    ],
    "families": [
      {
        "id": "fr-1-4",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-1-4"
      }
    ]
  },
  {
    "id": "fraction-3-4",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "anchor",
    "prompt": "3/4 = ?",
    "canonical_answer": "0.75",
    "answer_type": "decimal",
    "relation": "3/4 = 0.75",
    "hook": "3 个 0.25：0.25 × 3 = 0.75。",
    "pattern": {
      "check": "也可以 1 − 1/4 = 1 − 0.25 = 0.75，互相印证。",
      "family": [
        "1/4 = 0.25",
        "1/2 = 0.5"
      ]
    },
    "frames": [
      {
        "title": "1/4 = 0.25",
        "detail": "先锚住 1/4"
      },
      {
        "title": "× 3",
        "detail": "3 个 1/4"
      },
      {
        "title": "0.75",
        "detail": "3/4 = 0.75"
      }
    ],
    "families": [
      {
        "id": "fr-3-4",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-3-4"
      }
    ]
  },
  {
    "id": "fraction-1-5",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "structure",
    "prompt": "1/5 = ?",
    "canonical_answer": "0.2",
    "answer_type": "decimal",
    "relation": "1/5 = 0.2",
    "hook": "1 元分 5 份，每份 2 毛：1/5 = 0.2。",
    "pattern": {
      "check": "分子分母同乘 2 → 2/10 = 0.2。",
      "family": [
        "2/5 = 0.4",
        "1/10 = 0.1"
      ]
    },
    "frames": [
      {
        "title": "×2 → 2/10",
        "detail": "分母凑成 10"
      },
      {
        "title": "2/10 = 0.2",
        "detail": "十分之几就是一位小数"
      },
      {
        "title": "0.2",
        "detail": "1/5 = 0.2"
      }
    ],
    "families": [
      {
        "id": "fr-1-5",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-1-5"
      }
    ]
  },
  {
    "id": "fraction-2-5",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "anchor",
    "prompt": "2/5 = ?",
    "canonical_answer": "0.4",
    "answer_type": "decimal",
    "relation": "2/5 = 0.4",
    "hook": "2 个 0.2：0.2 × 2 = 0.4。",
    "pattern": {
      "check": "同乘 2 → 4/10 = 0.4，互相印证。",
      "family": [
        "1/5 = 0.2",
        "3/5 = 0.6"
      ]
    },
    "frames": [
      {
        "title": "1/5 = 0.2",
        "detail": "先锚住 1/5"
      },
      {
        "title": "× 2",
        "detail": "2 个 1/5"
      },
      {
        "title": "0.4",
        "detail": "2/5 = 0.4"
      }
    ],
    "families": [
      {
        "id": "fr-2-5",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-2-5"
      }
    ]
  },
  {
    "id": "fraction-3-5",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "anchor",
    "prompt": "3/5 = ?",
    "canonical_answer": "0.6",
    "answer_type": "decimal",
    "relation": "3/5 = 0.6",
    "hook": "3 个 0.2：0.2 × 3 = 0.6。",
    "pattern": {
      "check": "同乘 2 → 6/10 = 0.6，互相印证。",
      "family": [
        "1/5 = 0.2",
        "4/5 = 0.8"
      ]
    },
    "frames": [
      {
        "title": "1/5 = 0.2",
        "detail": "先锚住 1/5"
      },
      {
        "title": "× 3",
        "detail": "3 个 1/5"
      },
      {
        "title": "0.6",
        "detail": "3/5 = 0.6"
      }
    ],
    "families": [
      {
        "id": "fr-3-5",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-3-5"
      }
    ]
  },
  {
    "id": "fraction-4-5",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "anchor",
    "prompt": "4/5 = ?",
    "canonical_answer": "0.8",
    "answer_type": "decimal",
    "relation": "4/5 = 0.8",
    "hook": "4 个 0.2 = 0.8；也可以 1 − 0.2 = 0.8。",
    "pattern": {
      "check": "比 1 少一个 1/5：1 − 0.2 = 0.8。",
      "family": [
        "1/5 = 0.2",
        "3/5 = 0.6"
      ]
    },
    "frames": [
      {
        "title": "1 − 1/5",
        "detail": "4/5 比 1 少 1/5"
      },
      {
        "title": "1 − 0.2",
        "detail": "用锚点来算"
      },
      {
        "title": "0.8",
        "detail": "4/5 = 0.8"
      }
    ],
    "families": [
      {
        "id": "fr-4-5",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-4-5"
      }
    ]
  },
  {
    "id": "fraction-1-8",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "anchor",
    "prompt": "1/8 = ?",
    "canonical_answer": "0.125",
    "answer_type": "decimal",
    "relation": "1/8 = 0.125",
    "hook": "1/4 的一半：0.25 ÷ 2 = 0.125。",
    "pattern": {
      "check": "0.125 × 8 = 1；连续对半：1 → 0.5 → 0.25 → 0.125。",
      "family": [
        "1/4 = 0.25",
        "3/8 = 0.375"
      ]
    },
    "frames": [
      {
        "title": "1/4 = 0.25",
        "detail": "先锚住 1/4"
      },
      {
        "title": "再一半",
        "detail": "0.25 ÷ 2"
      },
      {
        "title": "0.125",
        "detail": "1/8 = 0.125"
      }
    ],
    "families": [
      {
        "id": "fr-1-8",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-1-8"
      },
      {
        "id": "eighths",
        "type": "scaling",
        "role": "member"
      }
    ]
  },
  {
    "id": "fraction-3-8",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "anchor",
    "prompt": "3/8 = ?",
    "canonical_answer": "0.375",
    "answer_type": "decimal",
    "relation": "3/8 = 0.375",
    "hook": "3 个 0.125：0.125 × 3 = 0.375。",
    "pattern": {
      "check": "0.375 在 0.25 和 0.5 之间，合理。",
      "family": [
        "1/8 = 0.125",
        "5/8 = 0.625"
      ]
    },
    "frames": [
      {
        "title": "1/8 = 0.125",
        "detail": "先锚住 1/8"
      },
      {
        "title": "× 3",
        "detail": "3 个 1/8"
      },
      {
        "title": "0.375",
        "detail": "3/8 = 0.375"
      }
    ],
    "families": [
      {
        "id": "fr-3-8",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-3-8"
      },
      {
        "id": "eighths",
        "type": "scaling",
        "role": "member"
      }
    ]
  },
  {
    "id": "fraction-5-8",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "anchor",
    "prompt": "5/8 = ?",
    "canonical_answer": "0.625",
    "answer_type": "decimal",
    "relation": "5/8 = 0.625",
    "hook": "5 个 0.125 = 0.625；也可以 1/2 + 1/8 = 0.5 + 0.125。",
    "pattern": {
      "check": "0.625 比 0.5 多 0.125，合理。",
      "family": [
        "1/8 = 0.125",
        "1/2 = 0.5"
      ]
    },
    "frames": [
      {
        "title": "1/2 + 1/8",
        "detail": "5/8 拆成 4/8 + 1/8"
      },
      {
        "title": "0.5 + 0.125",
        "detail": "两个锚点相加"
      },
      {
        "title": "0.625",
        "detail": "5/8 = 0.625"
      }
    ],
    "families": [
      {
        "id": "fr-5-8",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-5-8"
      },
      {
        "id": "eighths",
        "type": "scaling",
        "role": "member"
      }
    ]
  },
  {
    "id": "fraction-7-8",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "anchor",
    "prompt": "7/8 = ?",
    "canonical_answer": "0.875",
    "answer_type": "decimal",
    "relation": "7/8 = 0.875",
    "hook": "比 1 少一个 1/8：1 − 0.125 = 0.875。",
    "pattern": {
      "check": "0.875 接近 1，合理。",
      "family": [
        "1/8 = 0.125",
        "5/8 = 0.625"
      ]
    },
    "frames": [
      {
        "title": "1 − 1/8",
        "detail": "7/8 比 1 少 1/8"
      },
      {
        "title": "1 − 0.125",
        "detail": "用锚点来算"
      },
      {
        "title": "0.875",
        "detail": "7/8 = 0.875"
      }
    ],
    "families": [
      {
        "id": "fr-7-8",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-7-8"
      },
      {
        "id": "eighths",
        "type": "scaling",
        "role": "member"
      }
    ]
  },
  {
    "id": "fraction-1-10",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "structure",
    "prompt": "1/10 = ?",
    "canonical_answer": "0.1",
    "answer_type": "decimal",
    "relation": "1/10 = 0.1",
    "hook": "十分之一就是 0.1。",
    "pattern": {
      "check": "0.1 × 10 = 1。",
      "family": [
        "1/5 = 0.2",
        "3/10 = 0.3"
      ]
    },
    "frames": [
      {
        "title": "1 平均分成 10 份",
        "detail": "每份是十分之一"
      },
      {
        "title": "0.1",
        "detail": "1/10 = 0.1"
      }
    ],
    "families": [
      {
        "id": "fr-1-10",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-1-10"
      }
    ]
  },
  {
    "id": "fraction-3-10",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "structure",
    "prompt": "3/10 = ?",
    "canonical_answer": "0.3",
    "answer_type": "decimal",
    "relation": "3/10 = 0.3",
    "hook": "3 个 0.1 就是 0.3。",
    "pattern": {
      "check": "十分之几直接写成一位小数。",
      "family": [
        "1/10 = 0.1",
        "7/10 = 0.7"
      ]
    },
    "frames": [
      {
        "title": "1/10 = 0.1",
        "detail": "先锚住 1/10"
      },
      {
        "title": "× 3",
        "detail": "3 个 1/10"
      },
      {
        "title": "0.3",
        "detail": "3/10 = 0.3"
      }
    ],
    "families": [
      {
        "id": "fr-3-10",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-3-10"
      }
    ]
  },
  {
    "id": "fraction-7-10",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 1,
    "hook_type": "structure",
    "prompt": "7/10 = ?",
    "canonical_answer": "0.7",
    "answer_type": "decimal",
    "relation": "7/10 = 0.7",
    "hook": "7 个 0.1 就是 0.7。",
    "pattern": {
      "check": "十分之几直接写成一位小数。",
      "family": [
        "1/10 = 0.1",
        "3/10 = 0.3"
      ]
    },
    "frames": [
      {
        "title": "1/10 = 0.1",
        "detail": "先锚住 1/10"
      },
      {
        "title": "× 7",
        "detail": "7 个 1/10"
      },
      {
        "title": "0.7",
        "detail": "7/10 = 0.7"
      }
    ],
    "families": [
      {
        "id": "fr-7-10",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-7-10"
      }
    ]
  },
  {
    "id": "fraction-1-20",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "transformation",
    "prompt": "1/20 = ?",
    "canonical_answer": "0.05",
    "answer_type": "decimal",
    "relation": "1/20 = 0.05",
    "hook": "分子分母同乘 5 → 5/100 = 0.05。",
    "pattern": {
      "check": "分母 20 乘 5 凑成 100，百分之几就是两位小数。",
      "family": [
        "1/10 = 0.1",
        "1/25 = 0.04"
      ]
    },
    "frames": [
      {
        "title": "×5 → 5/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "5/100 = 0.05",
        "detail": "百分之几是两位小数"
      },
      {
        "title": "0.05",
        "detail": "1/20 = 0.05"
      }
    ],
    "families": [
      {
        "id": "fr-1-20",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-1-20"
      }
    ]
  },
  {
    "id": "fraction-3-20",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "transformation",
    "prompt": "3/20 = ?",
    "canonical_answer": "0.15",
    "answer_type": "decimal",
    "relation": "3/20 = 0.15",
    "hook": "同乘 5 → 15/100 = 0.15。",
    "pattern": {
      "check": "0.15 = 0.1 + 0.05，合理。",
      "family": [
        "1/20 = 0.05",
        "3/25 = 0.12"
      ]
    },
    "frames": [
      {
        "title": "×5 → 15/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "15/100 = 0.15",
        "detail": "百分之十五"
      },
      {
        "title": "0.15",
        "detail": "3/20 = 0.15"
      }
    ],
    "families": [
      {
        "id": "fr-3-20",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-3-20"
      }
    ]
  },
  {
    "id": "fraction-7-20",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "transformation",
    "prompt": "7/20 = ?",
    "canonical_answer": "0.35",
    "answer_type": "decimal",
    "relation": "7/20 = 0.35",
    "hook": "同乘 5 → 35/100 = 0.35。",
    "pattern": {
      "check": "0.35 在 0.25（1/4）和 0.5（1/2）之间，合理。",
      "family": [
        "1/4 = 0.25",
        "9/20 = 0.45"
      ]
    },
    "frames": [
      {
        "title": "×5 → 35/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "35/100 = 0.35",
        "detail": "百分之三十五"
      },
      {
        "title": "0.35",
        "detail": "7/20 = 0.35"
      }
    ],
    "families": [
      {
        "id": "fr-7-20",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-7-20"
      }
    ]
  },
  {
    "id": "fraction-9-20",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "9/20 = ?",
    "canonical_answer": "0.45",
    "answer_type": "decimal",
    "relation": "9/20 = 0.45",
    "hook": "同乘 5 → 45/100 = 0.45。",
    "pattern": {
      "check": "0.45 接近 0.5（1/2），合理。",
      "family": [
        "7/20 = 0.35",
        "1/2 = 0.5"
      ]
    },
    "frames": [
      {
        "title": "×5 → 45/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "45/100 = 0.45",
        "detail": "百分之四十五"
      },
      {
        "title": "0.45",
        "detail": "9/20 = 0.45"
      }
    ],
    "families": [
      {
        "id": "fr-9-20",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-9-20"
      }
    ]
  },
  {
    "id": "fraction-11-20",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "11/20 = ?",
    "canonical_answer": "0.55",
    "answer_type": "decimal",
    "relation": "11/20 = 0.55",
    "hook": "同乘 5 → 55/100 = 0.55。",
    "pattern": {
      "check": "0.55 比 0.5 多一点，合理——11/20 比一半多 1/20。",
      "family": [
        "1/2 = 0.5",
        "13/20 = 0.65"
      ]
    },
    "frames": [
      {
        "title": "×5 → 55/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "55/100 = 0.55",
        "detail": "百分之五十五"
      },
      {
        "title": "0.55",
        "detail": "11/20 = 0.55"
      }
    ],
    "families": [
      {
        "id": "fr-11-20",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-11-20"
      }
    ]
  },
  {
    "id": "fraction-13-20",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "13/20 = ?",
    "canonical_answer": "0.65",
    "answer_type": "decimal",
    "relation": "13/20 = 0.65",
    "hook": "同乘 5 → 65/100 = 0.65。",
    "pattern": {
      "check": "0.65 在 0.5 和 0.75 之间，合理。",
      "family": [
        "11/20 = 0.55",
        "3/4 = 0.75"
      ]
    },
    "frames": [
      {
        "title": "×5 → 65/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "65/100 = 0.65",
        "detail": "百分之六十五"
      },
      {
        "title": "0.65",
        "detail": "13/20 = 0.65"
      }
    ],
    "families": [
      {
        "id": "fr-13-20",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-13-20"
      }
    ]
  },
  {
    "id": "fraction-1-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "transformation",
    "prompt": "1/25 = ?",
    "canonical_answer": "0.04",
    "answer_type": "decimal",
    "relation": "1/25 = 0.04",
    "hook": "分子分母同乘 4 → 4/100 = 0.04。",
    "pattern": {
      "check": "分母 25 乘 4 凑成 100。",
      "family": [
        "1/20 = 0.05",
        "2/25 = 0.08"
      ]
    },
    "frames": [
      {
        "title": "×4 → 4/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "4/100 = 0.04",
        "detail": "百分之四"
      },
      {
        "title": "0.04",
        "detail": "1/25 = 0.04"
      }
    ],
    "families": [
      {
        "id": "fr-1-25",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-1-25"
      }
    ]
  },
  {
    "id": "fraction-2-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "transformation",
    "prompt": "2/25 = ?",
    "canonical_answer": "0.08",
    "answer_type": "decimal",
    "relation": "2/25 = 0.08",
    "hook": "同乘 4 → 8/100 = 0.08。",
    "pattern": {
      "check": "0.08 = 2 × 0.04，与 1/25 互相印证。",
      "family": [
        "1/25 = 0.04",
        "3/25 = 0.12"
      ]
    },
    "frames": [
      {
        "title": "×4 → 8/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "8/100 = 0.08",
        "detail": "百分之八"
      },
      {
        "title": "0.08",
        "detail": "2/25 = 0.08"
      }
    ],
    "families": [
      {
        "id": "fr-2-25",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-2-25"
      }
    ]
  },
  {
    "id": "fraction-3-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "3/25 = ?",
    "canonical_answer": "0.12",
    "answer_type": "decimal",
    "relation": "3/25 = 0.12",
    "hook": "同乘 4 → 12/100 = 0.12。",
    "pattern": {
      "check": "0.12 = 3 × 0.04，与 1/25 互相印证。",
      "family": [
        "2/25 = 0.08",
        "1/8 = 0.125"
      ]
    },
    "frames": [
      {
        "title": "×4 → 12/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "12/100 = 0.12",
        "detail": "百分之十二"
      },
      {
        "title": "0.12",
        "detail": "3/25 = 0.12"
      }
    ],
    "families": [
      {
        "id": "fr-3-25",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-3-25"
      }
    ]
  },
  {
    "id": "fraction-4-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "4/25 = ?",
    "canonical_answer": "0.16",
    "answer_type": "decimal",
    "relation": "4/25 = 0.16",
    "hook": "同乘 4 → 16/100 = 0.16。",
    "pattern": {
      "check": "0.16 = 4 × 0.04；4/25 与 1/6 无关，别和 0.166… 混。",
      "family": [
        "3/25 = 0.12",
        "1/4 = 0.25"
      ]
    },
    "frames": [
      {
        "title": "×4 → 16/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "16/100 = 0.16",
        "detail": "百分之十六"
      },
      {
        "title": "0.16",
        "detail": "4/25 = 0.16"
      }
    ],
    "families": [
      {
        "id": "fr-4-25",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-4-25"
      }
    ]
  },
  {
    "id": "fraction-6-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "6/25 = ?",
    "canonical_answer": "0.24",
    "answer_type": "decimal",
    "relation": "6/25 = 0.24",
    "hook": "同乘 4 → 24/100 = 0.24。",
    "pattern": {
      "check": "0.24 接近 0.25（1/4），合理。",
      "family": [
        "1/4 = 0.25",
        "4/25 = 0.16"
      ]
    },
    "frames": [
      {
        "title": "×4 → 24/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "24/100 = 0.24",
        "detail": "百分之二十四"
      },
      {
        "title": "0.24",
        "detail": "6/25 = 0.24"
      }
    ],
    "families": [
      {
        "id": "fr-6-25",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-6-25"
      }
    ]
  },
  {
    "id": "fraction-8-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "8/25 = ?",
    "canonical_answer": "0.32",
    "answer_type": "decimal",
    "relation": "8/25 = 0.32",
    "hook": "同乘 4 → 32/100 = 0.32。",
    "pattern": {
      "check": "0.32 在 0.25 和 0.5 之间，合理。",
      "family": [
        "6/25 = 0.24",
        "1/4 = 0.25"
      ]
    },
    "frames": [
      {
        "title": "×4 → 32/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "32/100 = 0.32",
        "detail": "百分之三十二"
      },
      {
        "title": "0.32",
        "detail": "8/25 = 0.32"
      }
    ],
    "families": [
      {
        "id": "fr-8-25",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-8-25"
      }
    ]
  },
  {
    "id": "fraction-12-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "12/25 = ?",
    "canonical_answer": "0.48",
    "answer_type": "decimal",
    "relation": "12/25 = 0.48",
    "hook": "同乘 4 → 48/100 = 0.48。",
    "pattern": {
      "check": "0.48 接近 0.5（1/2），合理——12/25 比一半少 0.5/25。",
      "family": [
        "1/2 = 0.5",
        "8/25 = 0.32"
      ]
    },
    "frames": [
      {
        "title": "×4 → 48/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "48/100 = 0.48",
        "detail": "百分之四十八"
      },
      {
        "title": "0.48",
        "detail": "12/25 = 0.48"
      }
    ],
    "families": [
      {
        "id": "fr-12-25",
        "type": "inverse_pair",
        "role": "forward",
        "counterpart": "ifraction-12-25"
      }
    ]
  },
  {
    "id": "isquare-6",
    "domain": "squares",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "retrieval_anchor",
    "prompt": "哪个数的平方是 36？",
    "canonical_answer": "6",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "6² = 36",
    "hook": "六六三十六，小九九老朋友。",
    "pattern": {
      "check": "36 在 25（5²）和 49（7²）之间。",
      "family": [
        "7² = 49",
        "8² = 64"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 36",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "6 × 6",
        "detail": "小九九里的六六三十六"
      },
      {
        "title": "36",
        "detail": "6² = 36"
      }
    ],
    "families": [
      {
        "id": "sq-6",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-6"
      }
    ],
    "entry_after": "square-6"
  },
  {
    "id": "isquare-7",
    "domain": "squares",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "retrieval_anchor",
    "prompt": "哪个数的平方是 49？",
    "canonical_answer": "7",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "7² = 49",
    "hook": "七七四十九，小九九老朋友。",
    "pattern": {
      "check": "49 在 36（6²）和 64（8²）之间。",
      "family": [
        "6² = 36",
        "8² = 64"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 49",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "7 × 7",
        "detail": "小九九里的七七四十九"
      },
      {
        "title": "49",
        "detail": "7² = 49"
      }
    ],
    "families": [
      {
        "id": "sq-7",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-7"
      }
    ],
    "entry_after": "square-7"
  },
  {
    "id": "isquare-8",
    "domain": "squares",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "retrieval_anchor",
    "prompt": "哪个数的平方是 64？",
    "canonical_answer": "8",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "8² = 64",
    "hook": "八八六十四，小九九老朋友。",
    "pattern": {
      "check": "64 在 49（7²）和 81（9²）之间。",
      "family": [
        "2⁶ = 64",
        "16² = 256"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 64",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "8 × 8",
        "detail": "八八六十四"
      },
      {
        "title": "64 = 2⁶",
        "detail": "2 连乘 6 次也是 64"
      },
      {
        "title": "64",
        "detail": "8² = 64"
      }
    ],
    "families": [
      {
        "id": "sq-8",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-8"
      }
    ],
    "entry_after": "square-8"
  },
  {
    "id": "isquare-9",
    "domain": "squares",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "retrieval_anchor",
    "prompt": "哪个数的平方是 81？",
    "canonical_answer": "9",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "9² = 81",
    "hook": "九九八十一，小九九老朋友。",
    "pattern": {
      "check": "81 在 64（8²）和 100（10²）之间。",
      "family": [
        "8² = 64",
        "10² = 100"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 81",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "9 × 9",
        "detail": "小九九里的九九八十一"
      },
      {
        "title": "81",
        "detail": "9² = 81"
      }
    ],
    "families": [
      {
        "id": "sq-9",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-9"
      }
    ],
    "entry_after": "square-9"
  },
  {
    "id": "isquare-10",
    "domain": "squares",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "哪个数的平方是 100？",
    "canonical_answer": "10",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "10² = 100",
    "hook": "整百想整十：10² = 100。",
    "pattern": {
      "check": "整十的平方一定是整百。",
      "family": [
        "20² = 400",
        "30² = 900"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 100",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "1² = 1",
        "detail": "先算十位的平方"
      },
      {
        "title": "1 | 00",
        "detail": "后面接两个 0"
      },
      {
        "title": "100",
        "detail": "10² = 100"
      }
    ],
    "families": [
      {
        "id": "sq-10",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-10"
      }
    ],
    "entry_after": "square-10"
  },
  {
    "id": "isquare-15",
    "domain": "squares",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "哪个数的平方是 225？",
    "canonical_answer": "15",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "15² = 225",
    "hook": "225 以 25 结尾，想尾 5 的平方：15² = 225。",
    "pattern": {
      "check": "末位是 5 的整数平方，一定以 25 结尾。225 在 100 和 400 之间。",
      "family": [
        "25² = 625",
        "35² = 1225"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 225",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "1 × 2",
        "detail": "先看 5 前面的 1"
      },
      {
        "title": "2",
        "detail": "1 × 2 得到前面这一截"
      },
      {
        "title": "2 | 25",
        "detail": "后面接上 25"
      },
      {
        "title": "225",
        "detail": "15² = 225"
      }
    ],
    "families": [
      {
        "id": "sq-15",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-15"
      }
    ],
    "entry_after": "square-15"
  },
  {
    "id": "isquare-20",
    "domain": "squares",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "哪个数的平方是 400？",
    "canonical_answer": "20",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "20² = 400",
    "hook": "整百想整十：20² = 400。",
    "pattern": {
      "check": "整十的平方一定是整百。",
      "family": [
        "10² = 100",
        "30² = 900"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 400",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "2² = 4",
        "detail": "先算十位的平方"
      },
      {
        "title": "4 | 00",
        "detail": "后面接两个 0"
      },
      {
        "title": "400",
        "detail": "20² = 400"
      }
    ],
    "families": [
      {
        "id": "sq-20",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-20"
      }
    ],
    "entry_after": "square-20"
  },
  {
    "id": "isquare-11",
    "domain": "squares",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "哪个数的平方是 121？",
    "canonical_answer": "11",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "11² = 121",
    "hook": "121 = 100 + 20 + 1：(10+1)²。",
    "pattern": {
      "check": "离 10 很近的数，借 10² 来算。",
      "family": [
        "12² = 144",
        "21² = 441"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 121",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "10² = 100",
        "detail": "先借整十"
      },
      {
        "title": "+20 +1",
        "detail": "加上 2×10×1 和 1²"
      },
      {
        "title": "121",
        "detail": "11² = 121"
      }
    ],
    "families": [
      {
        "id": "sq-11",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-11"
      }
    ],
    "entry_after": "square-11"
  },
  {
    "id": "isquare-12",
    "domain": "squares",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "retrieval_anchor",
    "prompt": "哪个数的平方是 144？",
    "canonical_answer": "12",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "12² = 144",
    "hook": "直接锚住：12² = 144。",
    "pattern": {
      "check": "144 在 121（11²）和 169（13²）之间。",
      "family": [
        "11² = 121",
        "13² = 169"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 144",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "12 × 12",
        "detail": "没有捷径，直接提取"
      },
      {
        "title": "144",
        "detail": "12² = 144"
      }
    ],
    "families": [
      {
        "id": "sq-12",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-12"
      }
    ],
    "entry_after": "square-12"
  },
  {
    "id": "isquare-13",
    "domain": "squares",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "reasonableness",
    "prompt": "哪个数的平方是 169？",
    "canonical_answer": "13",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "13² = 169",
    "hook": "169 个位是 9：13² = 169。",
    "pattern": {
      "check": "169 在 144（12²）和 196（14²）之间；注意别和 14²=196 混淆。",
      "family": [
        "12² = 144",
        "14² = 196"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 169",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "13 × 13",
        "detail": "直接提取"
      },
      {
        "title": "个位是 9",
        "detail": "3×3=9，个位一定是 9"
      },
      {
        "title": "169",
        "detail": "13² = 169"
      }
    ],
    "families": [
      {
        "id": "sq-13",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-13"
      }
    ],
    "entry_after": "square-13"
  },
  {
    "id": "isquare-14",
    "domain": "squares",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "reasonableness",
    "prompt": "哪个数的平方是 196？",
    "canonical_answer": "14",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "14² = 196",
    "hook": "196 接近 200，个位是 6：14² = 196。",
    "pattern": {
      "check": "196 接近 200；注意别和 13²=169 混淆。",
      "family": [
        "13² = 169",
        "15² = 225"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 196",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "14 × 14",
        "detail": "接近 200"
      },
      {
        "title": "个位是 6",
        "detail": "4×4=16，个位一定是 6"
      },
      {
        "title": "196",
        "detail": "14² = 196"
      }
    ],
    "families": [
      {
        "id": "sq-14",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-14"
      }
    ],
    "entry_after": "square-14"
  },
  {
    "id": "isquare-16",
    "domain": "squares",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "retrieval_anchor",
    "prompt": "哪个数的平方是 256？",
    "canonical_answer": "16",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "16² = 256",
    "hook": "直接锚住：16² = 256。",
    "pattern": {
      "check": "256 在 225（15²）和 289（17²）之间。",
      "family": [
        "2⁸ = 256",
        "8² = 64"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 256",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "16 = 2⁴",
        "detail": "16 是 2 连乘 4 次"
      },
      {
        "title": "(2⁴)² = 2⁸",
        "detail": "平方就是指数翻倍"
      },
      {
        "title": "256",
        "detail": "16² = 256"
      }
    ],
    "families": [
      {
        "id": "sq-16",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-16"
      }
    ],
    "entry_after": "square-16"
  },
  {
    "id": "isquare-25",
    "domain": "squares",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "哪个数的平方是 625？",
    "canonical_answer": "25",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "25² = 625",
    "hook": "625 以 25 结尾，尾 5 平方：25² = 625。",
    "pattern": {
      "check": "末位是 5 的整数平方，一定以 25 结尾。625 在 400 和 900 之间。",
      "family": [
        "15² = 225",
        "35² = 1225"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 625",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "2 × 3",
        "detail": "先看 5 前面的 2"
      },
      {
        "title": "6",
        "detail": "2 × 3 得到前面这一截"
      },
      {
        "title": "6 | 25",
        "detail": "后面接上 25"
      },
      {
        "title": "625",
        "detail": "25² = 625"
      }
    ],
    "families": [
      {
        "id": "sq-25",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-25"
      }
    ],
    "entry_after": "square-25"
  },
  {
    "id": "isquare-17",
    "domain": "squares",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "retrieval_anchor",
    "prompt": "哪个数的平方是 289？",
    "canonical_answer": "17",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "17² = 289",
    "hook": "289 在 256 和 324 之间：17² = 289。",
    "pattern": {
      "check": "289 在 256（16²）和 324（18²）之间，个位是 9。",
      "family": [
        "16² = 256",
        "18² = 324"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 289",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "17 × 17",
        "detail": "夹在 256 和 324 之间"
      },
      {
        "title": "个位是 9",
        "detail": "7×7=49，个位一定是 9"
      },
      {
        "title": "289",
        "detail": "17² = 289"
      }
    ],
    "families": [
      {
        "id": "sq-17",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-17"
      }
    ],
    "entry_after": "square-17"
  },
  {
    "id": "isquare-18",
    "domain": "squares",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "哪个数的平方是 324？",
    "canonical_answer": "18",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "18² = 324",
    "hook": "324 = 400 − 80 + 4：(20−2)²。",
    "pattern": {
      "check": "离 20 很近的数，借 20² 往回算。",
      "family": [
        "19² = 361",
        "20² = 400"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 324",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "20² = 400",
        "detail": "先借 20²"
      },
      {
        "title": "−80 +4",
        "detail": "减去 2×20×2，加回 2²"
      },
      {
        "title": "324",
        "detail": "18² = 324"
      }
    ],
    "families": [
      {
        "id": "sq-18",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-18"
      }
    ],
    "entry_after": "square-18"
  },
  {
    "id": "isquare-19",
    "domain": "squares",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "structure",
    "prompt": "哪个数的平方是 361？",
    "canonical_answer": "19",
    "answer_type": "integer",
    "direction": "inverse",
    "relation": "19² = 361",
    "hook": "361 = 400 − 40 + 1：(20−1)²。",
    "pattern": {
      "check": "离 20 最近的数，借 20² 往回算。",
      "family": [
        "18² = 324",
        "20² = 400"
      ]
    },
    "frames": [
      {
        "title": "? × ? = 361",
        "detail": "想哪个数自己乘自己"
      },
      {
        "title": "20² = 400",
        "detail": "先借 20²"
      },
      {
        "title": "−40 +1",
        "detail": "减去 2×20×1，加回 1²"
      },
      {
        "title": "361",
        "detail": "19² = 361"
      }
    ],
    "families": [
      {
        "id": "sq-19",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "square-19"
      }
    ],
    "entry_after": "square-19"
  },
  {
    "id": "ifraction-1-2",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "retrieval_anchor",
    "prompt": "0.5 是哪个分数？",
    "canonical_answer": "1/2",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.5 = 1/2",
    "hook": "一半就是 1/2。",
    "pattern": {
      "check": "0.5 × 2 = 1，正好回到 1。",
      "family": [
        "1/4 = 0.25",
        "2/4 = 1/2"
      ]
    },
    "frames": [
      {
        "title": "1 平均分成 2 份",
        "detail": "每份是一半"
      },
      {
        "title": "0.5",
        "detail": "1/2 = 0.5"
      }
    ],
    "families": [
      {
        "id": "fr-1-2",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-1-2"
      }
    ],
    "entry_after": "fraction-1-2"
  },
  {
    "id": "ifraction-1-4",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "anchor",
    "prompt": "0.25 是哪个分数？",
    "canonical_answer": "1/4",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.25 = 1/4",
    "hook": "0.25 是 0.5 的一半：1/4。",
    "pattern": {
      "check": "0.25 × 4 = 1；0.25 就是 25 分（1 元的 1/4）。",
      "family": [
        "1/2 = 0.5",
        "3/4 = 0.75"
      ]
    },
    "frames": [
      {
        "title": "1/2 = 0.5",
        "detail": "先想一半"
      },
      {
        "title": "再一半",
        "detail": "0.5 ÷ 2"
      },
      {
        "title": "0.25",
        "detail": "1/4 = 0.25"
      }
    ],
    "families": [
      {
        "id": "fr-1-4",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-1-4"
      }
    ],
    "entry_after": "fraction-1-4"
  },
  {
    "id": "ifraction-3-4",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "anchor",
    "prompt": "0.75 是哪个分数？",
    "canonical_answer": "3/4",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.75 = 3/4",
    "hook": "3 个 0.25：3/4。",
    "pattern": {
      "check": "也可以 1 − 1/4 = 1 − 0.25 = 0.75，互相印证。",
      "family": [
        "1/4 = 0.25",
        "1/2 = 0.5"
      ]
    },
    "frames": [
      {
        "title": "1/4 = 0.25",
        "detail": "先锚住 1/4"
      },
      {
        "title": "× 3",
        "detail": "3 个 1/4"
      },
      {
        "title": "0.75",
        "detail": "3/4 = 0.75"
      }
    ],
    "families": [
      {
        "id": "fr-3-4",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-3-4"
      }
    ],
    "entry_after": "fraction-3-4"
  },
  {
    "id": "ifraction-1-5",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "0.2 是哪个分数？",
    "canonical_answer": "1/5",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.2 = 1/5",
    "hook": "0.2 是五分之一：1/5。",
    "pattern": {
      "check": "分子分母同乘 2 → 2/10 = 0.2。",
      "family": [
        "2/5 = 0.4",
        "1/10 = 0.1"
      ]
    },
    "frames": [
      {
        "title": "×2 → 2/10",
        "detail": "分母凑成 10"
      },
      {
        "title": "2/10 = 0.2",
        "detail": "十分之几就是一位小数"
      },
      {
        "title": "0.2",
        "detail": "1/5 = 0.2"
      }
    ],
    "families": [
      {
        "id": "fr-1-5",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-1-5"
      }
    ],
    "entry_after": "fraction-1-5"
  },
  {
    "id": "ifraction-2-5",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "anchor",
    "prompt": "0.4 是哪个分数？",
    "canonical_answer": "2/5",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.4 = 2/5",
    "hook": "2 个 0.2：2/5。",
    "pattern": {
      "check": "同乘 2 → 4/10 = 0.4，互相印证。",
      "family": [
        "1/5 = 0.2",
        "3/5 = 0.6"
      ]
    },
    "frames": [
      {
        "title": "1/5 = 0.2",
        "detail": "先锚住 1/5"
      },
      {
        "title": "× 2",
        "detail": "2 个 1/5"
      },
      {
        "title": "0.4",
        "detail": "2/5 = 0.4"
      }
    ],
    "families": [
      {
        "id": "fr-2-5",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-2-5"
      }
    ],
    "entry_after": "fraction-2-5"
  },
  {
    "id": "ifraction-3-5",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "anchor",
    "prompt": "0.6 是哪个分数？",
    "canonical_answer": "3/5",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.6 = 3/5",
    "hook": "3 个 0.2：3/5。",
    "pattern": {
      "check": "同乘 2 → 6/10 = 0.6，互相印证。",
      "family": [
        "1/5 = 0.2",
        "4/5 = 0.8"
      ]
    },
    "frames": [
      {
        "title": "1/5 = 0.2",
        "detail": "先锚住 1/5"
      },
      {
        "title": "× 3",
        "detail": "3 个 1/5"
      },
      {
        "title": "0.6",
        "detail": "3/5 = 0.6"
      }
    ],
    "families": [
      {
        "id": "fr-3-5",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-3-5"
      }
    ],
    "entry_after": "fraction-3-5"
  },
  {
    "id": "ifraction-4-5",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "anchor",
    "prompt": "0.8 是哪个分数？",
    "canonical_answer": "4/5",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.8 = 4/5",
    "hook": "比 1 少 0.2：4/5。",
    "pattern": {
      "check": "比 1 少一个 1/5：1 − 0.2 = 0.8。",
      "family": [
        "1/5 = 0.2",
        "3/5 = 0.6"
      ]
    },
    "frames": [
      {
        "title": "1 − 1/5",
        "detail": "4/5 比 1 少 1/5"
      },
      {
        "title": "1 − 0.2",
        "detail": "用锚点来算"
      },
      {
        "title": "0.8",
        "detail": "4/5 = 0.8"
      }
    ],
    "families": [
      {
        "id": "fr-4-5",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-4-5"
      }
    ],
    "entry_after": "fraction-4-5"
  },
  {
    "id": "ifraction-1-10",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "0.1 是哪个分数？",
    "canonical_answer": "1/10",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.1 = 1/10",
    "hook": "十分之一就是 1/10。",
    "pattern": {
      "check": "0.1 × 10 = 1。",
      "family": [
        "1/5 = 0.2",
        "3/10 = 0.3"
      ]
    },
    "frames": [
      {
        "title": "1 平均分成 10 份",
        "detail": "每份是十分之一"
      },
      {
        "title": "0.1",
        "detail": "1/10 = 0.1"
      }
    ],
    "families": [
      {
        "id": "fr-1-10",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-1-10"
      }
    ],
    "entry_after": "fraction-1-10"
  },
  {
    "id": "ifraction-3-10",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "0.3 是哪个分数？",
    "canonical_answer": "3/10",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.3 = 3/10",
    "hook": "3 个 0.1：3/10。",
    "pattern": {
      "check": "十分之几直接写成一位小数。",
      "family": [
        "1/10 = 0.1",
        "7/10 = 0.7"
      ]
    },
    "frames": [
      {
        "title": "1/10 = 0.1",
        "detail": "先锚住 1/10"
      },
      {
        "title": "× 3",
        "detail": "3 个 1/10"
      },
      {
        "title": "0.3",
        "detail": "3/10 = 0.3"
      }
    ],
    "families": [
      {
        "id": "fr-3-10",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-3-10"
      }
    ],
    "entry_after": "fraction-3-10"
  },
  {
    "id": "ifraction-7-10",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "0.7 是哪个分数？",
    "canonical_answer": "7/10",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.7 = 7/10",
    "hook": "7 个 0.1：7/10。",
    "pattern": {
      "check": "十分之几直接写成一位小数。",
      "family": [
        "1/10 = 0.1",
        "3/10 = 0.3"
      ]
    },
    "frames": [
      {
        "title": "1/10 = 0.1",
        "detail": "先锚住 1/10"
      },
      {
        "title": "× 7",
        "detail": "7 个 1/10"
      },
      {
        "title": "0.7",
        "detail": "7/10 = 0.7"
      }
    ],
    "families": [
      {
        "id": "fr-7-10",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-7-10"
      }
    ],
    "entry_after": "fraction-7-10"
  },
  {
    "id": "ifraction-1-8",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "anchor",
    "prompt": "0.125 是哪个分数？",
    "canonical_answer": "1/8",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.125 = 1/8",
    "hook": "0.125 是 0.25 的一半：1/8。",
    "pattern": {
      "check": "0.125 × 8 = 1；连续对半：1 → 0.5 → 0.25 → 0.125。",
      "family": [
        "1/4 = 0.25",
        "3/8 = 0.375"
      ]
    },
    "frames": [
      {
        "title": "1/4 = 0.25",
        "detail": "先锚住 1/4"
      },
      {
        "title": "再一半",
        "detail": "0.25 ÷ 2"
      },
      {
        "title": "0.125",
        "detail": "1/8 = 0.125"
      }
    ],
    "families": [
      {
        "id": "fr-1-8",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-1-8"
      }
    ],
    "entry_after": "fraction-1-8"
  },
  {
    "id": "ifraction-3-8",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "anchor",
    "prompt": "0.375 是哪个分数？",
    "canonical_answer": "3/8",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.375 = 3/8",
    "hook": "3 个 0.125：3/8。",
    "pattern": {
      "check": "0.375 在 0.25 和 0.5 之间，合理。",
      "family": [
        "1/8 = 0.125",
        "5/8 = 0.625"
      ]
    },
    "frames": [
      {
        "title": "1/8 = 0.125",
        "detail": "先锚住 1/8"
      },
      {
        "title": "× 3",
        "detail": "3 个 1/8"
      },
      {
        "title": "0.375",
        "detail": "3/8 = 0.375"
      }
    ],
    "families": [
      {
        "id": "fr-3-8",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-3-8"
      }
    ],
    "entry_after": "fraction-3-8"
  },
  {
    "id": "ifraction-5-8",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "anchor",
    "prompt": "0.625 是哪个分数？",
    "canonical_answer": "5/8",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.625 = 5/8",
    "hook": "0.5 加 0.125：5/8。",
    "pattern": {
      "check": "0.625 比 0.5 多 0.125，合理。",
      "family": [
        "1/8 = 0.125",
        "1/2 = 0.5"
      ]
    },
    "frames": [
      {
        "title": "1/2 + 1/8",
        "detail": "5/8 拆成 4/8 + 1/8"
      },
      {
        "title": "0.5 + 0.125",
        "detail": "两个锚点相加"
      },
      {
        "title": "0.625",
        "detail": "5/8 = 0.625"
      }
    ],
    "families": [
      {
        "id": "fr-5-8",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-5-8"
      }
    ],
    "entry_after": "fraction-5-8"
  },
  {
    "id": "ifraction-7-8",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "anchor",
    "prompt": "0.875 是哪个分数？",
    "canonical_answer": "7/8",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.875 = 7/8",
    "hook": "比 1 少 0.125：7/8。",
    "pattern": {
      "check": "0.875 接近 1，合理。",
      "family": [
        "1/8 = 0.125",
        "5/8 = 0.625"
      ]
    },
    "frames": [
      {
        "title": "1 − 1/8",
        "detail": "7/8 比 1 少 1/8"
      },
      {
        "title": "1 − 0.125",
        "detail": "用锚点来算"
      },
      {
        "title": "0.875",
        "detail": "7/8 = 0.875"
      }
    ],
    "families": [
      {
        "id": "fr-7-8",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-7-8"
      }
    ],
    "entry_after": "fraction-7-8"
  },
  {
    "id": "ifraction-1-20",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "0.05 是哪个分数？",
    "canonical_answer": "1/20",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.05 = 1/20",
    "hook": "5/100 约到最简：1/20。",
    "pattern": {
      "check": "分母 20 乘 5 凑成 100，百分之几就是两位小数。",
      "family": [
        "1/10 = 0.1",
        "1/25 = 0.04"
      ]
    },
    "frames": [
      {
        "title": "×5 → 5/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "5/100 = 0.05",
        "detail": "百分之几是两位小数"
      },
      {
        "title": "0.05",
        "detail": "1/20 = 0.05"
      }
    ],
    "families": [
      {
        "id": "fr-1-20",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-1-20"
      }
    ],
    "entry_after": "fraction-1-20"
  },
  {
    "id": "ifraction-3-20",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "0.15 是哪个分数？",
    "canonical_answer": "3/20",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.15 = 3/20",
    "hook": "15/100 约到最简：3/20。",
    "pattern": {
      "check": "0.15 = 0.1 + 0.05，合理。",
      "family": [
        "1/20 = 0.05",
        "3/25 = 0.12"
      ]
    },
    "frames": [
      {
        "title": "×5 → 15/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "15/100 = 0.15",
        "detail": "百分之十五"
      },
      {
        "title": "0.15",
        "detail": "3/20 = 0.15"
      }
    ],
    "families": [
      {
        "id": "fr-3-20",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-3-20"
      }
    ],
    "entry_after": "fraction-3-20"
  },
  {
    "id": "ifraction-7-20",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "0.35 是哪个分数？",
    "canonical_answer": "7/20",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.35 = 7/20",
    "hook": "35/100 约到最简：7/20。",
    "pattern": {
      "check": "0.35 在 0.25（1/4）和 0.5（1/2）之间，合理。",
      "family": [
        "1/4 = 0.25",
        "9/20 = 0.45"
      ]
    },
    "frames": [
      {
        "title": "×5 → 35/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "35/100 = 0.35",
        "detail": "百分之三十五"
      },
      {
        "title": "0.35",
        "detail": "7/20 = 0.35"
      }
    ],
    "families": [
      {
        "id": "fr-7-20",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-7-20"
      }
    ],
    "entry_after": "fraction-7-20"
  },
  {
    "id": "ifraction-1-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "0.04 是哪个分数？",
    "canonical_answer": "1/25",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.04 = 1/25",
    "hook": "4/100 约到最简：1/25。",
    "pattern": {
      "check": "分母 25 乘 4 凑成 100。",
      "family": [
        "1/20 = 0.05",
        "2/25 = 0.08"
      ]
    },
    "frames": [
      {
        "title": "×4 → 4/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "4/100 = 0.04",
        "detail": "百分之四"
      },
      {
        "title": "0.04",
        "detail": "1/25 = 0.04"
      }
    ],
    "families": [
      {
        "id": "fr-1-25",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-1-25"
      }
    ],
    "entry_after": "fraction-1-25"
  },
  {
    "id": "ifraction-2-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "0.08 是哪个分数？",
    "canonical_answer": "2/25",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.08 = 2/25",
    "hook": "8/100 约到最简：2/25。",
    "pattern": {
      "check": "0.08 = 2 × 0.04，与 1/25 互相印证。",
      "family": [
        "1/25 = 0.04",
        "3/25 = 0.12"
      ]
    },
    "frames": [
      {
        "title": "×4 → 8/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "8/100 = 0.08",
        "detail": "百分之八"
      },
      {
        "title": "0.08",
        "detail": "2/25 = 0.08"
      }
    ],
    "families": [
      {
        "id": "fr-2-25",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-2-25"
      }
    ],
    "entry_after": "fraction-2-25"
  },
  {
    "id": "ifraction-9-20",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "0.45 是哪个分数？",
    "canonical_answer": "9/20",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.45 = 9/20",
    "hook": "45/100 约到最简：9/20。",
    "pattern": {
      "check": "0.45 接近 0.5（1/2），合理。",
      "family": [
        "7/20 = 0.35",
        "1/2 = 0.5"
      ]
    },
    "frames": [
      {
        "title": "×5 → 45/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "45/100 = 0.45",
        "detail": "百分之四十五"
      },
      {
        "title": "0.45",
        "detail": "9/20 = 0.45"
      }
    ],
    "families": [
      {
        "id": "fr-9-20",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-9-20"
      }
    ],
    "entry_after": "fraction-9-20"
  },
  {
    "id": "ifraction-11-20",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "0.55 是哪个分数？",
    "canonical_answer": "11/20",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.55 = 11/20",
    "hook": "55/100 约到最简：11/20。",
    "pattern": {
      "check": "0.55 比 0.5 多一点，合理——11/20 比一半多 1/20。",
      "family": [
        "1/2 = 0.5",
        "13/20 = 0.65"
      ]
    },
    "frames": [
      {
        "title": "×5 → 55/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "55/100 = 0.55",
        "detail": "百分之五十五"
      },
      {
        "title": "0.55",
        "detail": "11/20 = 0.55"
      }
    ],
    "families": [
      {
        "id": "fr-11-20",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-11-20"
      }
    ],
    "entry_after": "fraction-11-20"
  },
  {
    "id": "ifraction-13-20",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "0.65 是哪个分数？",
    "canonical_answer": "13/20",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.65 = 13/20",
    "hook": "65/100 约到最简：13/20。",
    "pattern": {
      "check": "0.65 在 0.5 和 0.75 之间，合理。",
      "family": [
        "11/20 = 0.55",
        "3/4 = 0.75"
      ]
    },
    "frames": [
      {
        "title": "×5 → 65/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "65/100 = 0.65",
        "detail": "百分之六十五"
      },
      {
        "title": "0.65",
        "detail": "13/20 = 0.65"
      }
    ],
    "families": [
      {
        "id": "fr-13-20",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-13-20"
      }
    ],
    "entry_after": "fraction-13-20"
  },
  {
    "id": "ifraction-3-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "0.12 是哪个分数？",
    "canonical_answer": "3/25",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.12 = 3/25",
    "hook": "12/100 约到最简：3/25。",
    "pattern": {
      "check": "0.12 = 3 × 0.04，与 1/25 互相印证。",
      "family": [
        "2/25 = 0.08",
        "1/8 = 0.125"
      ]
    },
    "frames": [
      {
        "title": "×4 → 12/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "12/100 = 0.12",
        "detail": "百分之十二"
      },
      {
        "title": "0.12",
        "detail": "3/25 = 0.12"
      }
    ],
    "families": [
      {
        "id": "fr-3-25",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-3-25"
      }
    ],
    "entry_after": "fraction-3-25"
  },
  {
    "id": "ifraction-4-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "0.16 是哪个分数？",
    "canonical_answer": "4/25",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.16 = 4/25",
    "hook": "16/100 约到最简：4/25。",
    "pattern": {
      "check": "0.16 = 4 × 0.04；4/25 与 1/6 无关，别和 0.166… 混。",
      "family": [
        "3/25 = 0.12",
        "1/4 = 0.25"
      ]
    },
    "frames": [
      {
        "title": "×4 → 16/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "16/100 = 0.16",
        "detail": "百分之十六"
      },
      {
        "title": "0.16",
        "detail": "4/25 = 0.16"
      }
    ],
    "families": [
      {
        "id": "fr-4-25",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-4-25"
      }
    ],
    "entry_after": "fraction-4-25"
  },
  {
    "id": "ifraction-6-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "0.24 是哪个分数？",
    "canonical_answer": "6/25",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.24 = 6/25",
    "hook": "24/100 约到最简：6/25。",
    "pattern": {
      "check": "0.24 接近 0.25（1/4），合理。",
      "family": [
        "1/4 = 0.25",
        "4/25 = 0.16"
      ]
    },
    "frames": [
      {
        "title": "×4 → 24/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "24/100 = 0.24",
        "detail": "百分之二十四"
      },
      {
        "title": "0.24",
        "detail": "6/25 = 0.24"
      }
    ],
    "families": [
      {
        "id": "fr-6-25",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-6-25"
      }
    ],
    "entry_after": "fraction-6-25"
  },
  {
    "id": "ifraction-8-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "0.32 是哪个分数？",
    "canonical_answer": "8/25",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.32 = 8/25",
    "hook": "32/100 约到最简：8/25。",
    "pattern": {
      "check": "0.32 在 0.25 和 0.5 之间，合理。",
      "family": [
        "6/25 = 0.24",
        "1/4 = 0.25"
      ]
    },
    "frames": [
      {
        "title": "×4 → 32/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "32/100 = 0.32",
        "detail": "百分之三十二"
      },
      {
        "title": "0.32",
        "detail": "8/25 = 0.32"
      }
    ],
    "families": [
      {
        "id": "fr-8-25",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-8-25"
      }
    ],
    "entry_after": "fraction-8-25"
  },
  {
    "id": "ifraction-12-25",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "transformation",
    "prompt": "0.48 是哪个分数？",
    "canonical_answer": "12/25",
    "answer_type": "fraction",
    "direction": "inverse",
    "relation": "0.48 = 12/25",
    "hook": "48/100 约到最简：12/25。",
    "pattern": {
      "check": "0.48 接近 0.5（1/2），合理——12/25 比一半少 0.5/25。",
      "family": [
        "1/2 = 0.5",
        "8/25 = 0.32"
      ]
    },
    "frames": [
      {
        "title": "×4 → 48/100",
        "detail": "分母凑成 100"
      },
      {
        "title": "48/100 = 0.48",
        "detail": "百分之四十八"
      },
      {
        "title": "0.48",
        "detail": "12/25 = 0.48"
      }
    ],
    "families": [
      {
        "id": "fr-12-25",
        "type": "inverse_pair",
        "role": "inverse",
        "counterpart": "fraction-12-25"
      }
    ],
    "entry_after": "fraction-12-25"
  },
  {
    "id": "fraction-1-3",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "1/3 = ?",
    "canonical_answer": "0.(3)",
    "answer_type": "decimal_repeating",
    "direction": "forward",
    "relation": "1/3 = 0.(3)",
    "hook": "1÷3 永远余 1，所以 3 无限循环。",
    "pattern": {
      "check": "0.(3) × 3 = 0.(9)，也就是 1。",
      "family": [
        "2/3 = 0.(6)",
        "1/9 = 0.(1)"
      ]
    },
    "frames": [
      {
        "title": "1 ÷ 3",
        "detail": "每一步都余 1"
      },
      {
        "title": "0.333…",
        "detail": "3 一直重复"
      },
      {
        "title": "0.(3)",
        "detail": "1/3 = 0.(3)"
      }
    ],
    "families": [
      {
        "id": "thirds",
        "type": "scaling",
        "role": "member"
      }
    ]
  },
  {
    "id": "fraction-2-3",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "relation_network",
    "prompt": "2/3 = ?",
    "canonical_answer": "0.(6)",
    "answer_type": "decimal_repeating",
    "direction": "forward",
    "relation": "2/3 = 0.(6)",
    "hook": "2 个 0.(3) 就是 0.(6)。",
    "pattern": {
      "check": "0.(6) 比 0.5 大，比 0.7 小。",
      "family": [
        "1/3 = 0.(3)",
        "1 − 1/3 = 2/3"
      ]
    },
    "frames": [
      {
        "title": "1/3 = 0.(3)",
        "detail": "先想 1/3"
      },
      {
        "title": "2 个 1/3",
        "detail": "0.(3) + 0.(3)"
      },
      {
        "title": "0.(6)",
        "detail": "2/3 = 0.(6)"
      }
    ],
    "families": [
      {
        "id": "thirds",
        "type": "scaling",
        "role": "member"
      }
    ]
  },
  {
    "id": "fraction-1-9",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 2,
    "hook_type": "structure",
    "prompt": "1/9 = ?",
    "canonical_answer": "0.(1)",
    "answer_type": "decimal_repeating",
    "direction": "forward",
    "relation": "1/9 = 0.(1)",
    "hook": "1÷9 永远余 1，1 无限循环。",
    "pattern": {
      "check": "n/9 = 0.(n)：2/9 = 0.(2)，5/9 = 0.(5)。",
      "family": [
        "2/9 = 0.(2)",
        "1/3 = 3/9 = 0.(3)"
      ]
    },
    "frames": [
      {
        "title": "1 ÷ 9",
        "detail": "每一步都余 1"
      },
      {
        "title": "0.111…",
        "detail": "1 一直重复"
      },
      {
        "title": "0.(1)",
        "detail": "1/9 = 0.(1)"
      }
    ],
    "families": [
      {
        "id": "ninths",
        "type": "scaling",
        "role": "member"
      }
    ]
  },
  {
    "id": "fraction-1-7",
    "domain": "fraction_decimal",
    "level": "core_recall",
    "tier": 3,
    "hook_type": "retrieval_anchor",
    "prompt": "1/7 = ?",
    "canonical_answer": "0.(142857)",
    "answer_type": "decimal_repeating",
    "direction": "forward",
    "relation": "1/7 = 0.(142857)",
    "hook": "142857 是「走马灯数」：记住 142｜857 这一圈。",
    "pattern": {
      "check": "1/7 比 1/8 = 0.125 大一点：0.142… 说得通。",
      "family": [
        "2/7 = 0.(285714)",
        "3/7 = 0.(428571)"
      ]
    },
    "frames": [
      {
        "title": "1 ÷ 7",
        "detail": "余数开始循环"
      },
      {
        "title": "142 | 857",
        "detail": "循环节分两块记"
      },
      {
        "title": "0.(142857)",
        "detail": "1/7 = 0.(142857)"
      }
    ],
    "families": [
      {
        "id": "cyc-7",
        "type": "cyclic_rotation",
        "role": "member"
      }
    ]
  }
];
