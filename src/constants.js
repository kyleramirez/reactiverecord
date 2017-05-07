export const restVerbs = {
               getting: false,
               posting: false,
               putting: false,
               deleting: false
             },
             requestProps = {
               request: {
                 status: null,
                 body: null
               }
             },
             recordProps = {
               attributes: {},
               errors: {}
             },
             singleRecordProps = {
               ...restVerbs,
               ...requestProps,
               ...recordProps
             },
             actionMatch = /^@REACTIVERECORD_(SET|GET|POST|PUT|DELETE|REQUEST_INFO|SAVE)(_SUCCESS)?_(.*)$/;
