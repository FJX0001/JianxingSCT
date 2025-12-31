[file name]: script.js
[file content begin]
// DOM元素
const uploadArea = document.getElementById('uploadArea');
const batchUploadArea = document.getElementById('batchUploadArea');
const fileInput = document.getElementById('fileInput');
const batchFileInput = document.getElementById('batchFileInput');
const selectedFileContainer = document.getElementById('selectedFileContainer');
const batchFilesContainer = document.getElementById('batchFilesContainer');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFile');
const removeBatchFilesBtn = document.getElementById('removeBatchFiles');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const batchDownloadBtn = document.getElementById('batchDownloadBtn');
const srtOutput = document.getElementById('srtOutput');
const notification = document.getElementById('notification');
const subtitleCount = document.getElementById('subtitleCount');
const outputSize = document.getElementById('outputSize');
const conversionStatus = document.getElementById('conversionStatus');
const outputFormat = document.getElementById('outputFormat');
const uploadText = document.getElementById('uploadText');
const uploadHint = document.getElementById('uploadHint');
const convertBtnText = document.getElementById('convertBtnText');
const downloadBtnText = document.getElementById('downloadBtnText');
const editorTitle = document.getElementById('editorTitle');
const batchFileCount = document.getElementById('batchFileCount');
const batchFilesList = document.getElementById('batchFilesList');
const singleModeBtn = document.getElementById('singleModeBtn');
const batchModeBtn = document.getElementById('batchModeBtn');
const batchConversionInfo = document.getElementById('batchConversionInfo');
const convertedCount = document.getElementById('convertedCount');
const totalFiles = document.getElementById('totalFiles');

// 全局变量
let currentFile = null;
let batchFiles = [];
let srtContent = '';
let originalFileName = '';
let originalFileExtension = '';
let isBatchMode = false;
let batchResults = [];

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
    isBatchMode = mode === 'batch';
    
    // 更新按钮状态
    if (isBatchMode) {
        singleModeBtn.classList.remove('active');
        batchModeBtn.classList.add('active');
        uploadArea.style.display = 'none';
        batchUploadArea.style.display = 'block';
        selectedFileContainer.style.display = 'none';
        batchFilesContainer.style.display = 'none';
        convertBtnText.textContent = '批量转换字幕';
        downloadBtn.style.display = 'none';
        batchDownloadBtn.style.display = 'flex';
        editorTitle.textContent = '批量转换结果';
        batchConversionInfo.style.display = 'block';
        uploadText.textContent = '点击选择或拖拽多个BCC字幕文件到此区域';
        uploadHint.textContent = '支持批量选择.bcc、.json、.txt格式的字幕文件';
    } else {
        singleModeBtn.classList.add('active');
        batchModeBtn.classList.remove('active');
        uploadArea.style.display = 'block';
        batchUploadArea.style.display = 'none';
        selectedFileContainer.style.display = 'none';
        batchFilesContainer.style.display = 'none';
        convertBtnText.textContent = '转换字幕格式';
        downloadBtn.style.display = 'flex';
        batchDownloadBtn.style.display = 'none';
        editorTitle.textContent = 'SRT字幕内容';
        batchConversionInfo.style.display = 'none';
        uploadText.textContent = '点击选择或拖拽BCC字幕文件到此区域';
        uploadHint.textContent = '支持.bcc、.json格式或包含BCC字幕内容的.txt文件';
    }
    
    // 清除当前内容
    clearAll();
}

// 处理单个文件选择
function handleFileSelect(file) {
    if (!file) return;
    
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

// 处理批量文件选择
function handleBatchFileSelect(files) {
    if (!files || files.length === 0) return;
    
    // 清空之前的文件列表
    batchFiles = [];
    batchResults = [];
    batchFilesList.innerHTML = '';
    
    // 过滤有效的字幕文件
    const validFiles = Array.from(files).filter(file => {
        const isBcc = file.name.endsWith('.bcc');
        const isJson = file.name.endsWith('.json');
        const isText = file.name.endsWith('.txt');
        return isBcc || isJson || isText;
    });
    
    if (validFiles.length === 0) {
        showNotification('请选择.bcc、.json或.txt格式的字幕文件', 'error');
        return;
    }
    
    // 更新文件列表
    batchFiles = validFiles;
    batchFileCount.textContent = batchFiles.length;
    totalFiles.textContent = batchFiles.length;
    convertedCount.textContent = '0';
    
    // 显示文件列表
    batchFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'batch-file-item';
        fileItem.innerHTML = `
            <div class="batch-file-info">
                <i class="fas fa-file-alt batch-file-icon"></i>
                <div class="batch-file-name">${file.name}</div>
            </div>
            <div class="batch-file-status">待处理</div>
        `;
        batchFilesList.appendChild(fileItem);
    });
    
    // 显示文件容器
    batchFilesContainer.style.display = 'block';
    convertBtn.disabled = false;
    batchDownloadBtn.disabled = true;
    
    // 清空输出区域
    srtOutput.textContent = '';
    conversionStatus.textContent = '准备批量转换';
    conversionStatus.style.color = '#333';
    subtitleCount.textContent = '0';
    outputSize.textContent = '0 KB';
    
    showNotification(`已选择 ${batchFiles.length} 个文件`);
}

