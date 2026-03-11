# Lujiachun
This repo is forked from [Alembic][1]
[![Gem Version][image-1]][2]

⚗ A Jekyll boilerplate theme designed to be a starting point for any Jekyll website.

![Screenshot][image-2]

[<img src="https://cdn.buymeacoffee.com/buttons/default-yellow.png" width="217"/>][3]

## Contents
- [About][4]
- [Features][5]
- [Examples][6]
- [Installation][7]
- [Customising][8]
- [Configuration][9]
  - [Gem dependency settings][10]
  - [Site settings][11]
  - [Site performance settings][12]
  - [Site navigation][13]
  - [Custom fonts][14]
- [Using includes][15]
- [Page layouts][16]
- [Page and Post options][17]
- [Credits][18]

## About

**Alembic is a starting point for [Jekyll][19] projects. Rather than starting from scratch, this boilerplate theme is designed to get rolling immediately. Install it, configure it, tweak it, push it.**

## Features

- Available as a **theme gem** and **GitHub Pages** theme
- Clear and elegant design that can be used out of the box or as solid starting point
- Tested in all major browsers, including **IE and Edge**
- Built in **Service Worker** so it can work offline and on slow connections
- **Configurable colours** and typography in a single settings file
- Extensive set of **shortcodes** to include various elements; such as buttons, icons, figure images and more
- Solid **typographic framework** from [Sassline][20]
- Configurable navigation via a single file
- Modular Jekyll components
- Post category support in the form of a single post index page grouped by category
- Built in live search using JavaScript
- **Contact form** built in using [Formspree][21] or [Netlify Forms][22]
- Designed with **[Siteleaf][23]** in mind
- Has 9 of the most popular networks as performant sharing buttons
- Has documentation

## Examples

Here are a few examples of Alembic out in the wild being used in a variety of ways:

- [billmei.net][24]
- [bawejakunal.github.io][25]
- [case2111.github.io][26]
- [karateca.org][27]

## Installation

### Quick setup

To give you a running start I've put together some starter kits that you can download, fork or even deploy immediately:

- Vanilla Jekyll starter kit:
  [![Deploy to Netlify][image-3]][28]
- Forestry starter kit:
  [![Deploy to Forestry][image-4]][29]
  [![Deploy to Netlify][image-5]][30]
- Netlify CMS starter kit:
  [![Deploy to Netlify][image-6]][31]

- GitHub Pages with remote theme kit - **[Download kit][32]**
- Stackbit starter kit:
  [![Create with Stackbit][image-7]][33]

### As a Jekyll theme

1. Add `gem "alembic-jekyll-theme"` to your `Gemfile` to add the theme as a dependancy
2. Run the command `bundle install` in the root of project to install the theme and its dependancies
3. Add `theme: alembic-jekyll-theme` to your `_config.yml` file to set the site theme
4. Run `bundle exec jekyll serve` to build and serve your site
5. Done! Use the [configuration][34] documentation and the example [`_config.yml`][35] file to set things like the navigation, contact form and social sharing buttons

### As a GitHub Pages remote theme

1. Add `gem "jekyll-remote-theme"` to your `Gemfile` to add the theme as a dependancy
2. Run the command `bundle install` in the root of project to install the jekyll remote theme gem as a dependancy
3. Add `jekyll-remote-theme` to the list of `plugins` in your `_config.yml` file
4. Add `remote_theme: daviddarnes/alembic@main` to your `_config.yml` file to set the site theme
5. Run `bundle exec jekyll serve` to build and serve your site
6. Done! Use the [configuration][36] documentation and the example [`_config.yml`][37] file to set things like the navigation, contact form and social sharing buttons

### As a Boilerplate / Fork

_(deprecated, not recommended)_

1. [Fork the repo][38]
2. Replace the `Gemfile` with one stating all the gems used in your project
3. Delete the following unnecessary files/folders: `.github`, `LICENSE`, `screenshot.png`, `CNAME` and `alembic-jekyll-theme.gemspec`
4. Run the command `bundle install` in the root of project to install the jekyll remote theme gem as a dependancy
5. Run `bundle exec jekyll serve` to build and serve your site
6. Done! Use the [configuration][39] documentation and the example [`_config.yml`][40] file to set things like the navigation, contact form and social sharing buttons

## Customising

