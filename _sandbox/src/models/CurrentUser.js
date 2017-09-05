import ReactiveRecord, { Model } from "../reactiverecord"

class CurrentUser extends Model {
  static schema = {
    name: String,
    username: String,
    email: String,
    address: Object,
    phone: String,
    website: String,
    company: Object
  }
  static routes = {
    index: "https://jsonplaceholder.typicode.com/users/2",
    create: "https://jsonplaceholder.typicode.com/users",
    update: "https://jsonplaceholder.typicode.com/users/:id",
    destroy: "https://jsonplaceholder.typicode.com/users/:id"
  }
  static store = { singleton: true }
}

export default ReactiveRecord.model("CurrentUser", CurrentUser)
