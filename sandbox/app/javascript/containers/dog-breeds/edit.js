import React from "react"
import { Link } from "react-router-dom"
import DocumentTitle from "react-document-title"
import ReactiveRecord, { Member } from "reactiverecord"
import Form from "./form"

export default function Edit({ history:{ push }, match:{ params:{ id } } }) {
  function goToResource({ id }){ return push(`/dog-breeds/${id}`) }
  return(
    <Member for={ReactiveRecord.model("DogBreed")} find={id}>
      { breed => (
        <DocumentTitle title={`Editing ${breed.name || "breed"}`}>
          <div>
            <h3>Editing {breed.name || "breed"}</h3>
            { do {
              if (!breed._request.status || breed._request.status == "GETTING")
                "Loading ..."
              else <Form resource={breed} onSuccess={goToResource} />
            }}
            <Link to={`/dog-breeds/${id}`}>Cancel</Link>
          </div>
        </DocumentTitle>
      )}
    </Member>
  )
}
