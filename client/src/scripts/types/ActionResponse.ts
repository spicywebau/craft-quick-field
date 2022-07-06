interface ActionResponse {
  data: ActionResponseData
}

interface ActionResponseData {
  template?: TemplateResponse
  elementSelector?: string
  field?: any
  group?: any
  groups?: any
}

interface TemplateResponse {
  html: string
  js: string
  css: string
}

export { ActionResponse, ActionResponseData, TemplateResponse }
