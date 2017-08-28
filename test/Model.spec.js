import chai, { expect } from "chai"
import { ReactiveRecord, Model } from "../src"
import "./test-utils"

describe("Model", ()=>{
  const reactiveRecordTest = new ReactiveRecord();
  const Person = reactiveRecordTest.model("Person", class Person extends Model {
    static schema = { name: String, _timestamps: true }
  });
  describe("#constructor", ()=>{

    const dude = new Person;

    it("should provide internal private attributes", ()=>{
      ["_attributes", "_request", "_errors", "_pristine", "_persisted"].map( property => {
        expect(dude).to.have.property(property);
      });
    });

    it("should have an ID property if no _primaryKey was given in the schema", ()=>{
      expect(dude).to.have.property("id");
    });

    it("should not create an ID property if a primary key was given in the schema", ()=>{
      const Card = reactiveRecordTest.model("Card", class Card extends Model {
        static schema = { _primaryKey: "token" }
      });
      const card = new Card;
      expect(card).to.not.have.property("id");
    });

    it("should have created read-only properties", ()=>{
      ["id", "createdAt", "updatedAt"].map( property => {
        expect(()=>{
          dude[property] = "anything";
        }).to.throw(TypeError)
      });
    });

    it("should treat a custom _primaryKey as read-only", () => {
      const Bank = reactiveRecordTest.model("Bank", class Bank extends Model {
        static schema = { _primaryKey: "token" }
      });
      const bank = new Bank;
      expect(()=>{
        bank.token = "anything";
      }).to.throw(TypeError)
    });

    it("should have created writeable properties", ()=>{
      dude.name = "Kyle";
      expect("Kyle").to.equal(dude.name);
    });

    it("should not allow changing the _pristine copy", ()=>{
      expect(()=>{
        dude._pristine.name = "Kyle"
      }).to.throw(TypeError)
    });

    it("should record if a resource is database persisted or not", ()=>{
      expect(false).to.equal(dude._persisted)
      expect(true).to.equal((new Person({}, true))._persisted)
    });
  });

  describe("#ReactiveRecord", () => {
    it("should give each instance access to ReactiveRecord", () => {
      expect((new Person).ReactiveRecord).to.not.be.undefined;
      expect ((new Person).ReactiveRecord).to.be.an.instanceof(ReactiveRecord);
    });
  });

  describe("#dispatch", () => {
    it("should dispatch actions to the ReactiveRecord instance", () => {
      reactiveRecordTest.dispatch = chai.spy();
      // expect(reactiveRecordTest.dispatch).to.have.been.called.with("")
    });
  });
});

// it("should give models access to the ReactiveRecord instance", ()=>{
//   reactiveRecordTest.model("Person", class extends Model {
//     static schema = {
//       name: String
//     }
//   });
//
//   const Person = reactiveRecordTest.model("Person");
// });
// reactiveRecord.model(Person);
// const PersonModel = reactiveRecord.model("Person")
//
// class Unit extends Model {
//   static routes = {
//     only: ["GET", "POST", "PUT"],
//     POST: "/api/v2/landlords/buildings/:building_id/units",
//     PUT: "/api/v2/landlords/buildings/:building_id/units/:id"
//   }
//   static schema = {
//     user_id: Number,
//     building_id: Number,
//     unit_type: String,
//     _timestamps: true
//   }
// }
// reactiveRecord.model(Unit);
// const UnitModel = reactiveRecord.model("Unit")
//
//
// // Stub out a redux store for reactiveRecord
// middleware({ dispatch })(function(action){ return action; })({type:"cool"})
//
// describe("Model", ()=>{
//   describe("#constructor", ()=>{
//
//     it("should create a pristine version of the model that is not writeable", ()=>{
//       const person = new Person({ name: "Kyle", age: 28 })
//       person.name = "Jim"
//       person.pristineRecord.name = "Jim";
//       expect(person.pristineRecord.name).to.equal("Kyle")
//     });
//
//   });
//   describe("#save", ()=>{
//     it("should only save the changed attributes (diff)", ()=>{
//       const person = new Person({ id:12983, name: "Kyle", age: 28 })
//       person.name = "Jim"
//       fetchSpy.reset();
//       person.save().catch(e=>{});
//       const [lastCall] = fetchSpy.__spy.calls,
//             [,{ body:jsonBody }] = lastCall,
//             body = JSON.parse(jsonBody);
//
//       expect(body).to.eql({ name: "Jim" })
//     })
//
//     it("should save the entire record if diff mode is disabled", ()=>{
//       const person = new Person({ name: "Kyle", age: 28 })
//       person.name = "Jim"
//       fetchSpy.reset();
//       reactiveRecord.setAPI({ diffMode: false })
//       person.save().catch(e=>{});
//       const [lastCall] = fetchSpy.__spy.calls,
//             [,{ body:jsonBody }] = lastCall,
//             body = JSON.parse(jsonBody);
//
//       expect(body).to.eql({ name: "Jim", age: 28 })
//     })
//
//     it("should be able to interpolate a route when diffMode is on (#BUG)", ()=>{
//
//       const unit = new Unit({
//         id:46,
//         user_id: 10,
//         building_id: 45,
//         unit_type: "sfh",
//         created_at: "2017-04-06T14:49:46-05:00",
//         updated_at:"2017-04-06T14:49:46-05:00"
//       })
//       unit.unit_type = "town"
//       fetchSpy.reset();
//       reactiveRecord.setAPI({ diffMode: true })
//       unit.save().catch(e=>{});
//
//       const [lastCall] = fetchSpy.__spy.calls,
//             [requestPath,{ body:jsonBody }] = lastCall,
//             body = JSON.parse(jsonBody);
//
//       expect(body).to.eql({ unit_type: "town" })
//       expect(requestPath).to.eql("/api/v2/landlords/buildings/45/units/46")
//     })
//
//     it("should submit all attributes if the record is new (no ID) (#BUG)", ()=>{
//       const unit = new Unit({
//         user_id: 10,
//         building_id: 45,
//         unit_type: "sfh"
//       })
//       fetchSpy.reset();
//
//       unit.save().catch(e=>{});
//
//       const [lastCall] = fetchSpy.__spy.calls,
//             [,{ body:jsonBody }] = lastCall,
//             body = JSON.parse(jsonBody);
//
//       expect(body).to.eql({ user_id: 10, building_id: 45, unit_type: "sfh" })
//     })
//   })
// });
