// 全局数据存储
const data = {
    optionInfo: [],
    optionPrice: [],
    etfPrice: [],
    portfolio: [],
    selectedOption: null,
    currentTab: 'market'
};

let etfChart = null;
let selectedChart = null;
let portfolioChart = null;
let predictionChart = null;

// ==================== 数据加载模块 ====================

async function loadDataFromFiles() {
    const optionInfoFile = document.getElementById('optionInfoFile').files[0];
    const optionPriceFile = document.getElementById('optionPriceFile').files[0];
    const etfPriceFile = document.getElementById('etfPriceFile').files[0];
    
    // 检查文件是否已选择
    if (!optionInfoFile && !optionPriceFile && !etfPriceFile) {
        updateDataStatus('❌ 请先选择文件', true);
        return;
    }
    
    try {
        updateDataStatus('⏳ 正在加载文件...', false);
        
        if (optionInfoFile) {
            const text = await optionInfoFile.text();
            data.optionInfo = Papa.parse(text).data;
        }
        
        if (optionPriceFile) {
            const text = await optionPriceFile.text();
            data.optionPrice = Papa.parse(text).data;
        }
        
        if (etfPriceFile) {
            const text = await etfPriceFile.text();
            data.etfPrice = Papa.parse(text).data;
        }
        
        initializeUI();
        updateDataStatus('✅ 数据加载成功！');
    } catch (error) {
        updateDataStatus('❌ 数据加载失败: ' + error.message, true);
        console.error('数据加载错误:', error);
    }
}

async function loadData() {
    // 保留为兼容性函数
    loadDataFromFiles();
}

async function loadSampleData() {
    try {
        // 从CSV文件加载数据
        const optionInfoRes = await fetch('../option_info.csv');
        const optionPriceRes = await fetch('../option_price.csv');
        const etfPriceRes = await fetch('../etf_price.csv');
        
        data.optionInfo = Papa.parse(await optionInfoRes.text()).data;
        data.optionPrice = Papa.parse(await optionPriceRes.text()).data;
        data.etfPrice = Papa.parse(await etfPriceRes.text()).data;
        
        initializeUI();
        updateDataStatus();
    } catch (error) {
        // 如果无法从服务器加载，生成示例数据
        generateSampleData();
    }
}

function generateSampleData() {
    // 生成示例期权数据
    const underlyings = ['588080.XSHG'];
    const months = ['2606', '2607', '2608'];
    const strikes = [1.25, 1.30, 1.35, 1.40, 1.45, 1.50];
    
    data.optionInfo = [];
    data.optionPrice = [];
    
    let idx = 36;
    underlyings.forEach(underlying => {
        months.forEach(month => {
            strikes.forEach(strike => {
                // 期权信息
                const optInfo = {
                    symbol: `科创板50购${month.slice(0, 2)}月${(strike * 100).toFixed(0)}`,
                    underlying_symbol: underlying,
                    maturity_date: `2026-${month.slice(0, 2)}-24`,
                    option_type: 'C',
                    exercise_type: 'E',
                    contract_multiplier: 10000,
                    strike_price: strike,
                    order_book_id: `1001${idx.toString().padStart(4, '0')}`,
                    trading_code: `${underlying}C${month}M${(strike * 100).toFixed(0)}`
                };
                data.optionInfo.push(optInfo);
                
                // 期权价格数据（多天数据）
                let price = strike * 0.1;
                for (let day = 0; day < 30; day++) {
                    const date = new Date(2026, 3, 13 + day);
                    data.optionPrice.push({
                        date: date.toISOString().split('T')[0],
                        code: `1001${idx.toString().padStart(4, '0')}.XSHG`,
                        open: parseFloat((price * (0.95 + Math.random() * 0.1)).toFixed(4)),
                        close: parseFloat((price * (0.95 + Math.random() * 0.1)).toFixed(4)),
                        high: parseFloat((price * (1.05 + Math.random() * 0.05)).toFixed(4)),
                        low: parseFloat((price * (0.85 + Math.random() * 0.05)).toFixed(4)),
                        volume: Math.floor(Math.random() * 1000 + 100),
                        money: Math.floor(Math.random() * 100000 + 10000),
                        position: Math.floor(Math.random() * 10000 + 1000)
                    });
                    price = data.optionPrice[data.optionPrice.length - 1].close;
                }
                
                idx++;
            });
        });
    });
    
    // ETF价格数据
    data.etfPrice = [];
    let etfPrice = 1.45;
    for (let day = 0; day < 30; day++) {
        const date = new Date(2026, 3, 15 + day);
        if (date.getDay() !== 0 && date.getDay() !== 6) {
            data.etfPrice.push({
                time: date.toISOString().split('T')[0],
                code: '588080.XSHG',
                open: parseFloat((etfPrice * (0.98 + Math.random() * 0.04)).toFixed(4)),
                close: parseFloat((etfPrice * (0.98 + Math.random() * 0.04)).toFixed(4)),
                high: parseFloat((etfPrice * (1.02 + Math.random() * 0.02)).toFixed(4)),
                low: parseFloat((etfPrice * (0.95 + Math.random() * 0.02)).toFixed(4)),
                volume: Math.floor(Math.random() * 1e9 + 5e8),
                money: Math.floor(Math.random() * 1.5e9 + 1e9)
            });
            etfPrice = data.etfPrice[data.etfPrice.length - 1].close;
        }
    }
    
    initializeUI();
    updateDataStatus();
}

