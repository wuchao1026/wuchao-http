document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const uploadArea = document.getElementById('uploadArea');
    const videoInput = document.getElementById('videoInput');
    const videoPreview = document.getElementById('videoPreview');
    const mainContent = document.querySelector('.main-content');
    const infoBtn = document.getElementById('infoBtn');
    const extractBtn = document.getElementById('extractBtn');
    const videoInfoPanel = document.querySelector('.video-info-panel');
    const closeButtons = document.querySelectorAll('.close');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const removeBtn = document.getElementById('removeBtn');

    // 上传区域点击事件
    uploadArea.addEventListener('click', () => {
        videoInput.click();
    });

    // 处理文件拖放
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ccc';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ccc';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            handleVideoFile(file);
        }
    });

    // 处理视频文件上传
    videoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleVideoFile(file);
        }
    });

    // 视频信息按钮点击事件
    infoBtn.addEventListener('click', () => {
        videoInfoPanel.hidden = !videoInfoPanel.hidden;
    });

    // 提取图片按钮点击事件
    extractBtn.addEventListener('click', () => {
        extractModal.style.display = 'block';
    });

    // 关闭模态框
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').style.display = 'none';
        });
    });

    // 移除视频按钮点击事件
    removeBtn.addEventListener('click', () => {
        // 重置所有状态
        videoPreview.src = '';
        imageGrid.innerHTML = '';
        mainContent.hidden = true;
        uploadArea.style.display = 'block';
        videoInfoPanel.hidden = true;
        downloadAllBtn.hidden = true;
        infoBtn.innerHTML = '<i class="fas fa-info-circle"></i><span>视频信息</span>';
        videoInput.value = ''; // 清除文件输入
    });

    // 下载所有图片按钮点击事件
    downloadAllBtn.addEventListener('click', () => {
        const images = document.querySelectorAll('.frame-wrapper img');
        if (images.length === 0) return;

        // 创建进度提示
        const progressContainer = document.querySelector('.progress-container');
        const progressBar = progressContainer.querySelector('.progress');
        const progressText = progressContainer.querySelector('.progress-text');
        
        progressContainer.hidden = false;
        downloadAllBtn.disabled = true;

        // 创建一个zip文件
        const zip = new JSZip();
        let processedImages = 0;

        // 添加所有图片到zip
        images.forEach((img, index) => {
            // 从base64字符串获取图片数据
            const imageData = img.src.split(',')[1];
            const fileName = img.parentElement.querySelector('.frame-label').textContent;
            zip.file(`${fileName}.jpg`, imageData, {base64: true});

            processedImages++;
            const progress = (processedImages / images.length) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `打包中 ${Math.round(progress)}%`;
        });

        // 生成并下载zip文件
        zip.generateAsync({type: 'blob'}).then(content => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'all_frames.zip';
            link.click();

            progressContainer.hidden = true;
            downloadAllBtn.disabled = false;
        });
    });

    // 处理视频文件
    function handleVideoFile(file) {
        const videoURL = URL.createObjectURL(file);
        videoPreview.src = videoURL;
        
        videoPreview.onloadedmetadata = () => {
            uploadArea.style.display = 'none';
            mainContent.hidden = false;
            calculateFrameRate();
        };
    }

    // 计算帧率
    async function calculateFrameRate() {
        const video = videoPreview;
        const file = videoInput.files[0];
        
        // 使用MediaInfo API计算帧率（如果浏览器支持）
        let frameRate = 30; // 默认帧率
        try {
            if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
                await new Promise(resolve => {
                    let frames = 0;
                    const startTime = performance.now();
                    
                    function countFrames(now, metadata) {
                        frames++;
                        if (now - startTime > 1000) { // 统计1秒内的帧数
                            frameRate = Math.round(frames * 1000 / (now - startTime));
                            resolve();
                        } else {
                            video.requestVideoFrameCallback(countFrames);
                        }
                    }
                    
                    video.requestVideoFrameCallback(countFrames);
                    video.play();
                });
                video.pause();
            }
        } catch (e) {
            console.log('无法精确计算帧率，使用默认值');
        }
        
        updateVideoInfo(file, frameRate);
    }

    // 更新视频信息显示
    function updateVideoInfo(file, frameRate) {
        const video = videoPreview;
        const videoInfo = document.getElementById('videoInfo');
        videoInfo.innerHTML = `
            <p><i class="fas fa-file-video"></i> 文件名：${file.name}</p>
            <p><i class="fas fa-weight"></i> 大小：${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <p><i class="fas fa-film"></i> 时长：${Math.round(video.duration)} 秒</p>
            <p><i class="fas fa-expand"></i> 分辨率：${video.videoWidth} x ${video.videoHeight}</p>
            <p><i class="fas fa-tachometer-alt"></i> 帧率：${frameRate} fps</p>
        `;
    }

    // 提取图片功能
    extractBtn.addEventListener('click', async () => {
        const video = videoPreview;
        const duration = video.duration;
        const fps = parseInt(document.querySelector('#videoInfo').textContent.match(/帧率：(\d+)/)[1]); // 从视频信息中获取帧率
        const totalFrames = Math.ceil(duration * fps);
        
        const imageGrid = document.getElementById('imageGrid');
        const progressContainer = document.querySelector('.progress-container');
        const progressBar = progressContainer.querySelector('.progress');
        const progressText = progressContainer.querySelector('.progress-text');
        
        imageGrid.innerHTML = '';
        progressContainer.hidden = false;
        extractBtn.disabled = true;
        infoBtn.disabled = true;

        try {
            let processedFrames = 0;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            // 创建每秒的图片组容器
            for (let second = 0; second < Math.ceil(duration); second++) {
                const secondGroup = document.createElement('div');
                secondGroup.className = 'second-group';
                const secondTitle = document.createElement('h4');
                secondTitle.textContent = `第 ${second + 1} 秒`;
                secondGroup.appendChild(secondTitle);
                
                const framesContainer = document.createElement('div');
                framesContainer.className = 'frames-container';
                secondGroup.appendChild(framesContainer);
                imageGrid.appendChild(secondGroup);

                // 提取这一秒内的所有帧
                for (let frame = 0; frame < fps; frame++) {
                    const time = second + (frame / fps);
                    if (time >= duration) break;

                    video.currentTime = time;
                    await new Promise(resolve => {
                        video.onseeked = () => {
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            
                            const imgWrapper = document.createElement('div');
                            imgWrapper.className = 'frame-wrapper';
                            const img = document.createElement('img');
                            img.src = canvas.toDataURL('image/jpeg');
                            
                            const frameLabel = document.createElement('div');
                            frameLabel.className = 'frame-label';
                            frameLabel.textContent = `帧 ${frame + 1}`;
                            
                            imgWrapper.appendChild(img);
                            imgWrapper.appendChild(frameLabel);
                            framesContainer.appendChild(imgWrapper);

                            // 添加点击下载功能
                            img.onclick = () => {
                                const link = document.createElement('a');
                                link.download = `second${second+1}_frame${frame+1}.jpg`;
                                link.href = img.src;
                                link.click();
                            };

                            processedFrames++;
                            const progress = (processedFrames / totalFrames) * 100;
                            progressBar.style.width = `${progress}%`;
                            progressText.textContent = `${Math.round(progress)}%`;

                            resolve();
                        };
                    });
                }
            }

            // 完成后显示下载所有按钮
            downloadAllBtn.hidden = false;
        } finally {
            progressContainer.hidden = true;
            extractBtn.disabled = false;
            infoBtn.disabled = false;
        }
    });
}); 