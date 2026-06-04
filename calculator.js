// 期权分析工具 - 高级计算模块
// 包含Black-Scholes模型、隐含波动率计算等

/**
 * Black-Scholes期权定价模型
 */
class BlackScholesCalculator {
    constructor(S, K, T, sigma, r, q = 0) {
        this.S = S;      // 标的资产现价
        this.K = K;      // 行权价
        this.T = T;      // 到期时间（年）
        this.sigma = sigma; // 波动率
        this.r = r;      // 无风险利率
        this.q = q;      // 股利收益率
    }
    
    /**
     * 计算d1和d2
     */
    calculateD() {
        const numerator = Math.log(this.S / this.K) + (this.r - this.q + 0.5 * this.sigma * this.sigma) * this.T;
        const denominator = this.sigma * Math.sqrt(this.T);
        
        this.d1 = numerator / denominator;
        this.d2 = this.d1 - this.sigma * Math.sqrt(this.T);
        
        return { d1: this.d1, d2: this.d2 };
    }
    
    /**
     * 计算看涨期权价格
     */
    callPrice() {
        this.calculateD();
        const cdfD1 = this.normalCDF(this.d1);
        const cdfD2 = this.normalCDF(this.d2);
        
        const call = this.S * Math.exp(-this.q * this.T) * cdfD1 - 
                     this.K * Math.exp(-this.r * this.T) * cdfD2;
        
        return Math.max(0, call);
    }
    
    /**
     * 计算看跌期权价格
     */
    putPrice() {
        this.calculateD();
        const cdfD1 = this.normalCDF(this.d1);
        const cdfD2 = this.normalCDF(this.d2);
        
        const put = this.K * Math.exp(-this.r * this.T) * (1 - cdfD2) - 
                    this.S * Math.exp(-this.q * this.T) * (1 - cdfD1);
        
        return Math.max(0, put);
    }
    
    /**
     * 计算Delta
     */
    delta(optionType = 'C') {
        this.calculateD();
        const cdfD1 = this.normalCDF(this.d1);
        
        if (optionType === 'C') {
            return Math.exp(-this.q * this.T) * cdfD1;
        } else {
            return Math.exp(-this.q * this.T) * (cdfD1 - 1);
        }
    }
    
    /**
     * 计算Gamma
     */
    gamma() {
        this.calculateD();
        const pdfD1 = this.normalPDF(this.d1);
        
        return pdfD1 * Math.exp(-this.q * this.T) / 
               (this.S * this.sigma * Math.sqrt(this.T));
    }
    
    /**
     * 计算Vega（每1%波动率变化）
     */
    vega() {
        this.calculateD();
        const pdfD1 = this.normalPDF(this.d1);
        
        return this.S * pdfD1 * Math.sqrt(this.T) * Math.exp(-this.q * this.T) / 100;
    }
    
    /**
     * 计算Theta（每天衰减）
     */
    theta(optionType = 'C') {
        this.calculateD();
        const cdfD1 = this.normalCDF(this.d1);
        const cdfD2 = this.normalCDF(this.d2);
        const pdfD1 = this.normalPDF(this.d1);
        
        const S_exp_q_T = this.S * Math.exp(-this.q * this.T);
        const K_exp_r_T = this.K * Math.exp(-this.r * this.T);
        
        if (optionType === 'C') {
            const term1 = -S_exp_q_T * pdfD1 * this.sigma / (2 * Math.sqrt(this.T));
            const term2 = this.q * S_exp_q_T * cdfD1;
            const term3 = -this.r * K_exp_r_T * cdfD2;
            
            return (term1 + term2 + term3) / 365;
        } else {
            const term1 = -S_exp_q_T * pdfD1 * this.sigma / (2 * Math.sqrt(this.T));
            const term2 = -this.q * S_exp_q_T * (1 - cdfD1);
            const term3 = this.r * K_exp_r_T * (1 - cdfD2);
            
            return (term1 + term2 + term3) / 365;
        }
    }
    
    /**
     * 计算Rho（每1%利率变化）
     */
    rho(optionType = 'C') {
        this.calculateD();
        const cdfD2 = this.normalCDF(this.d2);
        
        if (optionType === 'C') {
            return this.K * this.T * Math.exp(-this.r * this.T) * cdfD2 / 100;
        } else {
            return -this.K * this.T * Math.exp(-this.r * this.T) * (1 - cdfD2) / 100;
        }
    }
    
    /**
     * 计算所有Greeks
     */
    getAllGreeks(optionType = 'C') {
        return {
            delta: this.delta(optionType),
            gamma: this.gamma(),
            vega: this.vega(),
            theta: this.theta(optionType),
            rho: this.rho(optionType)
        };
    }
    
    /**
     * 正态分布CDF
     */
    normalCDF(x) {
        return 0.5 * (1 + erf(x / Math.sqrt(2)));
    }
    
    /**
     * 正态分布PDF
     */
    normalPDF(x) {
        return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    }
}

/**
 * 隐含波动率计算器
 * 使用牛顿-拉夫逊法迭代求解
 */
class ImpliedVolatilityCalculator {
    constructor(S, K, T, marketPrice, r, q = 0, optionType = 'C') {
        this.S = S;
        this.K = K;
        this.T = T;
        this.marketPrice = marketPrice;
        this.r = r;
        this.q = q;
        this.optionType = optionType;
        this.maxIterations = 100;
        this.tolerance = 1e-6;
    }
    
    /**
     * 使用二分法计算隐含波动率
     */
    calculateBisection(ivMin = 0.01, ivMax = 3.0) {
        while (ivMax - ivMin > this.tolerance) {
            const ivMid = (ivMin + ivMax) / 2;
            const calc = new BlackScholesCalculator(
                this.S, this.K, this.T, ivMid, this.r, this.q
            );
            
            const price = this.optionType === 'C' ? 
                calc.callPrice() : calc.putPrice();
            
            if (price < this.marketPrice) {
                ivMin = ivMid;
            } else {
                ivMax = ivMid;
            }
        }
        
        return (ivMin + ivMax) / 2;
    }
    
