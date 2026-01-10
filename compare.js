// DOM元素
const fileInput1 = document.getElementById('fileInput1');
const browseBtn1 = document.getElementById('browseBtn1');
const dropArea1 = document.getElementById('dropArea1');
const srtContent1 = document.getElementById('srtContent1');
const fileInfo1 = document.getElementById('fileInfo1');

const fileInput2 = document.getElementById('fileInput2');
const browseBtn2 = document.getElementById('browseBtn2');
const dropArea2 = document.getElementById('dropArea2');
const srtContent2 = document.getElementById('srtContent2');
const fileInfo2 = document.getElementById('fileInfo2');

const compareBtn = document.getElementById('compareBtn');
const clearCompareBtn = document.getElementById('clearCompareBtn');
const gotoInspectorBtn = document.getElementById('gotoInspectorBtn');
const exportComparisonBtn = document.getElementById('exportComparisonBtn');

const resultsContainer = document.getElementById('resultsContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const comparisonResults = document.getElementById('comparisonResults');

// 统计元素
const totalSubtitles1 = document.getElementById('totalSubtitles1');
const totalSubtitles2 = document.getElementById('totalSubtitles2');
const exactMatches = document.getElementById('exactMatches');
const timeDifferences = document.getElementById('timeDifferences');
const missingSubtitles = document.getElementById('missingSubtitles');

// 存储解析后的字幕数据
let subtitles1 = [];
let subtitles2 = [];
let comparisonData = [];

// 事件监听器
browseBtn1.addEventListener('click', () => fileInput1.click());
fileInput1.addEventListener('change', (e) => handleFileSelect(e, 1));
dropArea1.addEventListener('dragover', (e) => handleDragOver(e, dropArea1));
dropArea1.addEventListener('drop', (e) => handleDrop(e, 1));

browseBtn2.addEventListener('click', () => fileInput2.click());
fileInput2.addEventListener('change', (e) => handleFileSelect(e, 2));
dropArea2.addEventListener('dragover', (e) => handleDragOver(e, dropArea2));
dropArea2.addEventListener('drop', (e) => handleDrop(e, 2));

compareBtn.addEventListener('click', compareSRT);
clearCompareBtn.addEventListener('click', clearAllContent);
gotoInspectorBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});
exportComparisonBtn.addEventListener('click', exportComparisonReport);

// 处理文件选择
function handleFileSelect(event, fileNumber) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileInfo = fileNumber === 1 ? fileInfo1 : fileInfo2;
    fileInfo.textContent = `已选择: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    fileInfo.style.color = 'var(--primary-color)';
    
    readFile(file, fileNumber);
}

// 处理拖放
function handleDragOver(event, dropArea) {
    event.preventDefault();
    dropArea.style.borderColor = 'var(--primary-color)';
    dropArea.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
}

function handleDrop(event, fileNumber) {
    event.preventDefault();
    const dropArea = fileNumber === 1 ? dropArea1 : dropArea2;
    dropArea.style.borderColor = 'var(--border-color)';
    dropArea.style.backgroundColor = '';
    
    const file = event.dataTransfer.files[0];
    if (!file) return;
    
    const fileInfo = fileNumber === 1 ? fileInfo1 : fileInfo2;
    fileInfo.textContent = `已选择: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    fileInfo.style.color = 'var(--primary-color)';
    
    readFile(file, fileNumber);
}

// 读取文件内容
function readFile(file, fileNumber) {
    const reader = new FileReader();
    reader.onload = function(e) {
        if (fileNumber === 1) {
            srtContent1.value = e.target.result;
        } else {
            srtContent2.value = e.target.result;
        }
    };
    reader.readAsText(file);
}

// 清空所有内容
// 清空所有内容
function clearAllContent() {
    srtContent1.value = '';
    srtContent2.value = '';
    
    // 重置文件输入框的value，这样下次可以选择相同的文件
    fileInput1.value = '';
    fileInput2.value = '';
    
    // 清空文件信息显示
    fileInfo1.textContent = '';
    fileInfo2.textContent = '';
    
    // 重置拖放区域的样式
    dropArea1.style.borderColor = 'var(--border-color)';
    dropArea1.style.backgroundColor = '';
    dropArea2.style.borderColor = 'var(--border-color)';
    dropArea2.style.backgroundColor = '';
    
    // 清空存储的数据
    subtitles1 = [];
    subtitles2 = [];
    comparisonData = [];
    
    // 隐藏并清空结果
    resultsContainer.classList.add('hidden');
    comparisonResults.innerHTML = '';
    
    // 重置统计信息
    totalSubtitles1.textContent = '0';
    totalSubtitles2.textContent = '0';
    exactMatches.textContent = '0';
    timeDifferences.textContent = '0';
    missingSubtitles.textContent = '0';
}

