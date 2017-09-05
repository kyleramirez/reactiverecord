import React from "react"
import DocumentTitle from "react-document-title"

export default function Home(props) {
  return(
    <DocumentTitle title="Welcome, Homie">
      <div>
        Welcome, yo.
        <pre>Here are my props: {JSON.stringify(props, null, 2)}</pre>
        <button onClick={()=>console.log("Ya clicked meh.")}>Click my button, man.</button>
      </div>
    </DocumentTitle>
  )
}
