import ReactiveRecord, { Model } from "reactiverecord"

class Story extends Model {
  static schema = {
    title: String,
    _primaryKey: "slug"
  }
}
export default ReactiveRecord.model("Story", Story);
