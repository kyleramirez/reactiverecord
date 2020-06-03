---
layout: page
title: Using Nested Attributes
date: 2020-05-26 00:11:43 -0500
category: Guides
nav_order: 5
---

# Using Nested Attributes
{: .no_toc }
If you're unfamiliar with nested attributes and why they're useful, you can learn more about them using [this familiarization guide]({% post_url familiarization/2020-06-02-rails-nested-attributes %}). ReactiveRecord provides a way to use nested attributes in a declarable way using the `<Form />` component. Use the examples below to manage any kind of association. You also get the benefits of ReactiveRecord's schemas and automatic form validation!

#### Contents
{: .no_toc .mt-6 }
1. TOC
{:toc}

## Setting Up
To set up, make sure you have the correct attributes in your parent model's schema. Otherwise ReactiveRecord will not know how to build the nested attributes. For an `article` that *has many* `tag` resources, we'd need to add two attributes to our `Article` schema:

```js
class Article extends Model {
  static schema = {
    tags: Array,
    tags_attributes: Array
  }
}
```
We also need to create a `Tag` model, even though it will only be used within nested attributes. The `_destroy` property is covered later, but is only required if you allow destroying via nested attributes.

```js
class Tag extends Model {
  static routes = { only: [] }
  static schema = {
    label: { type: String, labelText: 'Tag Name' },
    _destroy: Boolean
  }
}
```

## Creating
We'll keep using the `article` and `tag` relationship example above in our form. We want to build a form that allows a user to add a new tag to an article. This will be a simple form with only one input to demonstrate the basic syntax required to enable nested attributes.

```jsx
const ArticleTagForm = ({ article }) => (
  <Form for={article}>
    {fields => (
      <Fragment>
        {fields.fieldsFor('tags_attributes', 'new', new Tag())(tagFields => (
          <Input {...tagFields.label} />
        ))}
        <button {...fields.submit}>Save Tag</button>
      </Fragment>
    )}
  </Form>
);
```
In the example above, we've made a call to the `fieldsFor` method in the form object. The method requires three arguments, which are [covered here]({% post_url api/2020-06-02-fields-for %}). The `'tags_attribute'` argument tells the form the `article` resource has many `tags`. The `'new'` argument is just a unique key to identify the new tag. It could be anything but I chose the word "new." The last argument is `new Tag()`, which is used to build the nested form object.

The `fieldsFor` method returns a render function with the nested form object as the only argument. This function should be for a <u>single resource only</u>. We can use it just like a regular form object. It even includes its own `fieldsFor` method for deeply nested attributes! Be sure to note that we've called the inner form object `tagFields`, which must be different than our `fields` variable. Make sure that you're not <a href="https://en.wikipedia.org/wiki/Variable_shadowing" target="_blank" rel="noreferrer noopener nofollow">shadowing</a> that `fields` variable.

## Updating
Submitting the form in the above example would result in creating a new tag. But what if we had existing tags that we wanted to list and update? To do that, we simply need to loop through the existing tags and give them each their own nested form object:
```jsx
...
{article.tags.map(tag => (
  <span key={tag.id}>
    {fields.fieldsFor('tags_attributes', tag.id, new Tag(tag))(tagFields => (
      <Input {...tagFields.label} />
    ))}
  </span>
))}
<button {...fields.submit}>Save Tags</button>
...
```
In this example, we're looping through the existing tags on the article and passing them each to their own `fieldsFor` block. Saving this form would save all the tags at once. Though this demonstrates how to set up a *has many*-type relationship, it's not a perfect example, because this isn't how people normally edit tags on an article. In a more realistic scenario, you'd simply want the ability to delete existing tags.

## Deleting
To delete a resource via nested attributes, you simply need to update the object with a `_destroy: true` attribute. There are several ways to accomplish this, but in this example we want to do it with a button click. We still want to loop through each of the existing tags, but this time we'll add a button to handle the destroy.

