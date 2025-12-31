// DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectedFileContainer = document.getElementById('selectedFileContainer');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFile');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const srtOutput = document.getElementById('srtOutput');
const notification = document.getElementById('notification');
const subtitleCount = document.getElementById('subtitleCount');
const outputSize = document.getElementById('outputSize');
const conversionStatus = document.getElementById('conversionStatus');
const outputFormat = document.getElementById('outputFormat');

// 批处理相关DOM元素
const singleModeBtn = document.getElementById('singleModeBtn');
const batchModeBtn = document.getElementById('batchModeBtn');
const modeDescription = document.getElementById('modeDescription');
const uploadTitle = document.getElementById('uploadTitle');
const uploadText = document.getElementById('uploadText');
const uploadHint = document.getElementById('uploadHint');
const batchFileContainer = document.getElementById('batchFileContainer');
const batchFilesList = document.getElementById('batchFilesList');
const batchFileCount = document.getElementById('batchFileCount');
const batchTotalSize = document.getElementById('batchTotalSize');
const clearBatchBtn = document.getElementById('clearBatchBtn');
const convertBatchBtn = document.getElementById('convertBatchBtn');
const singleModeButtons = document.getElementById('singleModeButtons');
const batchModeButtons = document.getElementById('batchModeButtons');
const outputTitle = document.getElementById('outputTitle');
const batchClearBtn = document.getElementById('batchClearBtn');
const batchDownloadBtn = document.getElementById('batchDownloadBtn');
const batchProgressSection = document.getElementById('batchProgressSection');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const progressFill = document.getElementById('progressFill');
const processedCount = document.getElementById('processedCount');
const successCount = document.getElementById('successCount');
const failCount = document.getElementById('failCount');
const progressFilesList = document.getElementById('progressFilesList');

// 全局变量
let currentFile = null;
let srtContent = '';
let originalFileName = '';
let originalFileExtension = '';

// 批处理相关变量
let isBatchMode = false;
let batchFiles = [];
let batchResults = [];
let batchZip = null;

// 显示通知
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 切换模式
function switchMode(mode) {
    if (mode === 'batch') {
        isBatchMode = true;
        batchModeBtn.classList.add('active');
        singleModeBtn.classList.remove('active');
        modeDescription.innerHTML = '<i class="fas fa-info-circle"></i> 当前模式：批量处理，可以一次选择多个BCC字幕文件进行转换';
        uploadTitle.textContent = '上传BCC字幕文件（批量）';
        uploadText.textContent = '点击选择或拖拽多个BCC字幕文件到此区域';
        uploadHint.textContent = '支持.bcc、.json、.txt格式的BCC字幕文件，可选择多个文件';
        
        // 显示批处理相关UI
        selectedFileContainer.style.display = 'none';
        singleModeButtons.style.display = 'none';
        batchFileContainer.style.display = 'block';
        batchModeButtons.style.display = 'flex';
        outputTitle.textContent = '批量转换结果';
        
        // 清除单文件内容
        clearSingleFile();
        
        showNotification('已切换到批量处理模式', 'success');
    } else {
        isBatchMode = false;
        singleModeBtn.classList.add('active');
        batchModeBtn.classList.remove('active');
        modeDescription.innerHTML = '<i class="fas fa-info-circle"></i> 当前模式：单文件转换，每次处理一个BCC字幕文件';
        uploadTitle.textContent = '上传BCC字幕文件';
        uploadText.textContent = '点击选择或拖拽BCC字幕文件到此区域';
        uploadHint.textContent = '支持.bcc、.json格式或包含BCC字幕内容的.txt文件';
        
        // 显示单文件相关UI
        batchFileContainer.style.display = 'none';
        batchModeButtons.style.display = 'none';
        singleModeButtons.style.display = 'flex';
        outputTitle.textContent = 'SRT字幕内容';
        batchProgressSection.style.display = 'none';
        
        // 清除批处理内容
        clearBatchFiles();
        
        showNotification('已切换到单文件模式', 'success');
    }
    
    // 重置文件输入
    fileInput.value = '';
}

// 处理文件选择
function handleFileSelect(file) {
    if (!file) return;
    
    if (isBatchMode) {
        // 批处理模式：添加到文件列表
        addFileToBatch(file);
    } else {
        // 单文件模式：处理单个文件
        handleSingleFile(file);
    }
}

