# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is **鹿佳莼's** personal Jekyll site (`https://plasmashen.github.io/lujiachun`, custom domain in `CNAME`), forked from the [Alembic Jekyll theme](https://alembic.darn.es/). It is both a blog (Chinese-language posts under `_posts/`) and a games hub (`/game/` — HTML mini-games plus Python analysis scripts).

The repo retains the upstream theme's gemspec (`alembic-jekyll-theme.gemspec`) and `Gemfile` (which just references the gemspec), so the project builds as if it were the theme itself rather than consuming it as a gem.

## Common commands

```bash
bundle install                      # install gems declared via the gemspec
bundle exec jekyll serve            # local dev server with live reload
bundle exec jekyll build            # build to _site/
python3 game/dp_optimizer.py        # run the card-pool-game DP analysis
python3 game/catch_bad_guy_expected_value.py  # EV simulator for catch_bad_guy_game
```

There is no test suite, linter, or CI build step. Deployment is GitHub Pages from the default branch — pushing to the remote publishes the site.

## Architecture notes

- **Theme overrides live at the repo root.** Because this repo *is* the theme, edits to `_layouts/`, `_includes/`, `_sass/`, and `assets/` directly change the rendered site — there is no separate theme gem to override. Upstream Alembic docs describing override paths (e.g., copy `assets/styles.scss` into your project) do not apply here.
- **`css_inline: true` is set in `_config.yml`.** Styles are inlined via `_includes/site-styles.html` into every page's `<head>`; `assets/styles.scss` is **not** served as a separate stylesheet. Custom CSS additions must go through `site-styles.html` (or a `site-before-start.html` include) or the change will not appear.
- **Site navigation, collections, fonts, and favicons are all configured in `_config.yml`.** The header nav (`navigation_header`) wires `/`, `/blog/`, `/categories/`, `/search/`, `/game/`, and an external "Fork" link. Posts use `permalink: pretty` (`/YYYY/MM/DD/page-name/`) and `timezone: Asia/Beijing`.
- **Layouts hierarchy:** `_layouts/default.html` is the chrome; `page.html`, `post.html`, `blog.html`, and `categories.html` extend it. The `defaults` block in `_config.yml` auto-assigns `layout: post` to anything in the `posts` collection and `layout: page` to top-level pages, so post/page front matter usually does not need to set `layout`.
- **Shortcode includes** (`button.html`, `figure.html`, `icon.html`, `video.html`, `map.html`, `google_map.html`, `site-form.html`, `site-search.html`, `nav-share.html`) are the public API for authoring posts — see the upstream README sections "Using includes" and "Page and Post options" for parameters.
- **Games section is self-contained.** Each file under `game/` is a standalone HTML page (some with embedded JS games) listed from `game/index.html`. The hub links to `https://lujiachun.top/...` absolute URLs, so local previews of the hub will navigate to the live site rather than local files. `game/DP_README.md` documents the dynamic-programming optimizer for the card-pool mini-game; treat it as design notes, not a contract.

## Notable deviations from upstream Alembic

- The original `daviddarnes/alembic` README, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, etc. are still present but are upstream theme docs — most instructions there (deploy buttons, gem installation, override patterns) target *consumers* of the theme, not this repo. Treat the upstream README as reference material, not as instructions for this project.
- `_config.yml` adds a `Game` nav entry, sets the site title/logo/url to 鹿佳莼's, enables `css_inline`, and sets the timezone to `Asia/Beijing`.
- Content is primarily Chinese; preserve UTF-8 and do not "normalize" Chinese filenames or post slugs without checking that links from the blog index and category pages still resolve.
