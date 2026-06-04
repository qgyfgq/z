# 期权分析工具 - 快速参考

## 🚀 快速开始

1. **打开应用**
   ```
   双击 index.html 或在浏览器中打开 http://localhost:8000/index.html
   ```

2. **加载数据**
   - 点击"📋 使用示例数据"（推荐新手）
   - 或上传 CSV 文件后点击"📂 加载数据"

3. **开始分析**
   - 选择ETF标的和期权月份
   - 点击期权名称查看详情
   - 添加到组合并查看损益图

## 📊 四种T型报价模式

| 模式 | 显示内容 | 用途 |
|------|---------|------|
| 行情 | 现价、涨跌幅、成交量 | 查看实时行情 |
| 价值 | IV、HV、时间价值、内在价值 | 分析期权定价 |
| 风险 | Delta、Gamma、Vega、Theta、Rho | 风险管理 |
| 合约 | 代码、类型、乘数、到期日 | 查看合约信息 |

## 📈 主要图表

| 图表 | 说明 | 功能 |
|------|------|------|
| ETF K线图 | 标的资产的日K线 | 基础面分析 |
| 期权K线图 | 单个期权的价格走势 | 期权价格分析 |
| 组合损益图 | 期权组合的P&L | 风险收益评估 |
| 概率分布图 | 未来价格的预测分布 | 价格预测 |

## 🎯 常用期权策略

### 1. 看涨策略 (看好后市)
- **买入看涨**: 1个看涨期权（买入）
- **看涨差价**: 1个看涨（买入）+ 1个高行权价看涨（卖出）

### 2. 看跌策略 (看空后市)
- **买入看跌**: 1个看跌期权（买入）
- **看跌差价**: 1个看跌（卖出）+ 1个低行权价看跌（买入）

### 3. 中性策略 (预期大幅波动)
- **跨式**: 相同行权价的看涨+看跌（各买入）
- **宽跨式**: 高行权价看涨+低行权价看跌（各买入）

### 4. 收益策略 (产生收入)
- **铁鹰**: 看涨差价+看跌差价
- **日历差**: 买入远月+卖出近月

## 💰 Greeks风险指标速查表

| Greek | 含义 | 范围 | 解释 |
|-------|------|------|------|
| Delta | 价格敏感度 | [-1, 1] | 标的上升1元，期权价格变化 |
| Gamma | Delta敏感度 | [0, +∞) | Delta变化速度，高表示敏感 |
| Vega | 波动率敏感度 | [-∞, +∞) | 波动率上升1%，期权价格变化 |
| Theta | 时间衰减 | [-∞, +∞) | 每天时间衰减，通常负数 |
| Rho | 利率敏感度 | [-∞, +∞) | 利率上升1%，期权价格变化 |

### Greeks使用场景
- **Delta** → 对冲风险、选择月份
- **Gamma** → 判断价格波动加速
- **Vega** → 预期波动率变化
- **Theta** → 评估时间成本
- **Rho** → 长期持仓考量（影响小）

## 🔢 关键公式

### Black-Scholes定价
```
C = S*N(d1) - K*e^(-rT)*N(d2)
P = K*e^(-rT)*N(-d2) - S*N(-d1)

其中:
d1 = [ln(S/K) + (r + σ²/2)*T] / (σ*√T)
d2 = d1 - σ*√T
```

### 隐含波动率 (IV)
```
使用Black-Scholes的反函数求解
当市场价格给定时，反推出的σ
```

### 历史波动率 (HV)
```
HV = 日收益率标准差 * √252
```

### 内在价值
```
看涨: max(S - K, 0)
看跌: max(K - S, 0)
```

### 时间价值
```
时间价值 = 期权价格 - 内在价值
```

## 🎮 快捷操作

| 操作 | 方法 |
|------|------|
| 切换ETF | 下拉菜单选择 |
| 切换月份 | 下拉菜单选择 |
| 切换报价模式 | 点击标签页 |
| 选择期权 | 点击表格中的期权名称 |
| 添加到组合 | 选择后点击"➕ 添加到组合" |
| 删除组合项 | 点击"删除"按钮 |
| 清空组合 | 点击"🗑️ 清空组合" |
| 查看预测 | 切换天数并查看图表 |

