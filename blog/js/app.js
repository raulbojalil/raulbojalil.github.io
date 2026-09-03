/**
 * Simple static Markdown blog powered by marked.js
 * Posts live in /posts as .md files.
 * The list of posts is defined in posts.json so you only edit that file when adding new posts.
 */

const POSTS_JSON = "posts/posts.json";
const POSTS_DIR = "posts/";

// Configure marked (optional nice defaults)
marked.setOptions({
  gfm: true,          // GitHub Flavored Markdown
  breaks: false,
  headerIds: true,
  mangle: false
});

const postListEl = document.getElementById("post-list");
const postViewEl = document.getElementById("post-view");
const postsUl = document.getElementById("posts");
const postContent = document.getElementById("post-content");
const backBtn = document.getElementById("back-btn");
const homeLink = document.getElementById("home-link");

let postsMeta = []; // will hold the array from posts.json

// ---------- Routing helpers (hash-based, works great on GitHub Pages) ----------
function getSlugFromHash() {
  const hash = window.location.hash.slice(1); // remove #
  return hash || null;
}

function showList() {
  postListEl.classList.remove("hidden");
  postViewEl.classList.add("hidden");
  window.location.hash = "";
  document.title = "My Blog";
}

function showPost(slug) {
  postListEl.classList.add("hidden");
  postViewEl.classList.remove("hidden");
  window.location.hash = slug;
}

// ---------- Load the list of posts ----------
async function loadPostsList() {
  try {
    const res = await fetch(POSTS_JSON);
    if (!res.ok) throw new Error(`Could not load ${POSTS_JSON}`);
    postsMeta = await res.json();

    // Sort by date descending (newest first)
    postsMeta.sort((a, b) => new Date(b.date) - new Date(a.date));

    renderPostList();
  } catch (err) {
    postsUl.innerHTML = `<li class="error">Failed to load posts: ${err.message}</li>`;
    console.error(err);
  }
}

function renderPostList() {
  if (!postsMeta.length) {
    postsUl.innerHTML = `<li class="loading">No posts yet.</li>`;
    return;
  }

  postsUl.innerHTML = postsMeta
    .map(
      (post) => `
      <li>
        <a href="#${post.slug}" data-slug="${post.slug}">
          <div class="post-title">${escapeHtml(post.title)}</div>
          <div class="post-meta">${formatDate(post.date)}${post.description ? " · " + escapeHtml(post.description) : ""}</div>
        </a>
      </li>
    `
    )
    .join("");
}

// ---------- Load a single post ----------
async function loadPost(slug) {
  const meta = postsMeta.find((p) => p.slug === slug);
  if (!meta) {
    postContent.innerHTML = `<p class="error">Post not found.</p>`;
    return;
  }

  postContent.innerHTML = `<p class="loading">Loading…</p>`;
  showPost(slug);

  try {
    const res = await fetch(`${POSTS_DIR}${meta.file}`);
    if (!res.ok) throw new Error(`Could not load ${meta.file}`);
    const md = await res.text();

    // Optional: you can also put front-matter in the .md files later.
    // For now we just render the whole file.
    const html = marked.parse(md);
    postContent.innerHTML = html;

    document.title = `${meta.title} · My Blog`;
  } catch (err) {
    postContent.innerHTML = `<p class="error">Failed to load post: ${err.message}</p>`;
    console.error(err);
  }
}

// ---------- Helpers ----------
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ---------- Event listeners ----------
backBtn.addEventListener("click", showList);
homeLink.addEventListener("click", (e) => {
  e.preventDefault();
  showList();
});

// Handle hash changes (browser back/forward + direct links)
window.addEventListener("hashchange", () => {
  const slug = getSlugFromHash();
  if (slug) {
    loadPost(slug);
  } else {
    showList();
  }
});

// Initial load
(async function init() {
  await loadPostsList();

  const initialSlug = getSlugFromHash();
  if (initialSlug) {
    loadPost(initialSlug);
  } else {
    showList();
  }
})();
