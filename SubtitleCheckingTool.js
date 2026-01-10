// DOM元素
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const dropArea = document.getElementById('dropArea');
const srtContent = document.getElementById('srtContent');
const checkBtn = document.getElementById('checkBtn');
const clearBtn = document.getElementById('clearBtn');
const exampleBtn = document.getElementById('exampleBtn');
const fixBtn = document.getElementById('fixBtn');
const exportBtn = document.getElementById('exportBtn');
const resultsContainer = document.getElementById('resultsContainer');
const loadingIndicator = document.getElementById('loadingIndicator');

// 结果元素
const totalSubtitles = document.getElementById('totalSubtitles');
const totalErrors = document.getElementById('totalErrors');
const totalWarnings = document.getElementById('totalWarnings');
const totalDuration = document.getElementById('totalDuration');
const timeline = document.getElementById('timeline');
const maxTime = document.getElementById('maxTime');
const errorsList = document.getElementById('errorsList');

// 示例SRT内容
const exampleSRT = `1
00:00:01,000 --> 00:00:04,000
欢迎使用SRT字幕检查工具

2
00:00:05,000 --> 00:00:09,000
本工具将帮助您检测字幕中的各种问题

3
00:00:10,500 --> 00:00:14,200
包括时间码格式错误、时间重叠问题等

4
00:00:14,500 --> 00:00:18,000
序号不连续、文本过长等常见问题

5
00:00:20,000 --> 00:00:24,000
这里是故意添加的错误示例：

6
00:00:25,000 --> 00:00:30,000
这段字幕的时间码格式不正确

7
00:00:31,500 --> 00:00:35,800
时间重叠示例

8
00:00:36,000 --> 00:00:40,000
这段字幕的文本过长，可能会超出屏幕显示范围，影响观看体验

9
00:00:41,000 --> 00:00:46,000
正常字幕示例

10
00:00:47,500 --> 00:00:52,000
最后一条字幕`;

// 当前解析的字幕数据
let currentSubtitles = [];
let currentErrors = [];
let currentWarnings = [];

// 事件监听器
browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
dropArea.addEventListener('dragover', handleDragOver);
dropArea.addEventListener('drop', handleDrop);
checkBtn.addEventListener('click', checkSRT);
clearBtn.addEventListener('click', clearContent);
exampleBtn.addEventListener('click', loadExample);
fixBtn.addEventListener('click', showFixSuggestions);
exportBtn.addEventListener('click', exportCorrectedSRT);

// 处理文件选择
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.textContent = `已选择: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    fileInfo.style.color = 'var(--primary-color)';
    
    readFile(file);
}

// 处理拖放
function handleDragOver(event) {
    event.preventDefault();
    dropArea.style.borderColor = 'var(--primary-color)';
    dropArea.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
}

function handleDrop(event) {
    event.preventDefault();
    dropArea.style.borderColor = 'var(--border-color)';
    dropArea.style.backgroundColor = '';
    
    const file = event.dataTransfer.files[0];
    if (!file) return;
    
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.textContent = `已选择: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    fileInfo.style.color = 'var(--primary-color)';
    
    readFile(file);
}

// 读取文件内容
function readFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        srtContent.value = e.target.result;
    };
    reader.readAsText(file);
}

// 清空内容
function clearContent() {
    srtContent.value = '';
    document.getElementById('fileInfo').textContent = '';
    resultsContainer.classList.add('hidden');
    loadingIndicator.classList.add('hidden');
}

// 加载示例
function loadExample() {
    srtContent.value = exampleSRT;
    document.getElementById('fileInfo').textContent = '已加载示例字幕';
    document.getElementById('fileInfo').style.color = 'var(--primary-color)';
}

// 检查SRT
function checkSRT() {
    const content = srtContent.value.trim();
    if (!content) {
        alert('请输入或上传SRT字幕内容');
        return;
    }
    
    // 显示加载指示器
    resultsContainer.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');
    
    // 模拟处理时间
    setTimeout(() => {
        parseSRT(content);
        displayResults();
    }, 500);
}

