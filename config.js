// 期权分析工具 - 配置文件
// 可以根据需要调整参数

const CONFIG = {
    // ===== 交易参数 =====
    riskFreeRate: 0.03,  // 无风险利率 3%
    tradingDays: 252,     // 年交易天数
    daysPerYear: 365,     // 日历年天数
    
    // ===== 显示参数 =====
    decimalPlaces: {
        price: 4,         // 价格显示小数位
        volatility: 2,    // 波动率显示小数位
        greeks: 4,        // Greeks显示小数位
        percent: 2        // 百分比显示小数位
    },
    
    // ===== 图表配置 =====
    chartHeight: 400,
    chartLineColor: '#667eea',
    chartAreaColor: 'rgba(102, 126, 234, 0.1)',
    upColor: '#f23645',      // K线上涨颜色
    downColor: '#22ab94',    // K线下跌颜色
    
    // ===== 期权评估参数 =====
    priceRange: 0.4,         // 损益图中价格范围（±40%）
    pricePoints: 100,        // 损益图中的价格点数
    predictDays: [3, 5, 10], // 价格预测的天数
    
    // ===== 预测参数 =====
    confidenceLevel: 0.95,   // 95%置信区间
    
    // ===== 数据导入参数 =====
    csvDelimiter: ',',
    csvQuoteChar: '"',
    
    // ===== 计算精度 =====
    ivIterations: 30,        // 隐含波动率二分法迭代次数
    ivTolerance: 0.0001,    // 隐含波动率误差容限
    ivMin: 0.01,            // 隐含波动率最小值
    ivMax: 3.0,             // 隐含波动率最大值
};

// 期权类型定义
const OPTION_TYPES = {
    CALL: 'C',
    PUT: 'P'
};

// 行权类型定义
const EXERCISE_TYPES = {
    EUROPEAN: 'E',
    AMERICAN: 'A'
};

// Greeks指标说明
const GREEKS_INFO = {
    delta: {
        name: 'Delta (Δ)',
        description: '期权价格对标的资产价格的敏感度',
        range: '[-1, 1]'
    },
    gamma: {
        name: 'Gamma (Γ)',
        description: 'Delta对标的资产价格的敏感度',
        range: '[0, +∞)'
    },
    vega: {
        name: 'Vega (ν)',
        description: '期权价格对波动率的敏感度（每1%波动率变化）',
        range: '[-∞, +∞)'
    },
    theta: {
        name: 'Theta (θ)',
        description: '期权价格对时间的敏感度（时间衰减，每天）',
        range: '[-∞, +∞)'
    },
    rho: {
        name: 'Rho (ρ)',
        description: '期权价格对利率的敏感度（每1%利率变化）',
        range: '[-∞, +∞)'
    }
};

// 常见期权策略
const OPTION_STRATEGIES = {
    'long_call': {
        name: '买入看涨',
        description: '看好后市，期望上涨',
        components: [{ type: 'call', direction: 'long' }]
    },
    'long_put': {
        name: '买入看跌',
        description: '看空后市或对冲风险',
        components: [{ type: 'put', direction: 'long' }]
    },
    'bull_call_spread': {
        name: '看涨期权差价',
        description: '中性偏看好，降低成本',
        components: [
            { type: 'call', direction: 'long', strikeOffset: 0 },
            { type: 'call', direction: 'short', strikeOffset: 1 }
        ]
    },
    'bear_put_spread': {
        name: '看跌期权差价',
        description: '中性偏看空，收取权利金',
        components: [
            { type: 'put', direction: 'short', strikeOffset: 0 },
            { type: 'put', direction: 'long', strikeOffset: 1 }
        ]
    },
    'straddle': {
        name: '跨式组合',
        description: '预期大幅波动',
        components: [
            { type: 'call', direction: 'long' },
            { type: 'put', direction: 'long' }
        ]
    },
    'strangle': {
        name: '宽跨式组合',
        description: '预期大幅波动但成本更低',
        components: [
            { type: 'call', direction: 'long', strikeOffset: 1 },
            { type: 'put', direction: 'long', strikeOffset: -1 }
        ]
    },
    'iron_condor': {
        name: '铁鹰组合',
        description: '中性市场，小幅盈利',
        components: [
            { type: 'call', direction: 'short', strikeOffset: 1 },
            { type: 'call', direction: 'long', strikeOffset: 2 },
            { type: 'put', direction: 'short', strikeOffset: -1 },
            { type: 'put', direction: 'long', strikeOffset: -2 }
        ]
    }
};

// 市场色彩方案
const COLORS = {
    primary: '#667eea',
    secondary: '#764ba2',
    up: '#f23645',
    down: '#22ab94',
    neutral: '#999',
    background: '#f5f7fa',
    surface: '#ffffff',
    border: '#e8eaed',
    text: '#333',
    hint: '#999'
};

// 工具函数 - 格式化
function formatPrice(value) {
    return parseFloat(value).toFixed(CONFIG.decimalPlaces.price);
}

function formatPercent(value) {
    return (parseFloat(value) * 100).toFixed(CONFIG.decimalPlaces.percent);
}

function formatVolatility(value) {
    return (parseFloat(value) * 100).toFixed(CONFIG.decimalPlaces.volatility);
}

function formatGreeks(value) {
    return parseFloat(value).toFixed(CONFIG.decimalPlaces.greeks);
}

// 工具函数 - 验证
function isValidPrice(value) {
    return !isNaN(parseFloat(value)) && parseFloat(value) > 0;
}

function isValidVolatility(value) {
    const vol = parseFloat(value);
    return !isNaN(vol) && vol >= CONFIG.ivMin && vol <= CONFIG.ivMax;
}

function isValidStrike(strike, spotPrice) {
    return isValidPrice(strike) && isValidPrice(spotPrice);
}

// 工具函数 - 日期
function getDaysToExpiration(expirationDate) {
    const today = new Date();
    const exp = new Date(expirationDate);
    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

function isOptionExpired(expirationDate) {
    return getDaysToExpiration(expirationDate) <= 0;
}

// 工具函数 - 数据处理
function parseCSVData(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const obj = {};
        const values = lines[i].split(',');
        headers.forEach((header, idx) => {
            obj[header] = values[idx]?.trim() || '';
        });
        data.push(obj);
    }
    
    return data;
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, OPTION_TYPES, EXERCISE_TYPES, GREEKS_INFO };
}
