import flute, { Model } from "../redux-flute";

export default flute.model(class Todo extends Model {
  static routes = {
    GET: "https://jsonplaceholder.typicode.com/todos",
    DELETE: "https://jsonplaceholder.typicode.com/todos/:id"
  }
  static schema = {
    title: String,
    completed: Boolean,
    userId: Number,
  }
});
