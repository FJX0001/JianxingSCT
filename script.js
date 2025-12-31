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
const batchDownloadBtn = document.getElementById('batchDownloadBtn');
const srtOutput = document.getElementById('srtOutput');
const notification = document.getElementById('notification');
const subtitleCount = document.getElementById('subtitleCount');
const outputSize = document.getElementById('outputSize');
const conversionStatus = document.getElementById('conversionStatus');
const outputFormat = document.getElementById('outputFormat');
const uploadText = document.getElementById('uploadText');
const uploadHint = document.getElementById('uploadHint');
const batchHint = document.getElementById('batchHint');
const batchModeToggle = document.getElementById('batchModeToggle');
const batchFilesContainer = document.getElementById('batchFilesContainer');
const batchFilesList = document.getElementById('batchFilesList');
const batchFileCount = document.getElementById('batchFileCount');
const batchProgressContainer = document.getElementById('batchProgressContainer');
const batchProgressFill = document.getElementById('batchProgressFill');
const batchProgressStatus = document.getElementById('batchProgressStatus');
const batchConvertedCount = document.getElementById('batchConvertedCount');
const batchTotalCount = document.getElementById('batchTotalCount');
const batchSuccessRate = document.getElementById('batchSuccessRate');
const batchTotalSize = document.getElementById('batchTotalSize');

// 全局变量
let currentFile = null;
let currentFiles = [];
let srtContent = '';
let originalFileName = '';
let originalFileExtension = '';
let batchResults = [];
let isBatchMode = false;

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

// 更新批量进度显示
function updateBatchProgress(converted, total, successCount, totalSize) {
    const progress = Math.round((converted / total) * 100);
    batchProgressFill.style.width = `${progress}%`;
    batchConvertedCount.textContent = converted;
    batchTotalCount.textContent = total;
    batchSuccessRate.textContent = total > 0 ? Math.round((successCount / total) * 100) + '%' : '0%';
    batchTotalSize.textContent = formatFileSize(totalSize);
    
    if (converted === 0) {
        batchProgressStatus.textContent = '准备中...';
    } else if (converted < total) {
        batchProgressStatus.textContent = `转换中 ${converted}/${total}`;
    } else {
        batchProgressStatus.textContent = '转换完成';
        batchDownloadBtn.disabled = false;
        showNotification(`批量转换完成！成功 ${successCount}/${total} 个文件`, 'success');
    }
}

// 添加文件到批量列表
function addFileToBatchList(file, index) {
    const fileItem = document.createElement('div');
    fileItem.className = 'batch-file-item';
    fileItem.dataset.index = index;
    
    fileItem.innerHTML = `
        <div class="batch-file-info">
            <i class="fas fa-file-alt" style="color: #00a1d6;"></i>
            <div style="flex: 1;">
                <div class="batch-file-name">${file.name}</div>
                <div class="batch-file-size">${formatFileSize(file.size)}</div>
            </div>
            <span class="batch-file-status pending">等待</span>
        </div>
    `;
    
    batchFilesList.appendChild(fileItem);
    return fileItem;
}

// 更新批量文件状态
function updateBatchFileStatus(index, status, message = '') {
    const fileItem = document.querySelector(`.batch-file-item[data-index="${index}"]`);
    if (!fileItem) return;
    
    const statusElement = fileItem.querySelector('.batch-file-status');
    statusElement.className = `batch-file-status ${status}`;
    
    switch(status) {
        case 'success':
            statusElement.textContent = '成功';
            break;
        case 'error':
            statusElement.textContent = message || '失败';
            break;
        case 'processing':
            statusElement.textContent = '转换中';
            statusElement.className = 'batch-file-status pending';
            break;
        default:
            statusElement.textContent = '等待';
    }
}

// 处理文件选择
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
function handleBatchFilesSelect(files) {
    if (!files || files.length === 0) return;
    
    // 清空之前的文件
    currentFiles = [];
    batchResults = [];
    batchFilesList.innerHTML = '';
    
    // 过滤有效的字幕文件
    const validFiles = Array.from(files).filter(file => {
        const fileName = file.name.toLowerCase();
        return fileName.endsWith('.bcc') || 
               fileName.endsWith('.json') || 
               fileName.endsWith('.txt') ||
               file.type === 'application/json' ||
               file.type === 'text/plain';
    });
    
    if (validFiles.length === 0) {
        showNotification('请选择.bcc、.json或.txt格式的字幕文件', 'error');
        return;
    }
    
    // 更新UI
    currentFiles = validFiles;
    batchFileCount.textContent = validFiles.length;
    batchFilesContainer.style.display = 'block';
    convertBtn.disabled = false;
    
    // 显示批量文件列表
    validFiles.forEach((file, index) => {
        addFileToBatchList(file, index);
    });
    
    showNotification(`已选择 ${validFiles.length} 个字幕文件`, 'success');
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
        
        return { content: srt, entryCount: entryCount };
    } catch (error) {
        console.error('转换错误:', error);
        throw new Error(`BCC格式转换失败: ${error.message}`);
    }
}

