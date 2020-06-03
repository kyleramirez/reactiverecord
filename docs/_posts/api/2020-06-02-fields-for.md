---
layout: page
title: fieldsFor()
date:   2020-06-02 11:28:00 -0500
category: API
nav_order: 30
---

# <samp>fieldsFor()</samp>
### <samp>fieldsFor(attributes_name, unique_identifier, resource)</samp>

| Argument | Type | Description | Required |
|:-----|:-----|:-----|:-----|
| <samp>attributes_name</samp> | String | Use either the pluralized or singularized model name with underscores and an `_attributes` suffix in order for ReactiveRecord to find the correct model. For a `post` resource that *has many* `tag` resources, you would write the pluralized `'tags_attribues'`. For a `apartment` resource that *belongs to* a `building` resource, you would write the singular `'building_attributes'`.  | Yes |
| <samp>unique_identifier</samp> | Any | The unique identifier behaves a lot like React's pattern for <a href="https://reactjs.org/docs/lists-and-keys.html" target="_blank" rel="noreferrer noopener nofollow">`key`</a>. It needs to be a unique identifier that is the same between each render. For persisted resources, use the ID or primary key attribute. For non-persisted resources, use any unique identifier such as `Math.random()`, so long as it is consistent between renders. | Yes |
| <samp>resource</samp> | Instance of Model | Use an existing or new instance of the nested resource. For a new `tag` resource, use `new Tag()`. | Yes |

| Returns | Description |
|:----|:----|
| ƒ() | Render function with a new fields object for the nested resource |