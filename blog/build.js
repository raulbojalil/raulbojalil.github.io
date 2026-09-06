const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const fm = require('front-matter');

const POSTS_DIR = path.join(__dirname, 'posts');
const TEMPLATE_INDEX_PATH = path.join(__dirname, 'index_template.html');
const TEMPLATE_POST_PATH = path.join(__dirname, 'post_template.html');
const OUTPUT_INDEX_PATH = path.join(__dirname, 'index.html');

const postsList = [];
const postTemplate = fs.existsSync(TEMPLATE_POST_PATH) ? fs.readFileSync(TEMPLATE_POST_PATH, 'utf-8') : '';

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      compilePost(fullPath);
    }
  }
}

function compilePost(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { attributes, body } = fm(fileContent);
  const htmlContent = marked.parse(body);

  // Extraer el nombre base del post (slug) y el directorio contenedor
  const postDir = path.dirname(filePath);
  const slug = path.basename(filePath, '.md');

  // Crear la subcarpeta del post (ej. posts/tech/mi-post)
  const outputFolder = path.join(postDir, slug);
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  // Definir la ruta del index.html dentro de la nueva carpeta
  const htmlOutputPath = path.join(outputFolder, 'index.html');
  
  // Calcular la URL limpia (relativa) terminada en '/'
  const relativeFolderPath = path.relative(__dirname, outputFolder).replace(/\\/g, '/');
  const cleanUrl = `${relativeFolderPath}/`;

  if (postTemplate) {
    const imageTag = attributes.image ? `<img src="${attributes.image}" class="cover" alt="${attributes.title || ''}">` : '';
    
    const outputPostHtml = postTemplate
      .replace(/{{title}}/g, attributes.title || 'Publicación')
      .replace(/{{category}}/g, attributes.category || 'General')
      .replace(/{{author}}/g, attributes.author || 'Anónimo')
      .replace(/{{date}}/g, attributes.date || '')
      .replace(/{{image}}/g, imageTag)
      .replace(/{{content}}/g, htmlContent);

    fs.writeFileSync(htmlOutputPath, outputPostHtml, 'utf-8');
  }

  postsList.push({
    title: attributes.title || 'Sin título',
    author: attributes.author || 'Anónimo',
    date: attributes.date || '',
    category: attributes.category || 'Other',
    image: attributes.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    excerpt: attributes.excerpt || attributes.description || '',
    featured: Boolean(attributes.featured),
    url: cleanUrl
  });

  console.log(`✓ Post compiled statically: ${cleanUrl}`);
}

processDirectory(POSTS_DIR);

postsList.sort((a, b) => new Date(b.date) - new Date(a.date));

const featuredPost = postsList.find(p => p.featured) || postsList[0];
const gridPosts = postsList.filter(p => p !== featuredPost);

let featuredHtml = '';
if (featuredPost) {
  featuredHtml = `
    <a class="featured-card" href="${featuredPost.url}">
        <img src="${featuredPost.image}" class="featured-img" alt="${featuredPost.title}">
        <div class="featured-body">
            <div><span class="tag">${featuredPost.category}</span></div>
            <h2>${featuredPost.title}</h2>
            <div class="post-meta">By ${featuredPost.author} • ${featuredPost.date}</div>
            <p style="font-size:0.85rem; color:var(--text-muted);">${featuredPost.excerpt}</p>
        </div>
    </a>`;
}

const gridHtml = gridPosts.map(post => `
    <a class="post-card" href="${post.url}">
        <img src="${post.image}" alt="${post.title}">
        <div class="post-card-body">
            <span class="tag">${post.category}</span>
            <h3>${post.title}</h3>
            <div class="post-meta">${post.author} • ${post.date}</div>
        </div>
    </a>`).join('\n');

if (fs.existsSync(TEMPLATE_INDEX_PATH)) {
  let templateContent = fs.readFileSync(TEMPLATE_INDEX_PATH, 'utf-8');

  templateContent = templateContent.replace(
    /<!-- FEATURED_POST_START -->[\s\S]*<!-- FEATURED_POST_END -->/,
    `<!-- FEATURED_POST_START -->\n${featuredHtml}\n            <!-- FEATURED_POST_END -->`
  );

  templateContent = templateContent.replace(
    /<!-- POSTS_GRID_START -->[\s\S]*<!-- POSTS_GRID_END -->/,
    `<!-- POSTS_GRID_START -->\n${gridHtml}\n            <!-- POSTS_GRID_END -->`
  );

  fs.writeFileSync(OUTPUT_INDEX_PATH, templateContent, 'utf-8');
  console.log('\n✓ Done.');
} else {
  console.error('\n⚠ Error: index_template.html not found');
}