function initializeUI() {
    // 获取唯一的ETF标的
    const etfCodes = [...new Set(data.optionInfo.map(opt => opt.underlying_symbol))];
    const etfSelect = document.getElementById('etfSelect');
    etfSelect.innerHTML = '';
    etfCodes.forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = code;
        etfSelect.appendChild(option);
    });
    
    if (etfCodes.length > 0) {
        etfSelect.value = etfCodes[0];
        updateETFChart();
    }
    
    // 获取唯一的月份
    const months = [...new Set(data.optionInfo.map(opt => 
        opt.maturity_date.slice(0, 7).replace('-', '')
    ))].sort();
    
    const monthSelect = document.getElementById('monthSelect');
    monthSelect.innerHTML = '';
    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `${month.slice(0, 4)}-${month.slice(4, 6)}`;
        monthSelect.appendChild(option);
    });
    
    if (months.length > 0) {
        monthSelect.value = months[0];
        updateOptionTable();
    }
}

function updateDataStatus(message = null, isError = false) {
    const statusEl = document.getElementById('dataStatus');
    
    if (message) {
        statusEl.textContent = message;
        statusEl.style.color = isError ? '#d32f2f' : '#1976d2';
    } else {
        const status = `✅ 已加载数据：期权合约 ${data.optionInfo.length} 条，期权价格 ${data.optionPrice.length} 条，ETF价格 ${data.etfPrice.length} 条`;
        statusEl.textContent = status;
        statusEl.style.color = '#1976d2';
    }
}

// ==================== 图表模块 ====================

function updateETFChart() {
    const etfCode = document.getElementById('etfSelect').value;
    if (!etfCode) return;
    
    const etfData = data.etfPrice.filter(d => d.code === etfCode).sort((a, b) => 
        new Date(a.time) - new Date(b.time)
    );
    
    if (etfData.length === 0) return;
    
    const dates = etfData.map(d => d.time);
    const opens = etfData.map(d => parseFloat(d.open) || 0);
    const closes = etfData.map(d => parseFloat(d.close) || 0);
    const highs = etfData.map(d => parseFloat(d.high) || 0);
    const lows = etfData.map(d => parseFloat(d.low) || 0);
    const volumes = etfData.map(d => parseInt(d.volume) || 0);
    
    // 构建标准OHLC格式 [open, close, low, high]
    const ohlcData = opens.map((o, i) => [o, closes[i], lows[i], highs[i]]);
    
    // 计算移动平均线
    const ma5 = calculateMA(closes, 5);
    const ma10 = calculateMA(closes, 10);
    const ma20 = calculateMA(closes, 20);
    
    // 归一化成交量用于显示
    const maxVolume = Math.max(...volumes);
    const normalizedVolumes = volumes.map(v => v / maxVolume * 100);
    
    const chartDom = document.getElementById('etfChart');
    if (!etfChart) {
        etfChart = echarts.init(chartDom);
    }
    
    const option = {
        title: { 
            text: `${etfCode} 技术面分析`, 
            left: 'center',
            textStyle: {
                fontSize: 14,
                fontWeight: 600,
                color: '#333'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            borderColor: '#ddd',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            textStyle: { color: '#333' },
            formatter: function(params) {
                let res = `<div style="padding:8px;"><strong>${params[0]?.axisValue}</strong><br/>`;
                params.forEach(param => {
                    if (param.componentSubType === 'candlestick') {
                        res += `K线：开${param.value[0].toFixed(4)} 高${param.value[3].toFixed(4)} 低${param.value[2].toFixed(4)} 收${param.value[1].toFixed(4)}<br/>`;
                    } else {
                        res += `<span style="color:${param.color}">●</span> ${param.name}：${typeof param.value === 'number' ? param.value.toFixed(4) : param.value}<br/>`;
                    }
                });
                return res + '</div>';
            }
        },
        backgroundColor: '#fafbfc',
        grid: [
            { left: 60, right: 20, top: 80, height: '65%' },
            { left: 60, right: 20, top: '73%', height: '12%' }
        ],
        xAxis: [
            {
                type: 'category',
                data: dates,
                boundaryGap: true,
                gridIndex: 0,
                axisLine: { lineStyle: { color: '#ccc' } },
                axisLabel: { color: '#666', fontSize: 10 },
                splitLine: { show: false }
            },
            {
                type: 'category',
                data: dates,
                gridIndex: 1,
                boundaryGap: true,
                axisLine: { lineStyle: { color: '#ccc' } },
                axisLabel: { show: false }
            }
        ],
        yAxis: [
            {
                type: 'value',
                gridIndex: 0,
                scale: true,
                axisLine: { show: false },
                axisLabel: { color: '#666', fontSize: 10 },
                splitLine: { lineStyle: { color: '#f0f0f0' } }
            },
            {
                type: 'value',
                gridIndex: 1,
                scale: false,
                axisLine: { show: false },
                axisLabel: { show: false },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: 'K线',
                type: 'candlestick',
                data: ohlcData,
                xAxisIndex: 0,
                yAxisIndex: 0,
                itemStyle: {
                    color: '#f23645',
                    color0: '#22ab94',
                    borderColor: '#f23645',
                    borderColor0: '#22ab94',
                    borderWidth: 1
                },
                emphasis: {
                    itemStyle: {
                        color: '#ff6b7a',
                        color0: '#30d89f'
                    }
                }
            },
            {
                name: 'MA5',
                type: 'line',
                data: ma5,
                xAxisIndex: 0,
                yAxisIndex: 0,
                smooth: true,
                lineStyle: { color: '#ff7f00', width: 1.5 },
                symbol: 'none',
                itemStyle: { opacity: 0 }
            },
            {
                name: 'MA10',
                type: 'line',
                data: ma10,
                xAxisIndex: 0,
                yAxisIndex: 0,
                smooth: true,
                lineStyle: { color: '#00d4ff', width: 1.5 },
                symbol: 'none',
                itemStyle: { opacity: 0 }
            },
            {
                name: 'MA20',
                type: 'line',
                data: ma20,
                xAxisIndex: 0,
                yAxisIndex: 0,
                smooth: true,
                lineStyle: { color: '#8b5cf6', width: 1.5 },
                symbol: 'none',
                itemStyle: { opacity: 0 }
            },
            {
                name: '成交量',
                type: 'bar',
                data: normalizedVolumes,
                xAxisIndex: 1,
                yAxisIndex: 1,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(102, 126, 234, 0.5)' },
                        { offset: 1, color: 'rgba(102, 126, 234, 0.1)' }
                    ])
                },
                emphasis: {
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(102, 126, 234, 0.8)' },
                            { offset: 1, color: 'rgba(102, 126, 234, 0.3)' }
                        ])
                    }
                }
            }
        ]
    };
    
    etfChart.setOption(option);
}

