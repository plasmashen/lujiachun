---
title: 鹿佳莼
feature\_text: |
  \#\# Alembic
  A Jekyll boilerplate theme designed to be a starting point for any Jekyll website
feature\_image: "https://picsum.photos/1300/400?image=989"
excerpt: "Alembic is a starting point for [Jekyll][1] projects. Rather than starting from scratch, this boilerplate is designed to get the ball rolling immediately. Install it, configure it, tweak it, push it."
---

Alembic is a starting point for [Jekyll][2] projects. Rather than starting from scratch, this boilerplate is designed to get rolling immediately. Install it, configure it, tweak it, push it.

{% include button.html text="Fork it" icon="github" link="https://github.com/daviddarnes/alembic" color="#0366d6" %} {% include button.html text="Buy me a coffee ☕️" link="https://buymeacoffee.com/daviddarnes#support" color="#f68140" %} {% include button.html text="Tweet it" icon="twitter" link="https://twitter.com/intent/tweet/?url=https://alembic.darn.es&text=Alembic%20-%20A%20Jekyll%20boilerplate%20theme&via=DavidDarnes" color="#0d94e7" %} {% include button.html text="Install Alembic ⚗️" link="https://github.com/daviddarnes/alembic#installation" %}

## Features

- Available as a **theme gem** and **GitHub Pages** theme
- Clear and elegant design that can be used out of the box or as solid starting point
- Tested in all major browsers, including **IE and Edge**
- Built in **Service Worker** so it can work offline and on slow connections
- **Configurable colours** and typography in a single settings file
- Extensive set of **shortcodes** to include various elements; such as buttons, icons, figure images and more
- Solid **typographic framework** from [Sassline][3]
- Configurable navigation via a single file
- Modular Jekyll components
- Post category support in the form of a single post index page grouped by category
- Built in live search using JavaScript
- **Contact form** built in using [Formspree][4]
- Designed with **[Siteleaf][5]** in mind
- Has 9 of the most popular networks as performant sharing buttons
- Has documentation

## Examples

Here are a few examples of Alembic out in the wild being used in a variety of ways:

- [bawejakunal.github.io][6]
- [case2111.github.io][7]
- [karateca.org][8]

## Installation

### Quick setup

To give you a running start I've put together some starter kits that you can download, fork or even deploy immediately:

- ⚗️🍨 Vanilla Jekyll starter kit  
	  [![Deploy to Netlify][image-1]][9]{:style="background: none"}
- ⚗️🌲 Forestry starter kit  
	  [![Deploy to Forestry][image-2]][10]{:style="background: none"}  
	  [![Deploy to Netlify][image-3]][11]{:style="background: none"}
- ⚗️💠 Netlify CMS starter kit  
	  [![Deploy to Netlify][image-4]][12]{:style="background: none"}

- ⚗️:octocat: GitHub Pages with remote theme kit  
	  {% include button.html text="Download kit" link="https://github.com/daviddarnes/alembic-kit/archive/remote-theme.zip" color="#24292e" %}
- ⚗️🚀 Stackbit starter kit  
	  [![Create with Stackbit][image-5]][13]{:style="background: none"}

### As a Jekyll theme

1. Add `gem "alembic-jekyll-theme"` to your `Gemfile` to add the theme as a dependancy
2. Run the command `bundle install` in the root of project to install the theme and its dependancies
3. Add `theme: alembic-jekyll-theme` to your `_config.yml` file to set the site theme
4. Run `bundle exec jekyll serve` to build and serve your site
5. Done! Use the [configuration][14] documentation and the example [`_config.yml`][15] file to set things like the navigation, contact form and social sharing buttons

### As a GitHub Pages remote theme

1. Add `gem "jekyll-remote-theme"` to your `Gemfile` to add the theme as a dependancy
2. Run the command `bundle install` in the root of project to install the jekyll remote theme gem as a dependancy
3. Add `jekyll-remote-theme` to the list of `plugins` in your `_config.yml` file
4. Add `remote_theme: daviddarnes/alembic@main` to your `_config.yml` file to set the site theme
5. Run `bundle exec jekyll serve` to build and serve your site
6. Done! Use the [configuration][16] documentation and the example [`_config.yml`][17] file to set things like the navigation, contact form and social sharing buttons

### As a Boilerplate / Fork

_(deprecated, not recommended)_

1. [Fork the repo][18]
2. Replace the `Gemfile` with one stating all the gems used in your project
3. Delete the following unnecessary files/folders: `.github`, `LICENSE`, `screenshot.png`, `CNAME` and `alembic-jekyll-theme.gemspec`
4. Run the command `bundle install` in the root of project to install the jekyll remote theme gem as a dependancy
5. Run `bundle exec jekyll serve` to build and serve your site
6. Done! Use the [configuration][19] documentation and the example [`_config.yml`][20] file to set things like the navigation, contact form and social sharing buttons

## Customising

When using Alembic as a theme means you can take advantage of the file overriding method. This allows you to overwrite any file in this theme with your own custom file, by matching the file name and path. The most common example of this would be if you want to add your own styles or change the core style settings.

To add your own styles copy the [`styles.scss`][21] into your own project with the same file path (`assets/styles.scss`). From there you can add your own styles, you can even optionally ignore the theme styles by removing the `@import "alembic";` line.

If you're looking to set your own colours and fonts you can overwrite them by matching the variable names from the [`_settings.scss`][22] file in your own `styles.scss`, make sure to state them before the `@import "alembic";` line so they take effect. The settings are a mixture of custom variables and settings from [Sassline][23] - follow the link to find out how to configure the typographic settings.

[1]:	https://jekyllrb.com/
[2]:	https://jekyllrb.com/
[3]:	https://sassline.com/
[4]:	https://formspree.io/
[5]:	https://www.siteleaf.com/
[6]:	https://bawejakunal.github.io/
[7]:	https://case2111.github.io/
[8]:	https://www.karateca.org/
[9]:	https://app.netlify.com/start/deploy?repository=https://github.com/daviddarnes/alembic-kit
[10]:	https://app.forestry.io/quick-start?repo=daviddarnes/alembic-forestry-kit&engine=jekyll
[11]:	https://app.netlify.com/start/deploy?repository=https://github.com/daviddarnes/alembic-forestry-kit
[12]:	https://app.netlify.com/start/deploy?repository=https://github.com/daviddarnes/alembic-netlifycms-kit&stack=cms
[13]:	https://app.stackbit.com/create?theme=https://github.com/daviddarnes/alembic-stackbit-kit
[14]:	#configuration
[15]:	https://github.com/daviddarnes/alembic/blob/master/_config.yml
[16]:	#configuration
[17]:	https://github.com/daviddarnes/alembic/blob/master/_config.yml
[18]:	https://github.com/daviddarnes/alembic#fork-destination-box
[19]:	#configuration
[20]:	https://github.com/daviddarnes/alembic/blob/master/_config.yml
[21]:	https://github.com/daviddarnes/alembic/blob/master/assets/styles.scss
[22]:	https://github.com/daviddarnes/alembic/blob/master/_sass/_settings.scss
[23]:	https://medium.com/@jakegiltsoff/sassline-v2-0-e424b2881e7e

[image-1]:	https://www.netlify.com/img/deploy/button.svg
[image-2]:	https://assets.forestry.io/import-to-forestry.svg
[image-3]:	https://www.netlify.com/img/deploy/button.svg
[image-4]:	https://www.netlify.com/img/deploy/button.svg
[image-5]:	https://assets.stackbit.com/badge/create-with-stackbit.svg