---
layout: home
nav_exclude: true
---
# 🛰️ Reactive Record
[![npm version](https://img.shields.io/npm/v/reactiverecord.svg?style=flat-square)](https://www.npmjs.com/package/reactiverecord) [![npm downloads](https://img.shields.io/npm/dm/reactiverecord.svg?style=flat-square)](https://www.npmjs.com/package/reactiverecord)

### {{ site.description }}
Your RESTful API's very own custom SDK — the missing link between your API and React!

### 🎉 Readable interface
{: .text-red-300 }
Use syntax simlar to Rails' ActiveRecord query interface to interact with RESTful endpoints:
```js
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

---

### Recent Posts
{% for post in site.posts %}
### [{{ post.title }}]({{ post.url }})
{{ post.excerpt }}
{% endfor %}