// 处理单个文件
function handleSingleFile(file) {
    // 获取文件扩展名
    const fileNameParts = file.name.split('.');
    originalFileExtension = fileNameParts.length > 1 ? fileNameParts[fileNameParts.length - 1] : '';
    
    // 检查文件类型
    const fileType = file.type;
    const isBcc = file.name.endsWith('.bcc');
    const isJson = fileType === 'application/json' || file.name.endsWith('.json');
    const isText = fileType === 'text/plain' || file.name.endsWith('.txt');
    
    if (!isBcc && !isJson && !isText) {
        showNotification('请选择.bcc、.json或.txt格式的字幕文件', 'error');
        return;
    }
    
    currentFile = file;
    originalFileName = file.name.replace(/\.[^/.]+$/, ""); // 移除扩展名
    
    // 更新UI显示文件信息
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    selectedFileContainer.style.display = 'block';
    convertBtn.disabled = false;
    
    // 读取文件内容
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // 尝试解析BCC格式
            const bccContent = e.target.result;
            conversionStatus.textContent = '文件已加载';
            conversionStatus.style.color = '#28a745';
        } catch (error) {
            console.error('文件读取错误:', error);
            conversionStatus.textContent = '文件读取失败';
            conversionStatus.style.color = '#dc3545';
        }
    };
    reader.readAsText(file);
}

// 添加文件到批处理列表
function addFileToBatch(file) {
    // 检查文件类型
    const isBcc = file.name.endsWith('.bcc');
    const isJson = file.name.endsWith('.json');
    const isText = file.name.endsWith('.txt');
    
    if (!isBcc && !isJson && !isText) {
        showNotification(`文件 "${file.name}" 不是支持的格式，已跳过`, 'error');
        return;
    }
    
    // 检查是否已存在同名文件
    const existingFileIndex = batchFiles.findIndex(f => f.name === file.name);
    if (existingFileIndex !== -1) {
        // 替换已存在的文件
        batchFiles[existingFileIndex] = file;
        updateBatchFileList();
        showNotification(`已替换文件: ${file.name}`, 'info');
    } else {
        // 添加新文件
        batchFiles.push(file);
        
        // 添加到文件列表显示
        const fileItem = document.createElement('div');
        fileItem.className = 'batch-file-item';
        fileItem.dataset.fileName = file.name;
        fileItem.innerHTML = `
            <div class="batch-file-info">
                <i class="fas fa-file-alt batch-file-icon"></i>
                <div class="batch-file-details">
                    <div class="batch-file-name">${file.name}</div>
                    <div class="batch-file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="remove-batch-file" data-file-name="${file.name}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        batchFilesList.appendChild(fileItem);
        
        // 添加删除按钮事件
        const removeBtn = fileItem.querySelector('.remove-batch-file');
        removeBtn.addEventListener('click', function() {
            removeFileFromBatch(file.name);
        });
    }
    
    // 更新批处理统计信息
    updateBatchStats();
    
    // 启用批量转换按钮
    convertBatchBtn.disabled = batchFiles.length === 0;
}

// 从批处理列表中移除文件
function removeFileFromBatch(fileName) {
    batchFiles = batchFiles.filter(file => file.name !== fileName);
    
    // 从UI中移除
    const fileItem = document.querySelector(`.batch-file-item[data-file-name="${fileName}"]`);
    if (fileItem) {
        fileItem.remove();
    }
    
    // 更新批处理统计信息
    updateBatchStats();
    
    // 更新批量转换按钮状态
    convertBatchBtn.disabled = batchFiles.length === 0;
}

// 更新批处理统计信息
function updateBatchStats() {
    const totalSize = batchFiles.reduce((total, file) => total + file.size, 0);
    batchFileCount.textContent = batchFiles.length;
    batchTotalSize.textContent = formatFileSize(totalSize);
}

// 更新批处理文件列表显示
function updateBatchFileList() {
    // 清空列表
    batchFilesList.innerHTML = '';
    
    // 重新添加所有文件
    batchFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'batch-file-item';
        fileItem.dataset.fileName = file.name;
        fileItem.innerHTML = `
            <div class="batch-file-info">
                <i class="fas fa-file-alt batch-file-icon"></i>
                <div class="batch-file-details">
                    <div class="batch-file-name">${file.name}</div>
                    <div class="batch-file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="remove-batch-file" data-file-name="${file.name}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        batchFilesList.appendChild(fileItem);
        
        // 添加删除按钮事件
        const removeBtn = fileItem.querySelector('.remove-batch-file');
        removeBtn.addEventListener('click', function() {
            removeFileFromBatch(file.name);
        });
    });
}

