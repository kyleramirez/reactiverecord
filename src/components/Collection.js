import React, { Component, Children } from "react"
import { connect } from "react-redux"
import { mapStateToProps, areStatesEqual, areStatePropsEqual } from "./connectFunctions"

export default function Collection(props) {
  
  const connectOptions = {
          areStatesEqual: areStatesEqual(props),
          areStatePropsEqual
        }
  
  const Collection = connect(mapStateToProps, null, null, connectOptions)(class Collection extends Component {
    static defaultProps = {
      where: {}
    }
    componentDidMount() {
      this.props.for.ReactiveRecord.dispatch = this.props.for.ReactiveRecord.dispatch || this.props.dispatch;
      this.props.for.all(this.props.where)
    }

    render() {
      return Children.only(this.props.children(this.props.resource))
    }

    reload() {
      this.componentDidMount()
    }
  })
  
  return <Collection {...props} />

}
