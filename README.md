# 宠物 MBTI

这是一个已经适配 GitHub Pages 的静态网站项目，目标公网地址为：

`https://yemin.github.io/petMbti/`

## 本地运行

方式一：

双击 `start.bat`

方式二：

```powershell
python server.py --open
```

本地默认地址通常是：

```text
http://127.0.0.1:8080/index.html
```

## 发布到这个网址

当前项目已经包含：

- `.github/workflows/pages.yml`
- `.nojekyll`

只要把项目推送到 GitHub 仓库 `yemin/petMbti`，再在仓库的 `Settings > Pages` 中把发布方式设为 `GitHub Actions`，GitHub 就会自动把站点发布到：

```text
https://yemin.github.io/petMbti/
```

## 推荐发布步骤

```powershell
cd "G:\AI\Codex\pet MBTI"
git init
git branch -M main
git remote add origin https://github.com/yemin/petMbti.git
git add .
git commit -m "Initial publish"
git push -u origin main
```

推送完成后：

1. 打开 GitHub 仓库 `yemin/petMbti`
2. 进入 `Settings > Pages`
3. 在 `Build and deployment` 中选择 `GitHub Actions`
4. 等待 Actions 完成部署

## 项目结构

```text
pet MBTI/
├─ .github/
│  └─ workflows/
│     └─ pages.yml
├─ assets/
│  ├─ css/
│  │  └─ styles.css
│  ├─ images/
│  │  └─ mbti-grid.png
│  └─ js/
│     ├─ mbti-data.js
│     ├─ quiz.js
│     └─ site.js
├─ .nojekyll
├─ about.html
├─ contact.html
├─ index.html
├─ quiz.html
├─ server.py
├─ start.bat
└─ README.md
```
