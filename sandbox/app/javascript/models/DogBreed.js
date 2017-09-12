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
  static validations = {
    name: {
      presence: [{ message: "%{attr} must be present" }]
    }
  }
}

export default ReactiveRecord.model("DogBreed", DogBreed)
