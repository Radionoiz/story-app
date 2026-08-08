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

`title`, `tags`, `date`, `excerpt`, and `slug` are optional. Without a title, the filename is converted into one. Nested folders inside `stories/` are supported.