// 更新批量文件状态
function updateBatchFileStatus(index, status, message = '') {
    const fileItems = batchFilesList.querySelectorAll('.batch-file-item');
    if (fileItems[index]) {
        const statusElement = fileItems[index].querySelector('.batch-file-status');
        statusElement.textContent = message || status;
        statusElement.className = `batch-file-status ${status}`;
    }
}

// 转换BCC到SRT
function convertBCCtoSRT(bccData) {
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
            count: entryCount,
            size: new Blob([srt]).size
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
            const result = convertBCCtoSRT(bccContent);
            srtContent = result.content;
            
            // 显示转换结果
            srtOutput.textContent = srtContent;
            
            // 启用下载按钮
            downloadBtn.disabled = false;
            
            // 更新状态
            subtitleCount.textContent = result.count;
            outputSize.textContent = formatFileSize(result.size);
            conversionStatus.textContent = '转换完成';
            conversionStatus.style.color = '#28a745';
            
            showNotification(`成功转换 ${result.count} 条字幕`);
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
    
    // 重置结果
    batchResults = [];
    srtOutput.textContent = '';
    conversionStatus.textContent = '批量转换中...';
    conversionStatus.style.color = '#ffc107';
    batchDownloadBtn.disabled = true;
    convertBtn.disabled = true;
    
    let successCount = 0;
    let failCount = 0;
    let totalSubtitles = 0;
    
    // 逐个处理文件
    for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        
        try {
            // 更新文件状态为处理中
            updateBatchFileStatus(i, 'processing', '处理中...');
            
            // 读取文件内容
            const fileContent = await readFileAsText(file);
            
            // 转换文件
            const result = convertBCCtoSRT(fileContent);
            
            // 保存结果
            batchResults.push({
                name: file.name.replace(/\.[^/.]+$/, "") + '.srt',
                content: result.content,
                originalName: file.name,
                count: result.count,
                size: result.size
            });
            
            // 更新文件状态为成功
            updateBatchFileStatus(i, 'success', '转换成功');
            successCount++;
            totalSubtitles += result.count;
            
            // 更新进度
            convertedCount.textContent = successCount + failCount;
            
            // 显示当前文件的转换结果摘要
            srtOutput.textContent += `文件 ${i+1}: ${file.name}\n`;
            srtOutput.textContent += `  状态: 转换成功 (${result.count} 条字幕)\n\n`;
            
        } catch (error) {
            // 更新文件状态为失败
            updateBatchFileStatus(i, 'error', '转换失败');
            failCount++;
            
            // 保存错误结果
            batchResults.push({
                name: file.name.replace(/\.[^/.]+$/, "") + '.srt',
                content: '',
                originalName: file.name,
                error: error.message,
                count: 0,
                size: 0
            });
            
            // 更新进度
            convertedCount.textContent = successCount + failCount;
            
            // 显示错误信息
            srtOutput.textContent += `文件 ${i+1}: ${file.name}\n`;
            srtOutput.textContent += `  状态: 转换失败 (${error.message})\n\n`;
        }
    }
    
    // 更新总体状态
    subtitleCount.textContent = totalSubtitles;
    const totalSize = batchResults.reduce((sum, result) => sum + result.size, 0);
    outputSize.textContent = formatFileSize(totalSize);
    
    if (failCount === 0) {
        conversionStatus.textContent = `批量转换完成 (${successCount}/${batchFiles.length})`;
        conversionStatus.style.color = '#28a745';
        showNotification(`批量转换完成！成功转换 ${successCount} 个文件，共 ${totalSubtitles} 条字幕`);
    } else if (successCount === 0) {
        conversionStatus.textContent = `批量转换失败 (${failCount}/${batchFiles.length})`;
        conversionStatus.style.color = '#dc3545';
        showNotification(`批量转换失败！所有文件均转换失败`, 'error');
    } else {
        conversionStatus.textContent = `批量转换完成 (${successCount}成功/${failCount}失败)`;
        conversionStatus.style.color = '#ff9800';
        showNotification(`批量转换完成！成功 ${successCount} 个，失败 ${failCount} 个`, 'warning');
    }
    
    // 如果有成功转换的文件，启用批量下载按钮
    if (successCount > 0) {
        batchDownloadBtn.disabled = false;
    }
    
    convertBtn.disabled = false;
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

