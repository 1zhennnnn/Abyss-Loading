export interface Achievement {
  id:             string;
  icon:           string;
  name:           string;
  desc:           string;
  unlocked_label: string;
  req_global_tag: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id:             'ach_song_wang_s',
    icon:           '🔥',
    name:           '第411次，最後一次',
    desc:           '燒王船完成真結局，終止三百年輪迴',
    unlocked_label: 'S結局',
    req_global_tag: 'cleared_yongan_truth',
  },
  {
    id:             'ach_moon_eye',
    icon:           '👁️',
    name:           '月之眼開竅',
    desc:           '抽到天機命格，觸發壁畫覺醒事件',
    unlocked_label: '達成',
    req_global_tag: 'mural_witnessed',
  },
  {
    id:             'ach_red_thread',
    icon:           '🧵',
    name:           '紅絲護命',
    desc:           '貪狼命格：紅絲線燃燒，從死亡邊緣歸來',
    unlocked_label: '達成',
    req_global_tag: 'has_red_amulet',
  },
  {
    id:             'ach_taboo',
    icon:           '🚫',
    name:           '那個回頭的人',
    desc:           '送王時回頭，並且存活了',
    unlocked_label: '達成',
    req_global_tag: 'taboo_broken_look_back',
  },
  {
    id:             'ach_office_s',
    icon:           '💼',
    name:           '帶自己走',
    desc:           '肝苦辦公室：在職中，完成 S 結局',
    unlocked_label: 'S結局',
    req_global_tag: 'cleared_office_clean',
  },
  {
    id:             'ach_office_loop',
    icon:           '🔄',
    name:           '你回來了',
    desc:           '在肝苦辦公室同一個場景停留超過三次',
    unlocked_label: '達成',
    req_global_tag: 'office_looped',
  },
  {
    id:             'ach_honest',
    icon:           '✍️',
    name:           '寫真正的原因',
    desc:           '離職申請單上誠實填寫離職原因',
    unlocked_label: '達成',
    req_global_tag: 'honest_resignation',
  },
  {
    id:             'ach_song_wang_escaped',
    icon:           '🏃',
    name:           '帶著印記離開',
    desc:           '燒王船普通結局，脖子上有硃砂印記',
    unlocked_label: 'A結局',
    req_global_tag: 'cleared_yongan_escaped',
  },
];