```jsx
const handleDestroy = useCallback(id => event => {
  // Make sure we're preventing default here otherwise the form will submit!
  event.preventDefault();
  article.updateAttributes({ tags_attributes: [{ id, _destroy: true }] });
}, [article]);
...
{article.tags.map(tag => (
  <span key={tag.id}>
    {tag.label}
    <button onClick={handleDestroy(tag.id)}>Delete</button>
  </span>
))}
...
```
In this example, we've created a callback function using the `useCallback` React hook. When the "Delete" button is clicked, we call `updateAttributes` on the `article` resource. When the request succeeds, the tag should automatically be removed from the list due to the article reloading in place. Very simple!

## Bringing it all together
Here is a full-on example for a form which is responsible for creating, updating and deleting via nested attributes using the examples above.
```jsx
const ArticleTagForm = ({ article }) => {
  const handleDestroy = useCallback(id => event => {
    // Make sure we're preventing default here otherwise the form will submit!
    event.preventDefault();
    article.updateAttributes({ tags_attributes: [{ id, _destroy: true }] });
  }, [article]);

  return (
    <Form for={article}>
      {fields => (
        <Fragment>
          {article.tags.map(tag => (
            <span key={tag.id}>
              {fields.fieldsFor('tags_attributes', tag.id, new Tag(tag))(tagFields => (
                <Input {...tagFields.label} />
              ))}
              <button onClick={handleDestroy(tag.id)}>Delete</button>
            </span>
          ))}
          {fields.fieldsFor('tags_attributes', 'new', new Tag())(tagFields => (
            <Input {...tagFields.label} />
          ))}
          <button {...fields.submit}>Save Tag</button>
        </Fragment>
      )}
    </Form>
  )
};
```
## Advanced scenarios
In the above examples, we're using calls to `fieldsFor` to handle a simple parent `article` resource with a *has many*-type relationship with child `tag` resources. We're able to create tags one at a time, making an API request each time. Similarly, each time we click the "Delete" button, we're making a new API request, which results in the instant removal of a tag. But what if we want to hold off on all API requests until the user is done making several changes, and submit all the changes at once? For instance, if the parent `article` resource did not yet exist, we would still want to submit a list of tags along with the new article. That's a perfect use case for nested attributes. We'll go through this type of setup in the examples below. Spoiler alert: It involves storing references to the edited resources in state.

### Creating multiple children in the same request
We want to build a form that allows the user to create a list of multiple tags, then submit the form to save all the tags at once. To do that, we'll need to keep the list of un-saved tags in state until the user is ready to submit. Instead of keeping the attributes in state, we need only to store a unique identifier for each new resource in state, and let ReactiveRecord keep track of the attributes. We'll set up the initial state as well as a function to call when we want to "add a new tag." That's going to look something like this:
```js
const [tagIdentifiers, setTagIdentifiers] = useState([]);
const addNewTag = useCallback(() => {
  setTagIdentifiers([...tagIdentifiers, Math.random()])
}, [tagIdentifiers]);
```
In the above example, we're storing our unique tag identifiers in the `tagIdentifiers` array. We've also created a function to call when we want to create a new tag in state. As you can see in the `addNewTag` function, we're only adding a random number to the array to represent the tag. We now have what we need to keep track of the un-saved tags in our form. For the JSX, we need to loop through each of the items in the `tagIdentifiers` array, and also create a button, which will add new tag fields to the form on click. That's going to look like this:
```jsx
const ArticleTagsForm = ({ article }) => {
  const [tagIdentifiers, setTagIdentifiers] = useState([]);
  const addNewTag = useCallback(event => {
    // Make sure we're preventing default here otherwise the form will submit!
    event.preventDefault();
    setTagIdentifiers([...tagIdentifiers, Math.random()])
  }, [tagIdentifiers]);

  return (
    <Form for={article}>
      {fields => (
        <Fragment>
          <small>Tags</small>
            {tagIdentifiers.map(key => (
              <div key={key}>
                {fields.fieldsFor('tags_attributes', key, new Tag())(tagFields => (
                  <Input {...tagFields.label} />
                ))}
              </div>
            ))}
          <button onClick={addNewTag}>
            + Add New Tag
          </button>
          <button>Save</button>
        <Fragment>
      )}
    </Form>
  );
}
```
In the above example, we're adding new tags to the `tagIdentifiers` array each time we click "+ Add New Tag." Then, everything is submitted as an array of nested attributes when we click "Save." You can see how for these memory-only tags, to "delete" one we would only need to create a function to splice our `tagIdentifiers` array.
```jsx
const destroyStateTag = useCallback(key => event => {
  event.preventDefault();
  setTagIdentifiers(tagIdentifiers.filter(identifier => identifier !== key))
}, [tagIdentifiers]);
...
<button onClick={destroyStateTag(key)}>Delete</button>
```

