import { QuickField, QuickFieldInterface } from './QuickField'
import '../styles/main.scss'

declare global {
  interface Window {
    QuickField: QuickFieldInterface
  }
}

const FLD = Craft.FieldLayoutDesigner
const FLDinit = FLD.prototype.init

/**
 * Override the current FieldLayoutDesigner "constructor" so new buttons can be initialised.
 */
FLD.prototype.init = function () {
  FLDinit.apply(this, arguments)

  if (this.$container.is('.layoutdesigner') === true) {
    window.QuickField = new QuickField(this)
  }
}
