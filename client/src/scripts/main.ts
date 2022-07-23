import { QuickField, QuickFieldInterface } from './QuickField'
import '../styles/main.scss'

declare global {
  interface Window {
    QuickField: QuickFieldInterface
  }
}

window.QuickField = new QuickField()
const FLD = Craft.FieldLayoutDesigner
const FLDinit = FLD.prototype.init
const FLDElement = FLD.Element
const FLDElementInitUi = FLDElement.prototype.initUi

/**
 * Overrides the current FieldLayoutDesigner 'constructor' so new buttons can be initialised.
 */
FLD.prototype.init = function (this: FieldLayoutDesigner) {
  FLDinit.apply(this, arguments)

  if (this.$container.is('.layoutdesigner')) {
    window.QuickField.addFld(this)
  }
}

/**
 * Overrides the current FieldLayoutDesigner.Element.initUi() so field edit buttons can be initialised.
 */
FLDElement.prototype.initUi = function (this: FldElement) {
  FLDElementInitUi.apply(this, arguments)

  if (this.$container.is('.fld-field[data-id]')) {
    const $editButton = this.$container.find('.qf-edit')

    if ($editButton.length > 0) {
      window.QuickField.addFieldEditButtonListener($editButton)
    } else {
      window.QuickField.addFieldEditButton(this.$container)
    }
  }
}
