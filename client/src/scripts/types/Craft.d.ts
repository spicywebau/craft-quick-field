declare const Craft: {
  FieldLayoutDesigner: FieldLayoutDesigner
  cp: Cp
  initUiElements: () => void
  sendActionRequest: (method: string, action: string, options?: object) => Promise<import('./ActionResponse').ActionResponse>
  t: (category: string, message: string, params?: object) => string
}

interface Cp {
  displayError: (message: string) => void
  displayNotice: (message: string) => void
}

interface FieldLayoutDesigner {
  $container: JQuery
  $fieldGroups: JQuery
  $fieldLibrary: JQuery
  $fieldSearch: JQuery
  $fields: JQuery
  $sidebar: JQuery
  $tabContainer: JQuery
  elementDrag: ElementDrag
  prototype: FldPrototype
}

interface ElementDrag {
  addItems: (items: JQuery) => void
  removeItems: (items: JQuery) => void
}

interface FldPrototype {
  init: (container: JQuery, settings: object) => void
}
