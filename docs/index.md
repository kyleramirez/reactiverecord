---
layout: home
nav_exclude: true
---
# Reactive Record [![npm version](https://img.shields.io/npm/v/reactiverecord.svg?style=flat-square)](https://www.npmjs.com/package/reactiverecord) [![npm downloads](https://img.shields.io/npm/dm/reactiverecord.svg?style=flat-square)](https://www.npmjs.com/package/reactiverecord)

### {{ site.description }}

```jsx
function Posts(params) {
  return (
    <Member for={Posts} find={params.id}>
      {posts => (
        <article>
          <h1>{post.title}</h1>
          {post.content}
        </article>
      )}
    </Member>
  )
}
```

### Recent Posts
{% for post in site.posts %}
### [{{ post.title }}]({{ post.url }})
{{ post.excerpt }}
{% endfor %}

