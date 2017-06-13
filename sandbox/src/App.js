/*eslint-disable no-unused-vars*/
import React, { Component } from "react";
import ReactiveRecord, { Model } from "./reactiverecord";

class Fart extends Model {
  static schema = {
    crisp: String,
    _timestamps: true
  }
}
ReactiveRecord.model("Fart", Fart)
window.Fart = ReactiveRecord.model("Fart")

export default class App extends Component {
  render() {
    return (
      <div>
        Mkay
      </div>
    );
  }
}
