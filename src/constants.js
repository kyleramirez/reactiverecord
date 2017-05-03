export const restVerbs = {
        getting: false,
        posting: false,
        putting: false,
        deleting: false
      },
      versioningProps = {
        _version: 0,
        _request: {
          version: null,
          status: null,
          body: null
        }
      },
      recordProps = {
        record: {},
        errors: {}
      },
      singleRecordProps = {
        ...restVerbs,
        ...versioningProps,
        ...recordProps
      },
      actionMatch = /^@REACTIVERECORD_(SET|GET|POST|PUT|DELETE|REQUEST_INFO|SAVE)(_SUCCESS)?_(.*)$/
