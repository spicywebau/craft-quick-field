declare const Garnish: {
  MenuBtn: new(btn: JQuery) => any
  $bod: JQuery
  $doc: JQuery
  Base: any
  Modal: any
  shake: (elem: JQuery) => void
}

declare interface GarnishComponent {
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
