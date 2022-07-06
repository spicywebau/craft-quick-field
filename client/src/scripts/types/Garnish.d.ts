declare const Garnish: {
  MenuBtn: new(btn: JQuery) => any
  $bod: JQuery
  $doc: JQuery
  Base: any
  Modal: any
  shake: (elem: JQuery) => void
}

declare interface GarnishComponent {
  addListener: (elem: HTMLElement|JQuery, events: string|string[], data: object|Function|string, func?: Function|string) => void
  extend: (source: object, value?: object) => GarnishComponent
  new: () => GarnishComponent
  off: (events: string, handler: Function) => void
  on: (events: string, handler: Function) => void
  trigger: (type: string, data: object) => void
}

declare interface GarnishModal extends GarnishComponent {
  _disabled: boolean
  $container: JQuery
  visible: boolean
  hide: () => void
}
