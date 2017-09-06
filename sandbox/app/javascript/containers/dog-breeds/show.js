import React from "react"
import { Link } from "react-router-dom"
import DocumentTitle from "react-document-title"
import ReactiveRecord, { Member } from "reactiverecord"

export default function Show({ match:{ params:{ id } } }) {
  return(
    <Member for={ReactiveRecord.model("DogBreed")} find={id}>
      { breed => (
        <DocumentTitle title={breed.name || "Untitled"}>
          <div>
            <h3>Showing {breed.name}</h3>
            <Link to={`/dog-breeds/${id}/edit`}>Edit</Link>
            <pre>{JSON.stringify(breed, null, 2)}</pre>
          </div>
        </DocumentTitle>
      )}
    </Member>
  )
}