// 计算移动平均线
function calculateMA(data, period) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j];
            }
            result.push(sum / period);
        }
    }
    return result;
}

function updateOptionTable() {
    const etfCode = document.getElementById('etfSelect').value;
    const month = document.getElementById('monthSelect').value;
    const tab = data.currentTab;
    
    if (!etfCode || !month) return;
    
    // 过滤期权合约
    const options = data.optionInfo.filter(opt => 
        opt.underlying_symbol === etfCode && 
        opt.maturity_date.includes(month.slice(0, 4) + '-' + month.slice(4, 6))
    );
    
    // 按行权价分组（看涨和看跌并列）
    const grouped = {};
    options.forEach(opt => {
        const strike = opt.strike_price;
        if (!grouped[strike]) {
            grouped[strike] = { C: null, P: null };
        }
        grouped[strike][opt.option_type] = opt;
    });
    
    const strikes = Object.keys(grouped).sort((a, b) => parseFloat(a) - parseFloat(b));
    
    // 获取当前ETF价格和时间
    const etfData = data.etfPrice.filter(d => d.code === etfCode)
        .sort((a, b) => new Date(b.time) - new Date(a.time));
    const spotPrice = etfData.length > 0 ? parseFloat(etfData[0].close) : 0;
    const maturityDate = options[0]?.maturity_date;
    const daysToExp = Math.max(0, (new Date(maturityDate) - new Date()) / (1000 * 60 * 60 * 24));
    const r = 0.03; // 无风险利率
    
    // 设置表头
    let headers = [];
    if (tab === 'market') {
        headers = ['行权价', '看涨', '买量', '现价', '涨跌幅', '成交量', '看跌', '买量', '现价', '涨跌幅', '成交量'];
    } else if (tab === 'value') {
        headers = ['行权价', '看涨', 'IV%', 'HV%', '时间价值', '内在价值', '看跌', 'IV%', 'HV%', '时间价值', '内在价值'];
    } else if (tab === 'risk') {
        headers = ['行权价', '看涨', 'Delta', 'Gamma', 'Vega', 'Theta', '看跌', 'Delta', 'Gamma', 'Vega', 'Theta'];
    } else if (tab === 'contract') {
        headers = ['行权价', '看涨代码', '类型', '乘数', '到期日', '看跌代码', '类型', '乘数', '到期日'];
    }
    
    document.getElementById('tableHeader').innerHTML = headers
        .map(h => `<th>${h}</th>`).join('');
    
    // 填充表格数据
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    strikes.forEach(strike => {
        const callOpt = grouped[strike].C;
        const putOpt = grouped[strike].P;
        
        const callPrice = callOpt ? getLatestPrice(callOpt.order_book_id) : null;
        const putPrice = putOpt ? getLatestPrice(putOpt.order_book_id) : null;
        
        const row = document.createElement('tr');
        let cells = '';
        
        cells += `<td style="font-weight: bold; text-align: center;">${strike}</td>`;
        
        if (tab === 'market') {
            // 行情模式
            cells += `<td style="cursor: pointer; color: #667eea;" onclick="selectOption('${callOpt?.order_book_id}')">${callOpt?.symbol || '-'}</td>`;
            cells += `<td>${callPrice?.volume ? Math.floor(callPrice.volume / 100) : '-'}</td>`;
            cells += `<td class="price-up">${callPrice?.close?.toFixed(4) || '-'}</td>`;
            cells += `<td ${callPrice?.change_pct_close >= 0 ? "class='price-up'" : "class='price-down'"}>${callPrice?.change_pct_close?.toFixed(2) || '-'}%</td>`;
            cells += `<td>${callPrice?.volume || '-'}</td>`;
            
            cells += `<td style="cursor: pointer; color: #667eea;" onclick="selectOption('${putOpt?.order_book_id}')">${putOpt?.symbol || '-'}</td>`;
            cells += `<td>${putPrice?.volume ? Math.floor(putPrice.volume / 100) : '-'}</td>`;
            cells += `<td class="price-up">${putPrice?.close?.toFixed(4) || '-'}</td>`;
            cells += `<td ${putPrice?.change_pct_close >= 0 ? "class='price-up'" : "class='price-down'"}>${putPrice?.change_pct_close?.toFixed(2) || '-'}%</td>`;
            cells += `<td>${putPrice?.volume || '-'}</td>`;
        } else if (tab === 'value') {
            // 价值模式
            if (callOpt && callPrice) {
                const callIV = calculateIV(callPrice.close, callOpt.strike_price, spotPrice);
                const callHV = calculateHV(data.optionPrice.filter(p => p.code === callOpt.order_book_id + '.XSHG'));
                const callIntrinsic = Math.max(0, spotPrice - callOpt.strike_price) * callOpt.contract_multiplier;
                const callTime = Math.max(0, callPrice.close * callOpt.contract_multiplier - callIntrinsic);
                
                cells += `<td style="cursor: pointer; color: #667eea;" onclick="selectOption('${callOpt.order_book_id}')">${callOpt.symbol}</td>`;
                cells += `<td>${(callIV * 100).toFixed(2)}</td>`;
                cells += `<td>${(callHV * 100).toFixed(2)}</td>`;
                cells += `<td>${callTime.toFixed(2)}</td>`;
                cells += `<td>${callIntrinsic.toFixed(2)}</td>`;
            } else {
                cells += `<td colspan="5">-</td>`;
            }
            
            if (putOpt && putPrice) {
                const putIV = calculateIV(putPrice.close, putOpt.strike_price, spotPrice);
                const putHV = calculateHV(data.optionPrice.filter(p => p.code === putOpt.order_book_id + '.XSHG'));
                const putIntrinsic = Math.max(0, putOpt.strike_price - spotPrice) * putOpt.contract_multiplier;
                const putTime = Math.max(0, putPrice.close * putOpt.contract_multiplier - putIntrinsic);
                
                cells += `<td style="cursor: pointer; color: #667eea;" onclick="selectOption('${putOpt.order_book_id}')">${putOpt.symbol}</td>`;
                cells += `<td>${(putIV * 100).toFixed(2)}</td>`;
                cells += `<td>${(putHV * 100).toFixed(2)}</td>`;
                cells += `<td>${putTime.toFixed(2)}</td>`;
                cells += `<td>${putIntrinsic.toFixed(2)}</td>`;
            } else {
                cells += `<td colspan="5">-</td>`;
            }
        } else if (tab === 'risk') {
            // 风险模式 - Greeks
            if (callOpt && callPrice) {
                const callIV = calculateIV(callPrice.close, callOpt.strike_price, spotPrice);
                const delta = calculateDelta(spotPrice, callOpt.strike_price, daysToExp / 365, callIV, r, 'C');
                const gamma = calculateGamma(spotPrice, callOpt.strike_price, daysToExp / 365, callIV, r);
                const vega = calculateVega(spotPrice, callOpt.strike_price, daysToExp / 365, callIV, r);
                const theta = calculateTheta(spotPrice, callOpt.strike_price, daysToExp / 365, callIV, r, 'C');
                
                cells += `<td style="cursor: pointer; color: #667eea;" onclick="selectOption('${callOpt.order_book_id}')">${callOpt.symbol}</td>`;
                cells += `<td>${delta.toFixed(3)}</td>`;
                cells += `<td>${gamma.toFixed(5)}</td>`;
                cells += `<td>${vega.toFixed(3)}</td>`;
                cells += `<td>${theta.toFixed(5)}</td>`;
            } else {
                cells += `<td colspan="5">-</td>`;
            }
            
            if (putOpt && putPrice) {
                const putIV = calculateIV(putPrice.close, putOpt.strike_price, spotPrice);
                const delta = calculateDelta(spotPrice, putOpt.strike_price, daysToExp / 365, putIV, r, 'P');
                const gamma = calculateGamma(spotPrice, putOpt.strike_price, daysToExp / 365, putIV, r);
                const vega = calculateVega(spotPrice, putOpt.strike_price, daysToExp / 365, putIV, r);
                const theta = calculateTheta(spotPrice, putOpt.strike_price, daysToExp / 365, putIV, r, 'P');
                
                cells += `<td style="cursor: pointer; color: #667eea;" onclick="selectOption('${putOpt.order_book_id}')">${putOpt.symbol}</td>`;
                cells += `<td>${delta.toFixed(3)}</td>`;
                cells += `<td>${gamma.toFixed(5)}</td>`;
                cells += `<td>${vega.toFixed(3)}</td>`;
                cells += `<td>${theta.toFixed(5)}</td>`;
            } else {
                cells += `<td colspan="5">-</td>`;
            }
        } else if (tab === 'contract') {
            // 合约模式
            if (callOpt) {
                cells += `<td style="cursor: pointer; color: #667eea;" onclick="selectOption('${callOpt.order_book_id}')">${callOpt.trading_code}</td>`;
                cells += `<td>${callOpt.option_type === 'C' ? '看涨' : '看跌'}</td>`;
                cells += `<td>${callOpt.contract_multiplier}</td>`;
                cells += `<td>${callOpt.maturity_date}</td>`;
            } else {
                cells += `<td colspan="4">-</td>`;
            }
            
            if (putOpt) {
                cells += `<td style="cursor: pointer; color: #667eea;" onclick="selectOption('${putOpt.order_book_id}')">${putOpt.trading_code}</td>`;
                cells += `<td>${putOpt.option_type === 'C' ? '看涨' : '看跌'}</td>`;
                cells += `<td>${putOpt.contract_multiplier}</td>`;
                cells += `<td>${putOpt.maturity_date}</td>`;
            } else {
                cells += `<td colspan="4">-</td>`;
            }
        }
        
        row.innerHTML = cells;
        tbody.appendChild(row);
    });
}

