import React from "react"
import { Form } from "reactiverecord"
import { ValidatedInput, ValidatedTextarea, ValidatedCheckbox } from "ui"

export default function ResourceForm({ resource, onSuccess, onError }) {
  return(
    <Form for={resource} afterSave={onSuccess} afterRollback={onError}>
      { fields => (
        <div>
          <ValidatedInput {...fields.name} />
          <ValidatedTextarea {...fields.description} />
          <ValidatedCheckbox {...fields.akc_recognized} />
          <button {...fields.submit}>
            {fields.validating ? "Validating" : fields.submitting ? "Saving" : "Save" } 
          </button>
        </div>
      )}
    </Form>
  )
}
