import React from "react"
import DocumentTitle from "react-document-title"

export default function Root({ location, INITIAL_STATE, applicationSrc, applicationCSSSrc }) {

  const propsForApplication = { location, INITIAL_STATE },
        { PROPS_ATTR, CLASS_NAME_ATTR } = ReactRailsUJS,
        initialRender = ReactRailsUJS.serverRender("renderToString", "Application", propsForApplication),
        propsForReactRoot = {
          [CLASS_NAME_ATTR]:"Application",
          [PROPS_ATTR]:JSON.stringify(propsForApplication),
          dangerouslySetInnerHTML: { __html: initialRender }
        },
        title = DocumentTitle.rewind();

  return(
    <html>
      <head>
        <title>{title}</title>
        <link rel="stylesheet" media="screen" href={applicationCSSSrc} />
      </head>
      <body>
        <div {...propsForReactRoot} />
        <script src={applicationSrc} type="text/javascript"></script>
      </body>
    </html>
  )
}
