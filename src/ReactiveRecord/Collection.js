import { skinnyObject } from '../utils';
import Request from './Request';

export default class Collection extends Array {
  constructor({ _collection = [], _request, _primaryKey }) {
    super(..._collection);

    this._request = new Request({ ..._request });

    this._primaryKey = _primaryKey || null;

    Object.defineProperty(this, 'reload', {
      value: query => this._request.reload(query),
      enumerable: false,
    });

    Object.defineProperty(this, 'serialize', {
      value: () =>
        skinnyObject({
          _request: this._request.serialize(),
          _collection: this.reduce(function(collection, member) {
            const { [_primaryKey]: key } = member;
            collection[`${_primaryKey}-${key}`] = member.serialize();
            return collection;
          }, {}),
        }),
      enumerable: false,
    });
  }
}