// 清除批处理文件列表
function clearBatchFiles() {
    batchFiles = [];
    batchResults = [];
    batchZip = null;
    batchFilesList.innerHTML = '';
    updateBatchStats();
    convertBatchBtn.disabled = true;
    batchDownloadBtn.disabled = true;
    batchProgressSection.style.display = 'none';
    srtOutput.textContent = '';
    subtitleCount.textContent = '0';
    outputSize.textContent = '0 KB';
    conversionStatus.textContent = '等待转换';
    conversionStatus.style.color = '#333';
}

// 清除单文件内容
function clearSingleFile() {
    currentFile = null;
    srtContent = '';
    originalFileName = '';
    originalFileExtension = '';
    
    // 重置UI
    selectedFileContainer.style.display = 'none';
    srtOutput.textContent = '';
    convertBtn.disabled = true;
    downloadBtn.disabled = true;
    subtitleCount.textContent = '0';
    outputSize.textContent = '0 KB';
    conversionStatus.textContent = '等待转换';
    conversionStatus.style.color = '#333';
}

// 转换BCC到SRT
function convertBCCtoSRT(bccData, fileName = '') {
    try {
        // 解析BCC JSON数据
        let bcc;
        if (typeof bccData === 'string') {
            // 尝试解析JSON
            bcc = JSON.parse(bccData);
        } else {
            bcc = bccData;
        }
        
        // 检查BCC格式是否有效
        if (!bcc.body || !Array.isArray(bcc.body)) {
            // 有些BCC文件可能body字段名称不同，尝试其他常见字段名
            if (bcc.subtitles && Array.isArray(bcc.subtitles)) {
                bcc.body = bcc.subtitles;
            } else if (bcc.events && Array.isArray(bcc.events)) {
                bcc.body = bcc.events;
            } else {
                throw new Error('无效的BCC格式：找不到字幕内容数组');
            }
        }
        
        // 对字幕条目按照开始时间排序
        const sortedBody = [...bcc.body].sort((a, b) => a.from - b.from);
        
        // 生成SRT内容
        let srt = '';
        let entryCount = 0;
        
        sortedBody.forEach((entry, index) => {
            // 检查字幕内容是否存在
            if (!entry.content && !entry.text) {
                return; // 跳过没有内容的条目
            }
            
            // 转换时间格式：秒 -> HH:MM:SS,mmm
            const formatTime = (seconds) => {
                // 处理负数时间
                const isNegative = seconds < 0;
                seconds = Math.abs(seconds);
                
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = Math.floor(seconds % 60);
                const milliseconds = Math.round((seconds % 1) * 1000);
                
                const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
                return isNegative ? `-${timeStr}` : timeStr;
            };
            
            // 获取开始和结束时间
            const startTime = entry.from !== undefined ? entry.from : (entry.start || 0);
            const endTime = entry.to !== undefined ? entry.to : (entry.end || startTime + 3); // 默认3秒时长
            const content = entry.content || entry.text || '';
            
            // 跳过无效的时间条目
            if (startTime === undefined || endTime === undefined) {
                return;
            }
            
            // SRT格式：序号 + 时间轴 + 内容
            srt += `${entryCount + 1}\n`;
            srt += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
            srt += `${content}\n\n`;
            
            entryCount++;
        });
        
        // 如果没有有效的字幕条目
        if (entryCount === 0) {
            throw new Error('未找到有效的字幕条目');
        }
        
        return {
            content: srt,
            entryCount: entryCount,
            fileName: fileName
        };
    } catch (error) {
        console.error('转换错误:', error);
        throw new Error(`BCC格式转换失败: ${error.message}`);
    }
}

// 执行单个文件转换
function performConversion() {
    if (!currentFile) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            conversionStatus.textContent = '转换中...';
            conversionStatus.style.color = '#ffc107';
            
            const bccContent = e.target.result;
            const result = convertBCCtoSRT(bccContent, currentFile.name);
            srtContent = result.content;
            
            // 显示转换结果
            srtOutput.textContent = srtContent;
            
            // 启用下载按钮
            downloadBtn.disabled = false;
            
            // 更新状态
            subtitleCount.textContent = result.entryCount;
            outputSize.textContent = formatFileSize(new Blob([srtContent]).size);
            conversionStatus.textContent = '转换完成';
            conversionStatus.style.color = '#28a745';
            
            showNotification(`成功转换 ${result.entryCount} 条字幕`);
        } catch (error) {
            srtOutput.textContent = `转换错误: ${error.message}`;
            conversionStatus.textContent = '转换失败';
            conversionStatus.style.color = '#dc3545';
            showNotification(`转换失败: ${error.message}`, 'error');
        }
    };
    
    reader.readAsText(currentFile);
}

