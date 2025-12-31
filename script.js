// DOM元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const folderInput = document.getElementById('folderInput');
const selectedFileContainer = document.getElementById('selectedFileContainer');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFile');
const convertBtn = document.getElementById('convertBtn');
const batchConvertBtn = document.getElementById('batchConvertBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const srtOutput = document.getElementById('srtOutput');
const notification = document.getElementById('notification');
const subtitleCount = document.getElementById('subtitleCount');
const outputSize = document.getElementById('outputSize');
const conversionStatus = document.getElementById('conversionStatus');
const outputFormat = document.getElementById('outputFormat');
const batchProgress = document.getElementById('batchProgress');
const batchProgressBar = document.getElementById('batchProgressBar');
const batchProgressText = document.getElementById('batchProgressText');
const batchStatus = document.getElementById('batchStatus');
const batchResults = document.getElementById('batchResults');
const downloadAllBtn = document.getElementById('downloadAllBtn');

// 全局变量
let currentFile = null;
let srtContent = '';
let originalFileName = '';
let originalFileExtension = '';
let batchFiles = [];
let batchSRTFiles = [];

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

// 处理文件选择（单个文件）
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

// 处理文件夹选择（批量文件）
function handleFolderSelect(files) {
    if (!files || files.length === 0) return;
    
    // 筛选支持的文件格式
    const supportedFiles = Array.from(files).filter(file => {
        const fileName = file.name.toLowerCase();
        return fileName.endsWith('.bcc') || 
               fileName.endsWith('.json') || 
               fileName.endsWith('.txt');
    });
    
    if (supportedFiles.length === 0) {
        showNotification('文件夹中没有找到支持的.bcc、.json或.txt文件', 'error');
        return;
    }
    
    batchFiles = supportedFiles;
    
    // 显示批处理信息
    batchProgress.style.display = 'block';
    batchProgressText.textContent = `已选择 ${supportedFiles.length} 个文件`;
    batchProgressBar.style.width = '0%';
    batchStatus.textContent = '准备转换...';
    
    showNotification(`已选择 ${supportedFiles.length} 个文件进行批量转换`);
    
    // 隐藏单个文件区域
    selectedFileContainer.style.display = 'none';
    convertBtn.disabled = true;
    batchConvertBtn.disabled = false;
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
        
        return { srt, entryCount };
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
            srtContent = result.srt;
            
            // 显示转换结果
            srtOutput.textContent = srtContent;
            
            // 启用下载按钮
            downloadBtn.disabled = false;
            
            // 更新状态
            conversionStatus.textContent = '转换完成';
            conversionStatus.style.color = '#28a745';
            subtitleCount.textContent = result.entryCount;
            outputSize.textContent = formatFileSize(new Blob([srtContent]).size);
            
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
    
    batchSRTFiles = [];
    let successCount = 0;
    let failCount = 0;
    
    // 显示批处理进度
    batchProgress.style.display = 'block';
    batchProgressBar.style.width = '0%';
    batchStatus.textContent = '开始批量转换...';
    
    // 创建结果列表
    batchResults.innerHTML = '';
    batchResults.style.display = 'block';
    
    for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // 移除扩展名
        
        // 更新进度
        const progress = ((i + 1) / batchFiles.length * 100).toFixed(1);
        batchProgressBar.style.width = `${progress}%`;
        batchProgressText.textContent = `正在转换 ${i + 1}/${batchFiles.length}`;
        batchStatus.textContent = `正在处理: ${file.name}`;
        
        try {
            // 读取并转换文件
            const content = await readFileAsText(file);
            const result = convertBCCtoSRT(content);
            
            // 保存转换结果
            batchSRTFiles.push({
                name: `${fileName}.srt`,
                content: result.srt,
                size: new Blob([result.srt]).size,
                entryCount: result.entryCount,
                success: true
            });
            
            successCount++;
            
            // 添加结果项
            const resultItem = document.createElement('div');
            resultItem.className = 'batch-result-item success';
            resultItem.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span class="result-filename">${file.name}</span>
                <span class="result-info">→ ${fileName}.srt (${result.entryCount}条)</span>
            `;
            batchResults.appendChild(resultItem);
            
        } catch (error) {
            failCount++;
            batchSRTFiles.push({
                name: file.name,
                content: null,
                error: error.message,
                success: false
            });
            
            // 添加失败结果项
            const resultItem = document.createElement('div');
            resultItem.className = 'batch-result-item error';
            resultItem.innerHTML = `
                <i class="fas fa-times-circle"></i>
                <span class="result-filename">${file.name}</span>
                <span class="result-info">转换失败: ${error.message}</span>
            `;
            batchResults.appendChild(resultItem);
        }
    }
    
    // 完成处理
    batchProgressBar.style.width = '100%';
    batchProgressText.textContent = `转换完成 ${successCount}成功/${failCount}失败`;
    batchStatus.textContent = '批量转换完成';
    
    // 显示总结果
    const summary = document.createElement('div');
    summary.className = 'batch-summary';
    summary.innerHTML = `
        <h4><i class="fas fa-list-check"></i> 转换完成</h4>
        <p>成功: ${successCount} 个文件</p>
        <p>失败: ${failCount} 个文件</p>
    `;
    batchResults.appendChild(summary);
    
    // 启用下载所有按钮
    if (successCount > 0) {
        downloadAllBtn.disabled = false;
    }
    
    showNotification(`批量转换完成: ${successCount}个成功, ${failCount}个失败`, successCount > 0 ? 'success' : 'error');
}

// 读取文件为文本
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('读取文件失败'));
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

// 下载所有批量转换的文件
function downloadAllSRTFiles() {
    if (batchSRTFiles.length === 0 || batchSRTFiles.filter(f => f.success).length === 0) return;
    
    // 创建ZIP文件
    const zip = new JSZip();
    
    // 添加成功的文件到ZIP
    batchSRTFiles.filter(file => file.success).forEach(file => {
        zip.file(file.name, file.content);
    });
    
    // 生成并下载ZIP
    zip.generateAsync({ type: 'blob' })
        .then(function(content) {
            // 下载ZIP文件
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = '批量转换字幕.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification(`已下载 ${batchSRTFiles.filter(f => f.success).length} 个SRT文件`);
        })
        .catch(function(error) {
            console.error('ZIP生成失败:', error);
            showNotification('ZIP文件生成失败', 'error');
        });
}

// 清除所有内容
function clearAll() {
    currentFile = null;
    srtContent = '';
    originalFileName = '';
    originalFileExtension = '';
    batchFiles = [];
    batchSRTFiles = [];
    
    // 重置UI
    selectedFileContainer.style.display = 'none';
    srtOutput.textContent = '';
    convertBtn.disabled = true;
    downloadBtn.disabled = true;
    batchConvertBtn.disabled = true;
    downloadAllBtn.disabled = true;
    batchProgress.style.display = 'none';
    batchResults.style.display = 'none';
    batchResults.innerHTML = '';
    subtitleCount.textContent = '0';
    outputSize.textContent = '0 KB';
    conversionStatus.textContent = '等待转换';
    conversionStatus.style.color = '#333';
    
    showNotification('已清除所有内容');
}

// 初始化事件监听器
function initEventListeners() {
    // 单个文件上传
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
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    // 批量文件夹上传
    folderInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFolderSelect(e.target.files);
        }
    });
    
    removeFileBtn.addEventListener('click', clearAll);
    convertBtn.addEventListener('click', performConversion);
    batchConvertBtn.addEventListener('click', performBatchConversion);
    downloadBtn.addEventListener('click', downloadSRTFile);
    downloadAllBtn.addEventListener('click', downloadAllSRTFiles);
    clearBtn.addEventListener('click', clearAll);
}

// 添加键盘快捷键支持
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl + Enter 转换
        if (e.ctrlKey && e.key === 'Enter' && !convertBtn.disabled) {
            e.preventDefault();
            performConversion();
        }
        
        // Ctrl + Shift + Enter 批量转换
        if (e.ctrlKey && e.shiftKey && e.key === 'Enter' && !batchConvertBtn.disabled) {
            e.preventDefault();
            performBatchConversion();
        }
        
        // Ctrl + D 下载单个
        if (e.ctrlKey && e.key === 'd' && !downloadBtn.disabled) {
            e.preventDefault();
            downloadSRTFile();
        }
        
        // Ctrl + Shift + D 下载所有
        if (e.ctrlKey && e.shiftKey && e.key === 'd' && !downloadAllBtn.disabled) {
            e.preventDefault();
            downloadAllSRTFiles();
        }
        
        // Esc 清除
        if (e.key === 'Escape') {
            clearAll();
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
        srtOutput.textContent = result.srt;
        subtitleCount.textContent = '5';
        outputSize.textContent = formatFileSize(new Blob([result.srt]).size);
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
