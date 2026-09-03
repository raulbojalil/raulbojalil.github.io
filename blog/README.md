# Static Markdown Blog (GitHub Pages ready)

A minimal, zero-build static blog that loads Markdown posts dynamically using [marked.js](https://marked.js.org/).

## Features

- Pure static HTML / CSS / JS — works perfectly on **GitHub Pages**
- Posts are just `.md` files in the `posts/` folder
- Post list is defined in `posts/posts.json` (easy to edit)
- Hash-based routing (`#slug`) so direct links and browser back/forward work
- Clean dark theme with good Markdown styling
- Mobile friendly

## Project structure

```
.
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
├── posts/
│   ├── posts.json      ← list of posts
│   ├── welcome.md
│   └── markdown-demo.md
└── README.md
```

## How to use

### 1. Put this on GitHub Pages

1. Create a new repository (or use an existing one).
2. Push these files to the `main` (or `gh-pages`) branch.
3. In the repo settings → Pages → set source to the branch that contains these files.
4. Your blog will be live at `https://<username>.github.io/<repo>/`

### 2. Add a new post

1. Create a Markdown file, for example:

   ```
   posts/my-awesome-post.md
   ```

2. Open `posts/posts.json` and add an entry (newest posts can go at the top or anywhere — the app sorts by date):

   ```json
   {
     "slug": "my-awesome-post",
     "title": "My Awesome Post",
     "date": "2025-09-15",
     "file": "my-awesome-post.md",
     "description": "A short teaser shown in the list"
   }
   ```

3. Commit and push. The new post appears automatically.

### 3. Customize

- Edit `index.html` to change the blog title and tagline.
- Tweak colors in `css/styles.css` (CSS variables at the top).
- The JavaScript is in `js/app.js` — very small and easy to extend.

## Technical notes

- `marked.js` is loaded from a CDN. You can also vendor it if you prefer.
- All content is fetched with the browser’s `fetch()` API, so the Markdown files must be publicly accessible (they are on GitHub Pages).
- No build tools required.

Enjoy!
