import React, { Component, Children } from "react"
import { connect } from "react-redux"
import mapStateToProps from "../mapStateToProps"

class Collection extends Component {

  componentDidMount() {
    this.props.for.ReactiveRecord.dispatch = this.props.for.ReactiveRecord.dispatch || this.props.dispatch;
    this.props.for.all()
  }

  render() {
    return Children.only(this.props.children(this.props.resource))
  }
}

export default connect(mapStateToProps)(Collection)