// 解析SRT内容
function parseSRT(content) {
    currentSubtitles = [];
    currentErrors = [];
    currentWarnings = [];
    
    const lines = content.split('\n');
    let i = 0;
    let subtitleIndex = 0;
    
    while (i < lines.length) {
        // 跳过空行
        if (lines[i].trim() === '') {
            i++;
            continue;
        }
        
        // 解析序号
        let index;
        try {
            index = parseInt(lines[i].trim());
        } catch (e) {
            currentErrors.push({
                type: '序号格式错误',
                message: `第${i+1}行: 无法解析序号 "${lines[i]}"`,
                line: i+1,
                subtitleIndex: subtitleIndex + 1
            });
            i++;
            continue;
        }
        
        // 检查序号连续性
        if (subtitleIndex > 0 && index !== currentSubtitles[subtitleIndex-1].index + 1) {
            currentWarnings.push({
                type: '序号不连续',
                message: `序号不连续: ${currentSubtitles[subtitleIndex-1].index} → ${index}`,
                line: i+1,
                subtitleIndex: subtitleIndex + 1
            });
        }
        
        i++;
        
        // 解析时间码
        if (i >= lines.length) {
            currentErrors.push({
                type: '格式不完整',
                message: `序号 ${index} 后缺少时间码`,
                line: i,
                subtitleIndex: subtitleIndex + 1
            });
            break;
        }
        
        const timeMatch = lines[i].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (!timeMatch) {
            currentErrors.push({
                type: '时间码格式错误',
                message: `第${i+1}行: 时间码格式不正确 "${lines[i]}"`,
                line: i+1,
                subtitleIndex: subtitleIndex + 1
            });
            i++;
            // 尝试继续解析
            continue;
        }
        
        const startTime = {
            hours: parseInt(timeMatch[1]),
            minutes: parseInt(timeMatch[2]),
            seconds: parseInt(timeMatch[3]),
            milliseconds: parseInt(timeMatch[4])
        };
        
        const endTime = {
            hours: parseInt(timeMatch[5]),
            minutes: parseInt(timeMatch[6]),
            seconds: parseInt(timeMatch[7]),
            milliseconds: parseInt(timeMatch[8])
        };
        
        // 检查时间码有效性
        if (!isValidTime(startTime) || !isValidTime(endTime)) {
            currentErrors.push({
                type: '时间码值无效',
                message: `时间码值无效: ${lines[i]}`,
                line: i+1,
                subtitleIndex: subtitleIndex + 1
            });
        }
        
        // 计算时间（毫秒）
        const startMs = timeToMs(startTime);
        const endMs = timeToMs(endTime);
        
        // 检查结束时间是否晚于开始时间
        if (endMs <= startMs) {
            currentErrors.push({
                type: '时间顺序错误',
                message: `结束时间不晚于开始时间: ${lines[i]}`,
                line: i+1,
                subtitleIndex: subtitleIndex + 1
            });
        }
        
        i++;
        
        // 解析字幕文本
        const textLines = [];
        while (i < lines.length && lines[i].trim() !== '') {
            textLines.push(lines[i]);
            i++;
        }
        
        // 检查字幕文本是否为空
        if (textLines.length === 0) {
            currentWarnings.push({
                type: '空字幕',
                message: `序号 ${index} 的字幕文本为空`,
                line: i,
                subtitleIndex: subtitleIndex + 1
            });
        }
        
        // 检查单行文本长度
        textLines.forEach((line, lineIndex) => {
            if (line.length > 40) {
                currentWarnings.push({
                    type: '文本过长',
                    message: `第${lineIndex+1}行文本过长 (${line.length}字符): "${line.substring(0, 30)}..."`,
                    line: i - textLines.length + lineIndex + 1,
                    subtitleIndex: subtitleIndex + 1
                });
            }
        });
        
        // 检查总行数
        if (textLines.length > 2) {
            currentWarnings.push({
                type: '行数过多',
                message: `字幕包含${textLines.length}行，建议不超过2行`,
                line: i - textLines.length + 1,
                subtitleIndex: subtitleIndex + 1
            });
        }
        
        // 添加到字幕数组
        currentSubtitles.push({
            index: index,
            start: startTime,
            end: endTime,
            startMs: startMs,
            endMs: endMs,
            text: textLines.join('\n'),
            lineCount: textLines.length
        });
        
        subtitleIndex++;
        i++; // 跳过空行
    }
    
    // 检查时间重叠
    for (let j = 1; j < currentSubtitles.length; j++) {
        const prev = currentSubtitles[j-1];
        const curr = currentSubtitles[j];
        
        if (curr.startMs < prev.endMs) {
            currentErrors.push({
                type: '时间重叠',
                message: `字幕 ${prev.index} 和 ${curr.index} 时间重叠: ${formatTime(prev.end)} → ${formatTime(curr.start)}`,
                line: -1,
                subtitleIndex: curr.index
            });
        }
        
        // 检查时间间隔是否过短
        const gap = curr.startMs - prev.endMs;
        if (gap > 0 && gap < 100) { // 小于100毫秒
            currentWarnings.push({
                type: '间隔过短',
                message: `字幕 ${prev.index} 和 ${curr.index} 间隔过短: ${gap}ms`,
                line: -1,
                subtitleIndex: curr.index
            });
        }
    }
}

