import React, { Component } from "react"

export default function withTransformed(...models) {
  console.log("models:", models)
  return (mapStateToProps, ...connectArgs) => WrappedComponent => {
    console.log("mapStateToProps:", mapStateToProps, connectArgs)
    const Connected = this(mapStateToProps, ...connectArgs)(WrappedComponent)
    return class extends Component {
      render() {
        return <Connected {...this.props} />
      }
    }
  }
}
