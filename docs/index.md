---
layout: home
nav_exclude: true
---
# Reactive Record
[![npm version](https://img.shields.io/npm/v/reactiverecord.svg?style=flat-square)](https://www.npmjs.com/package/reactiverecord) [![npm downloads](https://img.shields.io/npm/dm/reactiverecord.svg?style=flat-square)](https://www.npmjs.com/package/reactiverecord)

### {{ site.description }}
Welcome to your RESTful API's fully-built JS SDK. Reactive Record is a small collection of JS tools and React components that help you &hellip;

- **C**reate
- **R**ead
- **U**pdate
- **D**elete
- Validate

&hellip; any type of resource in React. It's the missing link between your API and React, and the perfect companion to your Ruby on Rails application!

## Watch the talk at React Chicago!
{: .text-alpha }
<style>
  .responsive-yt-embed {position: relative;overflow: hidden;height:0;padding-bottom: 56.25%;}
  .responsive-yt-embed iframe, .responsive-yt-embed object, .responsive-yt-embed embed {position: absolute;top: 0;left: 0;width: 100%;height: 100%;}
</style>
<div style="max-width: 600px">
  <div class="responsive-yt-embed" style="width:100%;height:auto;">
    <iframe src="https://www.youtube-nocookie.com/embed/n0iL0trBbA8" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  </div>
</div>

### 🎉 Readable interface
{: .text-red-300 .mt-6 }
Use syntax simlar to Rails' ActiveRecord query interface to interact with RESTful endpoints:
```javascript
> Product.create({ title: "Wooden desk", price: "20.00" })
```
> &#9495; <span class="label">POST</span> `/products` 201 Created

### 🎉 Built for JSX
{: .text-red-300 }
Use the query interface via JSX with included components:

```jsx
import ReactiveRecord, { Member } from "reactiverecord"
const Product = ReactiveRecord.model("Product")

return (
  <Member for={Product} find={props.id}>
    {product => <h1>{product.title}</h1>}
  </Member>
)
```
> &#9495; <span class="label">GET</span> `/products/24` 200 OK

<div class="text-center mt-7">
  <a class="btn btn-lg" href="{% post_url guides/2019-07-14-getting-started %}">
    Get Started &raquo;
  </a>
</div>

---

### News
{% assign posts = site.posts | where: "layout", "post" %}
{% for post in posts %}
### [{{ post.title }}]({{ post.url }})
{{ post.excerpt }}
{% endfor %}
