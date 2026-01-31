// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const sourceTextarea = document.getElementById('source-srt');
    const targetTextarea = document.getElementById('target-srt');
    const resultTextarea = document.getElementById('result-srt');
    const processBtn = document.getElementById('process-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const clearBtn = document.getElementById('clear-btn');
    const sourceCount = document.getElementById('source-count');
    const targetCount = document.getElementById('target-count');
    const resultCount = document.getElementById('result-count');
    const timecodesCount = document.getElementById('timecodes-count');
    const textblocksCount = document.getElementById('textblocks-count');
    const notification = document.getElementById('notification');

    // 字符计数功能
    function updateCharCount() {
        sourceCount.textContent = sourceTextarea.value.length;
        targetCount.textContent = targetTextarea.value.length;
        resultCount.textContent = resultTextarea.value.length;
    }

    // 监听文本输入
    sourceTextarea.addEventListener('input', updateCharCount);
    targetTextarea.addEventListener('input', updateCharCount);
    resultTextarea.addEventListener('input', updateCharCount);

    // 显示通知
    function showNotification(message, type = 'success') {
        notification.textContent = message;
        notification.className = 'notification';
        
        // 设置通知类型颜色
        if (type === 'success') {
            notification.style.backgroundColor = '#10b981';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#ef4444';
        } else if (type === 'info') {
            notification.style.backgroundColor = '#3b82f6';
        }
        
        // 显示通知
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 3秒后隐藏通知
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // 解析SRT字幕，提取时间轴
    function parseTimecodesFromSRT(srtText) {
        const lines = srtText.split('\n');
        const timecodes = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 检测时间轴行（包含 -->）
            if (line.includes('-->')) {
                timecodes.push(line);
            }
        }
        
        return timecodes;
    }

    // 解析SRT字幕，提取序号和文本内容
    function parseTextFromSRT(srtText) {
        const lines = srtText.split('\n');
        const textBlocks = [];
        let currentBlock = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // 检测序号行（纯数字）
            if (/^\d+$/.test(line)) {
                // 如果已有正在处理的文本块，先保存
                if (currentBlock) {
                    textBlocks.push(currentBlock);
                }
                
                // 开始新的文本块
                currentBlock = {
                    index: line,
                    text: ''
                };
            }
            // 检测时间轴行，跳过
            else if (line.includes('-->')) {
                // 跳过时间轴行
                continue;
            }
            // 如果是文本内容行
            else if (line && currentBlock) {
                // 如果不是空行，则添加到文本块
                if (currentBlock.text) {
                    currentBlock.text += '\n' + line;
                } else {
                    currentBlock.text = line;
                }
            }
            // 如果是空行且当前有文本块，结束当前文本块
            else if (!line && currentBlock) {
                textBlocks.push(currentBlock);
                currentBlock = null;
            }
        }
        
        // 处理最后一个文本块
        if (currentBlock) {
            textBlocks.push(currentBlock);
        }
        
        return textBlocks;
    }

    // 合并时间轴和文本内容，生成新的SRT
    function mergeSRT(timecodes, textBlocks) {
        let result = '';
        
        // 确保时间轴和文本块数量匹配
        const minLength = Math.min(timecodes.length, textBlocks.length);
        
        for (let i = 0; i < minLength; i++) {
            result += `${i + 1}\n`;
            result += `${timecodes[i]}\n`;
            result += `${textBlocks[i].text}\n\n`;
        }
        
        return result;
    }

    // 处理字幕
    function processSubtitles() {
        const sourceText = sourceTextarea.value.trim();
        const targetText = targetTextarea.value.trim();
        
        // 检查输入
        if (!sourceText || !targetText) {
            showNotification('请确保两个文本框都包含SRT字幕内容', 'error');
            return;
        }
        
        try {
            // 解析源字幕的时间轴
            const timecodes = parseTimecodesFromSRT(sourceText);
            
            // 解析目标字幕的文本内容
            const textBlocks = parseTextFromSRT(targetText);
            
            // 更新统计信息
            timecodesCount.textContent = timecodes.length;
            textblocksCount.textContent = textBlocks.length;
            
            // 检查是否解析到内容
            if (timecodes.length === 0) {
                showNotification('在源字幕中未找到时间轴，请检查格式是否正确', 'error');
                return;
            }
            
            if (textBlocks.length === 0) {
                showNotification('在目标字幕中未找到文本内容，请检查格式是否正确', 'error');
                return;
            }
            
            // 合并生成新的SRT
            const result = mergeSRT(timecodes, textBlocks);
            
            // 显示结果
            resultTextarea.value = result;
            updateCharCount();
            
            // 显示成功通知
            showNotification(`成功生成新字幕！已处理 ${Math.min(timecodes.length, textBlocks.length)} 条字幕`, 'success');
            
        } catch (error) {
            console.error('处理字幕时出错:', error);
            showNotification('处理字幕时出错，请检查SRT格式是否正确', 'error');
        }
    }

    // 复制结果到剪贴板
    function copyToClipboard() {
        if (!resultTextarea.value.trim()) {
            showNotification('没有内容可以复制', 'error');
            return;
        }
        
        resultTextarea.select();
        document.execCommand('copy');
        
        // 取消选择
        window.getSelection().removeAllRanges();
        
        showNotification('已复制到剪贴板', 'success');
    }

    // 下载SRT文件
    function downloadSRT() {
        const content = resultTextarea.value.trim();
        
        if (!content) {
            showNotification('没有内容可以下载', 'error');
            return;
        }
        
        // 创建Blob对象
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        // 创建下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = '新字幕.srt';
        document.body.appendChild(a);
        a.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('文件下载中...', 'success');
    }

    // 清空所有文本框
    function clearAll() {
        sourceTextarea.value = '';
        targetTextarea.value = '';
        resultTextarea.value = '';
        timecodesCount.textContent = '0';
        textblocksCount.textContent = '0';
        updateCharCount();
        showNotification('已清空所有内容', 'info');
    }

    // 添加示例数据（用于演示）
    function addExampleData() {
        // 只有当两个文本框都为空时才添加示例
        if (!sourceTextarea.value.trim() && !targetTextarea.value.trim()) {
            // 源字幕（包含时间轴）
            const sourceExample = `1
00:00:01,000 --> 00:00:04,000
这是第一个时间轴的示例

2
00:00:05,000 --> 00:00:08,000
这是第二个时间轴

3
00:00:10,000 --> 00:00:15,000
第三个时间轴的示例字幕

4
00:00:20,000 --> 00:00:25,000
最后一条示例时间轴`;

            // 目标字幕（包含文本内容）
            const targetExample = `1
00:00:00,000 --> 00:00:00,000
这是第一条字幕文本内容

2
00:00:00,000 --> 00:00:00,000
第二条字幕内容，有两行
这是第二行

3
00:00:00,000 --> 00:00:00,000
第三条字幕的文本

4
00:00:00,000 --> 00:00:00,000
最后一条字幕内容`;

            sourceTextarea.value = sourceExample;
            targetTextarea.value = targetExample;
            updateCharCount();
            showNotification('已添加示例数据，点击"处理字幕"按钮查看效果', 'info');
        }
    }

    // 绑定事件监听器
    processBtn.addEventListener('click', processSubtitles);
    copyBtn.addEventListener('click', copyToClipboard);
    downloadBtn.addEventListener('click', downloadSRT);
    clearBtn.addEventListener('click', clearAll);

    // 初始化时添加示例数据（可选）
    setTimeout(addExampleData, 500);

    // 初始化字符计数
    updateCharCount();
    
    // 添加快捷键支持
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter 处理字幕
        if (e.ctrlKey && e.key === 'Enter') {
            processSubtitles();
        }
        
        // Ctrl+C 复制结果（当焦点不在输入框中时）
        if (e.ctrlKey && e.key === 'c' && 
            document.activeElement !== sourceTextarea && 
            document.activeElement !== targetTextarea && 
            document.activeElement !== resultTextarea) {
            copyToClipboard();
            e.preventDefault();
        }
    });
});