// 解析SRT内容（独立版本，不依赖原script.js）
function parseSRTContent(content) {
    const subtitles = [];
    const lines = content.split('\n');
    let i = 0;
    
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
            i++;
            continue;
        }
        
        i++;
        
        // 解析时间码
        if (i >= lines.length) break;
        
        const timeMatch = lines[i].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (!timeMatch) {
            i++;
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
        
        // 计算时间（毫秒）
        const startMs = timeToMs(startTime);
        const endMs = timeToMs(endTime);
        
        i++;
        
        // 解析字幕文本
        const textLines = [];
        while (i < lines.length && lines[i].trim() !== '') {
            textLines.push(lines[i]);
            i++;
        }
        
        // 添加到字幕数组
        subtitles.push({
            index: index,
            start: startTime,
            end: endTime,
            startMs: startMs,
            endMs: endMs,
            text: textLines.join('\n'),
            rawStartTime: lines[i-1-textLines.length] // 原始时间字符串
        });
        
        i++; // 跳过空行
    }
    
    return subtitles;
}

// 对比SRT文件
function compareSRT() {
    const content1 = srtContent1.value.trim();
    const content2 = srtContent2.value.trim();
    
    if (!content1 || !content2) {
        alert('请上传或粘贴两个字幕文件进行对比');
        return;
    }
    
    // 显示加载指示器
    resultsContainer.classList.add('hidden');
    loadingIndicator.classList.remove('hidden');
    
    // 解析字幕
    subtitles1 = parseSRTContent(content1);
    subtitles2 = parseSRTContent(content2);
    
    // 模拟处理时间
    setTimeout(() => {
        performComparison();
        displayComparisonResults();
    }, 500);
}

// 执行对比
function performComparison() {
    comparisonData = [];
    
    // 创建索引映射
    const subtitleMap1 = {};
    const subtitleMap2 = {};
    
    subtitles1.forEach(sub => subtitleMap1[sub.index] = sub);
    subtitles2.forEach(sub => subtitleMap2[sub.index] = sub);
    
    // 获取所有唯一序号
    const allIndices = new Set([
        ...subtitles1.map(s => s.index),
        ...subtitles2.map(s => s.index)
    ]);
    
    const sortedIndices = Array.from(allIndices).sort((a, b) => a - b);
    
    // 对比每个序号
    sortedIndices.forEach(index => {
        const sub1 = subtitleMap1[index];
        const sub2 = subtitleMap2[index];
        
        const comparison = {
            index: index,
            existsInBoth: !!(sub1 && sub2),
            existsInFile1: !!sub1,
            existsInFile2: !!sub2,
            timeDifferences: []
        };
        
        if (sub1 && sub2) {
            // 检查开始时间差异
            const startDiff = sub2.startMs - sub1.startMs;
            const endDiff = sub2.endMs - sub1.endMs;
            
            // 注意：这里严格检查，任何差异都会被标记
            if (startDiff !== 0) {
                comparison.timeDifferences.push({
                    type: '开始时间',
                    file1: formatTime(sub1.start),
                    file2: formatTime(sub2.start),
                    difference: startDiff,
                    absDifference: Math.abs(startDiff),
                    differenceText: formatTimeDifference(startDiff)
                });
            }
            
            if (endDiff !== 0) {
                comparison.timeDifferences.push({
                    type: '结束时间',
                    file1: formatTime(sub1.end),
                    file2: formatTime(sub2.end),
                    difference: endDiff,
                    absDifference: Math.abs(endDiff),
                    differenceText: formatTimeDifference(endDiff)
                });
            }
            
            // 检查持续时间差异
            const duration1 = sub1.endMs - sub1.startMs;
            const duration2 = sub2.endMs - sub2.startMs;
            const durationDiff = duration2 - duration1;
            
            if (durationDiff !== 0) {
                comparison.timeDifferences.push({
                    type: '持续时间',
                    file1: formatDuration(duration1),
                    file2: formatDuration(duration2),
                    difference: durationDiff,
                    absDifference: Math.abs(durationDiff),
                    differenceText: formatTimeDifference(durationDiff)
                });
            }
        }
        
        comparisonData.push(comparison);
    });
}