function getLatestPrice(orderBookId) {
    const prices = data.optionPrice.filter(p => p.code === orderBookId + '.XSHG')
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    return prices[0] || null;
}

function selectOption(orderId) {
    if (!orderId) return;
    
    const opt = data.optionInfo.find(o => o.order_book_id === orderId);
    const prices = data.optionPrice.filter(p => p.code === orderId + '.XSHG')
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    data.selectedOption = { opt, prices };
    
    // 更新已选期权信息显示
    if (opt) {
        const latestPrice = prices[prices.length - 1];
        document.getElementById('selectedOptInfo').innerHTML = `
            <p><strong>合约代码:</strong> ${opt.trading_code}</p>
            <p><strong>期权类型:</strong> ${opt.option_type === 'C' ? '看涨(Call)' : '看跌(Put)'}</p>
            <p><strong>行权价:</strong> ${opt.strike_price}</p>
            <p><strong>当前价:</strong> ${latestPrice?.close?.toFixed(4) || '-'}</p>
            <p><strong>持仓量:</strong> ${latestPrice?.position || 0}</p>
            <p><strong>成交量:</strong> ${latestPrice?.volume || 0}</p>
            <p><strong>到期日期:</strong> ${opt.maturity_date}</p>
            <p><strong>合约乘数:</strong> ${opt.contract_multiplier}</p>
        `;
    }
    
    // 更新期权详情
    updateOptionInfo();
    
    // 绘制期权K线
    drawSelectedOptionChart();
}

