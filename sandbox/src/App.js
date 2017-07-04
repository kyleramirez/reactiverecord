/*eslint-disable no-unused-vars*/
import React, { Component } from "react";
import ReactiveRecord, { Model } from "./reactiverecord";

class Fart extends Model {
  static schema = {
    crisp: String,
    cling: Array,
    spring: Object,
    ding: { default: "DINGALING!", type: String },
    _timestamps: true,
    _primaryKey: "token"
  }
  static routes = {
    fat: "basket",
    // only: "create"
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
