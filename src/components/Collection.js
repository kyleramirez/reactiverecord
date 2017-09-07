import React, { Component } from "react"
import { connect } from "react-redux"
import {
  mapStateToProps,
  areStatesEqual,
  areStatePropsEqual,
  ReactiveResource
} from "./connectFunctions"

export default class Collection extends Component {
  static defaultProps = {
    where: {}
  }
  constructor(props, context) {
    super(props, context);
    const connectOptions = {
            areStatesEqual: areStatesEqual(props),
            areStatePropsEqual
          }
    this.Collection = connect(mapStateToProps, null, null, connectOptions)(ReactiveResource)
  }

  componentDidMount() {
    this.props.for.ReactiveRecord.dispatch = this.props.for.ReactiveRecord.dispatch || this.props.dispatch;
    this.props.for.all(this.props.where)
  }

  render() {
    const { Collection, props } = this;
    return <Collection {...props}  />
  }

  reload() {
    this.componentDidMount()
  }
}
