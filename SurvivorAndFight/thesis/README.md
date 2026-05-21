# 毕业论文 LaTeX

正文采用 `ctexrep` + `upc-thesis-format.tex`（与 **main** 分支一致的章/节目录结构）。官方模板文件见 `_template_ref/`、`upcthesis.cls`（备用）。

## 华文中宋字体（可选）

页脚/封面使用 **STZhongsong（华文中宋）**。在 `thesis/` 执行（约 1 分钟内，先查本机 Office，再尝试下载）：

```powershell
.\install-fonts.ps1
```

若未安装，将自动回退宋体，不影响编译。字体文件放在 `fonts/STZhongsong.ttf`（已加入 `.gitignore`，勿提交仓库）。

## 编译

在 `thesis/` 目录执行（需 **XeLaTeX** + **BibTeX**）：

```powershell
.\build.ps1
```

输出：`main.pdf`

## 目录说明

| 路径 | 说明 |
|------|------|
| `main.tex` | 主控文件（`frontmatter` + `\chapter` 八章） |
| `frontmatter.tex` | 封面、声明、中英文摘要 |
| `upc-thesis-format.tex` | 版式（页眉页脚、目录、图表题等） |
| `upcthesis.cls` | 官方模板文档类（备用，当前 main 未使用） |
| `chapter01.tex` … `chapter08.tex` | 正文章节（`\chapter` / `\section`） |
| `references.bib` | 参考文献数据库 |
| `_template_ref/` | 上游模板完整副本，便于对照与更新 |
| `upc-thesis-format.tex` | 旧版手写格式（已弃用，保留作参考） |
| `frontmatter.tex` | 旧版封面/摘要（已弃用，见 `sections/before/`） |

## 更新官方模板

```powershell
cd _template_ref
git pull origin master
# 再将 upcthesis.cls、style/*.bst 复制到 thesis 根目录
```
