# The Story Shelf

A static story library powered by plain text files. There is no database or admin panel: add a `.txt` file to `stories/`, commit it, and it appears in the collection.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`. The output is written to `dist/` and can be deployed to GitHub Pages, Netlify, Vercel, or any static host.

## Add a story

Create a file such as `stories/my-story.txt`:

```txt
---
title: My Story Title
tags: mystery, short fiction
date: 2026-08-08
excerpt: An optional short description shown on the collection page.
---
Your story begins here.

Blank lines create new paragraphs.
```

`title`, `tags`, `date`, `excerpt`, and `slug` are optional. Without a title, the filename is converted into one.

## Add a story with chapters

Create one folder inside `stories/`. Add a `story.txt` file for shared story metadata, then add one text file per chapter:

```text
stories/
  my-long-story/
    story.txt
    01-the-arrival.txt
    02-the-letter.txt
    03-the-return.txt
```

The `story.txt` file describes the whole story and does not become a chapter:

```txt
---
title: My Long Story
tags: fantasy, adventure
date: 2026-08-14
excerpt: A short description for the collection page.
slug: my-long-story
---
```

Each chapter file contains its own title and text:

```txt
---
title: The Arrival
order: 1
---
The first chapter begins here.
```

Chapters are sorted by `order`. If `order` is omitted, the number at the beginning of the filename is used. Each chapter receives its own URL and previous/next navigation. The original single-file story format remains supported.

## Format story text

Story and chapter bodies support Markdown and safe HTML. For example:

```txt
This is *italic* or <em>italic</em>.

This is **bold** or <strong>bold</strong>.

You can also use <i>italic</i> and <b>bold</b>.

This is <u>underlined</u>.
```

HTML is sanitized when rendered. Unsafe elements and attributes, such as scripts and inline event handlers, are removed automatically.
