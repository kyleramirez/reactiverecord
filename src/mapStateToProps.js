import ReactiveRecordCollection from "./ReactiveRecordCollection"

export default function mapStateToProps(state, { for:Model }) {
  const { ReactiveRecord:{ instanceId }, store:{ singleton }, displayName } = Model,
        stateModels = state.instanceId === instanceId ?
          state
        :
          Object.values(state).filter( statePiece => statePiece.instanceId === instanceId);

  if (singleton) {
    const { attributes, errors:_errors, request:_request } = stateModels[displayName];
    return { resource: new Model({ ...attributes, _errors, _request }, true) }
  }
  else {
    const { collection, request } = stateModels[displayName],
          transformedCollection = Object.values(collection)
                                        .map(function({ attributes, errors:_errors, request:_request }) {
                                          return new Model({ ...attributes, _errors, _request }, true)
                                        }),
          resource = new ReactiveRecordCollection(...transformedCollection);
    resource._request = request;
    return { resource  }
  }
}