function updateOptionInfo() {
    if (!data.selectedOption) return;
    
    const opt = data.selectedOption.opt;
    const latestPrice = data.selectedOption.prices[data.selectedOption.prices.length - 1];
    const etfPrice = getLatestETFPrice();
    
    const iv = calculateIV(latestPrice.close, opt.strike_price, etfPrice);
    const hv = calculateHV(data.selectedOption.prices);
    const intrinsicValue = Math.max(0, etfPrice - opt.strike_price) * opt.contract_multiplier;
    const timeValue = Math.max(0, (latestPrice.close || 0) - intrinsicValue / opt.contract_multiplier) * opt.contract_multiplier;
    
    document.getElementById('optionInfo').innerHTML = `
        <div class="info-card">
            <label>合约代码</label>
            <div class="value">${opt.trading_code}</div>
        </div>
        <div class="info-card">
            <label>行权价</label>
            <div class="value">${opt.strike_price.toFixed(2)}</div>
        </div>
        <div class="info-card">
            <label>当前价</label>
            <div class="value">${latestPrice?.close?.toFixed(4) || '-'}</div>
        </div>
        <div class="info-card">
            <label>隐含波动率</label>
            <div class="value">${(iv * 100).toFixed(2)}%</div>
        </div>
        <div class="info-card">
            <label>历史波动率</label>
            <div class="value">${(hv * 100).toFixed(2)}%</div>
        </div>
        <div class="info-card">
            <label>到期时间</label>
            <div class="value">${opt.maturity_date}</div>
        </div>
        <div class="info-card">
            <label>内在价值</label>
            <div class="value">${intrinsicValue.toFixed(2)}</div>
        </div>
        <div class="info-card">
            <label>时间价值</label>
            <div class="value">${Math.max(0, timeValue).toFixed(2)}</div>
        </div>
        <div class="info-card">
            <label>持仓量</label>
            <div class="value">${latestPrice?.position || 0}</div>
        </div>
        <div class="info-card">
            <label>成交量</label>
            <div class="value">${latestPrice?.volume || 0}</div>
        </div>
        <div class="info-card">
            <label>合约类型</label>
            <div class="value">${opt.option_type === 'C' ? '看涨' : '看跌'}</div>
        </div>
        <div class="info-card">
            <label>行权类型</label>
            <div class="value">${opt.exercise_type === 'E' ? '欧式' : '美式'}</div>
        </div>
    `;
}

