export default class Errors {
  constructor({ _schema, ...errors }) {
    this._schema = _schema;
    Object.keys(_schema).map( attr => (this[attr] = errors[attr] || []))
  }
  clear() {
    Object.keys(this._schema).map( attr => (this[attr] = []))
  }
  get fullMessages() {
    return Object.keys(this._schema).map( attr => (this[attr][0])).filter(Boolean)
  }
}
