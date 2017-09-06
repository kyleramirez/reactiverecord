import React from "react"
import DocumentTitle from "react-document-title"
import { Link } from "react-router-dom"

export default function Home() {
  return(
    <DocumentTitle title="Welcome">
      <div>
        <h3>Welcome to <code>ReactiveRecord</code></h3>
        <Link to="/dog-breeds">Go see some dogs</Link>
      </div>
    </DocumentTitle>
  )
}