function drawSelectedOptionChart() {
    if (!data.selectedOption) return;
    
    const prices = data.selectedOption.prices;
    const dates = prices.map(p => p.date);
    const opens = prices.map(p => parseFloat(p.open) || 0);
    const closes = prices.map(p => parseFloat(p.close) || 0);
    const highs = prices.map(p => parseFloat(p.high) || 0);
    const lows = prices.map(p => parseFloat(p.low) || 0);
    const volumes = prices.map(p => parseInt(p.volume) || 0);
    
    // 构建OHLC格式 [open, close, low, high]
    const ohlcData = opens.map((o, i) => [o, closes[i], lows[i], highs[i]]);
    
    // 计算移动平均线
    const ma5 = calculateMA(closes, 5);
    const ma10 = calculateMA(closes, 10);
    
    // 归一化成交量
    const maxVolume = Math.max(...volumes);
    const normalizedVolumes = volumes.map(v => (maxVolume > 0 ? v / maxVolume * 50 : 0));
    
    const chartDom = document.getElementById('selectedChart');
    if (!selectedChart) {
        selectedChart = echarts.init(chartDom);
    }
    
    const option = {
        title: { 
            text: `${data.selectedOption.opt.symbol} - 期权走势`, 
            left: 'center',
            textStyle: { fontSize: 14, fontWeight: 600, color: '#333' }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            borderColor: '#ddd',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            textStyle: { color: '#333' },
            formatter: function(params) {
                let res = `<div style="padding:8px;"><strong>${params[0]?.axisValue}</strong><br/>`;
                params.forEach(param => {
                    if (param.componentSubType === 'candlestick') {
                        res += `K线：开${param.value[0].toFixed(4)} 收${param.value[1].toFixed(4)} 高${param.value[3].toFixed(4)} 低${param.value[2].toFixed(4)}<br/>`;
                    } else {
                        res += `<span style="color:${param.color}">●</span> ${param.name}：${typeof param.value === 'number' ? param.value.toFixed(4) : param.value}<br/>`;
                    }
                });
                return res + '</div>';
            }
        },
        backgroundColor: '#fafbfc',
        grid: [
            { left: 60, right: 20, top: 80, height: '75%' },
            { left: 60, right: 20, top: '80%', height: '10%' }
        ],
        xAxis: [
            {
                type: 'category',
                data: dates,
                gridIndex: 0,
                boundaryGap: true,
                axisLine: { lineStyle: { color: '#ccc' } },
                axisLabel: { color: '#666', fontSize: 10 },
                splitLine: { show: false }
            },
            {
                type: 'category',
                data: dates,
                gridIndex: 1,
                boundaryGap: true,
                axisLine: { show: false },
                axisLabel: { show: false }
            }
        ],
        yAxis: [
            {
                type: 'value',
                gridIndex: 0,
                scale: true,
                axisLine: { show: false },
                axisLabel: { color: '#666', fontSize: 10 },
                splitLine: { lineStyle: { color: '#f0f0f0' } }
            },
            {
                type: 'value',
                gridIndex: 1,
                scale: false,
                axisLine: { show: false },
                axisLabel: { show: false },
                splitLine: { show: false }
            }
        ],
        series: [
            {
                name: 'K线',
                type: 'candlestick',
                data: ohlcData,
                xAxisIndex: 0,
                yAxisIndex: 0,
                itemStyle: {
                    color: '#f23645',
                    color0: '#22ab94',
                    borderColor: '#f23645',
                    borderColor0: '#22ab94',
                    borderWidth: 1
                }
            },
            {
                name: 'MA5',
                type: 'line',
                data: ma5,
                xAxisIndex: 0,
                yAxisIndex: 0,
                smooth: true,
                lineStyle: { color: '#ff7f00', width: 1.5 },
                symbol: 'none',
                itemStyle: { opacity: 0 }
            },
            {
                name: 'MA10',
                type: 'line',
                data: ma10,
                xAxisIndex: 0,
                yAxisIndex: 0,
                smooth: true,
                lineStyle: { color: '#00d4ff', width: 1.5 },
                symbol: 'none',
                itemStyle: { opacity: 0 }
            },
            {
                name: '成交量',
                type: 'bar',
                data: normalizedVolumes,
                xAxisIndex: 1,
                yAxisIndex: 1,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(102, 126, 234, 0.6)' },
                        { offset: 1, color: 'rgba(102, 126, 234, 0.2)' }
                    ])
                }
            }
        ]
    };
    
    selectedChart.setOption(option);
}

function drawPortfolioChart() {
    if (data.portfolio.length === 0) {
        document.getElementById('portfolioChart').innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">请添加期权到组合</div>';
        return;
    }
    
    const etfPrice = getLatestETFPrice();
    const prices = Array.from({ length: 100 }, (_, i) => etfPrice * (0.8 + i * 0.004));
    
    const profits = prices.map(price => {
        let totalProfit = 0;
        data.portfolio.forEach(item => {
            const profit = calculateOptionProfit(item, price);
            totalProfit += profit;
        });
        return totalProfit;
    });
    
    const chartDom = document.getElementById('portfolioChart');
    if (!portfolioChart) {
        portfolioChart = echarts.init(chartDom);
    }
    
    const option = {
        title: { text: '期权组合损益图', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: prices.map(p => p.toFixed(2)), boundaryGap: false },
        yAxis: { type: 'value' },
        series: [{
            data: profits,
            type: 'line',
            smooth: true,
            itemStyle: { color: '#667eea' },
            areaStyle: { 
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
                    { offset: 1, color: 'rgba(102, 126, 234, 0)' }
                ])
            }
        }],
        grid: { left: 60, right: 20, bottom: 50, top: 60 }
    };
    
    portfolioChart.setOption(option);
}

function updatePortfolioGreeks() {
    if (data.portfolio.length === 0) {
        document.getElementById('portfolioDelta').textContent = '0.000';
        document.getElementById('portfolioGamma').textContent = '0.000';
        document.getElementById('portfolioVega').textContent = '0.000';
        document.getElementById('portfolioTheta').textContent = '0.000';
        document.getElementById('portfolioRho').textContent = '0.000';
        document.getElementById('portfolioCost').textContent = '0.00';
        return;
    }
    
    const etfPrice = getLatestETFPrice();
    const r = CONFIG.riskFreeRate;
    
    let totalDelta = 0, totalGamma = 0, totalVega = 0, totalTheta = 0, totalRho = 0, totalCost = 0;
    
    data.portfolio.forEach(item => {
        const opt = item.opt;
        const latestPrice = getLatestPrice(opt.order_book_id);
        
        if (latestPrice) {
            const daysToExp = Math.max(0, (new Date(opt.maturity_date) - new Date()) / (1000 * 60 * 60 * 24));
            const T = daysToExp / 365;
            const iv = calculateIV(latestPrice.close, opt.strike_price, etfPrice);
            
            const delta = calculateDelta(etfPrice, opt.strike_price, T, iv, r, opt.option_type);
            const gamma = calculateGamma(etfPrice, opt.strike_price, T, iv, r);
            const vega = calculateVega(etfPrice, opt.strike_price, T, iv, r);
            const theta = calculateTheta(etfPrice, opt.strike_price, T, iv, r, opt.option_type);
            const rho = calculateRho(etfPrice, opt.strike_price, T, iv, r, opt.option_type);
            
            const multiplier = item.direction === 'long' ? 1 : -1;
            const quantity = item.quantity;
            
            totalDelta += delta * multiplier * quantity * opt.contract_multiplier;
            totalGamma += gamma * multiplier * quantity * opt.contract_multiplier;
            totalVega += vega * multiplier * quantity;
            totalTheta += theta * multiplier * quantity * opt.contract_multiplier;
            totalRho += rho * multiplier * quantity;
            totalCost += latestPrice.close * multiplier * quantity * opt.contract_multiplier;
        }
    });
    
    document.getElementById('portfolioDelta').textContent = totalDelta.toFixed(3);
    document.getElementById('portfolioGamma').textContent = totalGamma.toFixed(5);
    document.getElementById('portfolioVega').textContent = totalVega.toFixed(3);
    document.getElementById('portfolioTheta').textContent = totalTheta.toFixed(5);
    document.getElementById('portfolioRho').textContent = totalRho.toFixed(3);
    document.getElementById('portfolioCost').textContent = totalCost.toFixed(2);
    
    // 更新风险指标表
    updatePortfolioRiskTable(totalDelta, totalGamma, totalVega, totalTheta);
}

