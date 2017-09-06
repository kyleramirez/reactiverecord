import ReactiveRecord, { Model } from "../reactiverecord"

class DogBreed extends Model {
  static schema = {
    name: String,
    description: String,
    akc_recognized: {
      default: false,
      type: Boolean
    },
    _timestamps: true
  }
}

export default ReactiveRecord.model("DogBreed", DogBreed)
