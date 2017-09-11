import React, { Component } from "react"
import * as styles from "./styles.scss"
import { validated } from "reactiverecord"

function without(...keys) {
  const obj = {};
  for (let i in this) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(this, i)) continue;
    obj[i] = this[i];
  }
  return obj;
}

function toClassName() {
  return this.filter(Boolean).join(" ");
}

function toNumericHash() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function triggerEventForProps(type, e) {
  const fn = this.props[`on${type}`];
  if (typeof fn === "function") fn.call(this, e);
}

export class Input extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      hasFocus: false,
      hasValue: props.defaultValue || props.value
    }
    this.generatedId = `input-${JSON.stringify(this.props)::toNumericHash()}`;
    this.onFocus = this::this.onFocus;
    this.onChange = this::this.onChange;
    this.onBlur = this::this.onBlur;
    this.classNames = {
      wrapper: styles["wrapper"],
      type: styles["text"],
      hasFocus: styles["hasFocus"],
      hasValue: styles["hasValue"],
      hasError: styles["hasError"],
      label: styles["label"],
      error: styles["error"]
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.hasOwnProperty("value") && nextProps.value != this.props.value) {
      this.setState({ hasValue: !!nextProps.value })
    }
  }

  render() {
    return(
      <label {...this.wrapperProps}>
        {this.input}
        {this.label}
        {this.error}
      </label>
    )
  }

  onFocus(e) {
    this.setState({ hasFocus: true })
    if (this.props.readOnly) this.elem.select();
    this::triggerEventForProps("Focus", e);
  }

  onChange(e) {
    const { hasValue } = this.state;
    if (this.value && !hasValue) this.setState({ hasValue: true });
    if (!this.value && hasValue) this.setState({ hasValue: false });
    this::triggerEventForProps("Change", e);
  }

  onBlur(e) {
    this.setState({ hasFocus: false });
    this::triggerEventForProps("Blur", e);
  }

  get wrapperProps() {
    const hasFocus = this.state.hasFocus ? this.classNames.hasFocus : null,
          hasValue = this.state.hasValue ? this.classNames.hasValue : null,
          hasError = this.props.errorText ? this.classNames.hasError : null,
          className = [
            this.props.className,
            this.classNames.wrapper,
            this.classNames.type,
            hasFocus,
            hasValue,
            hasError
          ]::toClassName()
    return {
      className,
      style: this.props.style,
      htmlFor: this.props.id || this.generatedId
    }
  }

  get inputProps() {
    return {
      ref: ref => (this.elem = ref),
      id: this.props.id || this.generatedId,
      onFocus: this.onFocus,
      onChange: this.onChange,
      onBlur: this.onBlur,
      ...this.props::without(
        "id", "className", "style",
        "labelText", "errorText",
        "onFocus", "onChange", "onBlur"
      )
    }
  }

  get input() {
    return(<input {...this.inputProps} />)
  }

  get label() {
    return(<span className={this.classNames.label}>{this.props.labelText}</span>)
  }

  get error() {
    return this.props.errorText ? <span className={this.classNames.error}>{this.props.errorText}</span> : null
  }

  get value() {
    return this.elem.value;
  }
}

export class Textarea extends Input {
  static defaultProps = {
    rows: 1,
    minRows: 1
  }

  constructor(...args) {
    super(...args);
    this.textareaChange = this::this.textareaChange;
  }

  componentDidMount() {
    this.renderedLineHeight = parseInt(getComputedStyle(this.elem).lineHeight);
    this.handleHeight();
  }

  get input() {
    return(
      <textarea
        {...this.inputProps::without("minRows", "onChange")}
        onChange={this.textareaChange}
      ></textarea>
    )
  }

  textareaChange(e) {
    this.handleHeight();
    this.onChange(e);
  }

  handleHeight() {
    this.elem.rows = 1;
    const { props:{ minRows }, renderedLineHeight, elem } = this,
          padding = 9, /* 9px for padding-bottom: 0.5em */
          nextRows = Math.max(Math.ceil((elem.scrollHeight - padding) / renderedLineHeight), minRows);
    elem.rows = nextRows;
  }
}

export class Select extends Input {
  constructor(props, context) {
    super(props, context)
    this.classNames.type = styles["select"];
  }
  get input() {
    return(
      <select {...this.inputProps::without("children")}>
        {this.props.children}
      </select>
    )
  }
}

export class Checkbox extends Input {
  constructor(props, context) {
    super(props, context);
    this.classNames.type = styles["checkbox"];
  }

  get input() {
    return [
      <input
        {...this.inputProps::without("defaultValue")}
        defaultChecked={this.inputProps.defaultValue}
        key="input"
        type="checkbox"
      />,
      <span key="visual" className={styles["checkbox"]}></span>
    ]
  }

  get value() {
    return this.elem.checked
  }
}

export class Radio extends Checkbox {
  constructor(props, context) {
    super(props, context);
    this.classNames.type = styles["radio"];
  }

  get input() {
    return [
      <input
        {...this.inputProps::without("defaultValue")}
        defaultChecked={this.inputProps.defaultValue}
        key="input"
        type="radio"
      />,
      <span key="visual" className={styles["radio"]}></span>
    ]
  }
}

export const ValidatedInput = validated(Input);
export const ValidatedTextarea = validated(Textarea);
export const ValidatedSelect = validated(Select);
export const ValidatedCheckbox = validated(Checkbox);
export const ValidatedRadio = validated(Radio);
