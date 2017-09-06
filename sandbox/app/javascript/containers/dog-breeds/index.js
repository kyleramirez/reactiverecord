import React from "react"
import { Switch, Route, Link } from "react-router-dom"
import DocumentTitle from "react-document-title"
import ReactiveRecord, { Collection } from "reactiverecord"
import Edit from "./edit"
import New from "./new"
import Show from "./show"

const DogBreed = ReactiveRecord.model("DogBreed");
if (typeof window === "object") window.DogBreed = DogBreed;

function Index() {
  return(
    <DocumentTitle title="Dogs">
      <div>
        <pre>
          <Link to="/dog-breeds">All Breeds</Link><br />
          <Link to="/dog-breeds/new">New Breed</Link>
        </pre>
        <Route path="/dog-breeds" exact render={() => (
          <Collection for={DogBreed}>
            { breeds => (
              <div>
                <h3>Index of Dog Breeds</h3>
                { breeds.map( breed => (
                  <pre key={breed.id}>
                    <Link to={`/dog-breeds/${breed.id}`}>{breed.name}</Link>&nbsp;
                    {JSON.stringify(breed, null, 2)}
                  </pre>
                ))}
              </div>
            )}
          </Collection>
        )} />
        <Switch>
          <Route key="new" path="/dog-breeds/new" component={New} />
          <Route key="show" path="/dog-breeds/:id" exact component={Show} />
          <Route key="edit" path="/dog-breeds/:id/edit" exact component={Edit} />
        </Switch>
      </div>
    </DocumentTitle>
  )
}

export const DogResources = [
  <Route key="index" path="/dog-breeds" component={Index} />,
]
