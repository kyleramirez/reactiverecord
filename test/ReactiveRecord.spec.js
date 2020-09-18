import chai, { expect } from 'chai';
import { ReactiveRecord, Model } from '../src';
import { xhrRequests } from './test-utils';

describe('ReactiveRecord', () => {
  describe('#model', () => {
    const reactiveRecordTest = new ReactiveRecord();
    it('should throw an error if getting a non-existent model', () => {
      expect(() => {
        reactiveRecordTest.model('Insect');
      }).to.throw(ReferenceError);
    });

    it("should require models which inherit from ReactiveRecord's Model", () => {
      const reactiveRecordTest = new ReactiveRecord();
      expect(() => {
        reactiveRecordTest.model('Insect', class Insect {});
      }).to.throw(TypeError);
    });

    it('should assign models a unique instance', () => {
      const reactiveRecordTest = new ReactiveRecord();
      const reactiveRecordTest2 = new ReactiveRecord();
      reactiveRecordTest.model(
        'Person',
        class extends Model {
          static schema = {
            name: String,
          };
        }
      );
      reactiveRecordTest2.model(
        'Person',
        class extends Model {
          static schema = {
            name: String,
          };
        }
      );
      reactiveRecordTest2.model(
        'Place',
        class extends Model {
          static schema = {
            name: String,
          };
        }
      );

      const instanceOne = reactiveRecordTest.model('Person').ReactiveRecord;
      const instanceTwo = reactiveRecordTest2.model('Person').ReactiveRecord;
      const placeInstance = reactiveRecordTest2.model('Place').ReactiveRecord;

      /* eslint-disable no-unused-expressions */
      expect(instanceOne).to.not.be.undefined;
      /* eslint-enable no-unused-expressions */
      expect(instanceOne).to.not.equal(instanceTwo);
      expect(instanceTwo).to.equal(placeInstance);
    });

    it('should assign models a displayName', () => {
      const Thing = reactiveRecordTest.model(
        'Thing',
        class extends Model {
          static schema = {
            name: String,
          };
        }
      );
      expect(Thing).to.have.property('displayName');
      expect(Thing.displayName).to.equal('Thing');
    });

    it('should assign default routes to a model', () => {
      const Plan = reactiveRecordTest.model('Plan', class extends Model {});
      expect(Plan.routes).to.have.all.keys('index', 'create', 'show', 'update', 'destroy');
    });

    it('should not override provided routes from a model', () => {
      const indexRoute = '/api/v2/dishes';
      const Dish = reactiveRecordTest.model(
        'Dish',
        class extends Model {
          static routes = { index: indexRoute };
        }
      );
      expect(Dish.routes.index).to.equal(indexRoute);
    });

    it('should not generate routes specified in the except as an array', () => {
      const reactiveRecordTest = new ReactiveRecord();
      const Test = reactiveRecordTest.model(
        'Test',
        class extends Model {
          static routes = {
            except: ['index', 'show'],
          };
        }
      );
      expect(Test.routes).to.not.have.keys('index', 'show');
    });

    it('should not generate a route specified in the except as a string', () => {
      const reactiveRecordTest = new ReactiveRecord();
      const Test = reactiveRecordTest.model(
        'Test',
        class extends Model {
          static routes = {
            except: 'destroy',
          };
        }
      );
      expect(Test.routes).to.not.have.key('destroy');
    });

    it('should only generate routes specified in the except as an array', () => {
      const reactiveRecordTest = new ReactiveRecord();
      const Test = reactiveRecordTest.model(
        'Test',
        class extends Model {
          static routes = {
            only: ['index', 'show'],
          };
        }
      );
      expect(Test.routes).to.have.keys('index', 'show');
      expect(Object.keys(Test.routes).length).to.equal(2);
    });

    it('should only generate a route specified in the except as a string', () => {
      const reactiveRecordTest = new ReactiveRecord();
      const Test = reactiveRecordTest.model(
        'Test',
        class extends Model {
          static routes = {
            only: 'index',
          };
        }
      );
      expect(Test.routes).to.have.key('index');
      expect(Object.keys(Test.routes).length).to.equal(1);
    });

    it('should add a new Model to the ReactiveRecord instance', () => {
      const reactiveRecordTest = new ReactiveRecord();
      reactiveRecordTest.model(
        'Person',
        class extends Model {
          static schema = {
            name: String,
          };
        }
      );
      expect(reactiveRecordTest.models).to.have.property('Person');
    });

    it("should set the model's store configuration as not singleton unless otherwise specified", () => {
      const reactiveRecordTest = new ReactiveRecord();
      const Person = reactiveRecordTest.model('Person', class extends Model {});
      const CurrentUser = reactiveRecordTest.model(
        'CurrentUser',
        class extends Person {
          static store = { singleton: true };
        }
      );
      expect(Person.store.singleton).to.equal(false);
      expect(CurrentUser.store.singleton).to.equal(true);
    });

    it("should add either a singleton or collection reducer to the model's store configuration", () => {
      const reactiveRecordTest = new ReactiveRecord();
      const Person = reactiveRecordTest.model('Person', class extends Model {});
      const CurrentUser = reactiveRecordTest.model(
        'CurrentUser',
        class extends Person {
          static store = { singleton: true };
        }
      );
      expect(Person.store.reducer.name).to.equal('bound collectionReducer');
      expect(CurrentUser.store.reducer.name).to.equal('bound singletonReducer');
    });

    it("should not replace an existing reducer in the model's store configuration", () => {
      function myReducer(state = {}) {
        return state;
      }
      const reactiveRecordTest = new ReactiveRecord();
      const Person = reactiveRecordTest.model(
        'Person',
        class extends Model {
          static store = {
            reducer: myReducer,
          };
        }
      );
      expect(Person.store.reducer).to.equal(myReducer);
      expect(Person.store.singleton).to.equal(false);
    });
  });

  describe('#setAPI', () => {
    const reactiveRecordTest = new ReactiveRecord();

    reactiveRecordTest.setAPI({
      headers: {
        Accept: 'text/plain',
        JWT_TOKEN: 'thetoken',
      },
    });

    it('should merge API request headers with the default headers', () => {
      expect(reactiveRecordTest.API.headers['Content-Type']).to.equal('application/json');
      expect(reactiveRecordTest.API.headers['JWT_TOKEN']).to.equal('thetoken');
    });
    it('should leave default API request properties alone if unspecified', () => {
      expect(reactiveRecordTest.API.prefix).to.equal('');
    });
  });

  describe('#performAsync', () => {
    const reactiveRecordTest = new ReactiveRecord();
    const dispatchSpy = chai.spy();
    reactiveRecordTest.model(
      'Person',
      class extends Model {
        static schema = { name: String };
      }
    );
    reactiveRecordTest.dispatch = dispatchSpy;

    it('should throw an error if referencing a non-existent model', () => {
      return reactiveRecordTest
        .performAsync({ type: '@CREATE(Insect)', _attributes: { name: 'Asian Longhorn Beetle' } })
        .catch(e => {
          expect(e).to.be.an.instanceof(ReferenceError);
        });
    });

    it('should select the appropriate route based on the dispatched action', () => {
      xhrRequests.reset();
      reactiveRecordTest.model(
        'Insect',
        class extends Model {
          static routes = {
            index: '/the-index-route',
            create: '/the-create-route',
            show: '/the-show-route',
            update: '/the-update-route',
            destroy: '/the-destroy-route',
          };
        }
      );
      reactiveRecordTest.performAsync({ type: '@INDEX(Insect)' });
      // expect(XMLHttpRequest).to.have.been.called.with(Insect.routes.index)

      reactiveRecordTest.performAsync({ type: '@CREATE(Insect)' });
      // expect(XMLHttpRequest).to.have.been.called.with(Insect.routes.create)

      reactiveRecordTest.performAsync({ type: '@SHOW(Insect)' });
      // expect(XMLHttpRequest).to.have.been.called.with(Insect.routes.show)

      reactiveRecordTest.performAsync({ type: '@UPDATE(Insect)' });
      // expect(XMLHttpRequest).to.have.been.called.with(Insect.routes.update)

      reactiveRecordTest.performAsync({ type: '@DESTROY(Insect)' });
      // expect(XMLHttpRequest).to.have.been.called.with(Insect.routes.destroy)
    });

    // it("should select the appropriate request method based on the dispatched action", () => {
    //   xhrRequests.reset()
    //   reactiveRecordTest.performAsync({ type: "@INDEX(Person)" })
    //   reactiveRecordTest.performAsync({ type: "@CREATE(Person)", _attributes: { name: "O'Doyle" } })
    //   reactiveRecordTest.performAsync({ type: "@SHOW(Person)", _attributes: { id: 123 } })
    //   reactiveRecordTest.performAsync({ type: "@UPDATE(Person)", _attributes: { id: 123, name: "Happy" } })
    //   reactiveRecordTest.performAsync({ type: "@DESTROY(Person)", _attributes: { id: 123 } })
    //   const index = [
    //     "/people",
    //     {
    //       method: "GET",
    //       headers: { Accept: "application/json", "Content-Type": "application/json" }
    //     }
    //   ]
    //   const create = [
    //     "/people",
    //     {
    //       method: "POST",
    //       body: JSON.stringify({ name: "O'Doyle" }),
    //       headers: { Accept: "application/json", "Content-Type": "application/json" }
    //     }
    //   ]
    //   const show = [
    //     "/people/123",
    //     {
    //       method: "GET",
    //       headers: { Accept: "application/json", "Content-Type": "application/json" }
    //     }
    //   ]
    //   const update = [
    //     "/people/123",
    //     {
    //       method: "PUT",
    //       body: JSON.stringify({ name: "Happy" }),
    //       headers: { Accept: "application/json", "Content-Type": "application/json" }
    //     }
    //   ]
    //   const destroy = [
    //     "/people/123",
    //     {
    //       method: "DELETE",
    //       body: JSON.stringify({}),
    //       headers: { Accept: "application/json", "Content-Type": "application/json" }
    //     }
    //   ]
    //   expect(XMLHttpRequest).to.have.been.called.with(...index)
    //   expect(XMLHttpRequest).to.have.been.called.with(...create)
    //   expect(XMLHttpRequest).to.have.been.called.with(...show)
    //   expect(XMLHttpRequest).to.have.been.called.with(...update)
    //   expect(XMLHttpRequest).to.have.been.called.with(...destroy)
    // })

    // it("should never include a body for a GET request", () => {
    //   xhrRequests.reset()
    //   const requestWithNoBody = {
    //     method: "GET",
    //     headers: {
    //       Accept: "application/json",
    //       "Content-Type": "application/json"
    //     }
    //   }
    //   reactiveRecordTest.performAsync({
    //     type: "@INDEX(Person)",
    //     _attributes: {
    //       include: "friends",
    //       exclude: "email",
    //       joins: "invoices",
    //       "range-start": "2017-04-01",
    //       "range-end": "2017-08-01"
    //     }
    //   })
    //   expect(XMLHttpRequest).to.have.been.called.with(requestWithNoBody)
    //   xhrRequests.reset()

    //   reactiveRecordTest.performAsync({
    //     type: "@SHOW(Person)",
    //     _attributes: {
    //       id: 123,
    //       include: "friends",
    //       exclude: "email",
    //       joins: "invoices",
    //       "range-start": "2017-04-01",
    //       "range-end": "2017-08-01"
    //     }
    //   })
    //   expect(XMLHttpRequest).to.have.been.called.with(requestWithNoBody)
    // })

    // it("should add all attributes not in the schema to the URL and query string", () => {
    //   xhrRequests.reset()
    //   reactiveRecordTest.performAsync({
    //     type: "@CREATE(Person)",
    //     _attributes: {
    //       name: "Kyle",
    //       source: "signup-page",
    //       partner: "StateFarm"
    //     }
    //   })

    //   expect(XMLHttpRequest).to.have.been.called.with("/people?source=signup-page&partner=StateFarm", {
    //     method: "POST",
    //     body: JSON.stringify({ name: "Kyle" }),
    //     headers: {
    //       Accept: "application/json",
    //       "Content-Type": "application/json"
    //     }
    //   })
    // })

    // it("should interpolate url tokens, including ones not in the schema", () => {
    //   reactiveRecordTest.model(
    //     "Mammal",
    //     class extends Model {
    //       static routes = {
    //         index: ":prefix/:modelname/:special_attribute_not_in_schema/:species_id"
    //       }
    //       static schema = {
    //         species_id: String
    //       }
    //     }
    //   )
    //   const oldPrefix = reactiveRecordTest.API.prefix
    //   reactiveRecordTest.API.prefix = "/my-custom-prefix"

    //   xhrRequests.reset()
    //   reactiveRecordTest.performAsync({
    //     type: "@INDEX(Mammal)",
    //     _attributes: {
    //       species_id: "123",
    //       special_attribute_not_in_schema: "happiness"
    //     }
    //   })
    //   expect(XMLHttpRequest).to.have.been.called.with("/my-custom-prefix/mammals/happiness/123")
    //   reactiveRecordTest.API.prefix = oldPrefix
    // })

    it('should resolve all 2xx HTTP status codes');

    it('should reject all 4xx - 5xx status codes');

    it('should reject a JSON parse error');
  });
});
