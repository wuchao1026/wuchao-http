let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let currentImage = null;
let cropMode = false;
let startX, startY, isDrawing = false;
let cropRect = {};
const uploadOverlay = document.getElementById('uploadOverlay');
let history = [];
let currentStep = -1;

// 图片加载处理
document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                currentImage = img;
                // 保存文件信息
                currentImage.fileInfo = {
                    name: file.name,
                    lastModified: new Date(file.lastModified),
                    size: file.size
                };
                // 隐藏上传遮罩
                uploadOverlay.classList.add('hidden');
                saveState();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// 添加保存状态函数
function saveState() {
    currentStep++;
    history = history.slice(0, currentStep);
    history.push(canvas.toDataURL());
}

// 添加撤销函数
function undo() {
    if (currentStep > 0) {
        currentStep--;
        const img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        };
        img.src = history[currentStep];
    }
}

// 显示图片信息
function showImageInfo() {
    if (!currentImage) return;
    const info = document.getElementById('imageInfo');
    const format = currentImage.src.split(';')[0].split('/')[1];
    const fileInfo = currentImage.fileInfo || {};
    
    // 格式化文件大小
    const formatFileSize = (bytes) => {
        if (!bytes) return '未知';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    };

    // 格式化日期
    const formatDate = (date) => {
        if (!date) return '未知';
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    info.innerHTML = `
        图片名称: ${fileInfo.name || '未知'}<br>
        图片尺寸: ${currentImage.width} x ${currentImage.height} 像素<br>
        文件格式: ${format}<br>
        文件大小: ${formatFileSize(fileInfo.size)}<br>
        修改时间: ${formatDate(fileInfo.lastModified)}<br>
        当前方向: ${canvas.width > canvas.height ? '横向' : '纵向'}<br>
    `;
}

// 反色功能
function invertColors() {
    if (!currentImage) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];         // 红
        data[i + 1] = 255 - data[i + 1]; // 绿
        data[i + 2] = 255 - data[i + 2]; // 蓝
    }
    
    ctx.putImageData(imageData, 0, 0);
    saveState();
}

// 图片拼接功能
function mergeTwoImages() {
    if (!currentImage) return;
    const dialog = document.getElementById('mergeDialog');
    dialog.classList.add('show');
}

// 关闭拼接设置对话框
function closeMergeDialog() {
    const dialog = document.getElementById('mergeDialog');
    dialog.classList.remove('show');
}

// 选择第二张图片并执行拼接
function selectSecondImage() {
    const direction = document.getElementById('mergeDirection').value;
    const position = document.getElementById('mergePosition').value;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img2 = new Image();
            img2.onload = function() {
                const newCanvas = document.createElement('canvas');
                
                if (direction === 'horizontal') {
                    // 左右拼接
                    newCanvas.width = currentImage.width + img2.width;
                    newCanvas.height = Math.max(currentImage.height, img2.height);
                    
                    const newCtx = newCanvas.getContext('2d');
                    if (position === 'first') {
                        newCtx.drawImage(currentImage, 0, 0);
                        newCtx.drawImage(img2, currentImage.width, 0);
                    } else {
                        newCtx.drawImage(img2, 0, 0);
                        newCtx.drawImage(currentImage, img2.width, 0);
                    }
                } else {
                    // 上下拼接
                    newCanvas.width = Math.max(currentImage.width, img2.width);
                    newCanvas.height = currentImage.height + img2.height;
                    
                    const newCtx = newCanvas.getContext('2d');
                    if (position === 'first') {
                        newCtx.drawImage(currentImage, 0, 0);
                        newCtx.drawImage(img2, 0, currentImage.height);
                    } else {
                        newCtx.drawImage(img2, 0, 0);
                        newCtx.drawImage(currentImage, 0, img2.height);
                    }
                }
                
                canvas.width = newCanvas.width;
                canvas.height = newCanvas.height;
                ctx.drawImage(newCanvas, 0, 0);
                
                saveState();
                closeMergeDialog();
            };
            img2.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };
    
    input.click();
}

// 裁剪功能
function enableCrop() {
    cropMode = true;
    canvas.style.cursor = 'crosshair';
    
    canvas.addEventListener('mousedown', startCrop);
    canvas.addEventListener('mousemove', drawCrop);
    canvas.addEventListener('mouseup', endCrop);
}

function startCrop(e) {
    if (!cropMode) return;
    
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDrawing = true;
}

