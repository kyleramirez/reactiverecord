import React, { Component } from 'react';
import { connect } from 'react-redux';
import { mapStateToProps, areStatesEqual, areStatePropsEqual, ReactiveResource } from './connectFunctions';
import { pick } from '../utils';

export default class Member extends Component {
  static defaultProps = {
    fetch: true,
  };
  constructor(props, context) {
    super(props, context);
    const connectOptions = {
      areStatesEqual: areStatesEqual(props),
      areStatePropsEqual,
    };
    this.Member = connect(
      mapStateToProps('Member'),
      null,
      null,
      connectOptions
    )(ReactiveResource);
  }

  componentDidMount() {
    this.props.for.ReactiveRecord.dispatch = this.props.for.ReactiveRecord.dispatch || this.props.dispatch;
    this.load();
  }

  componentDidUpdate(prevProps) {
    let prop = null;
    for (prop in pick.call(prevProps, 'for', 'where', 'fetch', 'find')) {
      if (JSON.stringify(prevProps[prop]) !== JSON.stringify(this.props[prop])) {
        this.load();
        break;
      }
    }
  }

  render() {
    const { Member, props } = this;
    return <Member {...props} />;
  }

  load() {
    const {
      store: { singleton = false },
    } = this.props.for;
    if (this.props.fetch) {
      let value;
      if (singleton) {
        value = this.props.for.load(this.props.where);
      } else {
        value = this.props.for.find(this.props.find, this.props.where);
      }
      if (this.props.then) {
        value.then(this.props.then);
      }
      if (this.props.catch) {
        value.catch(this.props.catch);
      }
    }
  }

  reload() {
    this.load();
  }
}
