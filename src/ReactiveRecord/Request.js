
function noop() {}

export default class Request {
  constructor({ status=null, body=null, dispatch=noop, action=null }){
    this.status = status;
    this.body = body;
    this.dispatch = dispatch;
    this.action = action;
  }

  reload(query={}) {
    const action = {
      ...this.action,
      attributes:{
        ...this.action.attributes,
        ...query
      }
    }
    return this.dispatch(action);
  }

  get canReload() {
    return !!this.action
  }

  serialize() {
    return {
      status: this.status,
      body: this.body,
      action: this.action
    }
  }
}
