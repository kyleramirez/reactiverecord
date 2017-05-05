import { expect } from "chai"
import { ReactiveRecord, Model } from "../src"

describe("ReactiveRecord", ()=>{
  describe("#model", ()=>{
    const reactiveRecordTest = new ReactiveRecord();

    class Person extends Model {
      static schema = {
        name: String,
        age: Number
      }
    }

    it("should add a new Model to the ReactiveRecord instance", ()=>{
      reactiveRecordTest.model(Person);
      expect(reactiveRecordTest.models).to.have.property("Person")
    });

    it("should retrieve a ReactiveRecord #<Model> when passed a string", ()=>{
      const Person = reactiveRecordTest.model("Person");
      expect(Person.prototype).to.be.instanceof(Model)
    });

    it("should throw an error if getting a non-existant model.",()=>{
      expect(()=>(reactiveRecordTest.model("Animal"))).to.throw(ReferenceError)
    });

    it("should throw an error if passed a non-ReactiveRecord class",()=>{
      expect(()=>(reactiveRecordTest.model(class Person {}))).to.throw(TypeError)
    });

    it("should throw an error if the #<Model> has no or an empty schema",()=>{
      expect(()=>(reactiveRecordTest.model(class Spreadsheet extends Model {}))).to.throw(TypeError)
      expect(()=>(reactiveRecordTest.model(class Spreadsheet extends Model { static schema = {}}))).to.throw(TypeError)
    });
  });

  describe("#setAPI", ()=>{
    const reactiveRecordTest = new ReactiveRecord();

    reactiveRecordTest.setAPI({ headers: {
      "Accept": "text/plain",
      "JWT_TOKEN": "thetoken"
    }});

    it("should merge API request headers with the default headers", ()=>{
      expect(reactiveRecordTest.apiHeaders["Content-Type"]).to.equal("application/json")
      expect(reactiveRecordTest.apiHeaders["JWT_TOKEN"]).to.equal("thetoken")
    });
    it("should leave default API request properties alone if unspecified", ()=>{
      expect(reactiveRecordTest.apiPrefix).to.equal("")
    });
  });

  describe("#getRoute", ()=>{
    const reactiveRecordTest = new ReactiveRecord();
    class Person extends Model {
      static schema = { name: String, age: Number }
      static routes = { except: "DELETE", POST: "/correct-route/:id" }
    }
    reactiveRecordTest.model(Person);;
    it("should throw an error if a forbidden method is attempted", ()=>{
      expect(()=>{ reactiveRecordTest.getRoute(Person, "DELETE", { name: "Jim" }) }).to.throw(TypeError)
    });
    it("should generate the correct route", ()=>{
      expect(reactiveRecordTest.getRoute(Person, "PUT", { name: "Jim", id:"123" })).to.equal("/people/123")
    });
    it("should use a route specified in the model definition", ()=>{
      expect(reactiveRecordTest.getRoute(Person, "POST", { name: "Jim", id:"123" })).to.equal("/correct-route/123")
    });
    it("should add a query string to the route if a query string is specified", ()=>{
      expect("/correct-route/123?word=up").to.equal(reactiveRecordTest.getRoute(Person, "POST", { name: "Jim", id:"123" },"?word=up"))
    });
    it("should add a query string to the route if an object was given as the query argument", ()=>{
      const obj = { cool:"story", bro:"tell", it:"again", search:"Whoa! This was so cooL!<div></div>" },
            queryString = "?cool=story&bro=tell&it=again&search=Whoa!%20This%20was%20so%20cooL!%3Cdiv%3E%3C%2Fdiv%3E"
      expect(`/correct-route/123${queryString}`).to.equal(reactiveRecordTest.getRoute(Person, "POST", { name: "Jim", id:"123" }, obj))
    });
  });

  
});