When using Alembic as a theme means you can take advantage of the file overriding method. This allows you to overwrite any file in this theme with your own custom file, by matching the file name and path. The most common example of this would be if you want to add your own styles or change the core style settings.

To add your own styles copy the [`styles.scss`][41] into your own project with the same file path (`assets/styles.scss`). From there you can add your own styles, you can even optionally ignore the theme styles by removing the `@import "alembic";` line.

If you're looking to set your own colours and fonts you can overwrite them by matching the variable names from the [`_settings.scss`][42] file in your own `styles.scss`, make sure to state them before the `@import "alembic";` line so they take effect. The settings are a mixture of custom variables and settings from [Sassline][43] - follow the link to find out how to configure the typographic settings.

## Configuration

There are a number of optional settings for you to configure. Use the example [`_config.yml`][44] file in the repo and use the documentation below to configure your site:

### Gem dependency settings

`twitter`, `author` and `social` values will need to be changed to the projects' social information or removed. Look for the `Gem settings` comment within the `/_config.yml` file. These values are for the [jekyll-seo-tag][45] - follow the link to find out more.

### Site settings

You'll need to change the `description`, `title` and `url` to match with the project. You'll also need to replace the logos, default social and default offline images in the `/assets/` directory with your own graphics. Setting the site language can be done with `lang`, the theme will default to `en-US`. The `email` needs to be changed to the email you want to receive contact form enquires with. The `disqus` value can be changed to your project username on [Disqus][46], remove this from the `/_config.yml` file if you don't want comments enabled. Look for the `Site settings` comment within the `/_config.yml` file. The `repo` setting is optional, for now, and can be removed entirely, if you wish.

Google Analytics can be enabled via the site configuration too. Add your tracking ID to the `/_config.yml` file in the following method: `google_analytics: 'UA-XXXXXXXX-1'`. By default all IPs of site visitors are anonymous to maintain a level of privacy for the audience. If you wish to turn this off set the `google_analytics_anonymize_ip` key to `false`.

Date format can be customised in the `/_config.yml` with the option `date_format` (please refer to Liquid date filters documentation for learning about formatting possibilities). Only placeholder formatting is supported, do not try to use ordinal dates introduced in Jekyll 3.8.

The `short_name` option within `/_config.yml` is to add a custom name to the site's web application counterpart. When the website is added to a device this name will appear alonside the app icon. The short name will default to the site title if this isn't set.

### Site performance settings

Alembic comes with a couple of options to enhance the speed and overall performance of the site you build upon it.

By default the built in Service Worker is enabled, and will work on a 'network first' method. Meaning if there's no internet connection the content the Service Worker has cached will be used until the connection comes back. It will always look for a live version of the code first. To disable the Service Worker add an option called `service_worker` with a value of `false` in the `/_config.yml` file.

Another option to speed up Alembic is to enable inline CSS, which is off by default. You can enable this by setting `css_inline: true` inside your `/_config.yml` file. By switching to inline styles you bypass the use `/assets/styles.scss`, any custom styles will need to be added in `/_includes/site-styles.html` or in a new custom file.

Please note that these options aren't a "silver bullet" for making your site faster, make sure to audit and debug your site to get the best performance for your situation.

### Site navigation

There are a total of 4 different navigation types:

- `navigation_header`: The links shown in the header (it is also used on the 404 page)
- `navigation_footer`: The links shown in the footer
- `social_links`: The social icon links that are shown in the sidebar
- `sharing_links`: The social sharing buttons that are shown at the bottom of blog posts

All navigations can be edited using the `_config.yml` file. To see example usage either look for the `Site navigation` comment within the `/_config.yml` file or see [the nav-share.html include][47].

If there are no items for the `navigation_header` or `navigation_footer`, they will fallback to a list of pages within the site. The `social_navigation` properties should either be one that is already in the list (so `Twitter` or `Facebook`) or a regular `link`, this is so an icon can be set for the link.

### Custom fonts

Alembic comes with custom fonts served from Google fonts. By default it requests Merriweather but this can be any font from any provider assuming it supports requesting fonts in the same manner and does not require javascript.

This can be configured under the `custom_fonts` key.