    /**
     * 使用牛顿-拉夫逊法计算隐含波动率
     * 更快收敛，但需要良好的初值
     */
    calculateNewtonRaphson(initialGuess = 0.3) {
        let iv = initialGuess;
        
        for (let i = 0; i < this.maxIterations; i++) {
            const calc = new BlackScholesCalculator(
                this.S, this.K, this.T, iv, this.r, this.q
            );
            
            const price = this.optionType === 'C' ? 
                calc.callPrice() : calc.putPrice();
            
            const diff = price - this.marketPrice;
            
            if (Math.abs(diff) < this.tolerance) {
                return iv;
            }
            
            const vega = calc.vega();
            if (Math.abs(vega) < 1e-10) {
                break; // 避免除以零
            }
            
            iv = iv - diff / vega;
            
            // 约束在合理范围内
            iv = Math.max(0.001, Math.min(5, iv));
        }
        
        return iv;
    }
}

/**
 * 价格预测计算器
 * 基于对数正态分布
 */
class PricePredictionCalculator {
    constructor(prices, daysToPredict = 5) {
        this.prices = prices;
        this.daysToPredict = daysToPredict;
        this.currentPrice = prices[prices.length - 1];
        this.calculateVolatility();
    }
    
    /**
     * 计算历史波动率
     */
    calculateVolatility() {
        if (this.prices.length < 2) {
            this.volatility = 0.2; // 默认20%
            return;
        }
        
        const returns = [];
        for (let i = 1; i < this.prices.length; i++) {
            const ret = Math.log(this.prices[i] / this.prices[i - 1]);
            returns.push(ret);
        }
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => 
            a + Math.pow(b - mean, 2), 0) / returns.length;
        
        // 年化波动率
        this.volatility = Math.sqrt(variance * 252);
        this.meanReturn = mean * 252; // 年化收益率
    }
    
    /**
     * 预测未来价格（对数正态分布）
     */
    predictPrice() {
        const T = this.daysToPredict / 365;
        const logCurrent = Math.log(this.currentPrice);
        
        // E[ln(S_T)] = ln(S_0) + (μ - σ²/2) * T
        const expectedLogPrice = logCurrent + 
            (this.meanReturn - 0.5 * this.volatility * this.volatility) * T;
        
        return Math.exp(expectedLogPrice);
    }
    
    /**
     * 计算预测价格的标准差
     */
    predictStdDev() {
        const T = this.daysToPredict / 365;
        const predictedPrice = this.predictPrice();
        
        // Var[S_T] = S_0^2 * exp(2*μ*T + σ²*T) * (exp(σ²*T) - 1)
        const variance = Math.pow(this.currentPrice, 2) * 
            Math.exp(2 * this.meanReturn * T + this.volatility * this.volatility * T) *
            (Math.exp(this.volatility * this.volatility * T) - 1);
        
        return Math.sqrt(variance);
    }
    
    /**
     * 计算价格上升概率
     */
    calculateUpProbability() {
        const T = this.daysToPredict / 365;
        const d2 = (Math.log(1) + (this.meanReturn - 0.5 * this.volatility * this.volatility) * T) /
                   (this.volatility * Math.sqrt(T));
        
        return 0.5 * (1 + erf(d2 / Math.sqrt(2)));
    }
    
    /**
     * 计算价格下降概率
     */
    calculateDownProbability() {
        return 1 - this.calculateUpProbability();
    }
    
    /**
     * 计算置信区间
     */
    calculateConfidenceInterval(confidenceLevel = 0.95) {
        const z = this.getZScore(confidenceLevel);
        const mean = this.predictPrice();
        const std = this.predictStdDev();
        
        return {
            mean: mean,
            std: std,
            lower: mean - z * std,
            upper: mean + z * std,
            level: confidenceLevel
        };
    }
    
    /**
     * 生成预测概率分布
     */
    generateDistribution(points = 100) {
        const mean = this.predictPrice();
        const std = this.predictStdDev();
        
        const distribution = [];
        const minPrice = mean - 4 * std;
        const maxPrice = mean + 4 * std;
        const step = (maxPrice - minPrice) / points;
        
        for (let price = minPrice; price <= maxPrice; price += step) {
            const logPrice = Math.log(price);
            const logMean = Math.log(mean);
            const normalizedPrice = (logPrice - logMean) / (this.volatility * Math.sqrt(this.daysToPredict / 365));
            
            // 对数正态分布的PDF
            const pdf = (1 / (price * this.volatility * Math.sqrt(2 * Math.PI * this.daysToPredict / 365))) *
                        Math.exp(-normalizedPrice * normalizedPrice / 2);
            
            distribution.push({
                price: parseFloat(price.toFixed(4)),
                probability: pdf
            });
        }
        
        return distribution;
    }
    
    /**
     * 获取Z分数
     */
    getZScore(confidenceLevel) {
        const scores = {
            0.90: 1.645,
            0.95: 1.96,
            0.99: 2.576
        };
        return scores[confidenceLevel] || 1.96;
    }
}

/**
 * 辅助函数 - 误差函数
 */
function erf(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;
    const t5 = t4 * t;
    
    const result = 1.0 - (((((a5 * t5 + a4 * t4) + a3 * t3) + a2 * t2) + a1 * t) * t) * 
                   Math.exp(-x * x);
    
    return sign * result;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BlackScholesCalculator,
        ImpliedVolatilityCalculator,
        PricePredictionCalculator,
        erf
    };
}
