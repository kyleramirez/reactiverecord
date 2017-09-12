import ReactiveRecord, { Validator, Model } from "../reactiverecord"

Validator.validators.remote.isFunny = function(value, options, form, attribute, callback) {
  setTimeout(()=>{
    callback(options.message)
  }, 500)
}

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
      presence: [{ message: "%{attribute} must be present" }]
    },
    description: {
      isFunny: [{message: "%{attribute} is not funny!!!!"}]
    },
    akc_recognized: {
      acceptance: [{
        accept: true,
        message: "It must be AKC registered ..."
      }]
    }
  }
}

export default ReactiveRecord.model("DogBreed", DogBreed)
