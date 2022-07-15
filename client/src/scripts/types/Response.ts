interface LoadResponse {
  data: LoadResponseData
}

interface LoadResponseData {
  template: Template
  groups: Group[]
}

interface DeleteFieldResponse {
  data: {
    field: Field
  }
}

interface EditFieldResponse {
  data: {
    field: Field
    template?: Template
  }
}

interface SaveFieldResponse {
  data: {
    field: Field
    elementSelectors: string
    selectorHtml: string
    template?: Template
  }
}
interface SaveGroupResponse {
  data: {
    group: Group
  }
}

interface Template {
  html: string
  js: string
  css: string
}

type FieldResponse = DeleteFieldResponse|EditFieldResponse|SaveFieldResponse
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
