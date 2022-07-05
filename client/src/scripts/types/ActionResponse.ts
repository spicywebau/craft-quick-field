interface ActionResponse {
  data: ActionResponseData
}

interface ActionResponseData {
  template?: any
  elementSelector?: string
  field?: any
  group?: any
  groups?: any
}

export { ActionResponse }
