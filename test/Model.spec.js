import chai, { expect } from "chai"
import { ReactiveRecord, Model } from "../src"
import "./test-utils"

describe("Model", () => {
  const reactiveRecordTest = new ReactiveRecord()
  reactiveRecordTest.dispatch = chai.spy(Promise.resolve.bind(Promise))
  const Person = reactiveRecordTest.model(
    "Person",
    class Person extends Model {
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
        return (this._attributes.email = next.replace(/\+[^@]*/, ""))
      }
      get phone() {
        return this._attributes.phone || "No phone number given"
      }
    }
  )
  const CurrentUser = reactiveRecordTest.model(
    "CurrentUser",
    class CurrentUser extends Person {
      static store = { singleton: true }
    }
  )
  const Smell = reactiveRecordTest.model(
    "Smell",
    class Smell extends Model {
      static routes = {
        index: "/:modelname/:special_prop_not_in_schema",
        update: ":prefix/:modelname/:id",
        except: ["destroy"]
      }
    }
  )
  const News = reactiveRecordTest.model(
    "News",
    class News extends Model {
      static schema = {
        _timestamps: true,
        _primaryKey: "slug",
        title: String,
        body: String
      }
    }
  )
  const LeadMessage = reactiveRecordTest.model(
    "LeadMessage",
    class LeadMessage extends Model {
      static routes = {
        destroy: "/units/:unit_id/leads/:lead_id/:modelname/:id"
      }
    }
  )

  describe("#constructor", () => {
    const dude = new Person()

    it("should record if a resource is database persisted or not", () => {
      expect(false).to.equal(dude._persisted)
      expect(true).to.equal(new Person({}, true)._persisted)
    })

    it("should provide internal private attributes", () => {
      ;["_attributes", "_request", "_errors", "_pristine", "_persisted"].forEach(property => {
        expect(dude).to.have.property(property)
      })
    })

    it("should have an ID property if no _primaryKey was given in the schema", () => {
      expect(dude).to.have.property("id")
    })

    it("should not create an ID property if a primary key was given in the schema", () => {
      const Card = reactiveRecordTest.model(
        "Card",
        class Card extends Model {
          static schema = { _primaryKey: "token" }
        }
      )
      const card = new Card()
      expect(card).to.not.have.property("id")
    })

    it("should have created read-only properties", () => {
      ;["id", "createdAt", "updatedAt"].forEach(property => {
        expect(() => {
          dude[property] = "anything"
        }).to.throw(TypeError)
      })
    })

    it("should treat created_at, createdAt, updated_at, updatedAt as the same", () => {
      const date = "2017-08-30T15:05:32.144Z"
      const created_at = date
      const updated_at = date
      const createdAt = date
      const updatedAt = date
      const person1 = new Person({ created_at, updated_at })
      const person2 = new Person({ createdAt, updatedAt })
      expect(date).to.equal(person1.createdAt.toISOString())
      expect(date).to.equal(person1.updatedAt.toISOString())
      expect(date).to.equal(person2.createdAt.toISOString())
      expect(date).to.equal(person2.createdAt.toISOString())
    })

    it("should treat an id and _id as the same", () => {
      const id = 123
      const _id = id
      const person1 = new Person({ id })
      const person2 = new Person({ _id })
      expect(id).to.equal(person1.id)
      expect(id).to.equal(person2.id)
    })

    it("should treat a custom _primaryKey as read-only", () => {
      const Bank = reactiveRecordTest.model(
        "Bank",
        class Bank extends Model {
          static schema = { _primaryKey: "token" }
        }
      )
      const bank = new Bank()
      expect(() => {
        bank.token = "anything"
      }).to.throw(TypeError)
    })

    it("should have created writeable properties", () => {
      dude.name = "Kyle"
      expect("Kyle").to.equal(dude.name)
    })

    it("should allow using custom getters and setters", () => {
      dude.email = "dude+nospam@email.com"
      expect("dude@email.com").to.equal(dude.email)
      expect("No phone number given").to.equal(dude.phone)
    })

    it("should not allow changing the _pristine copy", () => {
      expect(() => {
        dude._pristine.name = "Kyle"
      }).to.throw(TypeError)
    })

    it("should assign default values if described in the schema", () => {
      expect(Person.schema.level.default).to.equal(dude.level)
    })
  })

  describe("#ReactiveRecord", () => {
    it("should give each instance access to ReactiveRecord", () => {
      /* eslint-disable no-unused-expressions */
      expect(new Person().ReactiveRecord).to.not.be.undefined
      /* eslint-enable no-unused-expressions */
      expect(new Person().ReactiveRecord).to.be.an.instanceof(ReactiveRecord)
    })
  })

  describe("#dispatch", () => {
    it("should dispatch actions to the ReactiveRecord instance", () => {
      reactiveRecordTest.dispatch.reset()
      Person.create()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        _attributes: { level: "customer" }
      })
    })
  })

  describe("#store", () => {
    it("should have a default singleton property", () => {
      expect(Person.store).to.have.property("singleton")
    })
  })

  describe("#serialize and #toJSON", () => {
    it("should have only three top-level properties", () => {
      const person = new Person()
      ;["_attributes", "_request", "_errors"].forEach(property => {
        expect(person.serialize()).to.have.property(property)
      })
    })
  })

  describe("#diff", () => {
    it("should return an object with changed values only", () => {
      const person = new Person()
      person.name = "Mufasa"
      expect(person.diff).to.deep.equal({ name: "Mufasa", level: "customer" })
    })

    it("should include all new attributes in the diff for a model that is not persisted", () => {
      const personAttrs = { name: "Simba", level: "admin" }
      const person = new Person(personAttrs)
      expect(person.diff).to.deep.equal(personAttrs)
    })

    it("should show only changed attributes in the diff for a model that is persisted", () => {
      const person = new Person({ name: "Simba", level: "customer" }, true)
      expect(person.diff).to.deep.equal({})
      person.name = "Zazu"
      expect(person.diff).to.deep.equal({ name: "Zazu" })
    })

    it("should show default values as changed values even for persisted records", () => {
      const person = new Person()
      const persistedPerson = new Person({}, true)
      expect(person.diff).to.deep.equal({ level: "customer" })
      expect(persistedPerson.diff).to.deep.equal({ level: "customer" })
    })

    it("should only show a difference in an array if it changed", () => {
      const person = new Person()
      person.likes = ["beef"]
      expect(person.diff.likes).to.deep.equal(["beef"])
    })

    it("should only show a difference in an object if it changed", () => {
      const person = new Person()
      person.cart = { items: 4 }
      expect(person.diff.cart).to.deep.equal({ items: 4 })
    })

    it("should only show a difference in a date if it changed", () => {
      const date = new Date()
      const person = new Person()
      person.activated_on = date
      expect(person.diff.activated_on).to.equal(date.toISOString())
    })
  })

  describe("#changedAttributes", () => {
    it("should return an array of the changed attributes", () => {
      const person = new Person()
      person.name = "Charles"
      expect(person.changedAttributes)
        .to.be.an("array")
        .that.includes("name", "level")
    })
  })

  describe("#isPristine", () => {
    it("should correctly identify a pristine record", () => {
      const person = new Person({ level: "admin", name: "Nick" }, true)
      expect(person.isPristine).to.equal(true)
      person.name = "Troy"
      expect(person.isPristine).to.equal(false)
      /* Default values applied */
      expect(person.isPristine).to.equal(false)
    })
  })

  describe("#isDirty", () => {
    it("should be the opposite of #isPristine", () => {
      const person = new Person({ level: "admin", name: "Nick" }, true)
      expect(person.isDirty).to.equal(false)
    })
  })

  describe("#attributeChanged", () => {
    it("should correctly identify a changed attribute", () => {
      const person = new Person()
      person.name = "Jimothy"
      expect(person.attributeChanged("name")).to.equal(true)
      expect(person.attributeChanged("age")).to.equal(false)
    })
  })

  describe("#routeFor", () => {
    it("should build the correct route actions", () => {
      expect(new Smell().routeFor("index")).to.equal("/smells/:special_prop_not_in_schema")
      expect(new Smell().routeFor("index", { special_prop_not_in_schema: "kids" })).to.equal("/smells/kids")
      expect(new Smell().routeFor("index", "kind=bad&special_prop_not_in_schema=kids")).to.equal(
        "/smells/kids?kind=bad"
      )
      expect(new Smell().routeFor("index", { kind: "bad" })).to.equal("/smells/:special_prop_not_in_schema?kind=bad")
      expect(new Smell().routeFor("index", { modelname: "cats" })).to.equal(
        "/smells/:special_prop_not_in_schema?modelname=cats"
      )

      expect(new Smell().routeFor("create")).to.equal("/smells")

      expect(new Smell().routeFor("show")).to.equal("/smells/:id")
      expect(new Smell({ id: 123 }).routeFor("show")).to.equal("/smells/123")
      expect(new Smell({ id: 123 }).routeFor("show", { id: 456 })).to.equal("/smells/456")
      expect(new Smell({ id: 123 }).routeFor("show", "?id=456")).to.equal("/smells/456")

      const savedAPIPrefix = reactiveRecordTest.API.prefix
      reactiveRecordTest.API.prefix = "/api/v1"
      expect(new Smell({ id: 123 }).routeFor("update")).to.equal("/api/v1/smells/123")
      reactiveRecordTest.API.prefix = savedAPIPrefix
    })

    it("should throw an error for a route not permitted", () => {
      expect(() => {
        new Smell().routeFor("destroy")
      }).to.throw(ReferenceError)
    })

    it("should not destroy the current resource's attributes (BUG FIX)", () => {
      const smell = new Smell({ id: 123 }, true)
      expect(smell.routeFor("update")).to.equal("/smells/123")
      expect(smell.routeFor("update")).to.equal("/smells/123")
    })
  })

  describe("#routeAttributes", () => {
    it("should return all attributes needed to build the route", () => {
      const smellAttrs = { id: 123 }
      const otherSmellAttrs = { special_prop_not_in_schema: "ocean" }
      expect(new Smell(smellAttrs).routeAttributes("show")).to.deep.equal(smellAttrs)
      expect(new Smell().routeAttributes("index", otherSmellAttrs)).to.deep.equal(otherSmellAttrs)
    })

    it("should throw an error for a route not permitted", () => {
      expect(() => {
        new Smell().routeAttributes("destroy")
      }).to.throw(ReferenceError)
    })
  })

  describe("#create", () => {
    it("should submit the correct attributes for creation", () => {
      const attributes = { slug: "nandos-on-fire", title: "Nandos on fire" }
      const query = { priority: "breaking" }
      News.create(attributes, { query })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(News)",
        _attributes: { ...attributes, ...query }
      })
    })
  })

  describe("#updateAttributes", () => {
    it("should only send changed attributes and attributes needed for URL", () => {
      const news = new News({ slug: "nandos-on-fire", title: "Nandos on fire" }, true)
      news.updateAttributes({ title: "Update: Nandos never actually on fire" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@UPDATE(News)",
        _attributes: {
          title: "Update: Nandos never actually on fire",
          slug: "nandos-on-fire"
        }
      })
    })

    it("should consider default values as changed values", () => {
      const guy = new Person({ id: 123 }, true)
      guy.updateAttributes({ name: "Craig" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@UPDATE(Person)",
        _attributes: { id: 123, name: "Craig", level: "customer" }
      })
    })
  })

  describe("#updateAttribute", () => {
    it("should only send changed attribute and attributes needed for URL", () => {
      const news = new News({ slug: "nandos-on-fire", title: "Nandos on fire" }, true)
      news.updateAttribute("title", "Update: Nandos never actually on fire")
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@UPDATE(News)",
        _attributes: {
          title: "Update: Nandos never actually on fire",
          slug: "nandos-on-fire"
        }
      })
    })

    it("should consider default values as changed values", () => {
      const guy = new Person({ id: 123 }, true)
      guy.updateAttribute("name", "Craig")
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@UPDATE(Person)",
        _attributes: { id: 123, name: "Craig", level: "customer" }
      })
    })
  })

  describe("#save", () => {
    it("should only send changed attributes and attributes needed for URL", () => {
      const person = new Person({ id: 123, level: "Zulu" }, true)
      person.name = "Shaka"
      person.save()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@UPDATE(Person)",
        _attributes: { id: 123, name: "Shaka" }
      })
    })

    it("should dispatch a create action if the record is not persisted", () => {
      const person = new Person({ level: "Zulu" })
      person.name = "Shaka"
      person.save()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        _attributes: { name: "Shaka", level: "Zulu" }
      })
    })

    it("should dispatch an update action if the record is persisted", () => {
      const person = new Person({ id: 123 }, true)
      person.name = "Shaka"
      person.save()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@UPDATE(Person)",
        _attributes: { id: 123, name: "Shaka", level: "customer" }
      })
    })
  })

  describe("#destroy", () => {
    it("should only dispatch the attributes needed to destroy", () => {
      const person = new Person({ id: 123 }, true)
      person.destroy()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(Person)",
        _attributes: { id: 123 }
      })
    })

    it("should include the necessary attributes to build the route", () => {
      const leadMessage = new LeadMessage({ id: 124 })
      leadMessage.destroy({ unit_id: 50, lead_id: 500, reason: "Trump" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(LeadMessage)",
        _attributes: { id: 124, unit_id: 50, lead_id: 500, reason: "Trump" }
      })
    })
  })

  describe("#static destroy", () => {
    it("should only require a key to dispatch the correct attributes", () => {
      News.destroy("nandos-on-fire")
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(News)",
        _attributes: { slug: "nandos-on-fire" }
      })
    })

    it("should include the necessary attributes to build the route", () => {
      LeadMessage.destroy(124, { unit_id: 50, lead_id: 500, reason: "Trump" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(LeadMessage)",
        _attributes: { id: 124, reason: "Trump", unit_id: 50, lead_id: 500 }
      })
    })
  })

  describe("#find", () => {
    it("should dispatch a SHOW action", () => {
      News.find("nandos-on-fire")
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@SHOW(News)",
        _attributes: { slug: "nandos-on-fire" }
      })
    })
  })

  describe("#all", () => {
    it("should dispatch an INDEX action", () => {
      News.all()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@INDEX(News)",
        _attributes: {}
      })
    })
  })

  describe("#load", () => {
    it("should be an alias for #all", () => {
      News.load()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@INDEX(News)",
        _attributes: {}
      })
    })
  })

  describe("#reload", () => {
    it("should dispatch an INDEX action for singleton models", () => {
      const currentUser = new CurrentUser()
      currentUser.reload()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@INDEX(CurrentUser)",
        _attributes: {}
      })
    })
    it("should dispatch a SHOW action for non-singleton resoures", () => {
      const person = new Person({ id: 123 })
      person.reload()
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@SHOW(Person)",
        _attributes: { id: 123 }
      })
    })
  })

  describe("Query Interface", () => {
    it("should take a query for a create operation", () => {
      Person.create({ name: "Thomas" }, { query: { generic: "attribute" } })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        _attributes: {
          name: "Thomas",
          level: "customer",
          generic: "attribute"
        }
      })

      Person.create({ name: "Thomas" }, { query: "?generic=attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        _attributes: {
          name: "Thomas",
          level: "customer",
          generic: "attribute"
        }
      })
    })

    it("should take a query for a static destroy operation", () => {
      Person.destroy(123, { generic: "attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(Person)",
        _attributes: {
          id: 123,
          generic: "attribute"
        }
      })

      Person.destroy(123, "?generic=attribute")
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(Person)",
        _attributes: {
          id: 123,
          generic: "attribute"
        }
      })
    })

    it("should take a query for a find operation", () => {
      Person.find(123, { generic: "attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@SHOW(Person)",
        _attributes: {
          id: 123,
          generic: "attribute"
        }
      })

      Person.find(123, "?generic=attribute")
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@SHOW(Person)",
        _attributes: {
          id: 123,
          generic: "attribute"
        }
      })
    })

    it("should take a query for an index operation", () => {
      Person.all({ generic: "attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@INDEX(Person)",
        _attributes: { generic: "attribute" }
      })

      Person.all("?generic=attribute")
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@INDEX(Person)",
        _attributes: { generic: "attribute" }
      })
    })

    it("should take a query for a load operation", () => {
      Person.load({ generic: "attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@INDEX(Person)",
        _attributes: { generic: "attribute" }
      })

      Person.load("?generic=attribute")
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@INDEX(Person)",
        _attributes: { generic: "attribute" }
      })
    })

    it("should take a query for an updateAttributes operation", () => {
      const person = new Person()
      person.updateAttributes({ name: "Thomas" }, { query: { generic: "attribute" } })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        _attributes: {
          name: "Thomas",
          level: "customer",
          generic: "attribute"
        }
      })

      person.updateAttributes({ name: "Thomas" }, { query: "?generic=attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        _attributes: {
          name: "Thomas",
          level: "customer",
          generic: "attribute"
        }
      })
    })

    it("should take a query for an updateAttribute operation", () => {
      const person = new Person()
      person.updateAttribute("name", "Thomas", { query: { generic: "attribute" } })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        _attributes: {
          name: "Thomas",
          level: "customer",
          generic: "attribute"
        }
      })

      person.updateAttribute("name", "Thomas", { query: "?generic=attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        _attributes: {
          name: "Thomas",
          level: "customer",
          generic: "attribute"
        }
      })
    })

    it("should take a query for a save operation", () => {
      const person = new Person()
      person.save({ query: { generic: "attribute" } })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        _attributes: {
          level: "customer",
          generic: "attribute"
        }
      })

      person.save({ query: "?generic=attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@CREATE(Person)",
        _attributes: {
          level: "customer",
          generic: "attribute"
        }
      })
    })

    it("should take a query for a destroy operation", () => {
      const lastPerson = new Person({ id: 123 })
      lastPerson.destroy({ generic: "attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(Person)",
        _attributes: { id: 123, generic: "attribute" }
      })

      lastPerson.destroy("?generic=attribute")
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@DESTROY(Person)",
        _attributes: { id: 123, generic: "attribute" }
      })
    })

    it("should take a query for a reload operation", () => {
      const lastPerson = new Person({ id: 123 })
      lastPerson.reload({ generic: "attribute" })
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@SHOW(Person)",
        _attributes: {
          id: 123,
          generic: "attribute"
        }
      })

      lastPerson.reload("?generic=attribute")
      expect(reactiveRecordTest.dispatch).to.have.been.called.with({
        type: "@SHOW(Person)",
        _attributes: {
          id: 123,
          generic: "attribute"
        }
      })
    })
  })
})
