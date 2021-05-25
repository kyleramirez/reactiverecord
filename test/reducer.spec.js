import { expect } from 'chai';
import { without } from '../src/utils';
import collectionReducer from '../src/reducer/collectionReducer';
import { collectionProps, memberProps, _request } from '../src/constants';

const initializedReducer = collectionReducer.bind(this, 'Person', 'id');
const defaultPerson = {
  ...memberProps,
  _request: {
    ..._request,
    status: 200,
  },
};
const initialState = {
  ...collectionProps,
  _collection: {
    'id-300': {
      ...defaultPerson,
      _attributes: {
        name: 'Jen',
        id: 300,
      },
    },
    'id-301': {
      ...defaultPerson,
      _attributes: {
        name: 'Kate',
        id: 301,
      },
    },
    'id-302': {
      ...defaultPerson,
      _attributes: {
        name: 'Christine',
        id: 302,
      },
    },
    'id-303': {
      ...defaultPerson,
      _attributes: {
        name: 'Mary',
        id: 303,
      },
    },
  },
};

describe('collectionReducer', () => {
  it('should not respond to ReactiveRecord actions of a different model name', () => {
    const nextState = initializedReducer(initialState, { type: '@INDEX(Insect)' });
    expect(nextState).to.deep.equal(initialState);
  });
  it('should show the default request status of the model as null', () => {
    const nextState = initializedReducer(undefined, { type: '@INDEX(Insect)' });
    expect(nextState._request.status).to.equal(null);
  });

  describe('@INDEX(Model)', () => {
    it('should change the request status of the model to GETTING', () => {
      const nextState = initializedReducer(initialState, { type: '@INDEX(Person)' });
      expect(nextState).to.deep.equal({
        ...initialState,
        _request: {
          ...initialState._request,
          status: 'GETTING',
        },
      });
    });
    it('should remove all existing members with the invalidateCache option', () => {
      const nextState = initializedReducer(initialState, {
        type: '@INDEX(Person)',
        _options: { invalidateCache: true },
      });
      expect(nextState).to.deep.equal({
        ...initialState,
        _request: {
          ...initialState._request,
          status: 'GETTING',
        },
        _collection: {},
      });
    });
  });

  describe('@OK_INDEX(Model)', () => {
    const nextAction = {
      type: '@OK_INDEX(Person)',
      _request: {
        status: 200,
      },
      _collection: {
        300: {
          ...defaultPerson,
          _attributes: {
            name: 'Jenny McCarthy',
            id: 300,
          },
        },
        123: {
          ...defaultPerson,
          _attributes: {
            name: 'Kyle',
            id: 123,
          },
        },
      },
    };
    const nextState = initializedReducer(initialState, nextAction);
    it('should merge in the collection of resources', () => {
      expect(nextState).to.deep.equal({
        _request: {
          ...initialState._request,
          status: 200,
        },
        _collection: {
          ...initialState._collection,
          ...nextAction._collection,
        },
      });
    });

    it('should update the request status of the model to the given request status (200)', () => {
      expect(nextState._request.status).to.equal(200);
    });
  });

  describe('@ERROR_INDEX(Model)', () => {
    const nextAction = {
      type: '@ERROR_INDEX(Person)',
      _request: {
        status: 404,
      },
    };
    const nextState = initializedReducer(initialState, nextAction);
    it('should update the request status of the model to the given request status (404)', () => {
      expect(nextState._request.status).to.equal(404);
    });
  });

  describe('@CREATE(Model)', () => {
    const nextAction = {
      type: '@CREATE(Person)',
      attributes: {
        name: 'Ted',
      },
    };
    const nextState = initializedReducer(initialState, nextAction);
    it('should not change anything in state', () => {
      expect(nextState).to.deep.equal(initialState);
    });
  });

  describe('@OK_CREATE(Model)', () => {
    const nextAction = {
      type: '@OK_CREATE(Person)',
      _attributes: {
        id: 4001,
        name: 'Thomas Jefferson',
      },
      _request: {
        status: 201,
      },
    };
    const nextState = initializedReducer(initialState, nextAction);

    it(`should create a resource in the collection for an unknown key,
        should merge with a resource in the collection with the same key,
        should update the request status of the resource to the given request status (201),
        should not change the request status of the model`, () => {
      expect(nextState).to.deep.equal({
        ...initialState,
        _collection: {
          ...initialState._collection,
          'id-4001': {
            ...memberProps,
            _attributes: nextAction._attributes,
            _request: {
              ...memberProps._request,
              status: 201,
            },
          },
        },
      });
    });
  });

  describe('@ERROR_CREATE(Model)', () => {
    const nextAction = {
      type: '@ERROR_CREATE(Person)',
    };
    const nextState = initializedReducer(initialState, nextAction);

    it('should not change anything in state', () => {
      expect(nextState).to.deep.equal(initialState);
    });
  });

  describe('@SHOW(Model)', () => {
    const nextAction = {
      type: '@SHOW(Person)',
      _attributes: {
        id: 123,
      },
    };
    const nextState = initializedReducer(initialState, nextAction);

    it(`should create a resource in the collection for an unknown key,
        should merge with a resource in the collection with the same key,
        should update the request status of the resource to GETTING,
        should not change the request status of the model`, () => {
      expect(nextState).to.deep.equal({
        ...initialState,
        _collection: {
          ...initialState._collection,
          'id-123': {
            ...memberProps,
            _attributes: nextAction._attributes,
            _request: {
              ...memberProps._request,
              status: 'GETTING',
            },
          },
        },
      });
    });
  });

  describe('@OK_SHOW(Model)', () => {
    const nextAction = {
      type: '@OK_SHOW(Person)',
      _attributes: {
        id: 123,
        name: 'Kyle',
      },
      _request: {
        ...memberProps._request,
        status: 200,
      },
    };
    const nextState = initializedReducer(initialState, nextAction);

    it(`should create a resource in the collection for an unknown key,
        should merge with a resource in the collection with the same key,
        should update the request status of the resource to the given request status (200),
        should not change the request status of the model`, () => {
      expect(nextState).to.deep.equal({
        ...initialState,
        _collection: {
          ...initialState._collection,
          'id-123': {
            ...memberProps,
            _attributes: nextAction._attributes,
            _request: {
              ...memberProps._request,
              status: 200,
            },
          },
        },
      });
    });
  });

  describe('@ERROR_SHOW(Model)', () => {
    const nextAction = {
      type: '@ERROR_SHOW(Person)',
      _attributes: {
        id: 123,
      },
      _request: {
        status: 404,
        body: { message: 'Not Found.' },
      },
    };
    const nextState = initializedReducer(initialState, nextAction);

    it(`should create a resource in the collection for an unknown key,
        should merge with a resource in the collection with the same key,
        should update the request status of the resource to the given request status (404),
        should not change the request status of the model`, () => {
      expect(nextState).to.deep.equal({
        ...initialState,
        _collection: {
          ...initialState._collection,
          'id-123': {
            ...memberProps,
            _attributes: nextAction._attributes,
            _request: {
              ...memberProps._request,
              status: 404,
              body: { message: 'Not Found.' },
            },
          },
        },
      });
    });
  });

  describe('@UPDATE(Model)', () => {
    const nextAction = {
      type: '@UPDATE(Person)',
      _attributes: {
        id: 123,
      },
    };
    const nextState = initializedReducer(initialState, nextAction);

    it(`should create a resource in the collection for an unknown key,
        should merge with a resource in the collection with the same key,
        should update the request status of the resource to PUTTING,
        should not change the request status of the model`, () => {
      expect(nextState).to.deep.equal({
        ...initialState,
        _collection: {
          ...initialState._collection,
          'id-123': {
            ...memberProps,
            _attributes: nextAction._attributes,
            _request: {
              ...memberProps._request,
              status: 'PUTTING',
            },
          },
        },
      });
    });
  });

  describe('@OK_UPDATE(Model)', () => {
    const nextAction = {
      type: '@OK_UPDATE(Person)',
      _attributes: {
        id: 123,
        name: 'Kyle',
      },
      _request: {
        ...memberProps._request,
        status: 200,
      },
    };
    const nextState = initializedReducer(initialState, nextAction);

    it(`should create a resource in the collection for an unknown key,
        should merge with a resource in the collection with the same key,
        should update the request status of the resource to the given request status (202),
        should not change the request status of the model`, () => {
      expect(nextState).to.deep.equal({
        ...initialState,
        _collection: {
          ...initialState._collection,
          'id-123': {
            ...memberProps,
            _attributes: nextAction._attributes,
            _request: {
              ...memberProps._request,
              status: 200,
            },
          },
        },
      });
    });
  });

  describe('@ERROR_UPDATE(Model)', () => {
    const nextAction = {
      type: '@ERROR_UPDATE(Person)',
      _attributes: {
        id: 300,
      },
      _errors: {
        name: ['Name is required.'],
      },
      _request: {
        status: 422,
        body: { name: ['Name is required'] },
      },
    };
    const nextState = initializedReducer(initialState, nextAction);

    it(`should create a resource in the collection for an unknown key,
        should merge with a resource in the collection with the same key,
        should update the request status of the resource to the given request status (422),
        should not change the request status of the model`, () => {
      expect(nextState).to.deep.equal({
        ...initialState,
        _collection: {
          ...initialState._collection,
          'id-300': {
            ...initialState._collection['id-300'],
            _request: {
              status: 422,
              body: { name: ['Name is required'] },
            },
            _errors: {
              name: ['Name is required.'],
            },
          },
        },
      });
    });
  });

  describe('@DESTROY(Model)', () => {
    const nextAction = {
      type: '@DESTROY(Person)',
      _attributes: {
        id: 300,
      },
    };
    const nextState = initializedReducer(initialState, nextAction);

    it(`should create a resource in the collection for an unknown key,
        should merge with a resource in the collection with the same key,
        should update the request status of the resource to DELETING,
        should not change the request status of the model`, () => {
      expect(nextState).to.deep.equal({
        ...initialState,
        _collection: {
          ...initialState._collection,
          'id-300': {
            ...initialState._collection['id-300'],
            _request: {
              ...initialState._collection['id-300']._request,
              status: 'DELETING',
            },
          },
        },
      });
    });
  });

  describe('@OK_DESTROY(Model)', () => {
    const nextAction = {
      type: '@OK_DESTROY(Person)',
      _attributes: {
        id: 300,
      },
    };
    const nextState = initializedReducer(initialState, nextAction);

    it(`should remove the resource from the collection,
        should not change the request status of the model`, () => {
      expect(nextState).to.deep.equal({
        ...initialState,
        _collection: without.call(initialState._collection, 'id-300'),
      });
    });
  });

  describe('@ERROR_DESTROY(Model)', () => {
    const nextAction = {
      type: '@ERROR_DESTROY(Person)',
      _attributes: {
        id: 300,
      },
      _request: {
        status: 404,
        body: { message: 'Not Found.' },
      },
    };
    const nextState = initializedReducer(initialState, nextAction);

    it(`should create a resource in the collection for an unknown key,
        should merge with a resource in the collection with the same key,
        should update the request status of the resource to the given request status (404),
        should not remove the resource from the collection,
        should not change the request status of the model`, () => {
      expect(nextState).to.deep.equal({
        ...initialState,
        _collection: {
          ...initialState._collection,
          'id-300': {
            ...initialState._collection['id-300'],
            _request: {
              status: 404,
              body: { message: 'Not Found.' },
            },
          },
        },
      });
    });
  });
});