// 执行单文件转换
function performSingleConversion() {
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
            
            // 更新计数
            subtitleCount.textContent = result.entryCount;
            outputSize.textContent = formatFileSize(new Blob([srtContent]).size);
            
            // 启用下载按钮
            downloadBtn.disabled = false;
            
            // 更新状态
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
    if (!currentFiles.length) return;
    
    // 重置结果
    batchResults = [];
    batchProgressContainer.style.display = 'block';
    batchDownloadBtn.style.display = 'flex';
    batchDownloadBtn.disabled = true;
    
    // 初始化进度
    let convertedCount = 0;
    let successCount = 0;
    let totalSize = 0;
    
    updateBatchProgress(0, currentFiles.length, 0, 0);
    
    // 遍历所有文件进行转换
    for (let i = 0; i < currentFiles.length; i++) {
        const file = currentFiles[i];
        
        // 更新当前文件状态
        updateBatchFileStatus(i, 'processing');
        
        try {
            // 读取文件内容
            const content = await readFileAsText(file);
            
            // 转换字幕
            const result = convertBCCtoSRT(content);
            const fileName = file.name.replace(/\.[^/.]+$/, ""); // 移除扩展名
            
            // 保存转换结果
            batchResults.push({
                fileName: fileName,
                content: result.content,
                entryCount: result.entryCount,
                size: result.content.length,
                success: true
            });
            
            // 更新状态
            updateBatchFileStatus(i, 'success');
            successCount++;
            totalSize += result.content.length;
            
        } catch (error) {
            console.error(`文件 ${file.name} 转换失败:`, error);
            
            batchResults.push({
                fileName: file.name,
                content: '',
                entryCount: 0,
                size: 0,
                success: false,
                error: error.message
            });
            
            updateBatchFileStatus(i, 'error', error.message);
        }
        
        convertedCount++;
        updateBatchProgress(convertedCount, currentFiles.length, successCount, totalSize);
        
        // 为了避免界面卡顿，添加微小延迟
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // 显示第一个成功转换的结果
    const firstSuccess = batchResults.find(r => r.success);
    if (firstSuccess) {
        srtOutput.textContent = firstSuccess.content;
        subtitleCount.textContent = firstSuccess.entryCount;
        outputSize.textContent = formatFileSize(firstSuccess.size);
        conversionStatus.textContent = '批量转换完成';
        conversionStatus.style.color = '#28a745';
    }
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

// 下载批量SRT文件
async function downloadBatchSRTFiles() {

    if (!confirm('即将下载ZIP文件。\n\n如果下载后出现安全警告，请：\n1. 右键点击ZIP文件\n2. 选择"属性"\n3. 在常规界面的最底部\n4. 找到安全，勾选"解除锁定"\n5. 点击"确定"\n\n点击"确定"开始下载。')) {
        return;
    }
    if (batchResults.length === 0) return;
    
    try {
        const zip = new JSZip();
        let successCount = 0;
        
        // 添加成功的转换结果到ZIP
        batchResults.forEach(result => {
            if (result.success && result.content) {
                zip.file(`${result.fileName}.srt`, result.content);
                successCount++;
            }
        });
        
        if (successCount === 0) {
            showNotification('没有成功的转换结果可供下载', 'error');
            return;
        }
        
        // 添加一个说明文件到ZIP，这可以帮助避免安全警告
        const readmeContent = `这是由BCC字幕转换工具生成的SRT字幕文件包。
        
包含以下文件：
${batchResults.filter(r => r.success).map(r => `- ${r.fileName}.srt (${r.entryCount}条字幕)`).join('\n')}

转换工具：BCC字幕转SRT格式转换工具
转换时间：${new Date().toLocaleString()}
工具地址：https://fjx0001.github.io/JianxingSCT/

注意：这些文件是从您上传的BCC字幕文件转换而来，安全可靠。`;

        zip.file('README_说明.txt', readmeContent);
        
        // 生成ZIP文件 - 使用DEFLATE压缩算法，这是最兼容的格式
        const content = await zip.generateAsync({ 
            type: 'blob',
            compression: "DEFLATE",
            compressionOptions: {
                level: 6 // 中等压缩级别
            }
        });
        
        // 创建下载链接
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        
        // 使用更简单的文件名，避免特殊字符
        const timestamp = new Date().getTime();
        a.download = `bcc_srt_conversion_${timestamp}.zip`;
        
        // 尝试使用不同的下载方法
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // 释放URL对象
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
        
        showNotification(`已生成包含 ${successCount} 个SRT文件的ZIP压缩包，正在下载...`, 'success');
        setTimeout(() => {
            showNotification('如果下载的文件被系统标记为不安全，请右键点击ZIP文件，选择"属性"，然后勾选"解除锁定"选项。', 'warning');
        }, 1500);
        
    } catch (error) {
        console.error('ZIP文件创建失败:', error);
        showNotification('ZIP文件创建失败: ' + error.message, 'error');
    }
}

// 清除所有内容
function clearAll() {
    currentFile = null;
    currentFiles = [];
    batchResults = [];
    srtContent = '';
    originalFileName = '';
    originalFileExtension = '';
    
    // 重置UI
    selectedFileContainer.style.display = 'none';
    batchFilesContainer.style.display = 'none';
    batchProgressContainer.style.display = 'none';
    batchDownloadBtn.style.display = 'none';
    srtOutput.textContent = '';
    convertBtn.disabled = true;
    downloadBtn.disabled = true;
    batchDownloadBtn.disabled = true;
    subtitleCount.textContent = '0';
    outputSize.textContent = '0 KB';
    conversionStatus.textContent = '等待转换';
    conversionStatus.style.color = '#333';
    
    // 重置批量进度
    batchFilesList.innerHTML = '';
    batchFileCount.textContent = '0';
    batchProgressFill.style.width = '0%';
    
    showNotification('已清除所有内容');
}

// 切换批量模式
function toggleBatchMode() {
    isBatchMode = batchModeToggle.checked;
    
    // 更新文件输入属性
    fileInput.multiple = isBatchMode;
    
    // 更新UI文本
    if (isBatchMode) {
        uploadText.textContent = '点击选择或拖拽多个BCC字幕文件到此区域';
        uploadHint.textContent = '支持批量选择.bcc、.json、.txt格式的BCC字幕文件';
        batchHint.innerHTML = '<i class="fas fa-info-circle"></i> 在批量模式下，您可以一次性选择多个BCC文件进行转换';
        downloadBtn.style.display = 'none';
        batchDownloadBtn.style.display = 'flex';
    } else {
        uploadText.textContent = '点击选择或拖拽BCC字幕文件到此区域';
        uploadHint.textContent = '支持.bcc、.json格式或包含BCC字幕内容的.txt文件';
        batchHint.innerHTML = '<i class="fas fa-info-circle"></i> 在批量模式下，您可以一次性选择多个BCC文件进行转换';
        downloadBtn.style.display = 'flex';
        batchDownloadBtn.style.display = 'none';
        
        // 清除批量文件
        if (currentFiles.length > 0) {
            currentFiles = [];
            batchFilesContainer.style.display = 'none';
            batchProgressContainer.style.display = 'none';
        }
    }
    
    // 清除当前选择
    clearAll();
}

// 初始化事件监听器
function initEventListeners() {
    // 上传区域点击事件
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // 拖放事件
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
                handleBatchFilesSelect(e.dataTransfer.files);
            } else {
                handleFileSelect(e.dataTransfer.files[0]);
            }
        }
    });
    
    // 文件选择事件
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            if (isBatchMode) {
                handleBatchFilesSelect(e.target.files);
            } else {
                handleFileSelect(e.target.files[0]);
            }
        }
    });
    
    // 按钮事件
    removeFileBtn.addEventListener('click', clearAll);
    convertBtn.addEventListener('click', () => {
        if (isBatchMode) {
            performBatchConversion();
        } else {
            performSingleConversion();
        }
    });
    downloadBtn.addEventListener('click', downloadSRTFile);
    batchDownloadBtn.addEventListener('click', downloadBatchSRTFiles);
    clearBtn.addEventListener('click', clearAll);
    
    // 批量模式切换
    batchModeToggle.addEventListener('change', toggleBatchMode);
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
                performSingleConversion();
            }
        }
        
        // Ctrl + D 下载
        if (e.ctrlKey && e.key === 'd' && !downloadBtn.disabled && !isBatchMode) {
            e.preventDefault();
            downloadSRTFile();
        }
        
        // Ctrl + Shift + D 批量下载
        if (e.ctrlKey && e.shiftKey && e.key === 'D' && !batchDownloadBtn.disabled && isBatchMode) {
            e.preventDefault();
            downloadBatchSRTFiles();
        }
        
        // Esc 清除
        if (e.key === 'Escape') {
            clearAll();
        }
        
        // B 切换批量模式
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            batchModeToggle.checked = !batchModeToggle.checked;
            toggleBatchMode();
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
        subtitleCount.textContent = '5';
        outputSize.textContent = formatFileSize(new Blob([result.content]).size);
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
    toggleBatchMode(); // 初始化批量模式状态
}

// 当页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);