import { applyMiddleware } from "redux"
import ReactiveRecord, { middleware } from "reactiverecord"

export default applyMiddleware(ReactiveRecord::middleware());
