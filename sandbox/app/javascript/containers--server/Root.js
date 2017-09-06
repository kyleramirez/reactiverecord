import React from "react"
import DocumentTitle from "react-document-title"

export default function Root({ location, INITIAL_STATE, applicationSrc }) {

  const propsForApplication = { location, INITIAL_STATE },
        initialRender = ReactRailsUJS.serverRender("renderToString", "Application", propsForApplication),
        title = DocumentTitle.rewind();

  return(
    <html>
      <head>
        <title>{title}</title>
      </head>
      <body>
        <div
          data-react-class="Application"
          data-react-props={JSON.stringify(propsForApplication)}
          dangerouslySetInnerHTML={{ __html: initialRender }}
        />
        <script src={applicationSrc} type="text/javascript"></script>
      </body>
    </html>
  )
}
