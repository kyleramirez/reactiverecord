import chai, { expect } from "chai"
import { ReactiveRecord, Model, reducer } from "../src"

const reactiveRecordTest = new ReactiveRecord,
      Person = reactiveRecordTest.model("Person", class extends Model {
        static schema = { name: String }
      }),
      CurrentUser = reactiveRecordTest.model("CurrentUser", class extends Person {
        static store = { singleton: true }
      }),
      recordReducer = reactiveRecordTest::reducer();

it("should ", () => {
  // console.log(
  //   recordReducer(
  //     undefined,
  //     {"_attributes": { "id": 123, "name": "Kyle"},"_errors": {},"_request": {"status": 201,"body": null,"action": null},"type": "@OK_CREATE(Person)"}
  //   )
  // )
  console.log(
    recordReducer(
      undefined,
      {
        "_attributes": { "id": 123, "name": "Kyle"},
        "_errors": {},
        "_request": {"status": 200,"body": null,"action": { type: "@INDEX(CurrentUser)" }},
        "type": "@OK_INDEX(CurrentUser)"
      }
    )
  )
});

// {
//   "_attributes": {
//     "id": 123,
//     "name": "Kyle"
//   },
//   "_errors": {},
//   "_request": {
//     "status": 201,
//     "body": null,
//     "action": null
//   },
//   "type": "@OK_CREATE(Person)"
// }
// {
//   "_request": {
//     "status": 200,
//     "body": null,
//     "action": {
//       "type": "@INDEX(Person)",
//       "_attributes": {}
//     }
//   },
//   "_collection": {
//     "123": {
//       "_attributes": {
//         "id": 123,
//         "name": "Kyle"
//       },
//       "_errors": {},
//       "_request": {
//         "status": 200,
//         "body": null,
//         "action": null
//       }
//     },
//     "124": {
//       "_attributes": {
//         "id": 124,
//         "name": "Thom"
//       },
//       "_errors": {},
//       "_request": {
//         "status": 200,
//         "body": null,
//         "action": null
//       }
//     }
//   },
//   "type": "@OK_INDEX(Person)"
// }