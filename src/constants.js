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
               _request: {
                 status: null,
                 body: null,
                 original: null
               }
             },
             memberProps = {
               ...requestProps,
               _attributes: {},
               _errors: {}
             },
             collectionProps = {
               ...requestProps,
               collection: {}
             },
             ACTION_MATCHER = /^@(OK_|ERROR_)?(INDEX|CREATE|SHOW|UPDATE|DESTROY)\(([^\)]+)\)$/,
             ROUTE_TOKENIZER = /:([^\/\?]*)/g,
             ROUTE_NOT_FOUND_ERROR = function() { return ReferenceError("The specified route is either not found or not permitted") },
             MODEL_NOT_FOUND_ERROR = function(modelName) { return ReferenceError(`#<${modelName}> is not a recognized ReactiveRecord model`) };
