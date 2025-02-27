// 初始化变量
let myChart = null;
let yColumnCount = 1;
const colors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#7f8c8d', '#16a085'
];

// 缓存DOM元素
const inputModeButtons = document.querySelectorAll('.input-mode-btn');
const xAxisSettings = document.querySelector('.x-axis-settings');
const xInputs = document.querySelectorAll('.x-value');
const dataTable = document.getElementById('data-table');
const tableBody = document.getElementById('table-body');
const headerRow = dataTable.querySelector('thead tr');
const addRowButton = document.getElementById('add-row');
const generateXButton = document.getElementById('generate-x');
const generateChartButton = document.getElementById('generate-chart');
const saveChartButton = document.getElementById('save-chart');
const chartTypeButtons = document.querySelectorAll('.chart-type-btn');
const chartCanvas = document.getElementById('chart-canvas');
const xStartInput = document.getElementById('x-start');
const xEndInput = document.getElementById('x-end');
const xStepInput = document.getElementById('x-step');
const xAxisLabelInput = document.getElementById('x-axis-label');
const yAxisLabelInput = document.getElementById('y-axis-label');
const chartTitleInput = document.getElementById('chart-title');

let currentInputMode = 'manual'; // 默认输入模式
let currentChartType = 'line'; // 默认图表类型

// 保存X轴设置到localStorage
function saveXAxisSettings() {
    const settings = {
        start: xStartInput.value,
        end: xEndInput.value,
        step: xStepInput.value
    };
    localStorage.setItem('xAxisSettings', JSON.stringify(settings));
}

// 从localStorage恢复X轴设置
function loadXAxisSettings() {
    const settings = localStorage.getItem('xAxisSettings');
    if (settings) {
        const { start, end, step } = JSON.parse(settings);
        xStartInput.value = start;
        xEndInput.value = end;
        xStepInput.value = step;
    }
}

// 输入模式按钮处理
inputModeButtons.forEach(button => {
    button.addEventListener('click', () => {
        // 移除所有按钮的active类
        inputModeButtons.forEach(btn => btn.classList.remove('active'));
        // 添加当前按钮的active类
        button.classList.add('active');
        // 更新当前输入模式
        currentInputMode = button.dataset.mode;
        // 切换输入模式
        toggleXInputMode(currentInputMode === 'auto');
    });
});

// 修改切换X值输入模式函数
function toggleXInputMode(isAuto) {
    xInputs.forEach(input => {
        input.disabled = isAuto;
    });
    xAxisSettings.style.display = 'block'; // 始终显示X轴设置区域
}

// 生成X值按钮事件处理
generateXButton.addEventListener('click', generateXValues);

// 修改Y列添加按钮事件处理
function addYColumn() {
    yColumnCount++;
    addYColumnHeader();
    addYColumnCells();
    showFirstYColumnDeleteButton();
}

function addYColumnHeader() {
    const newTh = document.createElement('th');
    newTh.innerHTML = `Y${yColumnCount} 
        <button class="circle-button" onclick="addYColumn()">+</button>
        <button class="circle-button delete-button" onclick="removeYColumn(${yColumnCount})">-</button>`;
    headerRow.appendChild(newTh);
}

function addYColumnCells() {
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const newTd = document.createElement('td');
        newTd.innerHTML = `<input type="number" step="any" class="y${yColumnCount}-value">`;
        row.appendChild(newTd);
    });
}

function showFirstYColumnDeleteButton() {
    if (yColumnCount === 2) {
        const firstYColumn = dataTable.querySelector('th:nth-child(2)');
        firstYColumn.querySelector('.delete-button').style.display = 'inline-flex';
    }
}

// 添加删除Y列的函数
function removeYColumn(columnIndex) {
    if (yColumnCount <= 1) return; // 保留至少一个Y列
    removeYColumnHeader(columnIndex);
    removeYColumnCells(columnIndex);
    updateColumnNumbers(columnIndex);
    hideFirstYColumnDeleteButton();
}

function removeYColumnHeader(columnIndex) {
    headerRow.removeChild(headerRow.children[columnIndex]);
}

function removeYColumnCells(columnIndex) {
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        row.removeChild(row.children[columnIndex]);
    });
}

function updateColumnNumbers(columnIndex) {
    for (let i = columnIndex; i < headerRow.children.length; i++) {
        const th = headerRow.children[i];
        const yNum = i;
        th.innerHTML = `Y${yNum} 
            <button class="circle-button" onclick="addYColumn()">+</button>
            <button class="circle-button delete-button" onclick="removeYColumn(${yNum})">-</button>`;
        const rows = tableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const input = row.children[i].querySelector('input');
            input.className = `y${yNum}-value`;
        });
    }
    yColumnCount--;
}

function hideFirstYColumnDeleteButton() {
    if (yColumnCount === 1) {
        const firstYColumn = dataTable.querySelector('th:nth-child(2)');
        firstYColumn.querySelector('.delete-button').style.display = 'none';
    }
}


