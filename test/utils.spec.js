import { expect } from "chai"
import reactiveRecord, { Model } from "../src"
import {
  isEmptyObject, generateID, pruneDeep,
  pruneArray, regexIndexOf, checkResponseStatus,
  routePermitted, generateRoute,
  interpolateRoute, delimiterType, setReadOnlyProps,
  setWriteableProps, mergeRecordsIntoCache, createThisRecord,
  tmpRecordProps, objToQueryString
} from "../src/utils"

import { singleRecordProps, versioningProps, recordProps } from "../src/constants"

describe("Utils", ()=>{
  describe("#isEmptyObject", ()=>{

    it("should return true when passing in an empty object", ()=>{
      expect(isEmptyObject({})).to.equal(true)
    });
    it("should return false when passing in an object with properties", ()=>{
      expect(isEmptyObject({prop:true})).to.equal(false)
    });
  });

  describe("#generateID", ()=>{
    it("should create unique IDs even if generated at the same time", ()=>{
      expect(generateID()).to.not.equal(generateID())
    });
  });

  describe("#pruneArray", ()=>{
    it("should remove falsy values from an array, except empty strings", ()=>{
      const testArr = [null, undefined, NaN, "something","", false, 0]
      expect(pruneArray(testArr).length).to.equal(4)
    });
  });

  describe("#pruneDeep", ()=>{
    const testObj =
            {
              beTruthy: "something",
              beAnEmptyString: "",
              beZero: 0,
              beFalse: false,
              beUndefined: undefined,
              beNull: null,
              beEmptyObject: {},
              beObjectWithTruthyProperties: {
                someProp: true
              },
              beObjectWithFalsyProperties:{
                someProp: null
              },
              beArrayWithTruthyAndFalsyValues: [
                null,
                undefined,
                NaN,
                "something",
                //Object with TruthyAndFalsy
                { 
                  prop1: null,
                  prop2: "something"
                },
                //Object with falsy only
                {
                  prop1:null
                },
                //EmptyObject
                {}
              ],
              beEmptyArray:[],
              beArrayWithFalsyValues:[null,undefined,NaN],
              beADeepObjectWithProperties:{
                beTruthy: "something",
                beAnEmptyString: "",
                beZero: 0,
                beFalse: false,
                beUndefined: undefined,
                beNull: null,
                beEmptyObject: {},
                beObjectWithTruthyProperties: {
                  someProp: true
                },
                beObjectWithFalsyProperties:{
                  someProp: null
                },
                beArrayWithTruthyAndFalsyValues: [
                  null,
                  undefined,
                  NaN,
                  "something",
                  //Object with TruthyAndFalsy
                  { 
                    prop1: null,
                    prop2: "something"
                  },
                  //Object with falsy only
                  {
                    prop1:null
                  },
                  //EmptyObject
                  {}
                ],
                beEmptyArray:[],
                beArrayWithFalsyValues:[null,undefined,NaN]
              }
            },
            prunedTestObject = pruneDeep(testObj),
            manuallyPrunedObject = {
              beTruthy: "something",
              beAnEmptyString: "",
              beZero: 0,
              beFalse: false,
              beObjectWithTruthyProperties: {
                someProp: true
              },
              beArrayWithTruthyAndFalsyValues: [
                "something",
                { 
                  prop2: "something"
                },
              ],
              beADeepObjectWithProperties:{
                beTruthy: "something",
                beAnEmptyString: "",
                beZero: 0,
                beFalse: false,
                beObjectWithTruthyProperties: {
                  someProp: true
                },
                beArrayWithTruthyAndFalsyValues: [
                  "something",
                  { 
                    prop2: "something"
                  }
                ]
              }
            }
    it("should return a clean object with no falsy values, except for empty strings", ()=>{
      expect(JSON.stringify(prunedTestObject)).to.equal(JSON.stringify(manuallyPrunedObject))
    });
  });

  describe("#regexIndexOf", ()=>{
    it("should return the index of a Regex match", ()=>{
      const regexSearch = /(sweet|cool|awesome)/
      expect(regexIndexOf(regexSearch, "That would be sweet!")).to.equal(14)
    });
  });

  describe("#checkResponseStatus", ()=>{
    it("should give the response back if the status is 200-something", ()=>{
      const response = { status: 201 };
      expect(checkResponseStatus(response)).to.equal(response)
    });
    it("should throw an error if the response is an error-type", ()=>{
      const response = { status: 403 };
      expect(()=>(checkResponseStatus(response))).to.throw(Error)
    });
  });

  describe("#routePermitted", ()=>{
    it("should allow a string as an only clause", ()=>{
      expect(routePermitted({ only: "GET" }, "GET")).to.equal(true)
      expect(routePermitted({ only: "GET" }, "POST")).to.equal(false)
    });

    it("should allow a string as an except clause", ()=>{
      expect(routePermitted({ except: "POST" }, "GET")).to.equal(true)
      expect(routePermitted({ except: "POST" }, "POST")).to.equal(false)
    });

    it("should allow an array as an only clause", ()=>{
      expect(routePermitted({ only: ["GET", "POST"] }, "GET")).to.equal(true)
      expect(routePermitted({ only: ["GET", "POST"] }, "POST")).to.equal(true)
    });

    it("should allow an array as an except clause", ()=>{
      expect(routePermitted({ except: ["POST", "PUT"] }, "GET")).to.equal(true)
      expect(routePermitted({ except: ["POST", "PUT"] }, "POST")).to.equal(false)
    });
  });

  describe("#generateRoute", ()=>{
    it("should generate the correct route for an #index", ()=>{
      expect(generateRoute("BankAccount", "GET", "underscore", "/api", true)).to.equal("/api/bank_accounts")
      expect(generateRoute("BankAccount", "GET", "dasherize", "/api", true)).to.equal("/api/bank-accounts")
    });
    it("should generate the correct route for a #show", ()=>{
      expect(generateRoute("BankAccount", "GET", "underscore", "/api")).to.equal("/api/bank_accounts/:id")
      expect(generateRoute("BankAccount", "GET", "dasherize", "/api")).to.equal("/api/bank-accounts/:id")
    });
    it("should generate the correct route for a #update", ()=>{
      expect(generateRoute("BankAccount", "PUT", "underscore", "/api")).to.equal("/api/bank_accounts/:id")
      expect(generateRoute("BankAccount", "PUT", "dasherize", "/api")).to.equal("/api/bank-accounts/:id")
    });
    it("should generate the correct route for a #create", ()=>{
      expect(generateRoute("BankAccount", "POST", "underscore", "/api")).to.equal("/api/bank_accounts")
      expect(generateRoute("BankAccount", "POST", "dasherize", "/api")).to.equal("/api/bank-accounts")
    });
    it("should generate the correct route for a #destroy", ()=>{
      expect(generateRoute("BankAccount", "DELETE", "underscore", "/api")).to.equal("/api/bank_accounts/:id")
      expect(generateRoute("BankAccount", "DELETE", "dasherize", "/api")).to.equal("/api/bank-accounts/:id")
    });
  });

  describe("#interpolateRoute", ()=>{
    it("should replace variables preceeded by a colon given an object", ()=>{
      expect(interpolateRoute("/leases/:leaseId/users/:userId",{ leaseId:23, userId:44 })).to.equal("/leases/23/users/44")
    });
  });

  describe("#delimiterType", ()=>{
    it("should accept multiple types for underscore", ()=>{
      expect(delimiterType("_")).to.equal("underscore")
      expect(delimiterType("underscores")).to.equal("underscore")
      expect(delimiterType("underscore")).to.equal("underscore")
    });
    it("should return dasherize for anything unknown", ()=>{
      expect(delimiterType("%")).to.equal("dasherize")
      expect(delimiterType()).to.equal("dasherize")
    });
  });

  describe("#setReadOnlyProps", ()=>{
    it("should set an ID if id or _id is present in the params", ()=>{
      const toMutate = { record:{} },
            toMutate2 = { record:{} };
      setReadOnlyProps({_id:"abc"}, false, "Collaboration", toMutate)
      expect(toMutate).to.have.property("id")
      setReadOnlyProps({id:"abc"}, false, "Collaboration", toMutate2)
      expect(toMutate).to.have.property("id")
    });

    it("should set ID to null if not present initially", ()=>{
      const toMutate = { record:{} }
      setReadOnlyProps({}, false, "Collaboration", toMutate)
      expect(toMutate.id).to.equal(null)
    });

    it("should throw an error if trying to redefine ID", ()=>{
      const toMutate = { record: {} }
      setReadOnlyProps({id:"abc"}, false, "Collaboration", toMutate)
      expect(()=>(toMutate.id = "def")).to.throw(TypeError)
    });

    it("should set timestamps if timestamps are specified", ()=>{
      const toMutate = { record:{} },
            toMutate2 = { record:{} };
      setReadOnlyProps({}, true, "Collaboration", toMutate)
      expect(toMutate).to.have.property("timestamps")

      setReadOnlyProps({}, false, "Collaboration", toMutate2)
      expect(toMutate2).to.not.have.property("timestamps")
    });

    it("should allow camelcase createdAt/updatedAt and underscore created_at, updated_at", ()=>{
      const toMutate = { record:{} },
            toMutate2 = { record:{} };
      setReadOnlyProps({createdAt:"2016-11-13T18:14:30.082Z",updatedAt:"2016-11-13T18:14:30.082Z"}, true, "Collaboration", toMutate)
      expect(toMutate.createdAt).to.be.ok
      expect(toMutate.updatedAt).to.be.ok

      setReadOnlyProps({created_at:"2016-11-13T18:14:30.082Z",updated_at:"2016-11-13T18:14:30.082Z"}, true, "Collaboration", toMutate2)
      expect(toMutate.createdAt).to.be.ok
      expect(toMutate.updatedAt).to.be.ok
    });

    it("should set timestamps to null if not present initially", ()=>{
      const toMutate = { record:{} }
      setReadOnlyProps({}, true, "Collaboration", toMutate)
      expect(toMutate.createdAt).to.equal(null)
      expect(toMutate.updatedAt).to.equal(null)
    });

    it("should throw an error if trying to redefine timestamps", ()=>{
      const toMutate = { record:{} }
      setReadOnlyProps({}, true, "Collaboration", toMutate)
      expect(()=>(toMutate.createdAt = Date())).to.throw(TypeError)
      expect(()=>(toMutate.updatedAt = Date())).to.throw(TypeError)
    });

    it("should return the timestamps as a Date object when getting", ()=>{
      const toMutate = { record:{} }
      setReadOnlyProps({createdAt:"2016-11-13T18:14:30.082Z",updatedAt:"2016-11-13T18:14:30.082Z"}, true, "Collaboration", toMutate)
      expect(toMutate.createdAt).to.be.a("date")
      expect(toMutate.updatedAt).to.be.a("date")
    });

    
  });

  describe("#setWriteableProps", ()=>{
    const schema = {
            name: String,
            birthday: Date,
            admin: Boolean,
            attractiveness: Number
          }
    it("should not add properties that don't exist in the schema", ()=>{
      const toMutate = { record:{} }, toMutate2 = { record:{} }
      setWriteableProps({ gender: "male" }, schema, toMutate)
      expect(toMutate.gender).to.be.an("undefined")
    });

    it("should set properties in schema to null as a default value", ()=>{
      const toMutate = { record:{} }
      setWriteableProps({}, schema, toMutate)
      expect(toMutate.name).to.equal(null)
      expect(toMutate.birthday).to.equal(null)
      expect(toMutate.admin).to.equal(null)
      expect(toMutate.attractiveness).to.equal(null)
    });

    it("should return a date if the schema type is Date", ()=>{
      const toMutate = { record:{} }
      setWriteableProps({ birthday:"Apr 13, 1988" }, schema, toMutate)
      expect(toMutate.birthday).to.be.a("date")
    });

    it("should force a number value if the schema type is Number", ()=>{
      const toMutate = { record:{} }
      setWriteableProps({ attractiveness:"6" }, schema, toMutate)
      expect(toMutate.attractiveness).to.be.a("number")
    });
    it("should force a boolean value if the schema type is Boolean", ()=>{
      const toMutate = { record:{} },
            toMutate2 = { record:{} },
            toMutate3 = { record:{} },
            toMutate4 = { record:{} }

      setWriteableProps({ admin:0 }, schema, toMutate)
      expect((toMutate.admin).toString()).to.equal("false")

      setWriteableProps({ admin:1 }, schema, toMutate2)
      expect((toMutate2.admin).toString()).to.equal("true")

      setWriteableProps({ admin:true }, schema, toMutate3)
      expect((toMutate3.admin).toString()).to.equal("true")

      setWriteableProps({ admin:"true" }, schema, toMutate4)
      expect((toMutate4.admin).toString()).to.equal("true")
    });
    it("should convert the string `false` to a false value if the schema type is Boolean", ()=>{
      const toMutate = { record:{} }
      setWriteableProps({ admin:"false" }, schema, toMutate)
      expect((toMutate.admin).toString()).to.equal("false")
    });
  });

  describe("#mergeRecordsIntoCache", ()=>{
    class Person extends Model {
      static schema = {
        name: String,
        age: Number
      }
    }
    reactiveRecord.model(Person);
    class Invitation extends Model {
      static schema = {
        email: String,
        name: String,
        _key: "email"
      }
    }
    reactiveRecord.model(Invitation);

    const PersonModel = reactiveRecord.model("Person"),
          firstExistingRecord = new PersonModel({ name:"Kyle", _id:"582d28ea95386f2c5a6a0025" }),
          defaultCache = [{ ...singleRecordProps, record: {...firstExistingRecord.record} }],
          InvitationModel = reactiveRecord.model("Invitation"),
          firstExistingInvitationRecord = new InvitationModel({ name:"Kyle", email:"kyle@kyle.com" }),
          secondExistingInvitationRecord = new InvitationModel({ name:"Jim", email:"jim@jim.com" }),
          defaultInvitationCache = [
            { ...singleRecordProps, record: {...firstExistingInvitationRecord.record} },
            { ...singleRecordProps, record: {...secondExistingInvitationRecord.record} }
          ];

    it("should add previously non-existant records in the cache", ()=>{
      const records = [{ name:"Jim", _id:"582d28ea95386f2c5a6a0026" }],
            newCache = mergeRecordsIntoCache(defaultCache, records, "id", PersonModel);
      expect(newCache.length).to.equal(2)
    });

    it("should replace previously existant records in the cache", ()=>{
      const records = [{ name:"Jim", _id:"582d28ea95386f2c5a6a0025" }],
            newCache = mergeRecordsIntoCache(defaultCache, records, "id", PersonModel);

      expect(newCache.length).to.equal(1)
      expect(newCache[0].record.name).to.equal("Jim")
    });

    it("should add singleRecordProps to the record in the cache", ()=>{
      const records = [{ name:"Jim", _id:"582d28ea95386f2c5a6a0026" }],
            newCache = mergeRecordsIntoCache([], records, "id", PersonModel);
      expect(newCache[0]).to.have.all.keys(Object.keys(singleRecordProps))
    });

    it("should honor the keyString for selecting which records need to be removed", ()=>{
      const records = [{ name:"Jimothy", email:"jim@jim.com" }],
            newCache = mergeRecordsIntoCache(defaultInvitationCache, records, "email", InvitationModel),
            jimRecord = newCache.filter(i=>(i.record.email == "jim@jim.com"))[0];
      expect(jimRecord.record.name).to.equal("Jimothy");
    });

    it("should leave the object alone and return a new object", ()=>{
      const records = [{ name:"Kyle T.", _id:"582d28ea95386f2c5a6a0025" }],
            recordBeforeMerge = {...defaultCache[0]};
      mergeRecordsIntoCache(defaultCache, records, "id", PersonModel);
      expect(recordBeforeMerge).to.deep.equal(defaultCache[0])
    });
  });

  describe("#createThisRecord", ()=>{
    class Collaborator extends Model {
      static schema = {
        storyId: String,
        userId: String,
        _timestamps: true
      }
    }
    reactiveRecord.model(Collaborator);
    const CollaboratorModel = reactiveRecord.model("Collaborator")

    it("should the appropriate properties for a model type", ()=>{
      const recordForStore = createThisRecord(CollaboratorModel,{ _id:"id1", storyId:"id2", userId:"id3" });
      expect(recordForStore).to.deep.equal({ id: "id1", storyId: "id2", userId: "id3", createdAt: null, updatedAt: null })
    });
    it("should create properties according to schema, giving a null value if not defined", ()=>{
      const recordForStore = createThisRecord(CollaboratorModel,{ _id:"id1", userId:"id3" });
      expect(recordForStore).to.have.property("storyId")
      expect(recordForStore.storyId).to.equal(null)
    });
  });

  describe("#tmpRecordProps", ()=>{
    it("should return an object with the correct properties for a temporary record", ()=>{
      expect(tmpRecordProps()).to.be.an("object")
      expect(tmpRecordProps()).to.have.keys(Object.keys({...versioningProps, ...recordProps, creating:"", id:"" }))
    });
    it("should create a unique ID every time", ()=>{
      expect(tmpRecordProps().id).to.not.equal(tmpRecordProps().id)
    });
  });

  describe("#objToQueryString", ()=>{
    it("should turn a regular object into a query string", ()=>{
      const obj = { cool:"story", bro:"tell", it:"again", search:"Whoa! This was so cooL!<div></div>" },
            finalStr = "?cool=story&bro=tell&it=again&search=Whoa!%20This%20was%20so%20cooL!%3Cdiv%3E%3C%2Fdiv%3E";
      expect(objToQueryString(obj)).to.equal(finalStr);
    });
  });
});