// 显示对比结果
function displayComparisonResults() {
    loadingIndicator.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    
    // 更新统计信息
    totalSubtitles1.textContent = subtitles1.length;
    totalSubtitles2.textContent = subtitles2.length;
    
    // 计算统计
    let exactMatchCount = 0;
    let timeDiffCount = 0;
    let missingCount = 0;
    
    comparisonData.forEach(comp => {
        if (comp.existsInBoth && comp.timeDifferences.length === 0) {
            exactMatchCount++;
        }
        
        if (comp.timeDifferences.length > 0) {
            timeDiffCount++;
        }
        
        if (!comp.existsInBoth) {
            missingCount++;
        }
    });
    
    exactMatches.textContent = exactMatchCount;
    timeDifferences.textContent = timeDiffCount;
    missingSubtitles.textContent = missingCount;
    
    // 显示详细结果
    comparisonResults.innerHTML = '';
    
    if (comparisonData.length === 0) {
        comparisonResults.innerHTML = `
            <div class="error-item" style="border-left-color: var(--warning-color);">
                <div class="error-title">
                    <i class="fas fa-info-circle"></i>
                    <span>无可对比内容</span>
                </div>
                <div class="error-details">
                    未找到可对比的字幕内容，请确保字幕格式正确。
                </div>
            </div>
        `;
        return;
    }
    
    // 按问题严重性排序：缺失 > 时间差异 > 匹配
    const sortedComparisons = [...comparisonData].sort((a, b) => {
        if (!a.existsInBoth && b.existsInBoth) return -1;
        if (a.existsInBoth && !b.existsInBoth) return 1;
        if (a.timeDifferences.length > 0 && b.timeDifferences.length === 0) return -1;
        if (a.timeDifferences.length === 0 && b.timeDifferences.length > 0) return 1;
        return a.index - b.index;
    });
    
    sortedComparisons.forEach(comp => {
        const resultItem = document.createElement('div');
        
        if (!comp.existsInBoth) {
            // 缺失字幕
            resultItem.className = 'error-item';
            resultItem.style.borderLeftColor = 'var(--warning-color)';
            resultItem.style.backgroundColor = '#fff0f7';
            
            const missingIn = comp.existsInFile1 ? '文件二' : '文件一';
            const existsIn = comp.existsInFile1 ? '文件一' : '文件二';
            
            resultItem.innerHTML = `
                <div class="error-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>字幕缺失</span>
                </div>
                <div class="error-details">
                    <strong>字幕序号 ${comp.index}</strong><br>
                    仅在${existsIn}中存在，${missingIn}中缺失
                    ${comp.existsInFile1 ? `<br>时间: ${formatTime(subtitles1.find(s => s.index === comp.index).start)} --> ${formatTime(subtitles1.find(s => s.index === comp.index).end)}` : ''}
                    ${comp.existsInFile2 ? `<br>时间: ${formatTime(subtitles2.find(s => s.index === comp.index).start)} --> ${formatTime(subtitles2.find(s => s.index === comp.index).end)}` : ''}
                </div>
            `;
        } else if (comp.timeDifferences.length > 0) {
            // 时间差异
            resultItem.className = 'error-item';
            
            resultItem.innerHTML = `
                <div class="error-title">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>时间差异</span>
                </div>
                <div class="error-details">
                    <strong>字幕序号 ${comp.index}</strong><br>
                    ${comp.timeDifferences.map(diff => `
                        <div style="margin-top: 5px;">
                            <strong>${diff.type}:</strong><br>
                            文件一: ${diff.file1}<br>
                            文件二: ${diff.file2}<br>
                            差异: ${diff.differenceText} (${diff.difference > 0 ? '文件二晚' : '文件二早'} ${Math.abs(diff.difference)}ms)
                        </div>
                    `).join('')}
                    <div style="margin-top: 8px; font-size: 0.85em; color: var(--light-text);">
                        <i class="fas fa-info-circle"></i> 严格模式：检测到毫秒级差异
                    </div>
                </div>
            `;
        } else {
            // 完全匹配
            resultItem.className = 'error-item';
            resultItem.style.borderLeftColor = 'var(--success-color)';
            resultItem.style.backgroundColor = '#e6f7e6';
            
            const sub = subtitles1.find(s => s.index === comp.index) || subtitles2.find(s => s.index === comp.index);
            
            resultItem.innerHTML = `
                <div class="error-title">
                    <i class="fas fa-check-circle"></i>
                    <span>完全匹配</span>
                </div>
                <div class="error-details">
                    <strong>字幕序号 ${comp.index}</strong><br>
                    时间: ${formatTime(sub.start)} --> ${formatTime(sub.end)}<br>
                    两个文件的时间轴完全相同
                </div>
            `;
        }
        
        comparisonResults.appendChild(resultItem);
    });
    
    // 添加总结
    const summaryItem = document.createElement('div');
    summaryItem.className = 'fix-suggestion';
    summaryItem.style.marginTop = '20px';
    
    summaryItem.innerHTML = `
        <strong>对比总结:</strong><br>
        • 总共对比了 ${comparisonData.length} 个字幕序号<br>
        • ${exactMatchCount} 个字幕完全匹配 (${exactMatchCount > 0 ? Math.round(exactMatchCount/comparisonData.length*100) : 0}%)<br>
        • ${timeDiffCount} 个字幕存在时间差异<br>
        • ${missingCount} 个字幕在其中一个文件中缺失<br><br>
        <strong>注意:</strong> 本工具使用严格对比模式，任何毫秒级的时间差异都会被标记。
    `;
    
    comparisonResults.appendChild(summaryItem);
}

