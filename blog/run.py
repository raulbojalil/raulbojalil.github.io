import os
import json

# 1. Carpetas organizadas por los slugs de Wix
folders = [
    "posts/tech",
    "posts/software-development",
    "posts/ai",
    "posts/cybersecurity",
    "posts/other"
]

for folder in folders:
    os.makedirs(folder, exist_ok=True)

# 2. Artículos de prueba en inglés con metadatos ajustados
posts = {
    "posts/ai/generative-ai-future.md": """---
title: "Generative AI and the Future of Digital Design"
category: "AI"
lang: "en"
date: "2026-09-03"
author: "Laura Gómez"
image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
excerpt: "Exploring how generative artificial intelligence is reshaping digital art and design workflows."
featured: true
---

# Generative AI and the Future of Digital Design

Artificial intelligence is not replacing human creativity; it is elevating it to unprecedented levels.

## Modern Workflows
Generative visual tools now allow creators to turn concept sketches into fully realized layouts in minutes.

* **Rapid Prototyping:** Real-time visual feedback and iterations.
* **New Interfaces:** Prompt design as a core technical skill.
""",

    "posts/software-development/building-single-page-apps.md": """---
title: "Building Lightweight Single-Page Applications"
category: "Software development"
lang: "en"
date: "2026-09-01"
author: "David Ruiz"
image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80"
excerpt: "A look at client-side performance, minimal JS execution, and clean state handling."
featured: false
---

# Single-Page Architecture

Static sites backed by dynamic client-side parsers represent a fast, secure alternative for modern publishing platforms.
""",

    "posts/tech/hardware-trends.md": """---
title: "Next-Gen Hardware Trends in 2026"
category: "Tech"
lang: "en"
date: "2026-08-28"
author: "Alex Morgan"
image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
excerpt: "A dive into personal computing, embedded devices, and portable performance."
featured: false
---

# Hardware Innovation

Portable devices and custom embedded chips continue to shrink power budgets while pushing execution speeds higher.
""",

    "posts/cybersecurity/securing-static-sites.md": """---
title: "Securing Static Jamstack Sites"
category: "Cybersecurity"
lang: "en"
date: "2026-08-20"
author: "Marta Sanz"
image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80"
excerpt: "Key strategies to protect serverless architectures, static assets, and CDN pipelines."
featured: false
---

# Static Site Security

Eliminating server-side databases significantly reduces attack surfaces for static blogs hosted on platforms like GitHub Pages.
"""
}

# Escribir los archivos .md
for path, content in posts.items():
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip())

# 3. Guardar el índice
posts_index = list(posts.keys())
with open("posts.json", "w", encoding="utf-8") as f:
    json.dump(posts_index, f, indent=2, ensure_ascii=False)

