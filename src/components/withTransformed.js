import React, { Component } from "react"
import PropTypes from "prop-types"

function noop() { return {} }

export default function withTransformed(originalMapStateToProps, ...connectArgs) {

  return WrappedComponent => {

    const connect = this,
          displayName = WrappedComponent.name || WrappedComponent.displayName || "Unknown";

    return class extends Component {

      static contextTypes = {
        ReactiveRecord: PropTypes.object.isRequired
      }

      static displayName = `ReactiveRecord(${displayName})`

      render() {
        const { ReactiveRecord, ReactiveRecord:{ instanceId } } = this.context,
              mapStateToProps = function(state, ownProps) {
                /* find the reducer */
                let ReactiveRecordIsOnlyReducer = state.instanceId === instanceId;

                if (!ReactiveRecordIsOnlyReducer) {
                  for (let stateKey in state) {
                    
                  }
                }

                return (originalMapStateToProps || noop)(state, ownProps)
              },
              Connect = connect(mapStateToProps, ...connectArgs)(WrappedComponent);

        return <Connect {...this.props} />
      }
    }
  }
}
// const reducerModels = {...store[reducerName]};
//   for (let modelName in reducerModels) {
//     const model = flute.models[modelName],
//           isSingular = model.store.singleton,
//           modelShape = reducerModels[modelName];
//     if (isSingular)
//       reducerModels[modelName] = {...modelShape, record: new model({
//         ...modelShape.record,
//         errors:{...modelShape.errors},
//         _request:{...modelShape._request},
//         _version:modelShape._version
//       })}
//     else
//       reducerModels[modelName] = {...modelShape, cache:modelShape.cache.map(item=>(new model({
//         ...item.record,
//         errors:{...item.errors},
//         _request:{...item._request},
//         _version:item._version
//       }))) }
//   }
//   return mapStateToProps({...store, [reducerName]:{...reducerModels}}, ownProps)