function drawCrop(e) {
    if (!isDrawing || !cropMode) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - rect.left, 0), canvas.width);
    const y = Math.min(Math.max(e.clientY - rect.top, 0), canvas.height);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0);
    
    // 计算裁剪区域
    cropRect = {
        x: Math.min(startX, x),
        y: Math.min(startY, y),
        width: Math.abs(x - startX),
        height: Math.abs(y - startY)
    };
    
    // 确保裁剪区域不超出图片范围
    cropRect.x = Math.max(0, cropRect.x);
    cropRect.y = Math.max(0, cropRect.y);
    cropRect.width = Math.min(cropRect.width, canvas.width - cropRect.x);
    cropRect.height = Math.min(cropRect.height, canvas.height - cropRect.y);
    
    // 绘制裁剪框
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
    
    // 添加半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, cropRect.y); // 上方
    ctx.fillRect(0, cropRect.y + cropRect.height, canvas.width, canvas.height - (cropRect.y + cropRect.height)); // 下方
    ctx.fillRect(0, cropRect.y, cropRect.x, cropRect.height); // 左方
    ctx.fillRect(cropRect.x + cropRect.width, cropRect.y, canvas.width - (cropRect.x + cropRect.width), cropRect.height); // 右方
}

function endCrop() {
    if (!cropMode || !isDrawing) return;
    
    const imageData = ctx.getImageData(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
    canvas.width = cropRect.width;
    canvas.height = cropRect.height;
    ctx.putImageData(imageData, 0, 0);
    
    isDrawing = false;
    cropMode = false;
    canvas.style.cursor = 'default';
    
    canvas.removeEventListener('mousedown', startCrop);
    canvas.removeEventListener('mousemove', drawCrop);
    canvas.removeEventListener('mouseup', endCrop);
    
    saveState();
}

// 下载功能
function downloadImage() {
    if (!currentImage) return;
    
    const link = document.createElement('a');
    link.download = 'processed-image.png';
    link.href = canvas.toDataURL();
    link.click();
}

// 显示定制裁剪对话框
function showPixelCropDialog() {
    if (!currentImage) return;
    
    const dialog = document.getElementById('cropDialog');
    const cropX = document.getElementById('cropX');
    const cropY = document.getElementById('cropY');
    const cropWidth = document.getElementById('cropWidth');
    const cropHeight = document.getElementById('cropHeight');
    
    // 设置输入框的最大值
    cropX.max = currentImage.width - 1;
    cropY.max = currentImage.height - 1;
    cropWidth.max = currentImage.width;
    cropHeight.max = currentImage.height;
    
    // 设置默认值
    cropX.value = 0;
    cropY.value = 0;
    cropWidth.value = currentImage.width;
    cropHeight.value = currentImage.height;
    
    dialog.classList.add('show');
}

// 关闭定制裁剪对话框
function closeCropDialog() {
    const dialog = document.getElementById('cropDialog');
    dialog.classList.remove('show');
}

// 执行定制裁剪
function executePixelCrop() {
    const x = parseInt(document.getElementById('cropX').value);
    const y = parseInt(document.getElementById('cropY').value);
    const width = parseInt(document.getElementById('cropWidth').value);
    const height = parseInt(document.getElementById('cropHeight').value);
    
    // 验证输入值
    if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
        alert('请输入有效的数字');
        return;
    }
    
    // 验证裁剪区域是否在图片范围内
    if (x + width > currentImage.width || y + height > currentImage.height) {
        alert('裁剪区域超出图片范围');
        return;
    }
    
    // 执行裁剪
    const imageData = ctx.getImageData(x, y, width, height);
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(imageData, 0, 0);
    
    // 保存状态并关闭对话框
    saveState();
    closeCropDialog();
}

// 旋转图片
function rotateImage(degrees) {
    if (!currentImage) return;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (degrees === 90 || degrees === -90) {
        // 交换宽高
        tempCanvas.width = canvas.height;
        tempCanvas.height = canvas.width;
    } else {
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
    }
    
    // 移动到画布中心并旋转
    tempCtx.translate(tempCanvas.width/2, tempCanvas.height/2);
    tempCtx.rotate(degrees * Math.PI/180);
    tempCtx.drawImage(canvas, -canvas.width/2, -canvas.height/2);
    
    // 更新主画布
    canvas.width = tempCanvas.width;
    canvas.height = tempCanvas.height;
    ctx.drawImage(tempCanvas, 0, 0);
    
    // 更新当前图片
    const img = new Image();
    img.onload = function() {
        currentImage = img;
        saveState();
    };
    img.src = canvas.toDataURL();
}

// 水平镜像
function flipHorizontal() {
    if (!currentImage) return;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // 水平翻转
    tempCtx.translate(tempCanvas.width, 0);
    tempCtx.scale(-1, 1);
    tempCtx.drawImage(canvas, 0, 0);
    
    // 更新主画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
    
    // 更新当前图片并保存状态
    const img = new Image();
    img.onload = function() {
        currentImage = img;
        saveState();
    };
    img.src = canvas.toDataURL();
}

// 垂直镜像
function flipVertical() {
    if (!currentImage) return;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // 垂直翻转
    tempCtx.translate(0, tempCanvas.height);
    tempCtx.scale(1, -1);
    tempCtx.drawImage(canvas, 0, 0);
    
    // 更新主画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
    
    // 更新当前图片并保存状态
    const img = new Image();
    img.onload = function() {
        currentImage = img;
        saveState();
    };
    img.src = canvas.toDataURL();
} 