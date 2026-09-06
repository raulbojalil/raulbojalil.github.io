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

// 1. Recorrer directorios en busca de archivos Markdown
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

// 2. Compilar Markdown a HTML individual
function compilePost(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { attributes, body } = fm(fileContent);
  const htmlContent = marked.parse(body);

  // Determinar la ruta de salida .html
  const htmlOutputPath = filePath.replace(/\.md$/, '.html');
  
  // Calcular la ruta relativa web (ej: /blog/posts/ai/generative-ai.html)
  const relativeHtmlPath = '/' + path.relative(__dirname, htmlOutputPath).replace(/\\/g, '/');

  // Generar HTML del post si existe la plantilla
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

  // Guardar datos para generar el listado del index
  postsList.push({
    title: attributes.title || 'Sin título',
    author: attributes.author || 'Anónimo',
    date: attributes.date || '',
    category: attributes.category || 'Other',
    image: attributes.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    excerpt: attributes.excerpt || attributes.description || '',
    featured: Boolean(attributes.featured),
    url: relativeHtmlPath
  });

  console.log(`✓ Post estático compilado: ${relativeHtmlPath}`);
}

// Ejecutar compilación de posts
processDirectory(POSTS_DIR);

// Ordenar por fecha (más recientes primero)
postsList.sort((a, b) => new Date(b.date) - new Date(a.date));

// Separar el post destacado del resto
const featuredPost = postsList.find(p => p.featured) || postsList[0];
const gridPosts = postsList.filter(p => p !== featuredPost);

// 3. Generar HTML estático con hipervínculos <a> nativos
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

// 4. Inyectar únicamente dentro de las marcas en index_template.html
if (fs.existsSync(TEMPLATE_INDEX_PATH)) {
  let templateContent = fs.readFileSync(TEMPLATE_INDEX_PATH, 'utf-8');

  // Solo reemplaza el interior de las marcas (manteniendo <style> intacto)
  templateContent = templateContent.replace(
    /<!-- FEATURED_POST_START -->[\s\S]*<!-- FEATURED_POST_END -->/,
    `<!-- FEATURED_POST_START -->\n${featuredHtml}\n            <!-- FEATURED_POST_END -->`
  );

  templateContent = templateContent.replace(
    /<!-- POSTS_GRID_START -->[\s\S]*<!-- POSTS_GRID_END -->/,
    `<!-- POSTS_GRID_START -->\n${gridHtml}\n            <!-- POSTS_GRID_END -->`
  );

  fs.writeFileSync(OUTPUT_INDEX_PATH, templateContent, 'utf-8');
  console.log('\n✓ index.html compilado exitosamente sin JavaScript y preservando los estilos.');
} else {
  console.error('\n⚠ Error: No se encontró el archivo index_template.html');
}