export default function combineFormBuilders(...builders) {
  return (resource, fieldsObj) =>
    builders.reduce((finalBuilder, builder) => {
      if (typeof builder !== "function") {
        throw new TypeError(
          "Expected arguments for combineFormBuilders to be functions."
        )
      }
      return { ...finalBuilder, ...builder(resource, fieldsObj) }
    }, {})
}
