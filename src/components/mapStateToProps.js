import Collection from "../ReactiveRecord/Collection"

function onlyObjects(obj) { return typeof obj === "object" }

function onlyReactiveRecord() {
  if ("_isReactiveRecord" in this) return this;
  const chunks = Object.values(this).filter(onlyObjects)
  for(i=0; i < chunks.length; i++) {
    if ("_isReactiveRecord" in chunks[i]) return chunks[i];
    chunks.push(...Object.values(chunks[i]).filter(onlyObjects))
  }
}

export default function mapStateToProps(state, { for:Model }) {
  const { store:{ singleton }, displayName } = Model,
        stateModels = state::onlyReactiveRecord();

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