// 执行批量转换
async function performBatchConversion() {
    if (batchFiles.length === 0) return;
    
    // 重置结果和进度
    batchResults = [];
    batchZip = new JSZip();
    
    // 显示进度区域
    batchProgressSection.style.display = 'block';
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';
    progressText.textContent = `0/${batchFiles.length}`;
    processedCount.textContent = '0';
    successCount.textContent = '0';
    failCount.textContent = '0';
    progressFilesList.innerHTML = '';
    
    // 禁用按钮
    convertBatchBtn.disabled = true;
    batchDownloadBtn.disabled = true;
    
    // 清空输出区域
    srtOutput.textContent = '批量转换开始...\n\n';
    
    let success = 0;
    let fail = 0;
    
    // 逐个处理文件
    for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        
        // 更新进度
        const progress = Math.round(((i + 1) / batchFiles.length) * 100);
        progressFill.style.width = `${progress}%`;
        progressPercent.textContent = `${progress}%`;
        progressText.textContent = `${i + 1}/${batchFiles.length}`;
        processedCount.textContent = i + 1;
        
        try {
            // 读取文件内容
            const bccContent = await readFileAsText(file);
            
            // 转换文件
            const result = convertBCCtoSRT(bccContent, file.name);
            
            // 添加到结果列表
            batchResults.push({
                fileName: file.name.replace(/\.[^/.]+$/, "") + '.srt',
                content: result.content,
                entryCount: result.entryCount,
                success: true
            });
            
            // 添加到ZIP
            batchZip.file(result.fileName, result.content);
            
            success++;
            successCount.textContent = success;
            
            // 更新输出区域
            srtOutput.textContent += `✓ ${file.name} -> 转换成功 (${result.entryCount} 条字幕)\n`;
            
            // 添加到进度文件列表
            addProgressFileItem(file.name, 'success', result.entryCount);
            
            showNotification(`已转换: ${file.name}`, 'success');
        } catch (error) {
            console.error(`文件转换失败: ${file.name}`, error);
            
            batchResults.push({
                fileName: file.name,
                error: error.message,
                success: false
            });
            
            fail++;
            failCount.textContent = fail;
            
            // 更新输出区域
            srtOutput.textContent += `✗ ${file.name} -> 转换失败: ${error.message}\n`;
            
            // 添加到进度文件列表
            addProgressFileItem(file.name, 'error', 0, error.message);
            
            showNotification(`转换失败: ${file.name}`, 'error');
        }
    }
    
    // 完成处理
    conversionStatus.textContent = '批量转换完成';
    conversionStatus.style.color = success > 0 ? '#28a745' : '#dc3545';
    
    // 更新统计信息
    subtitleCount.textContent = batchResults.reduce((total, result) => {
        return total + (result.entryCount || 0);
    }, 0);
    
    const totalContent = batchResults.map(r => r.content || '').join('\n');
    outputSize.textContent = formatFileSize(new Blob([totalContent]).size);
    
    // 启用下载按钮
    if (success > 0) {
        batchDownloadBtn.disabled = false;
        showNotification(`批量转换完成！成功: ${success} 个文件，失败: ${fail} 个文件`, 'success');
    } else {
        showNotification('所有文件转换失败', 'error');
    }
    
    // 重新启用转换按钮
    convertBatchBtn.disabled = false;
}

// 读取文件为文本
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('文件读取失败'));
        reader.readAsText(file);
    });
}

// 添加进度文件项
function addProgressFileItem(fileName, status, entryCount = 0, error = '') {
    const fileItem = document.createElement('div');
    fileItem.className = `progress-file-item ${status}`;
    
    let statusIcon, statusText, details;
    if (status === 'success') {
        statusIcon = '<i class="fas fa-check-circle"></i>';
        statusText = '成功';
        details = `${entryCount} 条字幕`;
    } else {
        statusIcon = '<i class="fas fa-times-circle"></i>';
        statusText = '失败';
        details = error || '转换失败';
    }
    
    fileItem.innerHTML = `
        <div class="progress-file-info">
            <div class="progress-file-status">${statusIcon}</div>
            <div class="progress-file-details">
                <div class="progress-file-name">${fileName}</div>
                <div class="progress-file-result">${statusText} - ${details}</div>
            </div>
        </div>
    `;
    
    progressFilesList.appendChild(fileItem);
}

// 下载单个SRT文件
function downloadSRTFile() {
    if (!srtContent) return;
    
    // 使用原始文件名，添加.srt扩展名
    const downloadFileName = `${originalFileName}.srt`;
    
    // 创建Blob并下载
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`文件已下载: ${downloadFileName}`);
}