// 批量下载所有SRT文件
function downloadBatchSRTFiles() {
    if (batchResults.length === 0 || batchResults.every(r => r.error)) return;
    
    // 创建ZIP文件
    const zip = new JSZip();
    
    // 添加成功转换的文件到ZIP
    batchResults.forEach(result => {
        if (result.content && !result.error) {
            zip.file(result.name, result.content);
        }
    });
    
    // 生成ZIP文件并下载
    zip.generateAsync({ type: "blob" })
        .then(function(content) {
            // 使用FileSaver保存文件
            saveAs(content, "批量转换的SRT字幕.zip");
            showNotification(`批量下载完成！已打包 ${batchResults.filter(r => r.content && !r.error).length} 个文件`);
        })
        .catch(function(error) {
            console.error('ZIP文件生成失败:', error);
            showNotification('批量下载失败，请重试', 'error');
        });
}

// 清除所有内容
function clearAll() {
    currentFile = null;
    batchFiles = [];
    batchResults = [];
    srtContent = '';
    originalFileName = '';
    originalFileExtension = '';
    
    // 重置UI
    selectedFileContainer.style.display = 'none';
    batchFilesContainer.style.display = 'none';
    srtOutput.textContent = '';
    convertBtn.disabled = true;
    downloadBtn.disabled = true;
    batchDownloadBtn.disabled = true;
    subtitleCount.textContent = '0';
    outputSize.textContent = '0 KB';
    conversionStatus.textContent = '等待转换';
    conversionStatus.style.color = '#333';
    convertedCount.textContent = '0';
    totalFiles.textContent = '0';
    
    if (!isBatchMode) {
        // 恢复示例内容
        initExampleContent();
    }
    
    showNotification('已清除所有内容');
}

// 初始化事件监听器
function initEventListeners() {
    // 单个文件上传区域
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
                handleBatchFileSelect(e.dataTransfer.files);
            } else {
                handleFileSelect(e.dataTransfer.files[0]);
            }
        }
    });
    
    // 批量文件上传区域
    batchUploadArea.addEventListener('click', () => batchFileInput.click());
    
    batchUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        batchUploadArea.classList.add('dragover');
    });
    
    batchUploadArea.addEventListener('dragleave', () => {
        batchUploadArea.classList.remove('dragover');
    });
    
    batchUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        batchUploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            handleBatchFileSelect(e.dataTransfer.files);
        }
    });
    
    // 文件输入事件
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    batchFileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleBatchFileSelect(e.target.files);
        }
    });
    
    // 按钮事件
    removeFileBtn.addEventListener('click', clearAll);
    removeBatchFilesBtn.addEventListener('click', clearAll);
    
    convertBtn.addEventListener('click', () => {
        if (isBatchMode) {
            performBatchConversion();
        } else {
            performConversion();
        }
    });
    
    downloadBtn.addEventListener('click', downloadSRTFile);
    batchDownloadBtn.addEventListener('click', downloadBatchSRTFiles);
    clearBtn.addEventListener('click', clearAll);
    
    // 模式切换按钮
    singleModeBtn.addEventListener('click', () => switchMode('single'));
    batchModeBtn.addEventListener('click', () => switchMode('batch'));
}

// 添加键盘快捷键支持
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl + Enter 转换
        if (e.ctrlKey && e.key === 'Enter' && !convertBtn.disabled) {
            e.preventDefault();
            if (isBatchMode) {
                performBatchConversion();
            } else {
                performConversion();
            }
        }
        
        // Ctrl + D 下载
        if (e.ctrlKey && e.key === 'd' && !downloadBtn.disabled) {
            e.preventDefault();
            if (isBatchMode && !batchDownloadBtn.disabled) {
                downloadBatchSRTFiles();
            } else if (!downloadBtn.disabled) {
                downloadSRTFile();
            }
        }
        
        // Esc 清除
        if (e.key === 'Escape') {
            clearAll();
        }
        
        // Ctrl + 1 切换单个模式
        if (e.ctrlKey && e.key === '1') {
            e.preventDefault();
            switchMode('single');
        }
        
        // Ctrl + 2 切换批量模式
        if (e.ctrlKey && e.key === '2') {
            e.preventDefault();
            switchMode('batch');
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
        const result = convertBCCtoSRT(JSON.stringify(exampleBCC));
        srtOutput.textContent = result.content;
        subtitleCount.textContent = result.count;
        outputSize.textContent = formatFileSize(result.size);
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
    
    // 默认显示单个文件模式
    switchMode('single');
}

// 当页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
[file content end]
