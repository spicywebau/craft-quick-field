/**
 * A response when loading Quick Field's new field template and initial group data.
 */
interface LoadResponse {
  data: LoadResponseData
}

/**
 * Quick Field's new field template and initial group data.
 */
interface LoadResponseData {
  template: Template
  groups: Group[]
}

/**
 * A response when deleting a field.
 */
interface DeleteFieldResponse {
  data: {
    field: Field
  }
}

/**
 * A response when editing a field.
 */
interface EditFieldResponse {
  data: {
    field: Field
    template?: Template
  }
}

/**
 * A response when saving a field.
 */
interface SaveFieldResponse {
  data: {
    field: Field
    elementSelectors: string
    selectorHtml: string
    template?: Template
  }
}

/**
 * A response when saving a group.
 */
interface SaveGroupResponse {
  data: {
    group: Group
  }
}

/**
 * HTML, CSS and JavaScript data.
 */
interface Template {
  html: string
  js: string
  css: string
}

/**
 * A response when performing any field action.
 */
type FieldResponse = DeleteFieldResponse|EditFieldResponse|SaveFieldResponse

/**
 * A response when performing any POST request.
 */
type Response = FieldResponse|LoadResponse|SaveGroupResponse

export {
  Response,
  DeleteFieldResponse,
  EditFieldResponse,
  SaveFieldResponse,
  SaveGroupResponse,
  LoadResponse,
  LoadResponseData,
  Template
}