// 生成X值
function generateXValues() {
    const xStart = parseFloat(xStartInput.value);
    const xEnd = parseFloat(xEndInput.value);
    const xStep = parseFloat(xStepInput.value);

    if (isNaN(xStart) || isNaN(xEnd) || isNaN(xStep) || xStep <= 0) {
        showError('请输入有效的X轴范围和间隔值');
        return;
    }

    // 保存X轴设置
    saveXAxisSettings();

    // 清空现有的行
    tableBody.innerHTML = '';

    // 生成新的行
    for (let x = xStart; x <= xEnd; x += xStep) {
        addNewRow(x.toFixed(2), true);
    }
}

// 添加新行
function addNewRow(xValue = '', isDisabled = false) {
    const newRow = document.createElement('tr');
    let rowHtml = `<td><input type="number" step="any" class="x-value" value="${xValue}" ${isDisabled ? 'disabled' : ''}></td>`;

    // 添加所有Y值的输入框
    for (let i = 1; i <= yColumnCount; i++) {
        rowHtml += `<td><input type="number" step="any" class="y${i}-value"></td>`;
    }

    newRow.innerHTML = rowHtml;
    tableBody.appendChild(newRow);
}

// 修改添加行按钮事件处理
addRowButton.addEventListener('click', () => {
    const isAuto = currentInputMode === 'auto';
    addNewRow('', isAuto);
});

// 修改添加行按钮的内容
addRowButton.innerHTML = '+';

// 添加生成图表按钮事件监听器
generateChartButton.addEventListener('click', generateChart);

// 图表类型按钮处理
chartTypeButtons.forEach(button => {
    button.addEventListener('click', () => {
        // 移除所有按钮的active类
        chartTypeButtons.forEach(btn => btn.classList.remove('active'));
        // 添加当前按钮的active类
        button.classList.add('active');
        // 更新当前图表类型
        currentChartType = button.dataset.type;
    });
});

// 修改生成图表函数中获取图表类型的方式
function generateChart() {
    // 收集表格数据
    const data = collectTableData();

    if (Object.values(data).every(arr => arr.length === 0)) {
        showError('请输入至少一组有效的坐标数据');
        return;
    }

    // 获取用户输入的标题
    const xAxisLabel = xAxisLabelInput.value || 'X轴';
    const yAxisLabel = yAxisLabelInput.value || 'Y轴';
    const chartTitle = chartTitleInput.value;

    // 使用currentChartType替代原来的select值
    const chartType = currentChartType;

    // 创建图表
    const ctx = chartCanvas.getContext('2d');

    // 如果已存在图表，先销毁
    if (myChart) {
        myChart.destroy();
    }

    // 创建数据集
    const datasets = Object.entries(data).map(([label, points], index) => ({
        label: label,
        data: points,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length],
        fill: false
    }));

    // 创建新图表
    myChart = new Chart(ctx, {
        type: chartType,
        data: { datasets },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: !!chartTitle,  // 只在有标题时显示
                    text: chartTitle,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 20
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: xAxisLabel  // 使用用户输入的X轴标题
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel  // 使用用户输入的Y轴标题
                    }
                }
            }
        }
    });
}

function collectTableData() {
    const rows = tableBody.querySelectorAll('tr');
    const data = {};

    // 初始化数据数组
    for (let i = 1; i <= yColumnCount; i++) {
        data[`Y${i}`] = [];
    }

    rows.forEach(row => {
        const x = parseFloat(row.querySelector('.x-value').value);

        // 收集每个Y值
        for (let i = 1; i <= yColumnCount; i++) {
            const y = parseFloat(row.querySelector(`.y${i}-value`).value);
            if (!isNaN(x) && !isNaN(y)) {
                data[`Y${i}`].push({ x: x, y: y });
            }
        }
    });

    // 对每组数据进行排序
    Object.values(data).forEach(points => {
        points.sort((a, b) => a.x - b.x);
    });

    return data;
}

// 保存图表按钮事件处理
saveChartButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = '函数图像.png';
    link.href = chartCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// 修改初始Y1列的按钮
document.addEventListener('DOMContentLoaded', () => {
    // 加载保存的X轴设置
    loadXAxisSettings();

    // 如果没有保存的设置，使用默认值
    if (!xStartInput.value) xStartInput.value = '0';
    if (!xEndInput.value) xEndInput.value = '10';
    if (!xStepInput.value) xStepInput.value = '1';

    // 初始化X轴设置区域显示状态
    toggleXInputMode(false);

    // 为Y1的加号按钮添加事件处理
    const y1Header = dataTable.querySelector('th:nth-child(2)');
    y1Header.innerHTML = `Y1 
        <button class="circle-button" onclick="addYColumn()">+</button>
        <button class="circle-button delete-button" onclick="removeYColumn(1)" style="display: none;">-</button>`;

    // 添加第一行
    addRowButton.click();
});

// 显示错误信息
function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.classList.add('error-message');
    errorElement.textContent = message;
    document.body.appendChild(errorElement);
    setTimeout(() => {
        document.body.removeChild(errorElement);
    }, 3000);
}