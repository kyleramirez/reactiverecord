import { expect } from "chai"
import { ReactiveRecord, Model } from "../src"
import "./test-utils"

describe("ReactiveRecord", ()=>{
  describe("#model", ()=>{
    const reactiveRecordTest = new ReactiveRecord();
    it("should throw an error if getting a non-existent model", () => {
      expect(() => {
        reactiveRecordTest.model("Insect")
      }).to.throw(ReferenceError)
    });

    it("should require models which inherit from ReactiveRecord's Model", () => {
      const reactiveRecordTest = new ReactiveRecord();
      expect(() => {
        reactiveRecordTest.model("Insect", class Insect {})
      }).to.throw(TypeError)
    });

    it("should assign models a unique instance", () => {
      const reactiveRecordTest = new ReactiveRecord(),
            reactiveRecordTest2 = new ReactiveRecord();
      reactiveRecordTest.model("Person", class extends Model {
        static schema = {
          name: String
        }
      });
      reactiveRecordTest2.model("Person", class extends Model {
        static schema = {
          name: String
        }
      });
      reactiveRecordTest2.model("Place", class extends Model {
        static schema = {
          name: String
        }
      });

      const instanceOne = reactiveRecordTest.model("Person").ReactiveRecord,
            instanceTwo = reactiveRecordTest2.model("Person").ReactiveRecord,
            placeInstance = reactiveRecordTest2.model("Place").ReactiveRecord;

      expect(instanceOne).to.not.be.undefined;
      expect(instanceOne).to.not.equal(instanceTwo);
      expect(instanceTwo).to.equal(placeInstance);
    })

    it("should assign models a displayName", () => {
      const Thing = reactiveRecordTest.model("Thing", class extends Model {
              static schema = {
                name: String
              }
            });
      expect(Thing).to.have.property("displayName");
      expect(Thing.displayName).to.equal("Thing");
    });

    it("should assign default routes to a model", () => {
      const Plan = reactiveRecordTest.model("Plan", class extends Model {});
      expect(Plan.routes).to.have.all.keys("index", "create", "show", "update", "destroy")
    });

    it("should not override provided routes from a model", () => {
      const indexRoute = "/api/v2/dishes",
            Dish = reactiveRecordTest.model("Dish", class extends Model {
              static routes = { index: indexRoute }
            });
      expect(Dish.routes.index).to.equal(indexRoute)
    });

    it("should not generate routes specified in the except as an array", () => {
      const reactiveRecordTest = new ReactiveRecord(),
            Test = reactiveRecordTest.model("Test", class extends Model {
              static routes = {
                except: ["index", "show"]
              }
            });
      expect(Test.routes).to.not.have.keys("index", "show");
    });

    it("should not generate a route specified in the except as a string", () => {
      const reactiveRecordTest = new ReactiveRecord(),
            Test = reactiveRecordTest.model("Test", class extends Model {
              static routes = {
                except: "destroy"
              }
            });
      expect(Test.routes).to.not.have.key("destroy");
    });

    it("should only generate routes specified in the except as an array", () => {
      const reactiveRecordTest = new ReactiveRecord(),
            Test = reactiveRecordTest.model("Test", class extends Model {
              static routes = {
                only: ["index", "show"]
              }
            });
      expect(Test.routes).to.have.keys("index","show");
      expect(Object.keys(Test.routes).length).to.equal(2)
    });

    it("should only generate a route specified in the except as a string", () => {
      const reactiveRecordTest = new ReactiveRecord(),
            Test = reactiveRecordTest.model("Test", class extends Model {
              static routes = {
                only: "index"
              }
            });
      expect(Test.routes).to.have.key("index");
      expect(Object.keys(Test.routes).length).to.equal(1)
    });

    it("should add a new Model to the ReactiveRecord instance", ()=>{
      const reactiveRecordTest = new ReactiveRecord();
      reactiveRecordTest.model("Person", class extends Model {
        static schema = {
          name: String
        }
      });
      expect(reactiveRecordTest.models).to.have.property("Person")
    });
  });

  describe("#setAPI", ()=>{
    const reactiveRecordTest = new ReactiveRecord();

    reactiveRecordTest.setAPI({ headers: {
      "Accept": "text/plain",
      "JWT_TOKEN": "thetoken"
    }});

    it("should merge API request headers with the default headers", ()=>{
      expect(reactiveRecordTest.API.headers["Content-Type"]).to.equal("application/json")
      expect(reactiveRecordTest.API.headers["JWT_TOKEN"]).to.equal("thetoken")
    });
    it("should leave default API request properties alone if unspecified", ()=>{
      expect(reactiveRecordTest.API.prefix).to.equal("")
    });
  });

  describe("#performAsync", () => {
    const reactiveRecordTest = new ReactiveRecord(),
          Person = reactiveRecordTest.model("Person", class extends Model {});
          Person.schema = { name: String }
    fetch.reset();
    it("should dispatch correct actions", () => {
      reactiveRecordTest.performAsync({ type: "@CREATE(Person)", attributes: { name: "Kyle" } })
      console.log(fetch.__spy.calls[0])
    });
  });
});

// it("should add to query string for every type of operation where the attribute does not exist", () => {
//   reactiveRecordTest.dispatch.reset();
// });
//
// it("should not add to query string if the attribute in the query was used to build the URL", () => {
//   reactiveRecordTest.dispatch.reset();
// });
//
// it("should interpolate URL tokens that are not in the schema", () => {
//   reactiveRecordTest.dispatch.reset();
// });
// it("should give models access to the ReactiveRecord instance", ()=>{
//   reactiveRecordTest.model("Person", class extends Model {
//     static schema = {
//       name: String
//     }
//   });
