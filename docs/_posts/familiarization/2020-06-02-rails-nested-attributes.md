---
layout: page
title: Rails Nested Attributes
date:   2020-06-02 11:17:00 -0500
category: Familiarization
nav_order: 20
---
# Rails Nested Attributes
{: .no_toc }

If you're familiar with Ruby on Rails, you've no-doubt used nested attributes to create, update or delete associations. For the uninitiated, nested attributes allows you to save attributes on associated records through the parent resource. It can be extremely convenient, but can easily become an escape hatch to your RESTful API, where every object should have its own specific URI. There's hardly anything magical happening, and Rails is really the only framework where you would expect it to work with minimal configuration. As you will see, nested attributes are merely compact Rails-specific instructions to handle CRUD operations via the parent resource.

ReactiveRecord also has built-in support for handling nested attributes, which is [covered here]({% post_url guides/2020-05-26-using-nested-attributes %}).

#### Contents
{: .no_toc .mt-6 }
1. TOC
{:toc}

Nested attributes tend to look like this: Say you have an `article` resource which *has many* `tag` resources. To update the title of your article, your request body might look like this:
```json
{ "title": "How to use the CDI instrument" }
```
> &#9495; <span class="label">PUT</span> `/articles/24` 202 Accepted

But say you also wanted to create `tags`, and your `Article` model accepted nested attributes for tags. Your request body would look something like this:

## Creating
```json
{
  "tags_attributes": [
    { "label": "Aviation" },
    { "label": "Navigation" },
    { "label": "How-To" }
  ]
}
```
> &#9495; <span class="label">PUT</span> `/articles/24` 202 Accepted

Even though we've made a PUT request to update a specific `article` resource, we've included instructions to create three `tag` resources. We would expect the response to look like this:
```json
{
  "id": 24,
  "title": "How to use the CDI instrument",
  "tags": [
    { "id": 1, "label": "Aviation" },
    { "id": 2, "label": "Navigation" },
    { "id": 3, "label": "How-To" }
  ]
}
```
Notice how in the request, we included *only* the label attribute for each tag. In the response, not only are tags present in the `tags` array (not `tags_attributes`), but there are IDs present for each tag we created. That's exactly what we expect to happen with no ID present in the request. It's shorthand instructions to create a new record with the nested attributes. When we *do* include an ID, we're instructing Rails to UPDATE a resource using the provided attributes. This is a little funky because we're nesting an update action within an update action! With the following request body, we're saying update the post tag with ID 2 with a new label:

## Updating
```json
{
  "tags_attributes": [{ "id": 2, "label": "VOR Navigation" }]
}
```
> &#9495; <span class="label">PUT</span> `/articles/24` 202 Accepted

If our nested attributes configuration allows for destroying via nested attributes, we would destroy a resource via nested attributes by including a `_destroy` attribute along with the ID. Our request body would look like this:

## Deleting
```json
{
  "tags_attributes": [{ "id": 3, "_destroy": true }]
}
```
> &#9495; <span class="label">PUT</span> `/articles/24` 202 Accepted

## Relationship types
The above examples describe a parent with a *has many* type relationship with a child. However, nested attributes works with any kind of association, as long as it's configured in the Rails model.
- parent -> children
- children -> parent
- child -> parent
- parent -> child 

You can learn more about how to configure nested attributes via the <a href="https://api.rubyonrails.org/classes/ActiveRecord/NestedAttributes/ClassMethods.html" target="_blank" rel="noreferrer noopener nofollow">official Rails documentation</a>. Nested attributes have built-in support in ReactiveRecord, which is [covered here]({% post_url guides/2020-05-26-using-nested-attributes %}).
