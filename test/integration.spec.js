import { expect } from "chai"
import ReactiveRecord, { Model, reducer, middleware } from "../src"
import { fetchRequests, FetchResponse } from "./test-utils"
import { createStore, applyMiddleware } from "redux"

describe("Integrations", () => {
  /*******/ /* Minimal ReactiveRecord boilerplate */
  /*******/ const Post = ReactiveRecord.model(
    "Post",
    class extends Model {
      /*******/ static schema = {
        /*******/ userId: Number,
        /*******/ title: String,
        /*******/ body: String
        /*******/
      }
      /*******/
    }
  )
  /**
   * Example: CurrentUser
   *
   * const CurrentUser = ReactiveRecord.model(
   *   "CurrentUser",
   *   class extends Model {
   *     static schema = {
   *       id: Number,
   *       name: String,
   *       level: { default: "customer", type: String }
   *     }
   *     static store = {
   *       singleton: true
   *     }
   *   }
   * )
   */
  /*******/ const store = createStore(
    /*******/ reducer.call(ReactiveRecord),
    /*******/ applyMiddleware(middleware.call(ReactiveRecord))
    /*******/
  )
  /*******/ ReactiveRecord.dispatch = store.dispatch

  describe("Model.all(query)", () => {
    it("should ", () => {
      const request = [
          "/posts",
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json"
            },
            credentials: "same-origin"
          }
        ],
        response = {
          status: 200,
          body: JSON.stringify([
            { id: 123, title: "Hello World", body: "Lorem ipsum, what did you expect?" },
            { id: 124, title: "Moby-Shtick", body: "Call me, Ishmael." }
          ])
        }
      fetchRequests.expect(request).andResolveWith(new FetchResponse(response))
      return Post.all().then(function(posts) {
        expect(fetch).to.have.been.called.with(...request)
        // console.log(posts)
        // expect(posts).to.be.an.instanceof(Collection)
        expect(posts[0]).to.be.an.instanceof(Post)
      })
    })
  })
  /*
  describe("Model.load(query)");

  describe("Model.create(attrs, { query })", () => {
    it("should ", () => {
    });
  });

  describe("Model.destroy(key, query)", () => {
    it("should ", () => {
    });
  });

  describe("Model.find(key, query)", () => {
    it("should ", () => {
    });
  });

  describe("Model.prototype.updateAttributes(attrs, { query })", () => {
    it("should ", () => {
    });
  });

  describe("Model.prototype.updateAttribute(name, value, { query })", () => {
    it("should ", () => {
    });
  });

  describe("Model.prototype.save({ query })", () => {
    it("should ", () => {
    });
  });

  describe("Model.prototype.destroy(query)", () => {
    it("should ", () => {
    });
  });

  describe("Model.prototype.reload(query)", () => {
    it("should ", () => {
    });
  }); */
})
