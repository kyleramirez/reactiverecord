/*eslint-disable no-unused-vars*/
import React, { Component } from "react";
import ReactiveRecord, { Model } from "./reactiverecord";

class Fart extends Model {
  static _primaryKey = "token";
  static schema = { crisp: String }
}
ReactiveRecord.model("Fart", Fart)
window.Fart = ReactiveRecord.model("Fart")
console.log(new Fart())

export default class App extends Component {
  render() {
    return (
      <div>
        Mkay
      </div>
    );
  }
}