function updatePortfolioRiskTable(delta, gamma, vega, theta) {
    const tbody = document.getElementById('portfolioRiskTable');
    tbody.innerHTML = `
        <tr>
            <td>Delta合计</td>
            <td>${delta.toFixed(3)}</td>
            <td>${Math.abs(delta) < 0.3 ? '💚 低风险' : Math.abs(delta) < 0.7 ? '🟡 中等风险' : '🔴 高风险'}</td>
        </tr>
        <tr>
            <td>Gamma合计</td>
            <td>${gamma.toFixed(5)}</td>
            <td>${Math.abs(gamma) < 0.001 ? '💚 稳定' : '🟡 波动'}</td>
        </tr>
        <tr>
            <td>Vega合计</td>
            <td>${vega.toFixed(3)}</td>
            <td>${Math.abs(vega) < 50 ? '💚 波动率敏感性低' : '🟡 波动率敏感性高'}</td>
        </tr>
        <tr>
            <td>Theta合计</td>
            <td>${theta.toFixed(5)}</td>
            <td>${theta > 0 ? '💚 时间获利' : theta < -0.001 ? '🔴 时间亏损' : '💚 中性'}</td>
        </tr>
    `;
}

// ==================== 选项卡切换 ====================

function switchTab(tabName) {
    data.currentTab = tabName;
    
    // 更新选项卡样式
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // 更新表格列
    updateOptionTable();
}

// ==================== Greeks风险指标计算 ====================

function calculateDelta(S, K, T, sigma, r, optionType) {
    if (T <= 0) return optionType === 'C' ? 1 : 0;
    
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const cdf = 0.5 * (1 + erf(d1 / Math.sqrt(2)));
    
    return optionType === 'C' ? cdf : cdf - 1;
}

function calculateGamma(S, K, T, sigma, r) {
    if (T <= 0 || sigma <= 0) return 0;
    
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const pdf = Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI);
    
    return pdf / (S * sigma * Math.sqrt(T));
}

function calculateVega(S, K, T, sigma, r) {
    if (T <= 0) return 0;
    
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const pdf = Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI);
    
    return S * pdf * Math.sqrt(T) / 100; // 每1%波动率变化
}

function calculateTheta(S, K, T, sigma, r, optionType) {
    if (T <= 0) return 0;
    
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    
    const cdf1 = 0.5 * (1 + erf(d1 / Math.sqrt(2)));
    const cdf2 = 0.5 * (1 + erf(d2 / Math.sqrt(2)));
    const pdf = Math.exp(-0.5 * d1 * d1) / Math.sqrt(2 * Math.PI);
    
    if (optionType === 'C') {
        const term1 = -S * pdf * sigma / (2 * Math.sqrt(T));
        const term2 = -r * K * Math.exp(-r * T) * cdf2;
        return (term1 + term2) / 365; // 每天衰减
    } else {
        const term1 = -S * pdf * sigma / (2 * Math.sqrt(T));
        const term2 = r * K * Math.exp(-r * T) * (1 - cdf2);
        return (term1 + term2) / 365;
    }
}

function calculateRho(S, K, T, sigma, r, optionType) {
    if (T <= 0) return 0;
    
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    const cdf2 = 0.5 * (1 + erf(d2 / Math.sqrt(2)));
    
    if (optionType === 'C') {
        return K * T * Math.exp(-r * T) * cdf2 / 100; // 每1%利率变化
    } else {
        return -K * T * Math.exp(-r * T) * (1 - cdf2) / 100;
    }
}

// ==================== 期权组合模块 ====================

let selectedOptForPortfolio = null;

function addToPortfolio() {
    if (!data.selectedOption) {
        alert('请先选择一个期权');
        return;
    }
    
    selectedOptForPortfolio = data.selectedOption.opt;
    document.getElementById('addPortfolioModal').classList.add('show');
}

function confirmAddPortfolio() {
    const direction = document.getElementById('portfolioDirection').value;
    const qty = parseInt(document.getElementById('portfolioQty').value);
    
    data.portfolio.push({
        opt: selectedOptForPortfolio,
        direction: direction,
        quantity: qty,
        entryPrice: data.selectedOption.prices[data.selectedOption.prices.length - 1].close
    });
    
    updatePortfolioTable();
    drawPortfolioChart();
    closeModal('addPortfolioModal');
}