### Destroying multiple children in the same request
We've just shown how to destroy tags that have only been created in state. Now we want to be able to destroy tags that may be persisted already, in other words ones that have an ID. In a previous example, we showed how you could destroy tags one at a time with a click event handler. This is a similar method for destroying via nested attributes that waits for the final form submission. The implementation is similar to our previous method of using state to keep a record of the changes in the form. It looks something like this:
```js
const [deletedTagIds, setDeletedTagIds] = useState({});
const markTagForDeletion = useCallback(id => () => {
  setDeletedTagIds({ ...deletedTagIds, [id]: true })
}, [deletedTagIds]);
```
As you can see, when we call `markTagForDeletion`, we're simply adding the ID to an object of tags we intend to destroy when the form is submitted. We're using an object here to limit the complexity of our loop down the road, as you will see. In our form, instead of rendering that tag, we'd want to both hide it from view of the user, and also include a regular hidden field tag. Old school, I know!
```jsx
const ArticleTagsForm = ({ article }) => {
  const [deletedTagIds, setDeletedTagIds] = useState([]);
  const markTagForDeletion = useCallback(id => event => {
    // Make sure we're preventing default here otherwise the form will submit!
    event.preventDefault();
    setDeletedTagIds([...deletedTagIds, id]);
  }, [deletedTagIds]);

  return (
    <Form for={article}>
      {fields => (
        <Fragment>
          <small>Tags</small>
          {article.tags.map(tag => fields.fieldsFor('tags_attributes', tag.id, new Tag(tag))(tagFields => {
            if (deletedTagIds[tag.id]) {
              return <input key={tag.id} type="hidden" value="true" ref={tagFields._destroy.ref} />;
            }
            return (
              <span key={tag.id}>
                {tag.label}
                <button onClick={markTagForDeletion(tag.id)}>Delete</button>
              </span>
            );
          }))}
          <button>Save</button>
        <Fragment>
      )}
    </Form>
  );
};
```
In this example, if the tag ID is in the `deletedTagIds` object, we're rendering a hidden field tag instead of the tag label to tell ReactiveRecord to assemble the correct nested attributes upon form submission. As soon as we click the "Delete" button, we're saving the correct tag ID in state and re-rendering to hide it from view. Very cool!

### Updating a parent resource via nested attributes
All of the examples on this page describe a simple parent resource with a *has many*-type relationship with a child resource. You could intuitively guess how to make the same nested attributes work with a *belongs to*-type relationship, but we'll still provide an example here to get you started. In this example, we're going to be editing an "apartment" which in our backend involves editing an `Unit` and a parent `Building` resource.
```jsx
const UnitEditForm = ({ unit }) => (
  <Form for={unit}>
    {fields => (
      <Fragment>
        {fields.fieldsFor('building_attributes', unit.building_id, new Building(unit.building))(buildingFields => (
          <Fragment>
            <Input {...buildingFields.street_address} />
            <Input {...fields.unit_number} />
            <Input {...buildingFields.city} />
            <Input {...buildingFields.state} />
            <Input {...buildingFields.zip} />
          </Fragment>
        ))}
        <button {...fields.submit}>Save Unit</button>
      </Fragment>
    )}
  </Form>
);
```
In this example, visually to the user it appears to be a regular address form, but it's actually editing two different resources at once via nested attributes: the child `unit` resource and its parent `building` resource. One of the key differences from earlier is the first argument to `fieldsFor`: `'building_attributes'`. Notice "building" is singular, which tells ReactiveRecord this is not a one-to-many type relationship. This form would make an PUT request to something like `/units/123`, but would contain building attributes.

## Summary
Nested attributes are one of the advanced uses of ReactiveRecord, but it can come in handy. The usage can appear at bit verbose, and it is. That could change in the future as we experiment with cleaner syntax. For the time being, the syntax allows you to fully implement nested attributes with Rails.
