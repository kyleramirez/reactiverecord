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
             _request = {
               status: null,
               body: null
             },
             memberProps = {
               _request,
               _attributes: {},
               _errors: {}
             },
             collectionProps = {
               _request,
               _collection: {}
             },
             ACTION_MATCHER = /^@(OK_|ERROR_)?(INDEX|CREATE|SHOW|UPDATE|DESTROY)\(([^)]+)\)$/,
             ROUTE_TOKENIZER = /:([^/?]*)/g,
             ROUTE_NOT_FOUND_ERROR = function() { return ReferenceError("The specified route is either not found or not permitted") },
             MODEL_NOT_FOUND_ERROR = function(modelName) { return ReferenceError(`#<${modelName}> is not a recognized ReactiveRecord model`) },
             MODEL_NOT_VALID_ERROR = function(modelName) { return TypeError(`Class #<${modelName}> needs to inherit from ReactiveRecord's Model.`) };
