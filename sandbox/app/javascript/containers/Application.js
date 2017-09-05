import React from "react"
import DocumentTitle from "react-document-title"

export default function Application({ layoutProps, props }) {

  const initialRender = ReactRailsUJS.serverRender("renderToString", layoutProps.component, props),
        title = DocumentTitle.rewind();

  return(
    <html>
      <head>
        <title>{title}</title>
      </head>
      <body>
        <div
          data-react-class={layoutProps.component}
          data-react-props={JSON.stringify(props)}
          dangerouslySetInnerHTML={{ __html: initialRender }}
        />
        <script type="text/javascript" src={layoutProps.applicationSrc}></script>
      </body>
    </html>
  )
}
