import React, { Component } from "react"

export default class Form extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = { submitting: false }
    this.onSubmit = this::this.onSubmit;
    this.onSuccess = this::this.onSuccess;
    this.onError = this::this.onError;
  }

  render() {
    return(
      <form onSubmit={this.onSubmit}>
        <label htmlFor="name">
          Name<br />
          <input
            ref={ ref => this.name = ref}
            id="name"
            defaultValue={this.props.resource.name}
          />
          { do {
            if (this.props.resource._errors.hasOwnProperty("name"))
              <span style={{color: "red"}}>{this.props.resource._errors.name[0]}</span>
          }}
        </label><br />
        <label htmlFor="description">
          Description<br />
          <textarea
            ref={ ref => this.description = ref}
            id="description"
            defaultValue={this.props.resource.description}
          >
          </textarea>
          { do {
            if (this.props.resource._errors.hasOwnProperty("description"))
              <span style={{color: "red"}}>{this.props.resource._errors.description[0]}</span>
          }}
        </label><br />
        <label htmlFor="akc_recognized">
          <input
            ref={ ref => this.akc_recognized = ref}
            type="checkbox"
            id="akc_recognized"
            defaultChecked={this.props.resource.akc_recognized}
          />&nbsp;
          Is this breed AKC recognized?
          { do {
            if (this.props.resource._errors.hasOwnProperty("akc_recognized"))
              <span style={{color: "red"}}>{this.props.resource._errors.akc_recognized[0]}</span>
          }}
        </label>
        <div>
          <button>{this.state.submitting ? "Saving ..." : "Save"}</button>
        </div>
      </form>
    )
  }
  onSubmit(e) {
    const { onSuccess, onError } = this;
    e.preventDefault();

    const formAttrs = [
      ["name", "value"],
      ["description", "value"],
      ["akc_recognized", "checked"]
    ].reduce((final, [field, attr]) => {
      final[field] = this[field][attr]
      return final;
    }, {});

    this.setState({ submitting: true });
    this.props.resource.updateAttributes(formAttrs)
                       .then(onSuccess)
                       .catch(onError)
  }

  onSuccess(resource){
    this.setState({ submitting: false });
    if (typeof this.props.onSuccess == "function")
      this.props.onSuccess(resource)
  }

  onError(error){
    this.setState({ submitting: false });
    if (typeof this.props.onError == "function")
      this.props.onError(error)
  }
}