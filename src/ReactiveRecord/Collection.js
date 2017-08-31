import { skinnyObject } from "../utils"
import Request from "./Request"

export default class Collection extends Array {
  constructor({ _collection, _request, _primaryKey }) {
    super(..._collection);

    this._request = new Request({ ..._request });

    this._primaryKey = _primaryKey || null;

    this.reload = query => this._request.reload(query);

    this.serialize = () => skinnyObject({
      _request: this._request.serialize(),
      _collection: this.reduce(function(collection, member){
        const { [_primaryKey]:key } = member;
        collection[key] = member.serialize();
        return collection;
      }, {})
    })
  }
}
