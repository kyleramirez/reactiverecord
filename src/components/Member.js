import React, { Component } from "react"
import { connect } from "react-redux"
import {
  mapStateToProps,
  areStatesEqual,
  areStatePropsEqual,
  ReactiveResource
} from "./connectFunctions"

export default class Member extends Component {
  static defaultProps = {
    then: ()=>{},
    catch: e => { throw e; },
    where: {},
    fetch: true
  }
  constructor(props, context) {
    super(props, context);
    const connectOptions = {
            areStatesEqual: areStatesEqual(props),
            areStatePropsEqual
          }
    this.Member = connect(mapStateToProps, null, null, connectOptions)(ReactiveResource)
  }

  componentDidMount() {
    const { store: { singleton=false } } = this.props.for;
    this.props.for.ReactiveRecord.dispatch = this.props.for.ReactiveRecord.dispatch || this.props.dispatch;
    if (this.props.fetch) {
      if (singleton) return this.props.for.load(this.props.where).then(this.props.then).catch(this.props.catch)
      this.props.for.find(this.props.find, this.props.where).then(this.props.then).catch(this.props.catch)
    }
  }

  render() {
    const { Member, props } = this;
    return <Member {...props}  />
  }

  reload() {
    this.componentDidMount()
  }
}
