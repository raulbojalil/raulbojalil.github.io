# Welcome to my blog

This is a **static** Markdown blog that runs entirely in the browser.

## How it works

1. All posts live as plain `.md` files inside the `posts/` folder.
2. A small `posts/posts.json` file lists the posts (title, date, slug, filename).
3. When you open the site, JavaScript fetches that JSON and builds the list.
4. Clicking a post fetches the corresponding Markdown file and renders it with [marked.js](https://marked.js.org/).

No build step, no server-side code — perfect for **GitHub Pages**.

## Adding a new post

1. Create a new file, e.g. `posts/my-new-post.md`
2. Add an entry to `posts/posts.json`:

```json
{
  "slug": "my-new-post",
  "title": "My New Post",
  "date": "2025-09-10",
  "file": "my-new-post.md",
  "description": "Optional short summary"
}
```

3. Commit & push. That's it.

Enjoy writing!
