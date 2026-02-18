'use strict';

/**
 * 节日与节气种子数据
 * 包含：中国公历节日 / 中国农历节日 / 24节气 / 西方节日 / 国际节日
 *
 * type 说明：
 *   cn_solar  = 中国公历节日（固定月日）
 *   cn_lunar  = 中国农历节日（农历月日，每年公历日期不同，由 holidayService 动态计算）
 *   western   = 西方节日
 *   intl      = 国际节日
 *   solar_term= 24节气（公历日期每年略有差异，由 holidayService 用 lunar-javascript 计算）
 *
 * 农历节日只存 lunar_month / lunar_day，不存公历 month/day
 * 节气只存 name，公历日期运行时计算
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const holidays = [
      // ============================================================
      // 中国公历节日 (cn_solar) - 固定月日
      // ============================================================
      { name: '元旦', type: 'cn_solar', month: 1, day: 1, color: '#FF4444', description: '新年第一天', is_active: true },
      { name: '妇女节', type: 'cn_solar', month: 3, day: 8, color: '#FF69B4', description: '国际劳动妇女节', is_active: true },
      { name: '清明节', type: 'cn_solar', month: 4, day: 5, color: '#4CAF50', description: '公历4月4日或5日（此处取常用日期，实际为节气清明）', is_active: true },
      { name: '劳动节', type: 'cn_solar', month: 5, day: 1, color: '#FF4444', description: '国际劳动节', is_active: true },
      { name: '儿童节', type: 'cn_solar', month: 6, day: 1, color: '#FFD700', description: '国际儿童节', is_active: true },
      { name: '建党节', type: 'cn_solar', month: 7, day: 1, color: '#FF4444', description: '中国共产党成立纪念日', is_active: true },
      { name: '建军节', type: 'cn_solar', month: 8, day: 1, color: '#FF4444', description: '中国人民解放军建军节', is_active: true },
      { name: '教师节', type: 'cn_solar', month: 9, day: 10, color: '#4CAF50', description: '中国教师节', is_active: true },
      { name: '国庆节', type: 'cn_solar', month: 10, day: 1, color: '#FF4444', description: '中华人民共和国成立纪念日', is_active: true },

      // ============================================================
      // 中国农历节日 (cn_lunar) - 存农历月日
      // ============================================================
      { name: '春节', type: 'cn_lunar', lunar_month: 1, lunar_day: 1, color: '#FF4444', description: '农历新年，最重要的传统节日', is_active: true },
      { name: '元宵节', type: 'cn_lunar', lunar_month: 1, lunar_day: 15, color: '#FF6B6B', description: '正月十五，赏花灯吃元宵', is_active: true },
      { name: '龙抬头', type: 'cn_lunar', lunar_month: 2, lunar_day: 2, color: '#4169E1', description: '农历二月初二', is_active: true },
      { name: '端午节', type: 'cn_lunar', lunar_month: 5, lunar_day: 5, color: '#228B22', description: '农历五月初五，赛龙舟吃粽子', is_active: true },
      { name: '七夕节', type: 'cn_lunar', lunar_month: 7, lunar_day: 7, color: '#FF69B4', description: '农历七月初七，中国情人节', is_active: true },
      { name: '中元节', type: 'cn_lunar', lunar_month: 7, lunar_day: 15, color: '#808080', description: '农历七月十五，祭祖节', is_active: true },
      { name: '中秋节', type: 'cn_lunar', lunar_month: 8, lunar_day: 15, color: '#FFD700', description: '农历八月十五，赏月吃月饼', is_active: true },
      { name: '重阳节', type: 'cn_lunar', lunar_month: 9, lunar_day: 9, color: '#FF8C00', description: '农历九月初九，登高敬老', is_active: true },
      { name: '冬至', type: 'cn_lunar', lunar_month: 11, lunar_day: 0, color: '#4169E1', description: '冬至（实为节气，此处备用）', is_active: false }, // 冬至用节气计算更准确
      { name: '腊八节', type: 'cn_lunar', lunar_month: 12, lunar_day: 8, color: '#8B4513', description: '农历腊月初八，喝腊八粥', is_active: true },
      { name: '小年', type: 'cn_lunar', lunar_month: 12, lunar_day: 23, color: '#FF6347', description: '农历腊月廿三，送灶王', is_active: true },
      { name: '除夕', type: 'cn_lunar', lunar_month: 12, lunar_day: 30, color: '#FF4444', description: '农历除夕（大年三十），全家团圆', is_active: true },

      // ============================================================
      // 24节气 (solar_term) - 只存名称，公历日期运行时计算
      // ============================================================
      { name: '小寒', type: 'solar_term', color: '#87CEEB', description: '24节气第23个', is_active: true },
      { name: '大寒', type: 'solar_term', color: '#87CEEB', description: '24节气第24个', is_active: true },
      { name: '立春', type: 'solar_term', color: '#90EE90', description: '24节气第1个，春季开始', is_active: true },
      { name: '雨水', type: 'solar_term', color: '#90EE90', description: '24节气第2个', is_active: true },
      { name: '惊蛰', type: 'solar_term', color: '#90EE90', description: '24节气第3个', is_active: true },
      { name: '春分', type: 'solar_term', color: '#90EE90', description: '24节气第4个，春季中点', is_active: true },
      { name: '清明', type: 'solar_term', color: '#90EE90', description: '24节气第5个，扫墓祭祖', is_active: true },
      { name: '谷雨', type: 'solar_term', color: '#90EE90', description: '24节气第6个', is_active: true },
      { name: '立夏', type: 'solar_term', color: '#FFD700', description: '24节气第7个，夏季开始', is_active: true },
      { name: '小满', type: 'solar_term', color: '#FFD700', description: '24节气第8个', is_active: true },
      { name: '芒种', type: 'solar_term', color: '#FFD700', description: '24节气第9个', is_active: true },
      { name: '夏至', type: 'solar_term', color: '#FFD700', description: '24节气第10个，白天最长', is_active: true },
      { name: '小暑', type: 'solar_term', color: '#FF8C00', description: '24节气第11个', is_active: true },
      { name: '大暑', type: 'solar_term', color: '#FF8C00', description: '24节气第12个，最热', is_active: true },
      { name: '立秋', type: 'solar_term', color: '#FFA500', description: '24节气第13个，秋季开始', is_active: true },
      { name: '处暑', type: 'solar_term', color: '#FFA500', description: '24节气第14个', is_active: true },
      { name: '白露', type: 'solar_term', color: '#FFA500', description: '24节气第15个', is_active: true },
      { name: '秋分', type: 'solar_term', color: '#FFA500', description: '24节气第16个，秋季中点', is_active: true },
      { name: '寒露', type: 'solar_term', color: '#87CEEB', description: '24节气第17个', is_active: true },
      { name: '霜降', type: 'solar_term', color: '#87CEEB', description: '24节气第18个', is_active: true },
      { name: '立冬', type: 'solar_term', color: '#4169E1', description: '24节气第19个，冬季开始', is_active: true },
      { name: '小雪', type: 'solar_term', color: '#4169E1', description: '24节气第20个', is_active: true },
      { name: '大雪', type: 'solar_term', color: '#4169E1', description: '24节气第21个', is_active: true },
      { name: '冬至', type: 'solar_term', color: '#4169E1', description: '24节气第22个，夜晚最长', is_active: true },

      // ============================================================
      // 西方节日 (western) - 固定月日
      // ============================================================
      { name: '元旦', type: 'western', month: 1, day: 1, color: '#FFD700', description: '西方新年（与中国元旦同日）', is_active: false }, // 避免重复显示
      { name: '情人节', type: 'western', month: 2, day: 14, color: '#FF69B4', description: "Valentine's Day", is_active: true },
      { name: '愚人节', type: 'western', month: 4, day: 1, color: '#FF8C00', description: "April Fools' Day", is_active: true },
      { name: '万圣节', type: 'western', month: 10, day: 31, color: '#FF6347', description: "Halloween", is_active: true },
      { name: '平安夜', type: 'western', month: 12, day: 24, color: '#228B22', description: "Christmas Eve", is_active: true },
      { name: '圣诞节', type: 'western', month: 12, day: 25, color: '#FF4444', description: "Christmas Day", is_active: true },

      // ============================================================
      // 特殊规则节日（母亲节/父亲节）
      // ============================================================
      { name: '母亲节', type: 'western', month: null, day: null, special_rule: '5月第2个周日', color: '#FF69B4', description: "Mother's Day，每年5月第2个周日", is_active: true },
      { name: '父亲节', type: 'western', month: null, day: null, special_rule: '6月第3个周日', color: '#4169E1', description: "Father's Day，每年6月第3个周日", is_active: true },

      // ============================================================
      // 国际节日 (intl)
      // ============================================================
      { name: '世界地球日', type: 'intl', month: 4, day: 22, color: '#4CAF50', description: 'Earth Day', is_active: true },
      { name: '世界环境日', type: 'intl', month: 6, day: 5, color: '#4CAF50', description: 'World Environment Day', is_active: true },
      { name: '世界读书日', type: 'intl', month: 4, day: 23, color: '#4169E1', description: 'World Book Day', is_active: true },
      { name: '世界卫生日', type: 'intl', month: 4, day: 7, color: '#FF4444', description: 'World Health Day', is_active: true }
    ];

    // 补充默认字段
    const rows = holidays.map(h => ({
      name: h.name,
      type: h.type,
      month: h.month || null,
      day: h.day || null,
      lunar_month: h.lunar_month || null,
      lunar_day: h.lunar_day || null,
      is_leap_month: h.is_leap_month || false,
      special_rule: h.special_rule || null,
      color: h.color || '#FF4444',
      description: h.description || null,
      is_active: h.is_active !== undefined ? h.is_active : true
    }));

    await queryInterface.bulkInsert('holidays', rows);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('holidays', null, {});
  }
};
