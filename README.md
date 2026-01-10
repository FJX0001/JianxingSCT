# 字幕处理工具套件 (Subtitle Processing Tools)

一套完全在浏览器中运行的在线字幕处理工具，支持BCC字幕转换、SRT格式检查和字幕对比功能。

## 🚀 在线演示

访问地址：[https://fjx0001.github.io/JianxingSCT/](https://fjx0001.github.io/JianxingSCT/)

## 📋 功能概览

### 1. BCC转SRT格式转换工具 (`index.html`)
- 将B站的BCC字幕格式转换为标准的SRT格式
- 支持单文件转换和批量处理模式
- 自动下载转换结果，保留原始文件名
- 完全本地处理，保障用户隐私安全

### 2. SRT字幕检查工具 (`SubtitleCheckingTool.html`)
- 检查SRT字幕格式错误和时间码问题
- 检测时间重叠、序号不连续、文本过长等问题
- 提供可视化时间线显示
- 支持导出修正版SRT文件

### 3. SRT字幕对比工具 (`compare.html`)
- 对比两个字幕文件的时间轴差异
- 检测毫秒级时间码差异
- 识别缺失字幕和序号问题
- 生成详细的对比报告

## 🛠️ 技术特性

- **纯前端运行**：所有处理均在浏览器本地完成，不依赖服务器
- **实时处理**：即时转换、检查和对比，无需等待
- **批量处理**：支持多个文件同时处理
- **拖放支持**：可通过拖拽方式上传文件
- **键盘快捷键**：支持常用操作的键盘快捷键
- **响应式设计**：适配桌面和移动设备

## 📁 项目结构

```
JianxingSCT/
├── index.html                    # BCC转SRT转换工具主页面
├── SubtitleCheckingTool.html     # SRT字幕检查工具页面
├── compare.html                  # SRT字幕对比工具页面
├── style.css                     # 主样式文件
├── SubtitleCheckingTool.css      # 检查工具样式
├── compare.css                   # 对比工具样式
├── script.js                     # BCC转SRT功能核心逻辑
├── SubtitleCheckingTool.js       # SRT检查功能核心逻辑
└── compare.js                    # 字幕对比功能核心逻辑
```

## 🔧 使用说明

### BCC转SRT工具
1. 点击上传区域或拖拽BCC文件到指定区域
2. 选择文件后自动显示文件信息
3. 点击"转换字幕格式"按钮开始转换
4. 转换完成后可预览结果并下载SRT文件
5. 支持批量模式处理多个文件

### SRT检查工具
1. 上传或粘贴SRT字幕内容
2. 点击"检查字幕"按钮进行分析
3. 查看错误和警告统计
4. 使用"自动修复建议"获取优化建议
5. 导出修正后的SRT文件

### SRT对比工具
1. 分别上传两个SRT字幕文件
2. 点击"开始对比"按钮进行对比
3. 查看差异统计和详细对比结果
4. 可导出完整的对比报告

## ⌨️ 键盘快捷键

### 通用快捷键
- `Esc`：清除内容
- `Ctrl + B`：切换批量模式（转换工具）

### BCC转SRT工具
- `Ctrl + Enter`：开始转换
- `Ctrl + D`：下载单个文件
- `Ctrl + Shift + D`：下载批量文件（批量模式）

### SRT检查工具
- `Ctrl + Enter`：开始检查
- `Ctrl + F`：显示修复建议
- `Ctrl + D`：导出修正版

### SRT对比工具
- `Ctrl + C`：开始对比
- `Ctrl + E`：导出对比报告

## ⚙️ 技术栈

- **前端框架**：原生JavaScript
- **样式框架**：纯CSS，无依赖
- **字体图标**：Font Awesome 6
- **压缩库**：JSZip（批量下载）
- **兼容性**：支持现代浏览器

## 🧪 测试过的文件格式

### BCC转SRT工具支持：
- `.bcc` 文件（B站标准字幕格式）
- `.json` 文件（BCC JSON格式）
- `.txt` 文件（包含BCC字幕内容）

### SRT检查/对比工具支持：
- `.srt` 文件（标准SRT字幕格式）
- `.txt` 文件（包含SRT字幕内容）

## 🔒 隐私与安全

- 所有文件处理均在用户浏览器中完成
- 不会上传任何文件到服务器
- 不会收集用户数据或个人信息
- 支持离线使用（下载后可在本地运行）

## 🐛 已知问题和解决方案

### ZIP文件安全警告
下载批量转换的ZIP文件时，Windows系统可能显示安全警告。解决方法：
1. 右键点击下载的ZIP文件
2. 选择"属性"
3. 在常规选项卡底部，找到"安全"部分
4. 如果看到"此文件来自其他计算机..."的提示，请勾选"解除锁定"
5. 点击"确定"后即可正常解压

## 🤝 贡献指南

欢迎提交问题报告和功能建议！如需贡献代码：
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- 感谢 [Bilibili](https://www.bilibili.com) 的BCC字幕格式
- 感谢 [Font Awesome](https://fontawesome.com/) 提供图标
- 感谢 [JSZip](https://stuk.github.io/jszip/) 提供ZIP压缩功能
- 感谢所有测试用户提供的反馈

## 📞 支持与反馈

如有问题或建议，请：
1. 在 [GitHub Issues](https://github.com/FJX0001/JianxingSCT/issues) 提交问题
2. 通过GitHub Pull Request提交改进
3. 访问项目主页了解更多信息

---

**注意**：本工具由Bilibili Up主"建星程序出bug了"指导创建，旨在为字幕制作者提供便捷的字幕处理工具。工具会持续更新和改进，请关注项目更新。