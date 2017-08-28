import { skinnyObject } from "../utils"

export default class ReactiveRecordCollection extends Array {
  _request = {}
  serialize = () => skinnyObject(this)
  toJSON = ()=> {
    let collection = {}
    if (this.length) {
      const [{ constructor:{ schema:{ _primaryKey="id" } } }] = this;
      collection = this.reduce(
        function(collection, member) {
          const { [_primaryKey]:key } = member;
          collection[key] = member.serialize();
          return collection;
        },
        {}
      )
    }
    return {
      request:this._request,
      collection
    }
  }
}
