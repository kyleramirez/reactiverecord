import ReactiveRecord, { Model } from "../reactiverecord"

class Post extends Model {
  static schema = {
    userId: Number,
    title: String,
    body: String
  }
  static routes = {
    index: "https://jsonplaceholder.typicode.com/:modelname",
    create: "https://jsonplaceholder.typicode.com/:modelname",
    show: "https://jsonplaceholder.typicode.com/:modelname/:id",
    update: "https://jsonplaceholder.typicode.com/:modelname/:id",
    destroy: "https://jsonplaceholder.typicode.com/:modelname/:id"
  }
}

export default ReactiveRecord.model("Post", Post)
