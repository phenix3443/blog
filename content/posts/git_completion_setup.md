# Git 命令补全配置文档

## 概述
本文档记录了为 Windows PowerShell 配置 git 命令补全功能的完整过程，包括问题解决和最终配置。

## 配置完成状态

### ✅ 已完成的功能

1. **PowerShell 配置文件**
   - 位置：`C:\Users\pheni\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`
   - 功能：自动加载 git 命令补全和别名/函数

{{< gist phenix3443 8f5d2cf6f6dfd4b452b90904819c91bfs Microsoft.PowerShell_profile.ps1 >}}

2. **Git 命令补全功能**
   - ✅ 支持 git 子命令补全（add, commit, push, pull, checkout, branch, status, log 等）
   - ✅ 支持常用 git 选项补全
   - ✅ 支持上下文相关的参数补全

3. **Git 别名和函数**
   - ✅ `g` → `git`
   - ✅ `gs` → `git status`
   - ✅ `ga` → `git add`
   - ✅ `gcmt` → `git commit` (函数，避免与内置别名冲突)
   - ✅ `gpu` → `git push`
   - ✅ `gbr` → `git branch`
   - ✅ `gco` → `git checkout`
   - ✅ `glo` → `git log`

## 使用方法

### 命令补全
1. 输入 `git ` 然后按 **Tab** 键查看可用的子命令
2. 输入 `git add ` 然后按 **Tab** 键查看可用的选项
3. 输入 `git commit ` 然后按 **Tab** 键查看可用的提交选项

### 别名和函数使用
```powershell
# 使用别名
g status          # 等同于 git status
gs                # 等同于 git status
ga .              # 等同于 git add .
gpu origin main   # 等同于 git push origin main
gbr               # 等同于 git branch
gco branch-name   # 等同于 git checkout branch-name
glo               # 等同于 git log

# 使用函数
gcmt -m "message" # 等同于 git commit -m "message"
```

## 验证配置
运行以下命令验证配置是否成功：
```powershell
# 检查别名
Get-Alias | Where-Object {$_.Definition -like "*git*"}

# 检查函数
Get-Command gcmt

# 测试 git 命令
g status
gs
gcmt --help
```

## 技术细节

### 配置文件结构
```powershell
# Git 命令补全函数
function GitTabCompletion { ... }

# 注册补全功能
Register-ArgumentCompleter -CommandName git -ScriptBlock $function:GitTabCompletion

# Git 别名（避免冲突）
if (-not (Get-Alias g -ErrorAction SilentlyContinue)) { Set-Alias -Name g -Value git }
# ... 其他别名

# Git 函数（用于冲突命令）
function gcmt { git commit @args }
```

### 解决的问题
1. **别名冲突**：`gci` 和 `gcm` 是 PowerShell 内置只读别名
2. **解决方案**：使用条件检查和函数替代
3. **最终结果**：无错误启动，完整功能

## 注意事项
- 配置文件会在每次启动 PowerShell 时自动加载
- 已修复别名冲突问题：使用条件检查避免覆盖只读别名
- `gci` 和 `gcm` 都是 PowerShell 内置别名，已改为 `gcmt` 函数
- 命令补全功能基于 PowerShell 的 TabExpansion2 机制

## 故障排除
如果命令补全不工作：
1. 重新加载配置文件：`. $PROFILE`
2. 检查 PowerShell 执行策略：`Get-ExecutionPolicy`
3. 确保配置文件路径正确：`$PROFILE`

## 修复记录
- **2024-09-10**: 初始配置 git 命令补全
- **2024-09-10**: 修复了别名冲突问题
  - 原因：`gci` 和 `gcm` 都是 PowerShell 内置只读别名
  - 解决：改为使用 `gcmt` 作为 git commit 的函数
  - 改进：添加条件检查避免覆盖只读别名，对冲突命令使用函数而非别名

## 配置文件位置
- PowerShell 配置文件：`C:\Users\pheni\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`
- Git 安装路径：`C:\Program Files\Git\`
- 补全脚本路径：`C:\Program Files\Git\mingw64\share\git\completion\git-completion.bash`
