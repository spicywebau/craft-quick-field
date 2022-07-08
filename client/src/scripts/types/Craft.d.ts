declare const Craft: {
  FieldLayoutDesigner: FieldLayoutDesigner
  cp: Cp
  initUiElements: () => void
  sendActionRequest: (method: string, action: string, options?: object) => Promise<import('./Response').Response>
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
  Element: FldElement
  elementDrag: ElementDrag
  prototype: FldPrototype
}

interface FldElement {
  $container: JQuery
  prototype: {
    initUi: () => void
  }
}

interface ElementDrag {
  addItems: (items: JQuery) => void
  removeItems: (items: JQuery) => void
}

interface FldPrototype {
  init: (container: JQuery, settings: object) => void
}

type Field = Readonly<{
  group: Group
  id: number
  name: string
  handle: string
  instructions: string
  translationMethod: string
  translationKeyFormat: string
}>

type Group = Readonly<{
  id: number
  name: string
}>
