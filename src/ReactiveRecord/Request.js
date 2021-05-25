export default class Request {
  constructor({ status = 'NEW', body = null }) {
    this.status = status;
    this.body = body;
  }

  /**
   * TODO: Implement a .reload method here to re-run the original request on demand.
   */

  serialize() {
    return {
      status: this.status,
      body: this.body,
    };
  }
}
