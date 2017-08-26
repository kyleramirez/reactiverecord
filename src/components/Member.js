// import React, { Component, Children } from "react"
//
// export default class ReactiveRecordProvider extends Component {
//   constructor(props, context) {
//     super(props, context);
//     props.register.registerStore(context.store);
//   }
//   /* My own props */
//   static propTypes = {
//     register: PropTypes.object.isRequired,
//     children: PropTypes.element.isRequired
//   }
//   /* My own context */
//   static contextTypes = {
//     store: PropTypes.object.isRequired
//   }
//
//   /* My childrens' context */
//   static childContextTypes = {
//     ReactiveRecord: PropTypes.object.isRequired
//   }
//
//   getChildContext() {
//     return { ReactiveRecord: this.props.register }
//   }
//
//   render() {
//     return Children.only(this.props.children);
//   }
// }
