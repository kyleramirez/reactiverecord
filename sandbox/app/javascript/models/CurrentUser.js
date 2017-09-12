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
  static validations = {
    password: {
      presence: [
        {
          message: "Password is required."
        }
      ],
      length: [
        {
          messages: {
            minimum: "Password is too short (minimum is 8 characters).",
            maximum: "Password is too long (maximum is 20 characters)."
          },
          minimum: 8,
          maximum: 20
        }
      ],
      format: [
        {
          message: "Your password must contain at least one letter.",
          with: /^.*(?=.*[a-z]).*$/i
        },
        {
          message: "Your password must contain at least one number.",
          with: /^.*(?=.*[0-9]).*$/
        }
      ]
    },
    agree_to_terms: {
      acceptance: [
        {
          message: "You must accept our Terms of Use, Terms of Service to continue.",
          accept: true
        }
      ]
    },
    email: {
      uniqueness: [
        {
          message: "This e-mail may not be used.",
          case_sensitive: false
        }
      ]
    },
    phone: {
      format:[
        {
          message: "Please use a valid U.S. phone number (10 digits)",
          with: /^[\+\d{1,3}\-\s]*\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})(.*)$/,
          allow_blank: true
        }
      ]
    },
    bank_account_number: {
      numericality: [
        {
          messages: {
            numericality: "Please enter a number"
          }
        }
      ]
    },
    bank_routing_number: {
      routing_number: [
        { message: "Please use a valid routing number." }
      ]
    },
    birthday: {
      date: [
        { message: "Try YYYY-MM-DD" }
      ]
    }
  }
}

export default ReactiveRecord.model("CurrentUser", CurrentUser)
/*
 * # absence
 * # presence
 * # acceptance
 * # format
 * # numericality
 * # length
 * # exclusion
 * # inclusion
 * # confirmation
 - Options
   * allow_nil
   * allow_blank
   * message
   * on
   * if
   * unless
 *
 - Remote
   * uniqueness
   * routing_number
   
 */