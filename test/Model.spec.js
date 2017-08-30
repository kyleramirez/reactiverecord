import chai, { expect } from "chai"
import { ReactiveRecord, Model } from "../src"
import "./test-utils"

describe("Model", ()=>{
  const reactiveRecordTest = new ReactiveRecord();
  reactiveRecordTest.dispatch = chai.spy();
  const Person = reactiveRecordTest.model("Person", class Person extends Model {
    static schema = {
      name: String,
      level: {
        default: "customer",
        type: String
      },
      age: Number,
      phone: String,
      email: String,
      likes: Array,
      cart: Object,
      activated_on: Date,
      _timestamps: true
    }
    set email(next) {
      return this._attributes.email = next.replace(/\+[^@]*/, "");
    }
    get phone() {
      return this._attributes.phone || "No phone number given";
    }
  });
  const Smell = reactiveRecordTest.model("Smell", class Smell extends Model {
    static routes = {
      index: "/:modelname/:special_prop_not_in_schema",
      update: ":prefix/:modelname/:id",
      except: ["destroy"]
    }
  });
  const News = reactiveRecordTest.model("News", class News extends Model {
    static schema = {
      _timestamps: true,
      _primaryKey: "slug",
      title: String,
      body: String
    }
  });
  const LeadMessage = reactiveRecordTest.model("LeadMessage", class LeadMessage extends Model {
    static routes = {
      destroy: "/units/:unit_id/leads/:lead_id/:modelname/:id"
    }
  });

  describe("#constructor", ()=>{

    const dude = new Person;

    it("should record if a resource is database persisted or not", ()=>{
      expect(false).to.equal(dude._persisted)
      expect(true).to.equal((new Person({}, true))._persisted)
    });

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

    it("should allow using custom getters and setters", () => {
      dude.email = "dude+nospam@email.com"
      expect("dude@email.com").to.equal(dude.email)
      expect("No phone number given").to.equal(dude.phone)
    });

    it("should not allow changing the _pristine copy", ()=>{
      expect(()=>{
        dude._pristine.name = "Kyle"
      }).to.throw(TypeError)
    });

    it("should assign default values if described in the schema", () => {
      expect(Person.schema.level.default).to.equal(dude.level)
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
      reactiveRecordTest.dispatch.reset()
      Person.create()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        attributes: { level: "customer" },
        query: {}
      })
    });
  });

  describe("#store", () => {
    it("should have a default singleton property", () => {
      expect(Person.store).to.have.property("singleton")
    });
  });

  describe("#serialize and #toJSON", () => {
    it("should have only three top-level properties", () => {
      const person = new Person;
      ["_attributes","_request","_errors"].map( property => {
        expect(person.serialize()).to.have.property(property)
      });
    });
  });

  describe("#diff", () => {
    it("should return an object with changed values only", () => {
      const person = new Person
      person.name = "Mufasa"
      expect(person.diff).to.deep.equal({ name: "Mufasa", level: "customer" });
    });

    it("should include all new attributes in the diff for a model that is not persisted", () => {
      const personAttrs = { name: "Simba", level: "admin" },
            person = new Person(personAttrs);
      expect(person.diff).to.deep.equal(personAttrs);
    });

    it("should show only changed attributes in the diff for a model that is persisted", () => {
      const person = new Person({ name: "Simba", level: "customer" }, true);
      expect(person.diff).to.deep.equal({});
      person.name = "Zazu"
      expect(person.diff).to.deep.equal({ name: "Zazu" });
    });

    it("should show default values as changed values even for persisted records", () => {
      const person = new Person,
            persistedPerson = new Person({}, true);
      expect(person.diff).to.deep.equal({ level: "customer" });
      expect(persistedPerson.diff).to.deep.equal({ level: "customer" });
    });

    it("should only show a difference in an array if it changed", () => {
      const person = new Person;
      person.likes = ["beef"];
      expect(person.diff.likes).to.deep.equal(["beef"])
    });

    it("should only show a difference in an object if it changed", () => {
      const person = new Person;
      person.cart = { items: 4 };
      expect(person.diff.cart).to.deep.equal({ items: 4 })
    });

    it("should only show a difference in a date if it changed", () => {
      const date = new Date,
            person = new Person;
      person.activated_on = date
      expect(person.diff.activated_on).to.equal(date.toISOString());
    });

  });

  describe("#changedAttributes", () => {
    it("should return an array of the changed attributes", () => {
      const person = new Person;
      person.name = "Charles";
      expect(person.changedAttributes).to.be.an("array").that.includes("name", "level")
    });
  });

  describe("#isPristine", () => {
    it("should correctly identify a pristine record", () => {
      const person = new Person({ level: "admin", name: "Nick" }, true)
      expect(person.isPristine).to.equal(true)
      person.name = "Troy"
      expect(person.isPristine).to.equal(false)
      const otherPerson = new Person
      /* Default values applied */
      expect(person.isPristine).to.equal(false)
    });
  });

  describe("#isDirty", () => {
    it("should be the opposite of #isPristine", () => {
      const person = new Person({ level: "admin", name: "Nick" }, true)
      expect(person.isDirty).to.equal(false)
    });
  });

  describe("#attributeChanged", () => {
    it("should correctly identify a changed attribute", () => {
      const person = new Person
      person.name = "Jimothy"
      expect(person.attributeChanged("name")).to.equal(true)
      expect(person.attributeChanged("age")).to.equal(false)
    });
  });

  describe("#routeFor", () => {
    it("should build the correct route actions", () => {
      expect((new Smell).routeFor("index"))
        .to.equal("/smells/:special_prop_not_in_schema")
      expect((new Smell).routeFor("index", { special_prop_not_in_schema: "kids" }))
        .to.equal("/smells/kids")
      expect((new Smell).routeFor("index", "kind=bad&special_prop_not_in_schema=kids"))
        .to.equal("/smells/kids?kind=bad")
      expect((new Smell).routeFor("index", { kind: "bad" }))
        .to.equal("/smells/:special_prop_not_in_schema?kind=bad")
      expect((new Smell).routeFor("index", { modelname: "cats" }))
        .to.equal("/smells/:special_prop_not_in_schema?modelname=cats")

      expect((new Smell).routeFor("create"))
        .to.equal("/smells")

      expect((new Smell).routeFor("show"))
        .to.equal("/smells/:id")
      expect((new Smell({ id: 123 })).routeFor("show"))
        .to.equal("/smells/123")
      expect((new Smell({ id: 123 })).routeFor("show", { id: 456 }))
        .to.equal("/smells/456")
      expect((new Smell({ id: 123 })).routeFor("show", "?id=456"))
        .to.equal("/smells/456")

      const savedAPIPrefix = reactiveRecordTest.API.prefix;
      reactiveRecordTest.API.prefix = "/api/v1";
      expect((new Smell({ id: 123 })).routeFor("update"))
        .to.equal("/api/v1/smells/123")
      reactiveRecordTest.API.prefix = savedAPIPrefix;

    });

    it("should throw an error for a route not permitted", () => {
      expect(() => {
        (new Smell).routeFor("destroy")
      }).to.throw(ReferenceError)
    });
  });

  describe("#routeAttributes", () => {
    it("should return all attributes needed to build the route", () => {
      const smellAttrs = { id: 123 },
            otherSmellAttrs = { special_prop_not_in_schema: "ocean" };
      expect((new Smell(smellAttrs)).routeAttributes("show"))
        .to.deep.equal(smellAttrs)
      expect((new Smell).routeAttributes("index", otherSmellAttrs))
        .to.deep.equal(otherSmellAttrs)
    });

    it("should throw an error for a route not permitted", () => {
      expect(() => {
        (new Smell).routeAttributes("destroy")
      }).to.throw(ReferenceError)
    });
  });

  describe("#create", () => {
    it("should submit the correct attributes for creation", () => {
      reactiveRecordTest.dispatch.reset();
      const attributes = { slug: "nandos-on-fire", title: "Nandos on fire" },
            query = { priority: "breaking" };
      News.create(attributes, { query });
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(News)",
        attributes,
        query
      });
    });
  });

  describe("#updateAttributes", () => {

    it("should only send changed attributes and attributes needed for URL", () => {
      reactiveRecordTest.dispatch.reset();
      const news = new News({ slug: "nandos-on-fire", title: "Nandos on fire" }, true);
      news.updateAttributes({ title: "Update: Nandos never actually on fire" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@UPDATE(News)",
        attributes: {
          title: "Update: Nandos never actually on fire",
          slug: "nandos-on-fire"
        },
        query: {}
      });
    });

    it("should consider default values as changed values", () => {
      reactiveRecordTest.dispatch.reset();
      const guy = new Person({ id: 123 }, true);
      guy.updateAttributes({ name: "Craig" })
      // console.log(reactiveRecordTest.dispatch.__spy.calls[0][0])
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@UPDATE(Person)",
        attributes: { id: 123, name: "Craig", level: "customer" },
        query: {}
      });
    });
  });

  describe("#updateAttribute", () => {
    it("should only send changed attribute and attributes needed for URL", () => {
      reactiveRecordTest.dispatch.reset();
      const news = new News({ slug: "nandos-on-fire", title: "Nandos on fire" }, true);
      news.updateAttribute("title", "Update: Nandos never actually on fire")
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@UPDATE(News)",
        attributes: {
          title: "Update: Nandos never actually on fire",
          slug: "nandos-on-fire"
        },
        query: {}
      });
    });

    it("should consider default values as changed values", () => {
      reactiveRecordTest.dispatch.reset();
      const guy = new Person({ id: 123 }, true);
      guy.updateAttribute("name", "Craig")
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@UPDATE(Person)",
        attributes: { id: 123, name: "Craig", level: "customer" },
        query: {}
      });
    });
  });

  describe("#save", () => {
    it("should only send changed attributes and attributes needed for URL", () => {
      reactiveRecordTest.dispatch.reset();
      const person = new Person({ id: 123, level: "Zulu" }, true)
      person.name = "Shaka"
      person.save()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@UPDATE(Person)",
        attributes: { id: 123, name: "Shaka" },
        query: {}
      });
    });

    it("should dispatch a create action if the record is not persisted", () => {
      reactiveRecordTest.dispatch.reset();
      const person = new Person({ level: "Zulu" })
      person.name = "Shaka"
      person.save()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        attributes: { name: "Shaka", level: "Zulu" },
        query: {}
      });
    });

    it("should dispatch an update action if the record is persisted", () => {
      reactiveRecordTest.dispatch.reset();
      const person = new Person({ id: 123 }, true)
      person.name = "Shaka"
      person.save()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@UPDATE(Person)",
        attributes: { id: 123, name: "Shaka", level: "customer" },
        query: {}
      });
    });
  });

  describe("#destroy", () => {
    it("should only dispatch the attributes needed to destroy", () => {
      reactiveRecordTest.dispatch.reset();
      const person = new Person({ id: 123 }, true);
      person.destroy()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(Person)",
        attributes: { id: 123 },
        query: {}
      });
    });

    it("should include the necessary attributes to build the route", () => {
      reactiveRecordTest.dispatch.reset();
      const leadMessage = new LeadMessage({ id: 124 });
      leadMessage.destroy({ unit_id: 50, lead_id: 500, reason: "Trump" });
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(LeadMessage)",
        attributes: { id: 124, unit_id: 50, lead_id: 500 },
        query: { reason: "Trump" }
      });
    });
  });

  describe("#static destroy", () => {
    it("should only require a key to dispatch the correct attributes", () => {
      reactiveRecordTest.dispatch.reset();
      News.destroy("nandos-on-fire")
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(News)",
        attributes: { slug: "nandos-on-fire" },
        query: {}
      });
    });

    it("should include the necessary attributes to build the route", () => {
      reactiveRecordTest.dispatch.reset();
      LeadMessage.destroy(124,{ unit_id: 50, lead_id: 500, reason: "Trump" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(LeadMessage)",
        attributes: { id: 124 },
        query: { reason: "Trump", unit_id: 50, lead_id: 500 }
      });
    });
  });

  describe("Query Interface", () => {
    it("should take a query for a create operation", () => {
      reactiveRecordTest.dispatch.reset();
      Person.create({ name: "Thomas" }, { query: { generic: "attribute" } })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        attributes: {
          name: "Thomas",
          level: "customer"
        },
        query: {
          generic: "attribute"
        }
      })
    });

    it("should take a query for a static destroy operation", () => {
      reactiveRecordTest.dispatch.reset();
      Person.destroy(123, { generic: "attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(Person)",
        attributes: {
          id: 123
        },
        query: {
          generic: "attribute"
        }
      })
    });
      
    it("should take a query for a find operation", () => {
      reactiveRecordTest.dispatch.reset();
      Person.find(123, { generic: "attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@SHOW(Person)",
        attributes: {
          id: 123
        },
        query: {
          generic: "attribute"
        }
      })
    });
      
    it("should take a query for an index operation", () => {
      reactiveRecordTest.dispatch.reset();
      Person.all({ generic: "attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@INDEX(Person)",
        attributes: {},
        query: {
          generic: "attribute"
        }
      })
    });

    it("should take a query for a load operation", () => {
      reactiveRecordTest.dispatch.reset();
      Person.load({ generic: "attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@INDEX(Person)",
        attributes: {},
        query: {
          generic: "attribute"
        }
      })
    });

    it("should take a query for an updateAttributes operation", () => {
      reactiveRecordTest.dispatch.reset();
      const person = new Person
      person.updateAttributes({ name: "Thomas" }, { query: { generic: "attribute" } })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        attributes: {
          name: "Thomas",
          level: "customer"
        },
        query: {
          generic: "attribute"
        }
      })
    });

    it("should take a query for an updateAttribute operation", () => {
      reactiveRecordTest.dispatch.reset();
      const person = new Person
      person.updateAttribute("name", "Thomas", { query: { generic: "attribute" } })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        attributes: {
          name: "Thomas",
          level: "customer"
        },
        query: {
          generic: "attribute"
        }
      })
    });

    it("should take a query for a save operation", () => {
      reactiveRecordTest.dispatch.reset();
      const person = new Person
      person.save({ query: { generic: "attribute" } })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        attributes: {
          level: "customer"
        },
        query: {
          generic: "attribute"
        }
      })
    });

    it("should take a query for a destroy operation", () => {
      reactiveRecordTest.dispatch.reset();
      const lastPerson = new Person({ id: 123 })
      lastPerson.destroy({ generic: "attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(Person)",
        attributes: { id: 123 },
        query: {
          generic: "attribute"
        }
      })
    });

    it("should take a query for a reload operation", () => {
      reactiveRecordTest.dispatch.reset();
      const lastPerson = new Person({ id: 123 })
      lastPerson.reload({ generic: "attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@SHOW(Person)",
        attributes: {
          id: 123
        },
        query: {
          generic: "attribute"
        }
      })
    });

    it("should allow a query string or object for each type of operation", () => {
      reactiveRecordTest.dispatch.reset();
    });

    it("should override existing attribues for each type of operation", () => {
      reactiveRecordTest.dispatch.reset();
    });

    it("should add to query string for every type of operation where the attribute does not exist", () => {
      reactiveRecordTest.dispatch.reset();
    });

    it("should not add to query string if the attribute in the query was used to build the URL", () => {
      reactiveRecordTest.dispatch.reset();
    });

    it("should interpolate URL tokens that are not in the schema", () => {
      reactiveRecordTest.dispatch.reset();
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