## 🔍 数据导入格式

### option_info.csv 必需字段
- `symbol` - 期权名称
- `underlying_symbol` - 标的代码
- `strike_price` - 行权价
- `maturity_date` - 到期日期 (YYYY-MM-DD)
- `option_type` - C(看涨)/P(看跌)
- `exercise_type` - E(欧式)/A(美式)
- `contract_multiplier` - 合约乘数
- `order_book_id` - 交易所ID

### option_price.csv 必需字段
- `date` - 交易日期 (YYYY-MM-DD)
- `code` - 期权代码
- `open` - 开盘价
- `close` - 收盘价
- `high` - 最高价
- `low` - 最低价
- `volume` - 成交量
- `money` - 成交金额
- `position` - 持仓量

### etf_price.csv 必需字段
- `time` - 交易日期 (YYYY-MM-DD)
- `code` - ETF代码
- `open` - 开盘价
- `close` - 收盘价
- `high` - 最高价
- `low` - 最低价
- `volume` - 成交量
- `money` - 成交金额

## 📱 界面配置

### 默认配置 (config.js)
```javascript
riskFreeRate: 0.03      // 3%无风险利率
tradingDays: 252        // 年交易天数
daysPerYear: 365        // 日历年
confidenceLevel: 0.95   // 95%置信区间
```

### 自定义颜色
```javascript
CONFIG.chartLineColor = '#667eea'  // 图表线条
CONFIG.upColor = '#f23645'          // 上涨颜色
CONFIG.downColor = '#22ab94'        // 下跌颜色
```

## ⚠️ 常见问题快速解决

### Q: 图表显示不了？
A: 
- 检查浏览器是否支持 ECharts
- 刷新页面 (Ctrl+F5)
- 检查数据是否加载成功

### Q: 计算结果为什么是NaN？
A:
- 确认数据格式正确
- 检查行权价和现价是否为正数
- 打开浏览器控制台查看错误信息

### Q: 隐含波动率显示为 20%？
A:
- 市场价格可能太低或太高
- 这是默认值，表示计算失败
- 检查期权价格数据是否正确

### Q: 为什么看不到所有期权？
A:
- 确认已选择正确的ETF和月份
- 数据中可能没有该月份的合约
- 尝试"使用示例数据"看是否正常

### Q: 组合损益图不更新？
A:
- 确认已添加至少一个期权
- 刷新页面重新加载
- 检查浏览器控制台是否有错误

## 🎓 学习资源

### 期权基础
- [期权定价模型](https://en.wikipedia.org/wiki/Black%E2%80%93Scholes_model)
- [Greeks Greeks](https://en.wikipedia.org/wiki/Greeks_(finance))
- [期权策略指南](https://www.investopedia.com/terms/o/option.asp)

### 相关书籍
- 《期权、期货及其他衍生品》- John C. Hull
- 《算法交易》- Ernie Chan
- 《量化交易》- Ernest Chan

## 💻 开发环境

### 需要的工具
- 现代浏览器 (Chrome, Firefox, Safari, Edge)
- 文本编辑器 (VS Code, Sublime, Atom)
- Python 3.x (用于本地服务器)

### 启动本地服务器
```bash
# Windows - 进入项目文件夹后
python -m http.server 8000

# Linux/Mac
python3 -m http.server 8000

# 然后访问 http://localhost:8000
```

## 📞 技术支持

### 调试技巧
1. 打开浏览器开发者工具 (F12)
2. 查看 Console 标签页的错误信息
3. 在 Application 标签页查看本地存储
4. 在 Network 标签页检查文件加载

### 常用命令
```javascript
// 查看当前数据
console.log(data);

// 查看配置
console.log(CONFIG);

// 手动计算IV
const iv = calculateIV(0.05, 1.4, 1.5);
console.log('隐含波动率:', iv);

// 获取当前ETF价格
const price = getLatestETFPrice();
console.log('ETF价格:', price);
```

---

**快速参考卡 v1.0** | 最后更新: 2026年6月4日
