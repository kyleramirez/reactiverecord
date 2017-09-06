import React from "react"
import DocumentTitle from "react-document-title"
import ReactiveRecord from "reactiverecord"
import Form from "./form"

const DogBreed = ReactiveRecord.model("DogBreed"),
      title = "New dog breed";


export default function New({ history:{ push } }) {
  function goToResource({ id }){ return push(`/dog-breeds/${id}`) }
  return(
    <DocumentTitle title={title}>
      <div>
        <h3>{title}</h3>
        <Form resource={new DogBreed} onSuccess={goToResource} />
      </div>
    </DocumentTitle>
  )
}
