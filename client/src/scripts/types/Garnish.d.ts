/**
 * An instance of Garnish.
 */
declare const Garnish: {
  MenuBtn: new(btn: JQuery) => GarnishComponent
  $bod: JQuery
  $doc: JQuery
  Base: any
  Modal: any
  shake: (elem: JQuery) => void
}

/**
 * An interface representing a Garnish component.
 */
declare interface GarnishComponent {
  addListener: (elem: HTMLElement|JQuery, events: string|string[], data: object|Function|string, func?: Function|string) => void
  base: () => void
  destroy: () => void
  extend: (source: object, value?: object) => GarnishComponent
  off: (events: string, handler: Function) => void
  on: (events: string, handler: Function) => void
  trigger: (type: string, data: object) => void
}

/**
 * An interface representing a Garnish modal.
 */
declare interface GarnishModal extends GarnishComponent {
  _disabled: boolean
  $container: JQuery
  visible: boolean
  hide: () => void
}