// 导出对比报告
function exportComparisonReport() {
    if (comparisonData.length === 0) {
        alert('没有对比结果可以导出');
        return;
    }
    
    let report = `SRT字幕对比报告\n`;
    report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
    report += `========================================\n\n`;
    
    report += `统计摘要:\n`;
    report += `文件一字幕数: ${subtitles1.length}\n`;
    report += `文件二字幕数: ${subtitles2.length}\n`;
    report += `完全匹配: ${exactMatches.textContent}\n`;
    report += `时间差异: ${timeDifferences.textContent}\n`;
    report += `缺失字幕: ${missingSubtitles.textContent}\n\n`;
    
    report += `详细对比结果:\n`;
    report += `========================================\n\n`;
    
    comparisonData.forEach(comp => {
        report += `字幕序号: ${comp.index}\n`;
        
        if (!comp.existsInBoth) {
            const missingIn = comp.existsInFile1 ? '文件二' : '文件一';
            report += `状态: 缺失 (仅在${comp.existsInFile1 ? '文件一' : '文件二'}中存在)\n`;
        } else if (comp.timeDifferences.length > 0) {
            report += `状态: 时间差异\n`;
            comp.timeDifferences.forEach(diff => {
                report += `  ${diff.type}: 文件一=${diff.file1}, 文件二=${diff.file2}, 差异=${diff.differenceText}\n`;
            });
        } else {
            report += `状态: 完全匹配\n`;
        }
        
        report += `\n`;
    });
    
    // 创建下载链接
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `srt_comparison_report_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 工具函数
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

function formatTimeDifference(ms) {
    const absMs = Math.abs(ms);
    if (absMs < 1000) {
        return `${ms}ms`;
    }
    
    const seconds = absMs / 1000;
    if (seconds < 60) {
        return `${ms > 0 ? '+' : '-'}${seconds.toFixed(2)}s`;
    }
    
    const minutes = seconds / 60;
    return `${ms > 0 ? '+' : '-'}${minutes.toFixed(2)}min`;
}

function formatDuration(ms) {
    const seconds = ms / 1000;
    return `${seconds.toFixed(2)}s`;
}

// 初始化
function initCompareApp() {
    // 添加快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl + C 开始对比
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            compareSRT();
        }
        
        // Ctrl + E 导出报告
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportComparisonReport();
        }
    });
}

// 当页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initCompareApp);