# 项目文件结构

## 📁 核心文件

### HTML 文件
- **index.html** - 主应用界面，包含所有UI元素和图表容器
- **start.html** - 快速开始指南页面
- **README.md** - 详细功能文档

### JavaScript 文件
- **app.js** - 主应用逻辑，包含：
  - 数据加载模块
  - 图表更新函数
  - 期权选择和详情显示
  - 期权组合管理
  - T型报价表处理
  
- **config.js** - 全局配置和常数定义，包含：
  - 交易参数（无风险利率、交易天数等）
  - 显示参数（小数位、颜色等）
  - 期权策略定义
  - Greeks指标说明
  
- **calculator.js** - 高级金融计算模块，包含：
  - `BlackScholesCalculator` 类 - Black-Scholes期权定价模型
  - `ImpliedVolatilityCalculator` 类 - 隐含波动率计算
  - `PricePredictionCalculator` 类 - 价格预测（对数正态分布）

### CSV 数据文件
- **option_info.csv** - 期权合约信息
- **option_price.csv** - 期权价格数据
- **etf_price.csv** - ETF价格数据

## 🎯 功能模块详解

### 1. 数据加载 (app.js)
```javascript
loadData()           // 从文件上传加载CSV数据
loadSampleData()     // 加载示例数据
generateSampleData() // 生成演示数据
initializeUI()       // 初始化下拉菜单
```

### 2. ETF图表 (app.js)
```javascript
updateETFChart()     // 更新ETF K线图表
```

### 3. T型报价表 (app.js)
```javascript
updateOptionTable()  // 根据标签类型更新表格
switchTab(tabName)   // 切换四种显示模式
```
- **行情**：现价、涨跌幅、成交量
- **价值**：隐含波动率、历史波动率、时间价值、内在价值
- **风险**：Delta、Gamma、Vega、Theta、Rho
- **合约**：合约代码、类型、乘数、到期日

### 4. Greeks计算 (app.js)
```javascript
calculateDelta(S, K, T, sigma, r, optionType)    // Delta
calculateGamma(S, K, T, sigma, r)                 // Gamma
calculateVega(S, K, T, sigma, r)                  // Vega
calculateTheta(S, K, T, sigma, r, optionType)    // Theta
calculateRho(S, K, T, sigma, r, optionType)      // Rho
```

### 5. 期权选择 (app.js)
```javascript
selectOption(orderId)    // 选择单个期权
updateOptionInfo()       // 显示期权详情卡片
drawSelectedOptionChart()// 绘制期权K线图
```

### 6. 期权组合 (app.js)
```javascript
addToPortfolio()         // 打开添加期权对话框
confirmAddPortfolio()    // 确认添加到组合
removeFromPortfolio(idx) // 从组合删除
clearPortfolio()         // 清空整个组合
updatePortfolioTable()   // 更新组合列表
drawPortfolioChart()     // 绘制组合损益图
```

### 7. 价格预测 (app.js)
```javascript
updatePricePrediction()  // 计算价格预测
drawPredictionChart()    // 绘制概率分布
```

## 🔧 核心类详解

### BlackScholesCalculator (calculator.js)
用于计算期权定价和Greeks指标

```javascript
const calc = new BlackScholesCalculator(S, K, T, sigma, r);
calc.callPrice()     // 看涨期权价格
calc.putPrice()      // 看跌期权价格
calc.delta('C')      // Delta
calc.gamma()         // Gamma
calc.vega()          // Vega
calc.theta('C')      // Theta
calc.rho('C')        // Rho
calc.getAllGreeks('C') // 获取所有Greeks
```

### ImpliedVolatilityCalculator (calculator.js)
计算隐含波动率

```javascript
const iv_calc = new ImpliedVolatilityCalculator(S, K, T, marketPrice, r);
iv_calc.calculateBisection()       // 使用二分法
iv_calc.calculateNewtonRaphson()   // 使用牛顿-拉夫逊法
```

### PricePredictionCalculator (calculator.js)
基于对数正态分布的价格预测

```javascript
const predictor = new PricePredictionCalculator(prices, daysToPredict);
predictor.predictPrice()             // 预测价格
predictor.predictStdDev()            // 标准差
predictor.calculateUpProbability()   // 上升概率
predictor.calculateConfidenceInterval(0.95) // 置信区间
predictor.generateDistribution()     // 生成概率分布数据
```

