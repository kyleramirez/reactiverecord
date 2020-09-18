export default class Request {
  constructor({ status = 'NEW', body = null }) {
    this.status = status;
    this.body = body;
  }

  serialize() {
    return {
      status: this.status,
      body: this.body,
    };
  }
}
