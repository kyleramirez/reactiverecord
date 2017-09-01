import Collection from "../ReactiveRecord/Collection"

export default function mapStateToProps(state, { for:Model }) {
  const { ReactiveRecord:{ instanceId }, store:{ singleton }, displayName } = Model,
        stateModels = state.instanceId === instanceId ?
          state
        :
          Object.values(state).filter( statePiece => statePiece.instanceId === instanceId);

  if (singleton) {
    const { _attributes, _errors, _request } = stateModels[displayName];
    return { resource: new Model({ ...attributes, _errors, _request }, true) }
  }
  else {
    const { _collection, _request } = stateModels[displayName];
          const transformedCollection = Object.values(_collection)
                                        .map(function({ _attributes, _errors, _request }) {
                                          return new Model({ ..._attributes, _errors, _request }, true)
                                        }),
          resource = new Collection({ _collection: transformedCollection });

    resource._request = _request;
    return { resource  }
  }
}
