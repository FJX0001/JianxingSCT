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

// 全局变量
let currentFile = null;
let srtContent = '';
let originalFileName = '';
let originalFileExtension = '';

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
        
        // 更新计数
        subtitleCount.textContent = entryCount;
        outputSize.textContent = formatFileSize(new Blob([srt]).size);
        
        return srt;
    } catch (error) {
        console.error('转换错误:', error);
        throw new Error(`BCC格式转换失败: ${error.message}`);
    }
}

// 执行转换
function performConversion() {
    if (!currentFile) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            conversionStatus.textContent = '转换中...';
            conversionStatus.style.color = '#ffc107';
            
            const bccContent = e.target.result;
            srtContent = convertBCCtoSRT(bccContent);
            
            // 显示转换结果
            srtOutput.textContent = srtContent;
            
            // 启用下载按钮
            downloadBtn.disabled = false;
            
            // 更新状态
            conversionStatus.textContent = '转换完成';
            conversionStatus.style.color = '#28a745';
            
            showNotification(`成功转换 ${subtitleCount.textContent} 条字幕`);
        } catch (error) {
            srtOutput.textContent = `转换错误: ${error.message}`;
            conversionStatus.textContent = '转换失败';
            conversionStatus.style.color = '#dc3545';
            showNotification(`转换失败: ${error.message}`, 'error');
        }
    };
    
    reader.readAsText(currentFile);
}

// 下载SRT文件
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

// 清除所有内容
function clearAll() {
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
    
    showNotification('已清除所有内容');
}

// 初始化事件监听器
function initEventListeners() {
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
    
    removeFileBtn.addEventListener('click', clearAll);
    convertBtn.addEventListener('click', performConversion);
    downloadBtn.addEventListener('click', downloadSRTFile);
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
        
        // Ctrl + D 下载
        if (e.ctrlKey && e.key === 'd' && !downloadBtn.disabled) {
            e.preventDefault();
            downloadSRTFile();
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
        const exampleSRT = convertBCCtoSRT(JSON.stringify(exampleBCC));
        srtOutput.textContent = exampleSRT;
        subtitleCount.textContent = '5';
        outputSize.textContent = formatFileSize(new Blob([exampleSRT]).size);
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
