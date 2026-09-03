# Markdown features demo

This post shows the most common Markdown elements that render nicely with the included CSS.

## Headings

### This is an H3

#### And an H4

## Lists

Unordered:

- Apples
- Oranges
- Bananas

Ordered:

1. First
2. Second
3. Third

## Inline styles

You can use *italic*, **bold**, and `inline code`.

Links work too: [marked.js](https://marked.js.org/)

## Blockquote

> The only way to do great work is to love what you do.
> — Steve Jobs

## Code blocks

```js
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet("world"));
```

```python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b
```

## Tables

| Feature       | Supported |
|---------------|-----------|
| GFM           | Yes       |
| Tables        | Yes       |
| Task lists    | Yes       |
| Syntax highlight | Basic (via CSS) |

## Horizontal rule

---

That's most of what you need for a personal blog. Happy writing!