# 4. Generar index.html con UI en inglés, Selector de Categoria y Language Picker
html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NEXO DIGITAL — Tech & Insights</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        :root {
            --bg-color: #f8fafc;
            --card-bg: #ffffff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --accent: #2563eb;
            --border-color: #e2e8f0;
            --max-width: 1150px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg-color); color: var(--text-main); line-height: 1.6; }

        /* Header */
        header { background: var(--card-bg); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
        .header-content { max-width: var(--max-width); margin: 0 auto; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.03em; color: var(--text-main); text-decoration: none; cursor: pointer; }
        
        .header-actions { display: flex; align-items: center; gap: 1rem; }
        
        /* Language Picker */
        .lang-picker { padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--card-bg); font-size: 0.85rem; font-weight: 500; cursor: pointer; color: var(--text-main); }

        /* Category Filter Navigation */
        .category-nav { background: var(--card-bg); border-bottom: 1px solid var(--border-color); padding: 0.75rem 1.5rem; }
        .category-container { max-width: var(--max-width); margin: 0 auto; display: flex; gap: 0.75rem; overflow-x: auto; white-space: nowrap; }
        .cat-btn { background: transparent; border: 1px solid transparent; color: var(--text-muted); padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .cat-btn:hover { background: var(--bg-color); color: var(--text-main); }
        .cat-btn.active { background: var(--text-main); color: #ffffff; }

        /* Layout */
        .container { max-width: var(--max-width); margin: 2rem auto; padding: 0 1.5rem; display: grid; grid-template-columns: 2.7fr 1fr; gap: 2rem; }

        .tag { display: inline-block; background: var(--accent); color: white; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px; }

        /* Featured Card */
        .featured-card { background: var(--card-bg); border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden; display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 2rem; cursor: pointer; transition: transform 0.2s; }
        .featured-card:hover { transform: translateY(-2px); }
        .featured-img { width: 100%; height: 100%; object-fit: cover; min-height: 240px; }
        .featured-body { padding: 1.5rem; display: flex; flex-direction: column; justify-content: center; }
        .featured-body h2 { font-size: 1.5rem; margin-bottom: 0.5rem; line-height: 1.2; }

        /* Grid */
        .posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem; }
        .post-card { background: var(--card-bg); border-radius: 8px; border: 1px solid var(--border-color); overflow: hidden; cursor: pointer; transition: transform 0.2s; }
        .post-card:hover { transform: translateY(-3px); }
        .post-card img { width: 100%; height: 140px; object-fit: cover; }
        .post-card-body { padding: 1rem; }
        .post-card-body h3 { font-size: 1rem; margin-bottom: 0.4rem; line-height: 1.3; }
        .post-meta { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; }

        /* Post Reader View */
        #single-post-view { display: none; background: var(--card-bg); padding: 2rem; border-radius: 8px; border: 1px solid var(--border-color); }
        #single-post-view img.cover { width: 100%; max-height: 380px; object-fit: cover; border-radius: 6px; margin: 1rem 0; }
        .back-btn { display: inline-block; margin-bottom: 1rem; color: var(--accent); text-decoration: none; font-weight: 600; cursor: pointer; }
        .markdown-body { line-height: 1.7; margin-top: 1.5rem; }
        .markdown-body h1, .markdown-body h2 { margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .markdown-body ul, .markdown-body ol { margin-left: 1.5rem; margin-bottom: 1rem; }

        /* Sidebar */
        .sidebar-widget { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 1.2rem; margin-bottom: 1.5rem; }
        .sidebar-widget h4 { font-size: 0.95rem; border-bottom: 2px solid var(--bg-color); padding-bottom: 0.5rem; margin-bottom: 0.8rem; }

        @media (max-width: 800px) {
            .container { grid-template-columns: 1fr; }
            .featured-card { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>

    <header>
        <div class="header-content">
            <a class="logo" onclick="filterCategory('all')">NEXO DIGITAL</a>
            <div class="header-actions">
                <select class="lang-picker" id="langSelect" onchange="changeLanguage(this.value)">
                    <option value="en" selected>🇺🇸 English</option>
                    <option value="es">🇲🇽 Español</option>
                    <option value="fr">🇫🇷 Français</option>
                </select>
            </div>
        </div>
    </header>

    <!-- Categories Filter Toolbar -->
    <nav class="category-nav">
        <div class="category-container">
            <button class="cat-btn active" data-cat="all" onclick="filterCategory('all')">All Posts</button>
            <button class="cat-btn" data-cat="Tech" onclick="filterCategory('Tech')">Tech</button>
            <button class="cat-btn" data-cat="Software development" onclick="filterCategory('Software development')">Software development</button>
            <button class="cat-btn" data-cat="AI" onclick="filterCategory('AI')">AI</button>
            <button class="cat-btn" data-cat="Cybersecurity" onclick="filterCategory('Cybersecurity')">Cybersecurity</button>
            <button class="cat-btn" data-cat="Other" onclick="filterCategory('Other')">Other</button>
        </div>
    </nav>

    <main class="container">
        <section id="feed-view">
            <div id="featured-container"></div>
            <h3 id="section-title" style="margin-bottom: 1rem; font-size: 1.1rem;">Latest Posts</h3>
            <div id="grid-container" class="posts-grid"></div>
        </section>

        <section id="single-post-view">
            <span class="back-btn" onclick="showHome()">← Back to all posts</span>
            <div id="post-content"></div>
        </section>

        <aside class="sidebar">
            <div class="sidebar-widget">
                <h4 id="widget-title">About the Blog</h4>
                <p id="widget-desc" style="font-size:0.85rem; color:var(--text-muted);">A static publishing platform built with Markdown, HTML5, and JS.</p>
            </div>
            <div class="sidebar-widget">
                <h4 id="newsletter-title">Newsletter</h4>
                <input type="email" placeholder="Your email address" style="width:100%; padding:8px; margin-bottom:8px; border:1px solid var(--border-color); border-radius:4px; font-size:0.85rem;">
                <button style="width:100%; padding:8px; background:var(--text-main); color:white; border:none; border-radius:4px; font-weight:600; cursor:pointer;">Subscribe</button>
            </div>
        </aside>
    </main>

    <script>
        let allPosts = [];
        let currentCategory = 'all';
        let currentLanguage = 'en';

        function parseFrontMatter(text) {
            const regex = /^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n([\\s\\S]*)$/;
            const match = text.match(regex);
            
            if (!match) return { metadata: {}, markdown: text };

            const yamlText = match[1];
            const markdown = match[2];
            const metadata = {};

            yamlText.split('\\n').forEach(line => {
                const [key, ...valueParts] = line.split(':');
                if (key && valueParts.length > 0) {
                    let val = valueParts.join(':').trim();
                    val = val.replace(/^["']|["']$/g, '');
                    if (val === 'true') val = true;
                    if (val === 'false') val = false;
                    metadata[key.trim()] = val;
                }
            });

            return { metadata, markdown };
        }

        async function loadBlog() {
            try {
                const res = await fetch('posts.json');
                const filePaths = await res.json();

                allPosts = [];
                for (const path of filePaths) {
                    const postRes = await fetch(path);
                    const rawText = await postRes.text();
                    const { metadata, markdown } = parseFrontMatter(rawText);
                    
                    allPosts.push({ ...metadata, markdown, path });
                }

                renderFeed();
            } catch (err) {
                console.error("Error loading posts:", err);
            }
        }

        function filterCategory(cat) {
            currentCategory = cat;
            
            document.querySelectorAll('.cat-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.cat === cat);
            });

            showHome();
            renderFeed();
        }

        function changeLanguage(lang) {
            currentLanguage = lang;
            renderFeed();
        }

        function renderFeed() {
            const featuredContainer = document.getElementById('featured-container');
            const gridContainer = document.getElementById('grid-container');

            featuredContainer.innerHTML = '';
            gridContainer.innerHTML = '';

            // Filter posts by language and category
            let filtered = allPosts.filter(p => !p.lang || p.lang === currentLanguage);

            if (currentCategory !== 'all') {
                filtered = filtered.filter(p => p.category && p.category.toLowerCase() === currentCategory.toLowerCase());
            }

            if (filtered.length === 0) {
                gridContainer.innerHTML = `<p style="color:var(--text-muted); grid-column: 1/-1;">No posts found for this category.</p>`;
                return;
            }

            const featuredPost = filtered.find(p => p.featured) || filtered[0];

            if (featuredPost) {
                featuredContainer.innerHTML = `
                    <article class="featured-card" onclick="openPost('${featuredPost.path}')">
                        <img src="${featuredPost.image}" class="featured-img" alt="${featuredPost.title}">
                        <div class="featured-body">
                            <div><span class="tag">${featuredPost.category}</span></div>
                            <h2>${featuredPost.title}</h2>
                            <div class="post-meta">By ${featuredPost.author} • ${featuredPost.date}</div>
                            <p style="font-size:0.85rem; color:var(--text-muted);">${featuredPost.excerpt || ''}</p>
                        </div>
                    </article>
                `;
            }

            filtered.filter(p => p !== featuredPost).forEach(post => {
                const card = document.createElement('article');
                card.className = 'post-card';
                card.onclick = () => openPost(post.path);
                card.innerHTML = `
                    <img src="${post.image}" alt="${post.title}">
                    <div class="post-card-body">
                        <span class="tag">${post.category}</span>
                        <h3>${post.title}</h3>
                        <div class="post-meta">${post.author} • ${post.date}</div>
                    </div>
                `;
                gridContainer.appendChild(card);
            });
        }

        function openPost(path) {
            const post = allPosts.find(p => p.path === path);
            if (!post) return;

            const htmlContent = marked.parse(post.markdown);

            document.getElementById('post-content').innerHTML = `
                <span class="tag">${post.category}</span>
                <h1 style="font-size:2rem; margin-top:0.4rem;">${post.title}</h1>
                <div class="post-meta">By ${post.author} • ${post.date}</div>
                <img src="${post.image}" class="cover" alt="${post.title}">
                <div class="markdown-body">${htmlContent}</div>
            `;

            document.getElementById('feed-view').style.display = 'none';
            document.getElementById('single-post-view').style.display = 'block';
            window.scrollTo(0, 0);
        }

        function showHome() {
            document.getElementById('single-post-view').style.display = 'none';
            document.getElementById('feed-view').style.display = 'block';
        }

        loadBlog();
    </script>
</body>
</html>
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_content.strip())

print("✅ Updated blog migration structure generated successfully!")