- `urls`: The urls supplied to you from your font provider (eg https://fonts.googleapis.com/css2?family=Merriweather). For best performance try to use as few urls as possible
- `preconnect`: (optional) If your font provider serves the font files from another domain it can be useful to make a connection to that domain in advance. For example google load the font files from fonts.gstatic.com. This can be omitted if not required

If you want to customise this further you can find the include for custom fonts in `_includes/site-custom-fonts.html`.

## Using includes

There are 2 main types of includes: ones designed for the site and ones that are designed as shortcodes. Here are a list of the shortcode includes:

### `button.html`
A button that can link to a page of any kind.

Example usage: `{% include button.html text="I'm a button" link="https://david.darn.es" %}`

Available options:
- `text`: The text of the button _required_
- `link`: The link that the button goes to _required_
- `icon`: The icon that is added to the end of the button text
- `color`: The colour of the button

### `figure.html`
An image with optional caption.

Example usage: `{% include figure.html image="/uploads/feature-image.jpg" caption="Check out my photo" %}`

Available options:
- `image`: The image shown _required_
- `caption`: A caption to explain the image
- `position`: The position of the image; `left`, `right` or `center`
- `width` & `height`: Optional width and height attributes of the containing image

### `icon.html`
An icon.

Example usage: `{% include icon.html id="twitter" %}`

Available options:
- `id`: The reference for the icon _required_
- `title`: The accessible label for the icon
- `color`: The desired colour of the icon
- `width` & `height`: Width and height attributes for the icon, default is `16`

### `nav-share.html`
A set of buttons that share the current page to various social networks, which is controlled within the `_config.yml` file under the `sharing_links` keyword.

Example usage: `{% include nav-share.html %}`

Available options:
``` yml
Twitter: "#1DA1F2"
facebook: "#3B5998"
Pinterest: "#BD081C"
LinkedIn: "#0077B5"
tumblr: "#36465D"
Reddit: "#FF4500"
HackerNews: "#ff6600"
DesignerNews: "#2D72D9"
Email: true
```

_The first item is the name of the network (must be one of the ones stated above) and the second is the colour of the button. To remove a button remove the line of the same name._

### `video.html`
A YouTube video.

Example usage: `{% include video.html id="zrkcGL5H3MU" %}`

Available options:
- `id`: The YouTube ID for the video _required_

### `map.html`
A Google map. _See Google [My Maps][48]_

Example usage: `{% include map.html id="1UT-2Z-Vg_MG_TrS5X2p8SthsJhc" %}`

Available options:
- `id`: The map ID for the video _required_

### `site-form.html`
Adds a contact form to the page. This can be used with [Formspree][49] or [Netlify Forms][50] depending on your setup.

Example usage: `{% include site-form.html %}`

Available options:
- `netlify_form=true`: Set whether you would like to use Netlify Forms, otherwise the form will default to Formspree
- `name`: Give the form a name, by default the form is called "Contact". The name will be reflected when form submissions come through in Netlify or in your email client. The name is also used in the label and input elements for accessibility


Use the `email` option in the `/_config.yml` to change to the desired email.

### `site-search.html`
Adds a search form to the page.

Example usage: `{% include site-search.html %}`

This include has no options. This include will add a block of javascript to the page and javascript reference in order for the search field to work correctly.

### `site-before-start.html` & `site-before-end.html`
Optional html includes for adding scripts, css, js or any embed code you wish to add to every page without the need to overwrite the entire `default.html` template.

**Example usage:** These are different to other includes as they are designed to be overwritten. If you create a `site-before-start.html` file in the `_includes/` the contents of the file will be included immediately before the closing `</head>` tag. If you create a `site-before-end.html` file the contents of the file will be included immediately before the closing `</body>` tag.

## Page layouts

As well as `page`, `post`, `blog`, there are a few alternative layouts that can be used on pages:

- `categories`: Shows all posts grouped by category, with an index of categories in a left hand sidebar
- `search`: Adds a search field to the page as well as a simplified version of the sidebar to allow more focus on the search results

## Page and Post options

There are some more specific options you can apply when creating a page or a post:

- `aside: true`: Adds a sidebar to the page or post, this is false by default and will not appear
- `comments: false`: Turns off comments for that post
- `feature_image: "/uploads/feature-image.jpg"`: Adds a full width feature image at the top of the page
- `feature_text: "Example text"`: Adds text to the top of the page as a full width feature with solid colour; supports markdown. This can be used in conjunction with the `feature_image` option to create a feature image with text over it
- `indexing: false`: Adds a `noindex` meta element to the `<head>` to stop crawler bots from indexing the page, used on the 404 page

> **Note:** The Post List Page options are actually in the collection data within the `_config.yml` file.

## Credits

- Thanks to [Simple Icons][51] for providing the brand icons, by [Dan Leech][52]
- Thanks to [Sassline][53] for the typographic basis, by [Jake Giltsoff][54]
- Thanks to [Flexbox mixin][55] by [Brian Franco][56]
- Thanks to [Normalize][57] by [Nicolas Gallagher][58] and [Jonathan Neal][59].
- Thanks to [pygments-css][60] for the autumn syntax highlighting, by [Rich Leland][61]

[1]:	https://alembic.darn.es/
[2]:	https://badge.fury.io/rb/alembic-jekyll-theme
[3]:	https://buymeacoffee.com/daviddarnes#support
[4]:	#about
[5]:	#features
[6]:	#examples
[7]:	#installation
[8]:	#customising
[9]:	#configuration
[10]:	#gem-dependency-settings
[11]:	#site-settings
[12]:	#site-performance-settings
[13]:	#site-navigation
[14]:	#custom-fonts
[15]:	#using-includes
[16]:	#page-layouts
[17]:	#page-and-post-options
[18]:	#credits
[19]:	https://jekyllrb.com/
[20]:	https://sassline.com/
[21]:	https://formspree.io/
[22]:	https://www.netlify.com/features/#forms
[23]:	http://www.siteleaf.com/
[24]:	https://billmei.net/
[25]:	https://bawejakunal.github.io/
[26]:	https://case2111.github.io/
[27]:	https://www.karateca.org/
[28]:	https://app.netlify.com/start/deploy?repository=https://github.com/daviddarnes/alembic-kit
[29]:	https://app.forestry.io/quick-start?repo=daviddarnes/alembic-forestry-kit&engine=jekyll
[30]:	https://app.netlify.com/start/deploy?repository=https://github.com/daviddarnes/alembic-forestry-kit
[31]:	https://app.netlify.com/start/deploy?repository=https://github.com/daviddarnes/alembic-netlifycms-kit&stack=cms
[32]:	https://github.com/daviddarnes/alembic-kit/archive/remote-theme.zip
[33]:	https://app.stackbit.com/create?theme=https://github.com/daviddarnes/alembic-stackbit-kit
[34]:	#configuration
[35]:	https://github.com/daviddarnes/alembic/blob/master/_config.yml
[36]:	#configuration
[37]:	https://github.com/daviddarnes/alembic/blob/master/_config.yml
[38]:	https://github.com/daviddarnes/alembic#fork-destination-box
[39]:	#configuration
[40]:	https://github.com/daviddarnes/alembic/blob/master/_config.yml
[41]:	https://github.com/daviddarnes/alembic/blob/master/assets/styles.scss
[42]:	https://github.com/daviddarnes/alembic/blob/master/_sass/_settings.scss
[43]:	https://medium.com/@jakegiltsoff/sassline-v2-0-e424b2881e7e
[44]:	https://github.com/daviddarnes/alembic/blob/master/_config.yml
[45]:	https://github.com/jekyll/jekyll-seo-tag
[46]:	https://disqus.com
[47]:	#nav-sharehtml
[48]:	https://www.google.com/mymaps
[49]:	https://formspree.io/
[50]:	https://www.netlify.com/docs/form-handling/
[51]:	https://simpleicons.org/
[52]:	https://twitter.com/bathtype
[53]:	https://sassline.com/
[54]:	https://twitter.com/jakegiltsoff
[55]:	https://github.com/mastastealth/sass-flex-mixin
[56]:	https://twitter.com/brianfranco
[57]:	https://necolas.github.io/normalize.css/
[58]:	https://twitter.com/necolas
[59]:	https://twitter.com/jon_neal
[60]:	http://richleland.github.io/pygments-css/
[61]:	https://twitter.com/richleland

[image-1]:	https://badge.fury.io/rb/alembic-jekyll-theme.svg
[image-2]:	https://raw.githubusercontent.com/daviddarnes/alembic/master/screenshot.png
[image-3]:	https://www.netlify.com/img/deploy/button.svg
[image-4]:	https://assets.forestry.io/import-to-forestry.svg
[image-5]:	https://www.netlify.com/img/deploy/button.svg
[image-6]:	https://www.netlify.com/img/deploy/button.svg
[image-7]:	https://assets.stackbit.com/badge/create-with-stackbit.svg