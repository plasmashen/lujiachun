# 鹿佳莼的个人博客

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue?style=flat-square&logo=github)](https://plasmashen.github.io/lujiachun)
[![Jekyll](https://img.shields.io/badge/Jekyll-Blog-orange?style=flat-square&logo=jekyll)](https://jekyllrb.com/)
[![License](https://img.shields.io/github/license/plasmashen/lujiachun?style=flat-square)](LICENSE)

> 🌐 访问博客：[https://plasmashen.github.io/lujiachun](https://plasmashen.github.io/lujiachun)

一个基于 [Alembic](https://github.com/daviddarnes/alembic) 主题构建的现代化 Jekyll 博客，记录生活、分享见解。

---

## 📖 关于本站

**鹿佳莼的博客**是一个个人知识分享平台，专注于记录：

- 🏠 **生活笔记** - 装修日记、生活感悟
- 💡 **学习心得** - 技术探索、知识整理
- 📝 **随笔记录** - 日常思考、经验分享

本站采用 **Jekyll 静态网站生成器**，部署在 **GitHub Pages** 上，具有快速加载、离线可用、优雅简洁的特点。

---

## ✨ 核心特性

- 🎨 **优雅设计** - 清晰现代的视觉风格，支持自定义配色和排版
- 📱 **响应式布局** - 完美适配桌面、平板和移动设备
- ⚡ **高性能** - 内置 Service Worker，支持离线访问和慢速网络
- 🔍 **实时搜索** - 内置 JavaScript 全文搜索功能
- 📬 **联系表单** - 支持 Formspree 和 Netlify Forms
- 🌈 **社交分享** - 集成 9 大主流社交平台的分享按钮
- 🎯 **SEO 优化** - 使用 jekyll-seo-tag 提升搜索引擎可见性
- 📊 **分类管理** - 按类别组织文章，便于浏览和检索
- 💬 **评论系统** - 支持 Disqus 评论（可选）
- 🎪 **自定义字体** - 支持 Google Fonts 等外部字体服务

---

## 📂 项目结构

```
lujiachun/
├── _config.yml          # 站点配置文件
├── _posts/              # 博客文章目录
├── _layouts/            # 页面布局模板
├── _includes/           # 可复用组件
├── _sass/               # Sass 样式文件
├── assets/              # 静态资源（图片、CSS、JS）
├── blog/                # 博客列表页
├── categories/          # 分类页面
├── search/              # 搜索页面
├── game/                # 游戏页面
└── index.md             # 首页
```

---

## 🚀 快速开始

### 方式一：使用主题 Gem（推荐）

```bash
# 1. 在 Gemfile 中添加主题
gem "alembic-jekyll-theme"

# 2. 安装依赖
bundle install

# 3. 在 _config.yml 中设置主题
theme: alembic-jekyll-theme

# 4. 本地预览
bundle exec jekyll serve
```

### 方式二：GitHub Pages 远程主题

```bash
# 1. 添加远程主题依赖
gem "jekyll-remote-theme"

# 2. 安装依赖
bundle install

# 3. 在 _config.yml 中配置
plugins:
  - jekyll-remote-theme
remote_theme: daviddarnes/alembic@main

# 4. 本地预览
bundle exec jekyll serve
```

### 方式三：直接部署到 Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/daviddarnes/alembic-kit)

---

## ⚙️ 配置说明

主要配置项在 [`_config.yml`](_config.yml) 中：

### 站点信息

```yaml
title: "鹿佳莼"                    # 站点标题
description: ""                   # 站点描述
url: "https://plasmashen.github.io/lujiachun"
logo: "/assets/logos/lujiachun.png"
lang: en-GB                       # 站点语言
timezone: Asia/Beijing            # 时区设置
```

### 导航菜单

```yaml
navigation_header:
  - title: Home
    url: /
  - title: Blog
    url: /blog/
  - title: Categories
    url: /categories/
  - title: Search
    url: /search/
```

### 社交链接

```yaml
social_links:
  Twitter: <your_twitter_url>
  LinkedIn: <your_linkedin_url>
  GitHub: <your_github_url>
  RSS: true
```

### 性能优化

```yaml
service_worker: true      # 启用 Service Worker（默认开启）
css_inline: true          # 内联 CSS 提升加载速度
```

---

## 📝 文章写作

### 创建新文章

在 `_posts/` 目录下创建文件，命名格式：`YYYY-MM-DD-文章标题.md`

```markdown
---
title: 文章标题
categories:
  - 分类名称
feature_image: "https://example.com/image.jpg"
feature_text: "可选的摘要文字"
---

这里是文章内容...
```

### 可用组件

- `{% include button.html text="按钮文字" link="https://..." %}` - 按钮
- `{% include figure.html image="/path/to/img.jpg" caption="图片说明" %}` - 图片
- `{% include video.html id="YouTube 视频 ID" %}` - YouTube 视频
- `{% include map.html id="Google 地图 ID" %}` - Google 地图
- `{% include icon.html id="图标名称" %}` - 图标

---

## 🎨 自定义样式

### 修改配色和字体

复制 `assets/styles.scss` 到项目根目录，在 `@import "alembic";` 之前添加：

```scss
// 自定义变量
$color-primary: #your-color;
$font-family-base: 'Your Font', sans-serif;

@import "alembic";
```

### 完全覆盖样式

直接修改 `_sass/` 目录下的样式文件，或创建新的样式文件覆盖默认样式。

---

## 📊 文章示例

目前博客包含以下类型的文章：

- 🏠 **装修笔记** - 详细的家居装修经验分享
- 📝 **随笔记录** - 生活感悟和日常记录
- 💡 **技术分享** - 学习和探索的心得

查看 [`_posts/`](_posts/) 目录获取所有文章。

---

## 🛠️ 技术栈

- **静态生成器**: [Jekyll](https://jekyllrb.com/)
- **主题**: [Alembic](https://github.com/daviddarnes/alembic)
- **部署**: [GitHub Pages](https://pages.github.com/)
- **样式**: Sass / SCSS
- **图标**: [Simple Icons](https://simpleicons.org/)
- **排版**: [Sassline](https://sassline.com/)

### Jekyll 插件

- `jekyll-sitemap` - 自动生成站点地图
- `jekyll-seo-tag` - SEO 优化
- `jekyll-feed` - RSS 订阅
- `jekyll-paginate` - 分页支持
- `jemoji` - Emoji 表情支持
- `jekyll-mentions` - @提及功能

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

---

## 🙏 致谢

- 感谢 [Alembic](https://github.com/daviddarnes/alembic) 主题作者 [David Darnes](https://twitter.com/DavidDarnes)
- 感谢 [Simple Icons](https://simpleicons.org/) 提供品牌图标
- 感谢 [Sassline](https://sassline.com/) 提供排版基础
- 感谢所有为此项目贡献力量的开源作者

---

## 📬 联系方式

- 🌐 **博客**: [https://plasmashen.github.io/lujiachun](https://plasmashen.github.io/lujiachun)
- 📧 **邮箱**: me@daviddarnes.com
- 💼 **Google Scholar**: [Lujia Shen](http://scholar.google.com/citations?user=I8_wt_QAAAAJ&hl=zh-CN)
- 🐙 **GitHub**: [@plasmashen](https://github.com/plasmashen)

---

<div align="center">

**Made with ❤️ by Lujia Shen**

[⬆ 返回顶部](#鹿佳莼的个人博客)

</div>
