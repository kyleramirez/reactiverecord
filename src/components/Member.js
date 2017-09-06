import React, { Component, Children } from "react"
import { connect } from "react-redux"
import { mapStateToProps, areStatesEqual, areStatePropsEqual } from "./connectFunctions"

export default function Member(props) {
  
  const connectOptions = {
          areStatesEqual: areStatesEqual(props),
          areStatePropsEqual
        }
  
  const Member = connect(mapStateToProps, null, null, connectOptions)(class Member extends Component {

    componentDidMount() {
      const { store: { singleton=false } } = this.props.for
      this.props.for.ReactiveRecord.dispatch = this.props.for.ReactiveRecord.dispatch || this.props.dispatch;
      if (singleton) return this.props.for.load()
      this.props.for.find(this.props.find)
    }

    render() {
      return Children.only(this.props.children(this.props.resource))
    }

    reload() {
      this.componentDidMount()
    }
  })
  
  return <Member {...props} />

}
