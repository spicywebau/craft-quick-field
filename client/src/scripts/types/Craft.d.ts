/**
 * An instance of Craft.
 */
declare const Craft: {
  FieldLayoutDesigner: FieldLayoutDesigner
  cp: Cp
  initUiElements: () => void
  sendActionRequest: (method: string, action: string, options?: object) => Promise<import('./Response').Response>
  t: (category: string, message: string, params?: object) => string
}

/**
 * An interface for Craft control panel functionality.
 */
interface Cp {
  displayError: (message: string) => void
  displayNotice: (message: string) => void
}

/**
 * A Craft field layout designer.
 */
interface FieldLayoutDesigner {
  $container: JQuery
  $fieldGroups: JQuery
  $fieldLibrary: JQuery
  $fieldSearch: JQuery
  $fields: JQuery
  $sidebar: JQuery
  $tabContainer: JQuery
  $uiLibraryElements: JQuery
  Element: FldElement
  elementDrag: ElementDrag
  prototype: FldPrototype
}

/**
 * A Craft field layout designer element.
 */
interface FldElement {
  $container: JQuery
  prototype: {
    initUi: () => void
  }
}

/**
 * An interface for a Craft field layout designer's element drag functionality.
 */
interface ElementDrag {
  addItems: (items: JQuery) => void
  removeItems: (items: JQuery) => void
}

/**
 * A Craft field layout designer prototype.
 */
interface FldPrototype {
  init: (container: JQuery, settings: object) => void
}

/**
 * A Craft field.
 */
interface Field {
  group: Group
  id: number
  name: string
  handle: string
  instructions: string
  translationMethod: string
  translationKeyFormat: string
}

/**
 * A Craft field group.
 */
interface Group {
  id: number
  name: string
}
