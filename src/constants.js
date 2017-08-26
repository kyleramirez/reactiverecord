export const ACTION_METHODS = {
               index:"GET",
               create:"POST",
               show: "GET",
               update:"PUT",
               destroy:"DELETE"
             },
             ACTION_STATUSES = {
               index:"GETTING",
               create:"POSTING",
               show: "GETTING",
               update:"PUTTING",
               destroy:"DELETING"
             },
             requestProps = {
               request: {
                 status: null,
                 // GETTING, 200, POSTING, 201, PUTTING, 202, DELETING, 204
                 // 401, 403, 404, 500 ...
                 body: null,
                 original: null
               }
             },
             memberProps = {
               ...requestProps,
               attributes: {},
               errors: {}
             },
             collectionProps = {
               ...requestProps,
               collection: {}
             },
             ACTION_MATCHER = /^@(OK_|ERROR_)?(INDEX|CREATE|SHOW|UPDATE|DESTROY)\(([^\)]+)\)$/,
             ROUTE_TOKENIZER = /:([^\/\?]*)/g,
             ROUTE_NOT_FOUND_ERROR = ReferenceError.bind(this, "The specified route is either not found or not permitted"),
             MODEL_NOT_FOUND_ERROR = function(modelName) { return ReferenceError(`#<${modelName}> is not a recognized ReactiveRecord model`) };
