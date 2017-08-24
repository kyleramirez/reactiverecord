import React, { Component } from "react";
import ReactiveRecord, { reducer, middleware, ReactiveRecordProvider, withTransformed } from "./reactiverecord"
import { createStore, applyMiddleware, compose } from "redux"
import { Provider, connect } from "react-redux"

window.ReactiveRecord = ReactiveRecord;

const reduxDevTools = window.devToolsExtension ? window.devToolsExtension() : f => f;

const store = createStore(
  reducer.call(ReactiveRecord),
  compose(
    applyMiddleware(middleware.call(ReactiveRecord)),
    reduxDevTools
  )
);

// connect::withTransformed("Lease")(mapStateToProps, mapDispatchToProps)(Page)

class InnerPage extends Component {
  render() {
    console.log("InnerPageProps:",this.props)
    return <div>{this.props.children}</div>
  }
}

const Page = withTransformed.call(connect, "Lease")(({ instanceId })=>({ instanceId, truck:"barber" }))(InnerPage)

export default class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <ReactiveRecordProvider register={ReactiveRecord}>
          <Page>
            Mkay
          </Page>
        </ReactiveRecordProvider>
      </Provider>
    );
  }
}