// 显示结果
function displayResults() {
    loadingIndicator.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    
    // 更新统计信息
    totalSubtitles.textContent = currentSubtitles.length;
    totalErrors.textContent = currentErrors.length;
    totalWarnings.textContent = currentWarnings.length;
    
    // 计算总时长
    let totalMs = 0;
    if (currentSubtitles.length > 0) {
        totalMs = currentSubtitles[currentSubtitles.length - 1].endMs;
    }
    totalDuration.textContent = formatTimeFromMs(totalMs);
    
    // 更新最大时间
    const maxMs = Math.max(totalMs, 300000); // 至少显示5分钟
    maxTime.textContent = formatTimeFromMs(maxMs);
    
    // 清空时间线
    timeline.innerHTML = '';
    
    // 添加时间线标记
    if (currentSubtitles.length > 0) {
        const step = maxMs / 10; // 10个标记
        
        for (let i = 0; i <= 10; i++) {
            const time = i * step;
            const position = (time / maxMs) * 100;
            
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            marker.style.left = `${position}%`;
            
            const label = document.createElement('div');
            label.className = 'timeline-label';
            label.textContent = formatTimeFromMs(time).substring(3); // 去掉小时
            label.style.left = `${position}%`;
            
            timeline.appendChild(marker);
            timeline.appendChild(label);
        }
        
        // 添加字幕位置标记
        currentSubtitles.forEach(sub => {
            if (sub.startMs <= maxMs) {
                const position = (sub.startMs / maxMs) * 100;
                
                const subMarker = document.createElement('div');
                subMarker.className = 'timeline-marker';
                subMarker.style.left = `${position}%`;
                subMarker.style.height = '30%';
                subMarker.style.top = '70%';
                subMarker.style.backgroundColor = currentErrors.some(e => e.subtitleIndex === sub.index) ? 
                                                  'var(--error-color)' : 'var(--success-color)';
                subMarker.style.width = '6px';
                subMarker.title = `字幕 ${sub.index}: ${formatTime(sub.start)}`;
                
                timeline.appendChild(subMarker);
            }
        });
    }
    
    // 显示错误和警告
    errorsList.innerHTML = '';
    
    // 显示错误
    currentErrors.forEach(error => {
        const errorItem = document.createElement('div');
        errorItem.className = 'error-item';
        
        errorItem.innerHTML = `
            <div class="error-title">
                <i class="fas fa-exclamation-circle"></i>
                <span>${error.type}</span>
            </div>
            <div class="error-details">
                ${error.message}
                ${error.line > 0 ? `<br>行号: ${error.line}` : ''}
                ${error.subtitleIndex > 0 ? ` | 字幕序号: ${error.subtitleIndex}` : ''}
            </div>
        `;
        
        errorsList.appendChild(errorItem);
    });
    
    // 显示警告
    currentWarnings.forEach(warning => {
        const warningItem = document.createElement('div');
        warningItem.className = 'warning-item';
        
        warningItem.innerHTML = `
            <div class="error-title">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${warning.type}</span>
            </div>
            <div class="error-details">
                ${warning.message}
                ${warning.line > 0 ? `<br>行号: ${warning.line}` : ''}
                ${warning.subtitleIndex > 0 ? ` | 字幕序号: ${warning.subtitleIndex}` : ''}
            </div>
        `;
        
        errorsList.appendChild(warningItem);
    });
    
    // 如果没有错误或警告
    if (currentErrors.length === 0 && currentWarnings.length === 0) {
        const successItem = document.createElement('div');
        successItem.className = 'error-item';
        successItem.style.borderLeftColor = 'var(--success-color)';
        successItem.style.backgroundColor = '#e6f7e6';
        
        successItem.innerHTML = `
            <div class="error-title">
                <i class="fas fa-check-circle"></i>
                <span>检查完成，未发现错误或警告</span>
            </div>
            <div class="error-details">
                您的SRT字幕文件格式正确，所有检查项均已通过。
            </div>
        `;
        
        errorsList.appendChild(successItem);
    }
}