## 📊 数据流向

```
CSV文件
  ↓
Papa Parse解析
  ↓
data对象存储
  ├─ optionInfo[]      (期权信息)
  ├─ optionPrice[]     (期权价格)
  ├─ etfPrice[]        (ETF价格)
  ├─ portfolio[]       (当前组合)
  ├─ selectedOption    (选中期权)
  └─ currentTab        (当前标签)
  ↓
数据处理和计算
  ├─ BlackScholesCalculator → Greeks
  ├─ ImpliedVolatilityCalculator → IV
  └─ PricePredictionCalculator → 预测
  ↓
ECharts绘制图表
  ├─ etfChart          (ETF K线)
  ├─ selectedChart     (期权K线)
  ├─ portfolioChart    (损益图)
  └─ predictionChart   (概率分布)
```

## 🎨 UI布局

### 页面结构
```
Header (标题)
├─ Main Grid (1列 → 2列切换)
│  ├─ ETF K线图 (左)
│  ├─ T型报价表 (右)
│  ├─ 期权详情与损益 (全宽)
│  └─ 价格预测 (全宽)
└─ Modals
   └─ 添加到组合对话框
```

### 响应式设计
- 桌面 (> 1200px)：2列布局
- 平板 (768px - 1200px)：1列布局
- 手机 (< 768px)：单列堆叠

## 📋 配置参数 (config.js)

### 交易参数
```javascript
CONFIG.riskFreeRate = 0.03  // 3%无风险利率
CONFIG.tradingDays = 252    // 年交易天数
```

### 显示参数
```javascript
CONFIG.decimalPlaces.price = 4
CONFIG.decimalPlaces.volatility = 2
CONFIG.decimalPlaces.greeks = 4
```

### 图表配置
```javascript
CONFIG.chartHeight = 400
CONFIG.chartLineColor = '#667eea'
CONFIG.upColor = '#f23645'
CONFIG.downColor = '#22ab94'
```

## 🔌 外部依赖

- **ECharts** - 图表绘制库
- **PapaParse** - CSV文件解析
- **jstat** - 统计计算库（可选）

## 📝 使用示例

### 基本工作流
```javascript
// 1. 数据加载
loadSampleData();

// 2. 选择ETF和月份
document.getElementById('etfSelect').value = '588080.XSHG';
document.getElementById('monthSelect').value = '202606';
updateOptionTable();

// 3. 选择期权
selectOption('10010367');

// 4. 添加到组合
addToPortfolio();

// 5. 查看预测
updatePricePrediction();
```

### 计算例子
```javascript
// 计算期权Greeks
const calc = new BlackScholesCalculator(1.5, 1.4, 30/365, 0.2, 0.03);
console.log('看涨价格:', calc.callPrice());
console.log('Delta:', calc.delta('C'));
console.log('Gamma:', calc.gamma());

// 计算隐含波动率
const ivCalc = new ImpliedVolatilityCalculator(1.5, 1.4, 30/365, 0.05, 0.03);
console.log('隐含波动率:', ivCalc.calculateBisection());

// 价格预测
const prices = [1.45, 1.46, 1.47, 1.48, 1.49];
const pred = new PricePredictionCalculator(prices, 5);
console.log('预测价格:', pred.predictPrice());
console.log('上升概率:', pred.calculateUpProbability());
```

## 🐛 调试

### 浏览器控制台
```javascript
// 查看数据
console.log(data);

// 查看当前图表实例
console.log(etfChart);
console.log(portfolioChart);

// 手动计算
calculateHV(data.optionPrice);
calculateIV(0.05, 1.4, 1.5);
```

### 常见问题排查
1. 图表不显示 → 检查ECharts是否加载
2. 数据为空 → 检查CSV格式和字段名
3. 计算报错 → 检查浏览器控制台错误信息

## 📦 打包和部署

### 文件清单
- index.html (必须)
- app.js (必须)
- config.js (必须)
- calculator.js (必须)
- CSS (内联于HTML)
- CSV数据文件

### 部署步骤
1. 确保所有JavaScript文件在同一目录
2. CSV文件放在项目根目录
3. 使用HTTP服务器提供服务
4. 在浏览器中打开 http://localhost/index.html

---

**版本**: 1.0.0
**最后更新**: 2026年6月4日