// 下载批量转换结果
async function downloadBatchResults() {
    if (batchResults.length === 0 || !batchZip) {
        showNotification('没有可下载的文件', 'error');
        return;
    }
    
    try {
        // 生成ZIP文件
        const zipBlob = await batchZip.generateAsync({ type: 'blob' });
        
        // 创建下载链接
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BCC字幕批量转换_${new Date().getTime()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification(`已下载ZIP文件，包含 ${batchResults.filter(r => r.success).length} 个SRT文件`, 'success');
    } catch (error) {
        console.error('ZIP文件生成失败:', error);
        showNotification('ZIP文件生成失败', 'error');
    }
}

// 清除所有内容
function clearAll() {
    if (isBatchMode) {
        // 清除批处理内容
        clearBatchFiles();
        showNotification('已清除批量转换内容', 'success');
    } else {
        // 清除单文件内容
        clearSingleFile();
        showNotification('已清除所有内容', 'success');
    }
}

// 初始化事件监听器
function initEventListeners() {
    // 模式切换
    singleModeBtn.addEventListener('click', () => switchMode('single'));
    batchModeBtn.addEventListener('click', () => switchMode('batch'));
    
    // 上传区域事件
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            if (isBatchMode) {
                // 批量模式：添加所有文件
                Array.from(e.dataTransfer.files).forEach(file => {
                    handleFileSelect(file);
                });
            } else {
                // 单文件模式：只处理第一个文件
                handleFileSelect(e.dataTransfer.files[0]);
            }
        }
    });
    
    // 文件输入事件
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            if (isBatchMode) {
                // 批量模式：添加所有文件
                Array.from(e.target.files).forEach(file => {
                    handleFileSelect(file);
                });
            } else {
                // 单文件模式：只处理第一个文件
                handleFileSelect(e.target.files[0]);
            }
        }
    });
    
    // 单文件模式事件
    removeFileBtn.addEventListener('click', clearAll);
    convertBtn.addEventListener('click', performConversion);
    downloadBtn.addEventListener('click', downloadSRTFile);
    clearBtn.addEventListener('click', clearAll);
    
    // 批处理模式事件
    clearBatchBtn.addEventListener('click', clearBatchFiles);
    convertBatchBtn.addEventListener('click', performBatchConversion);
    batchClearBtn.addEventListener('click', clearAll);
    batchDownloadBtn.addEventListener('click', downloadBatchResults);
}

// 添加键盘快捷键支持
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl + Enter 转换
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (isBatchMode && !convertBatchBtn.disabled) {
                performBatchConversion();
            } else if (!isBatchMode && !convertBtn.disabled) {
                performConversion();
            }
        }
        
        // Ctrl + D 下载
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            if (isBatchMode && !batchDownloadBtn.disabled) {
                downloadBatchResults();
            } else if (!isBatchMode && !downloadBtn.disabled) {
                downloadSRTFile();
            }
        }
        
        // Esc 清除
        if (e.key === 'Escape') {
            clearAll();
        }
        
        // Ctrl + B 切换批处理模式
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            switchMode(isBatchMode ? 'single' : 'batch');
        }
    });
}

// 示例BCC数据用于演示
const exampleBCC = {
    "font_size": 0.4,
    "font_color": "#FFFFFF",
    "background_alpha": 0.5,
    "background_color": "#9C27B0",
    "Stroke": "none",
    "body": [
        {"from": 7.12, "to": 8.96, "location": 2, "content": "欢迎回来"},
        {"from": 12.45, "to": 15.23, "location": 2, "content": "今天我们来学习字幕格式转换"},
        {"from": 20.1, "to": 23.8, "location": 2, "content": "SRT是通用的字幕格式"},
        {"from": 30.5, "to": 34.2, "location": 2, "content": "转换完成后可以直接在视频播放器中使用"},
        {"from": 40.7, "to": 45.1, "location": 2, "content": "支持.bcc文件格式，如：112. Ability Tasks.bcc"}
    ]
};

// 页面加载时显示示例转换
function initExampleContent() {
    try {
        const exampleSRT = convertBCCtoSRT(JSON.stringify(exampleBCC), "示例文件.bcc");
        srtOutput.textContent = exampleSRT.content;
        subtitleCount.textContent = exampleSRT.entryCount;
        outputSize.textContent = formatFileSize(new Blob([exampleSRT.content]).size);
        conversionStatus.textContent = '示例内容';
        conversionStatus.style.color = '#6f7bf7';
    } catch (error) {
        console.error('示例转换错误:', error);
    }
}

// 初始化应用
function initApp() {
    initEventListeners();
    initKeyboardShortcuts();
    initExampleContent();
}

// 当页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