// 显示修复建议
function showFixSuggestions() {
    if (currentSubtitles.length === 0) {
        alert('请先检查字幕文件');
        return;
    }
    
    const suggestionItem = document.createElement('div');
    suggestionItem.className = 'fix-suggestion';
    
    let suggestions = '<strong>修复建议:</strong><br>';
    
    if (currentErrors.length > 0) {
        suggestions += '<br><strong>错误修复:</strong><br>';
        
        // 时间重叠修复建议
        const overlapErrors = currentErrors.filter(e => e.type === '时间重叠');
        if (overlapErrors.length > 0) {
            suggestions += '• 时间重叠: 调整重叠字幕的开始或结束时间，确保它们不重叠<br>';
        }
        
        // 时间顺序修复建议
        const timeOrderErrors = currentErrors.filter(e => e.type === '时间顺序错误');
        if (timeOrderErrors.length > 0) {
            suggestions += '• 时间顺序: 确保结束时间晚于开始时间<br>';
        }
        
        // 时间码格式修复建议
        const formatErrors = currentErrors.filter(e => e.type.includes('时间码格式'));
        if (formatErrors.length > 0) {
            suggestions += '• 时间码格式: 使用标准格式 HH:MM:SS,mmm --> HH:MM:SS,mmm<br>';
        }
    }
    
    if (currentWarnings.length > 0) {
        suggestions += '<br><strong>警告优化:</strong><br>';
        
        // 文本过长修复建议
        const longTextWarnings = currentWarnings.filter(w => w.type === '文本过长');
        if (longTextWarnings.length > 0) {
            suggestions += '• 文本过长: 将长文本拆分为多行，每行不超过40字符<br>';
        }
        
        // 行数过多修复建议
        const manyLinesWarnings = currentWarnings.filter(w => w.type === '行数过多');
        if (manyLinesWarnings.length > 0) {
            suggestions += '• 行数过多: 合并文本内容，每字幕不超过2行<br>';
        }
        
        // 序号不连续修复建议
        const sequenceWarnings = currentWarnings.filter(w => w.type === '序号不连续');
        if (sequenceWarnings.length > 0) {
            suggestions += '• 序号不连续: 重新编号所有字幕，确保序号连续递增<br>';
        }
    }
    
    suggestions += '<br><strong>通用建议:</strong><br>';
    suggestions += '• 确保字幕时间码使用00:00:00,000格式<br>';
    suggestions += '• 每两个字幕之间保留至少100ms间隔<br>';
    suggestions += '• 使用空行分隔每个字幕块<br>';
    suggestions += '• 导出前使用"导出修正版"功能自动修复序号和格式问题';
    
    suggestionItem.innerHTML = suggestions;
    
    // 添加到错误列表顶部
    errorsList.prepend(suggestionItem);
    
    // 滚动到建议位置
    suggestionItem.scrollIntoView({ behavior: 'smooth' });
}

// 导出修正版SRT
function exportCorrectedSRT() {
    if (currentSubtitles.length === 0) {
        alert('没有可导出的字幕内容');
        return;
    }
    
    let correctedSRT = '';
    
    // 重新编号并格式化
    currentSubtitles.forEach((sub, idx) => {
        // 使用连续序号
        correctedSRT += `${idx + 1}\n`;
        
        // 格式化时间码
        correctedSRT += `${formatTime(sub.start)} --> ${formatTime(sub.end)}\n`;
        
        // 添加字幕文本
        correctedSRT += `${sub.text}\n\n`;
    });
    
    // 创建下载链接
    const blob = new Blob([correctedSRT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrected_subtitles_${new Date().getTime()}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 工具函数
function isValidTime(time) {
    return time.hours >= 0 && time.hours < 24 &&
           time.minutes >= 0 && time.minutes < 60 &&
           time.seconds >= 0 && time.seconds < 60 &&
           time.milliseconds >= 0 && time.milliseconds < 1000;
}

function timeToMs(time) {
    return time.hours * 3600000 + 
           time.minutes * 60000 + 
           time.seconds * 1000 + 
           time.milliseconds;
}

function formatTime(time) {
    const pad = (num) => num.toString().padStart(2, '0');
    return `${pad(time.hours)}:${pad(time.minutes)}:${pad(time.seconds)},${time.milliseconds.toString().padStart(3, '0')}`;
}

function formatTimeFromMs(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    
    const pad = (num) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${milliseconds.toString().padStart(3, '0')}`;
}

// 初始化应用
function initApp() {
    // 初始加载示例
    loadExample();
    
    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl + Enter 检查字幕
        if (e.ctrlKey && e.key === 'Enter' && !checkBtn.disabled) {
            e.preventDefault();
            checkSRT();
        }
        
        // Ctrl + D 导出修正版
        if (e.ctrlKey && e.key === 'd' && !exportBtn.disabled) {
            e.preventDefault();
            exportCorrectedSRT();
        }
        
        // Ctrl + F 显示修复建议
        if (e.ctrlKey && e.key === 'f' && !fixBtn.disabled) {
            e.preventDefault();
            showFixSuggestions();
        }
        
        // Esc 清除内容
        if (e.key === 'Escape') {
            clearContent();
        }

    });

document.getElementById('gotoConverterBtn').addEventListener('click', function() {
    window.location.href = 'index.html';
});

document.getElementById('gotoCompareBtn').addEventListener('click', function() {
    window.location.href = 'compare.html';
});
}

// 当页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);