function updatePortfolioTable() {
    const tbody = document.getElementById('portfolioTable');
    tbody.innerHTML = '';
    
    data.portfolio.forEach((item, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button class="btn" style="padding: 5px 10px; font-size: 11px;" onclick="removeFromPortfolio(${idx})">删除</button></td>
            <td>${item.opt.trading_code}</td>
            <td>${item.direction === 'long' ? '买入' : '卖出'}</td>
            <td>${item.quantity}</td>
        `;
        tbody.appendChild(row);
    });
    
    // 更新Greeks合计
    updatePortfolioGreeks();
}

function removeFromPortfolio(idx) {
    data.portfolio.splice(idx, 1);
    updatePortfolioTable();
    drawPortfolioChart();
}

function clearPortfolio() {
    if (confirm('确定要清空期权组合吗？')) {
        data.portfolio = [];
        updatePortfolioTable();
        drawPortfolioChart();
    }
}

// ==================== 价格预测模块 ====================

function updatePricePrediction() {
    const etfCode = document.getElementById('etfSelect').value;
    if (!etfCode) return;
    
    const days = parseInt(document.getElementById('daysSelect').value);
    const etfData = data.etfPrice.filter(d => d.code === etfCode)
        .sort((a, b) => new Date(a.time) - new Date(b.time));
    
    if (etfData.length < 2) return;
    
    const prices = etfData.map(d => parseFloat(d.close) || 0);
    
    try {
        const predictor = new PricePredictionCalculator(prices, days);
        
        const predictedPrice = predictor.predictPrice();
        const stdPrice = predictor.predictStdDev();
        const interval = predictor.calculateConfidenceInterval(0.95);
        const upProbability = predictor.calculateUpProbability();
        
        // 更新信息卡
        document.getElementById('predictedPrice').textContent = formatPrice(predictedPrice);
        document.getElementById('predictedStd').textContent = formatPrice(stdPrice);
        document.getElementById('confidenceInterval').textContent = 
            `[${formatPrice(interval.lower)}, ${formatPrice(interval.upper)}]`;
        document.getElementById('upProbability').textContent = 
            `${(upProbability * 100).toFixed(2)}%`;
        
        // 绘制概率分布
        drawPredictionChart(predictor, days);
    } catch (error) {
        console.error('价格预测计算错误:', error);
    }
}

function drawPredictionChart(predictor, days) {
    const distribution = predictor.generateDistribution(100);
    
    const prices = distribution.map(d => d.price);
    const probabilities = distribution.map(d => d.probability);
    
    const chartDom = document.getElementById('predictionChart');
    if (!predictionChart) {
        predictionChart = echarts.init(chartDom);
    }
    
    const currentPrice = predictor.currentPrice;
    const predictedPrice = predictor.predictPrice();
    
    const option = {
        title: { text: `${days}天后价格分布预测`, left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: prices.map(p => p.toFixed(3)), boundaryGap: false },
        yAxis: { type: 'value' },
        series: [{
            data: probabilities,
            type: 'line',
            smooth: true,
            itemStyle: { color: CONFIG.colors ? CONFIG.colors.secondary : '#764ba2' },
            areaStyle: { color: 'rgba(118, 75, 162, 0.1)' },
            markLine: {
                data: [
                    { name: '当前价', xAxis: currentPrice.toFixed(3), lineStyle: { color: CONFIG.colors ? CONFIG.colors.up : '#f23645' } },
                    { name: '预测价', xAxis: predictedPrice.toFixed(3), lineStyle: { color: CONFIG.colors ? CONFIG.colors.down : '#22ab94' } }
                ]
            }
        }],
        grid: { left: 60, right: 20, bottom: 50, top: 60 }
    };
    
    predictionChart.setOption(option);
}

// ==================== 计算函数 ====================

function calculateIV(optionPrice, strikePrice, spotPrice) {
    // 简化的隐含波动率计算（使用二分法）
    try {
        const calc = new ImpliedVolatilityCalculator(
            spotPrice, 
            strikePrice, 
            30 / 365, 
            optionPrice,
            CONFIG.riskFreeRate,
            0,
            'C'
        );
        return calc.calculateBisection();
    } catch (e) {
        return 0.2; // 默认20%
    }
}

function calculateHV(prices) {
    if (prices.length < 2) return 0;
    
    const closeArray = prices.map(p => parseFloat(p.close) || 0);
    const returns = [];
    
    for (let i = 1; i < closeArray.length; i++) {
        returns.push(Math.log(closeArray[i] / closeArray[i - 1]));
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const std = Math.sqrt(variance);
    
    // 年化波动率
    return std * Math.sqrt(CONFIG.tradingDays);
}

function calculateOptionProfit(portfolio, spotPrice) {
    const opt = portfolio.opt;
    const multiplier = opt.contract_multiplier;
    let profit = 0;
    
    if (opt.option_type === 'C') {
        // 看涨期权
        const intrinsicValue = Math.max(0, spotPrice - opt.strike_price) * multiplier;
        profit = intrinsicValue - portfolio.entryPrice * multiplier;
    } else {
        // 看跌期权
        const intrinsicValue = Math.max(0, opt.strike_price - spotPrice) * multiplier;
        profit = intrinsicValue - portfolio.entryPrice * multiplier;
    }
    
    if (portfolio.direction === 'short') {
        profit = -profit;
    }
    
    return profit * portfolio.quantity;
}

function getLatestETFPrice() {
    const etfCode = document.getElementById('etfSelect').value;
    const etfData = data.etfPrice.filter(d => d.code === etfCode)
        .sort((a, b) => new Date(b.time) - new Date(a.time));
    
    if (etfData.length > 0) {
        return parseFloat(etfData[0].close) || 0;
    }
    return 1;
}

// 误差函数定义
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
    
    return sign * (1.0 - (((((a5 * t5 + a4 * t4) + a3 * t3) + a2 * t2) + a1 * t) * t) * Math.exp(-x * x));
}

// ==================== 模态框管理 ====================

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// 页面加载时初始化
window.addEventListener('load', () => {
    loadSampleData();
});
