import * as $ from 'jquery'
import { FieldModal, FieldModalInterface } from './FieldModal'
import { GroupDialog, GroupDialogInterface } from './GroupDialog'
import { Loader, LoaderInterface } from './Loader'
import { LoadResponseData } from './types/Response'
import Event from './types/Event'

interface QuickFieldInterface extends GarnishComponent {
  dialog: GroupDialogInterface
  loader: LoaderInterface
  modal: FieldModalInterface
  addFld: (fld: FieldLayoutDesigner) => void
  addFieldEditButton: ($button: JQuery) => void
  addFieldEditButtonListener: ($button: JQuery) => void
  openDeleteGroupDialog: ($group: JQuery) => void
  openRenameGroupDialog: ($group: JQuery) => void
}

interface QuickFieldPrivateInterface extends QuickFieldInterface {
  _groupObserver: MutationObserver
  _layouts: QuickFieldLayout[]
  _history: QuickFieldHistoryItemInterface[]
  _initialGroups: Group[]
  _newField: () => void
  _addField: (field: Field, elementSelectors: Record<string, string>) => void
  _resetField: (field: Field, elementSelectors: Record<string, string>, selectorHtml: string) => void
  _removeField: (field: Field) => void
  _addGroup: (group: Group, resetFldGroups: boolean) => void
  _removeGroup: (group: Group) => void
  _renameGroup: (group: Group, oldName: string) => void
  _addOptionToGroupSelect: ($option: JQuery, $select: JQuery, optionText: string) => void
}

interface OptionEvent extends Event {
  option: string
}

interface FieldEvent extends Event {
  field: Field
}

interface SaveFieldEvent extends FieldEvent {
  elementSelectors: Record<string, string>
  selectorHtml: string
}

interface DeleteGroupEvent extends Event {
  group: Group
}

interface SaveGroupEvent extends Event {
  group: Group
  oldName: string
}

interface QuickFieldHistoryItemInterface {
  action: QuickFieldHistoryAction
  component: Field|Group
  data?: QuickFieldHistoryItemData
}

interface QuickFieldHistoryFieldData {
  elementSelectors: Record<string, string>
  selectorHtml?: string
}

interface QuickFieldHistoryGroupData {
  oldName: string
}

type QuickFieldHistoryItemData = QuickFieldHistoryFieldData|QuickFieldHistoryGroupData

class QuickFieldHistoryItem implements QuickFieldHistoryItemInterface {
  private readonly _action: QuickFieldHistoryAction

  constructor (action: QuickFieldHistoryAction, public component: Field|Group, public data?: QuickFieldHistoryItemData) {
    this._action = action
  }

  get action (): QuickFieldHistoryAction {
    return this._action
  }
}

class QuickFieldHistoryFieldItem extends QuickFieldHistoryItem {
  constructor (action: QuickFieldHistoryAction, public component: Field, public data?: QuickFieldHistoryFieldData) {
    super(action, component, data)
  }
}

class QuickFieldHistoryGroupItem extends QuickFieldHistoryItem {
  constructor (action: QuickFieldHistoryAction, public component: Group, public data?: QuickFieldHistoryGroupData) {
    super(action, component, data)
  }
}

enum QuickFieldHistoryAction {
  ADD,
  EDIT,
  REMOVE
}

class QuickFieldLayout {
  public $container
  public $groupButton
  public $fieldButton
  private readonly _groupObserver: MutationObserver
  private _type: string
  private _replacePlaceholder: Record<number, Function>

  constructor (private readonly _quickField: QuickFieldInterface, public fld: FieldLayoutDesigner) {
    this.fld.$container.addClass('quick-field')

    this.$container = $('<div class="newfieldbtn-container btngroup small fullwidth">').prependTo(fld.$fieldLibrary)
    this.$groupButton = $('<div class="btn small add icon" tabindex="0">').text(Craft.t('quick-field', 'New Group')).appendTo(this.$container)
    this.$fieldButton = $('<div class="btn small add icon" tabindex="0">').text(Craft.t('quick-field', 'New Field')).appendTo(this.$container)
    this._replacePlaceholder = {}

    // Make sure the groups are never hidden, so they can always be renamed or deleted
    this._groupObserver = new window.MutationObserver(() => {
      this.fld.$fieldGroups
        .filter(function () {
          // Don't unhide e.g. the 'standard fields' group
          return ($(this).data('id')) ?? false
        })
        .removeClass('hidden')
    })
    this._groupObserver.observe(this.fld.$fieldLibrary[0], { attributes: true, childList: true, subtree: true })
  }

  public getType (): string {
    return this._type
  }

  public setType (type: string): void {
    this._type = type
  }

  public attachFieldButton (): void {
    this.$fieldButton.appendTo(this.$container)
  }

  public detachFieldButton (): void {
    this.$fieldButton.detach()
  }

  /**
   * Adds edit buttons to existing fields.
   */
  public addFieldEditButtons (): void {
    const addFieldEditButton: (_: number, field: HTMLElement) => void = (_, field) => this._quickField.addFieldEditButton($(field))

    // The fields on the sidebar
    this.fld.$fields.filter('.unused').each(addFieldEditButton)

    // The fields on tabs
    this.fld.$tabContainer.find('.fld-field[data-id]').each(addFieldEditButton)
  }

  /**
   * Creates field group rename/delete menus.
   *
   * @param $group
   * @private
   */
  public addGroupMenus (): void {
    this.fld.$fieldGroups.each((_: number, group: HTMLElement) => this._addGroupMenu($(group)))
  }

  private _addGroupMenu ($group: JQuery): void {
    const $button = $(`<button class="qf-settings icon menubtn" title="${Craft.t('quick-field', 'Settings')}" role="button" type="button"></button>`)
    const $menu = $(`
      <div class="menu">
        <ul class="padded">
          <li><a data-icon="edit" data-action="rename">${Craft.t('quick-field', 'Rename')}</a></li>
          <li><a class="error" data-icon="remove" data-action="delete">${Craft.t('quick-field', 'Delete')}</a></li>
        </ul>
      </div>
    `)
    $group.prepend($menu).prepend($button)
    const settingsMenu = new Garnish.MenuBtn($button)
    settingsMenu.on('optionSelect', (e: OptionEvent) => {
      switch ($(e.option).attr('data-action')) {
        case 'rename': this._quickField.openRenameGroupDialog($group); break
        case 'delete': this._quickField.openDeleteGroupDialog($group)
      }
    })
  }

  /**
   * Adds groups' ID data.
   *
   * @param groups
   */
  public addGroupIdData (groups: Group[]): void {
    // Loop through the groups in reverse so we don't have to reset `this.fld.$fieldGroups` every
    // time to get empty groups in the right place
    for (let i = groups.length - 1; i >= 0; i--) {
      const group = groups[i]
      let $group = this._getGroupByName(group.name)

      if ($group.length === 0) {
        this.addGroup(group, false)
        $group = this._getGroupByName(group.name)
      }

      $group.data('id', group.id)
    }

    this._resetFldGroups()
  }

  public addField (field: Field, elementSelector: string): void {
    // Make sure the field doesn't already exist in the FLD sidebar
    if (this.fld.$fields.filter(`.fld-field[data-id="${field.id}"]`).length > 0) {
      return
    }

    const $group = this._getGroupByName(field.group.name)

    if ($group !== null) {
      this._insertFieldElementIntoGroup(field, elementSelector, $group)
    } else {
      throw new Error('Invalid field group: {groupName}')
    }
  }

  public removeField (id: number): void {
    const selector = `.fld-field[data-id="${id}"]`
    const fld = this.fld
    const $fields = fld.$fields
    const $field = $fields.filter(selector).add(fld.$tabContainer.find(selector))

    if ($field.length > 0) {
      $field.remove()
      fld.$fields = $fields.not($field)
      fld.elementDrag.removeItems($field)
    }
  }

  public resetField (field: Field, elementSelector: string, selectorHtml: string): void {
    const fld = this.fld
    const $group = this._getGroupByName(field.group.name)

    // Remove the old element from the sidebar
    const $oldElement = fld.$fields.filter(`[data-id="${field.id}"]`)
    fld.elementDrag.removeItems($oldElement)
    $oldElement.remove()

    this._insertFieldElementIntoGroup(field, elementSelector, $group)
    this._updateFldField(field, selectorHtml)
  }

  private _updateFldField (field: Field, selectorHtml: string): void {
    const $fldField = this.fld.$tabContainer.find(`.fld-field[data-id="${field.id}"]`)

    if ($fldField.length === 0) {
      // The field isn't on the field layout, so there's nothing to update
      return
    }

    // Detach the required indicator before resetting the selector HTML, so we don't lose it
    const $requiredIndicator = $fldField.find('.fld-required-indicator').detach()
    const fldField = $fldField.data('fld-element')

    // Detach the settings button before resetting the selector HTML, so we don't lose the on click event
    // It will be reattached when calling `fldField.initUi()`
    fldField.$editBtn.detach()

    // Update the placeholder for the custom label in the settings if the field's been renamed
    // This also involves resetting the field's `createSettings` event, so if the field's settings slideout hasn't been
    // created yet, we can replace the placeholder with the correct field name when the slideout is created
    if (typeof this._replacePlaceholder[field.id] !== 'undefined') {
      fldField.off('createSettings.qf', this._replacePlaceholder[field.id])
    }

    this._replacePlaceholder[field.id] = function () {
      this.slideout?.$container
        .find('input[name$="[label]"')
        .attr('placeholder', field.name)
    }.bind(fldField)
    fldField.on('createSettings.qf', this._replacePlaceholder[field.id])
    this._replacePlaceholder[field.id]()

    // Now actually update the field
    $fldField
      .data('attribute', field.handle)
      .html($(selectorHtml).html())

    $requiredIndicator.appendTo($fldField.find('.fld-element-label'))
    fldField.initUi()
  }

  public addGroup (group: Group, resetFldGroups: boolean): void {
    // Make sure the group doesn't already exist in the FLD sidebar
    if (this._getGroupByName(group.name).length > 0) {
      return
    }

    const name = group.name
    const lowerCaseName = name.toLowerCase()
    const $newGroup = $(`
      <div class="fld-field-group" data-name="${lowerCaseName}">
        <h6>${name}</h6>
      </div>`)
    this._addGroupMenu($newGroup)
    this._attachGroup($newGroup, resetFldGroups)
    this._getGroupByName(group.name).data('id', group.id)
  }

  public renameGroup (group: Group, oldName: string): void {
    const $group = this._getGroupByName(oldName)

    if ($group.length > 0) {
      const newName = group.name
      const lowerCaseName = newName.toLowerCase()
      $group.detach()
        .attr('data-name', lowerCaseName)
        .data('name', lowerCaseName)
        .children('h6').text(newName)
      this._attachGroup($group, true)
    }
  }

  public removeGroup (id: number): void {
    const fld = this.fld
    const $deletedGroup = fld.$fieldGroups
      .filter(function () {
        return $(this).data('id') === id
      })

    // Remove any fields from this group from the tabs
    const $usedFields = $deletedGroup.find('.fld-field.hidden')
    const filterSelector = $usedFields.map((_: number, field: HTMLElement) => {
      const fieldId: string = $(field).data('id')
      return `[data-id="${fieldId}"]`
    }).get().join(',')
    fld.$tabContainer
      .find('.fld-field')
      .filter(filterSelector)
      .remove()

    $deletedGroup.remove()
    this._resetFldGroups()
  }

  /**
   * Inserts a field element into the correct position in its group.
   *
   * @param field
   * @param elementSelector
   * @param $group
   * @private
   */
  private _insertFieldElementIntoGroup (field: Field, elementSelector: string, $group: JQuery): void {
    const fld = this.fld
    const $element = $(elementSelector)
    const lowerCaseName = field.name.toLowerCase()
    let $prevElement = $group.children('.fld-element').filter(function () {
      return $(this).find('h4').text().toLowerCase() < lowerCaseName
    }).last()

    if ($prevElement.length === 0) {
      $prevElement = $group.children('h6')
    }

    $element.insertAfter($prevElement)
    fld.elementDrag.addItems($element)
    this._quickField.addFieldEditButton($element)
    fld.$fields = fld.$fieldGroups.children('.fld-element')
  }

  /**
   * Attaches a group to the correct position in the sidebar.
   *
   * @param $group
   * @param resetFldGroups
   * @private
   */
  private _attachGroup ($group: JQuery, resetFldGroups: boolean): void {
    const fld = this.fld
    const lowerCaseName = $group.attr('data-name') ?? ''
    let $prevElement = fld.$fieldGroups.filter(function () {
      const $this = $(this)
      return $this.hasClass('hidden') || $this.data('name') < lowerCaseName
    }).last()

    if ($prevElement.length === 0) {
      $prevElement = fld.$fieldSearch.parent()
    }

    $group.insertAfter($prevElement)

    if (resetFldGroups) {
      this._resetFldGroups()
    }
  }

  /**
   * Resets Craft's record of the field groups in the field layout designer sidebar.
   *
   * @private
   */
  private _resetFldGroups (): void {
    this.fld.$fieldGroups = this.fld.$sidebar.find('.fld-field-group')
  }

  /**
   * Finds the group element from its name.
   *
   * @param name
   * @returns {*}
   * @private
   */
  private _getGroupByName (name: string): JQuery {
    // Filtering `this.fld.$sidebar.find('.fld-field-group')` instead of `this.fld.$fieldGroups`, in
    // case we're adding groups and we haven't reset `this.fld.$fieldGroups` yet
    return this.fld.$sidebar.find('.fld-field-group').filter(`[data-name="${name.toLowerCase()}"]`)
  }
}

/**
 * QuickField class
 * Handles the buttons for creating new groups and fields inside a FieldLayoutDesigner
 */
const QuickField = Garnish.Base.extend({

  dialog: null,
  modal: null,
  loader: null,

  _layouts: null,
  _history: null,
  _initialGroups: null,

  /**
   * The constructor.
   */
  init: function (this: QuickFieldPrivateInterface) {
    let fieldButtonAttached = true

    this._layouts = []
    this._history = []
    this.dialog = new GroupDialog()
    this.modal = new FieldModal()
    this.loader = new Loader()

    this.dialog.on('newGroup', (e: SaveGroupEvent) => {
      const group = e.group
      this._addGroup(group, true)

      if (this.loader.isUnloaded()) {
        this.loader.load()
      } else if (!fieldButtonAttached) {
        this._layouts.forEach((layout) => layout.attachFieldButton())
        fieldButtonAttached = true
      }
    })

    this.dialog.on('renameGroup', (e: SaveGroupEvent) => this._renameGroup(e.group, e.oldName))
    this.dialog.on('deleteGroup', (e: DeleteGroupEvent) => {
      this._removeGroup(e.group)

      this._layouts.forEach((layout) => {
        if (layout.fld.$fieldGroups.not('.hidden').length === 0) {
          layout.detachFieldButton()
          fieldButtonAttached = false
        }
      })
    })

    this.modal.on('newField', (e: SaveFieldEvent) => this._addField(e.field, e.elementSelectors))
    this.modal.on('saveField', (e: SaveFieldEvent) => this._resetField(e.field, e.elementSelectors, e.selectorHtml))
    this.modal.on('deleteField', (e: FieldEvent) => this._removeField(e.field))
    this.modal.on('destroy', () => {
      this._layouts.forEach((layout) => layout.detachFieldButton())
      fieldButtonAttached = false
    })

    this.loader.on('load', (e: LoadResponseData) => {
      this.modal.$loadSpinner.addClass('hidden')
      this.modal.initTemplate(e.template)
      this._layouts.forEach((layout) => layout.addGroupIdData(e.groups))
      this._initialGroups = e.groups

      if (!fieldButtonAttached) {
        this._layouts.forEach((layout) => layout.$fieldButton.appendTo(layout.$container))
        fieldButtonAttached = true
      }
    })
    this.loader.on('unload', () => this.modal.destroy())
  },

  addFld: function (this: QuickFieldPrivateInterface, fld: FieldLayoutDesigner) {
    const newLayout = new QuickFieldLayout(this, fld)
    this._layouts.push(newLayout)
    this.addListener(newLayout.$groupButton, 'activate', '_newGroup')
    this.addListener(newLayout.$fieldButton, 'activate', '_newField')

    newLayout.addFieldEditButtons()
    newLayout.addGroupMenus()
    newLayout.addGroupIdData(this._initialGroups)

    // Get the field layout type from one of the UI elements' settings HTML
    const matches = fld.$uiLibraryElements
      .filter('[data-type="craft-fieldlayoutelements-Heading"]')
      .data('settings-html')
      .match(/elementType&quot;:&quot;([a-zA-Z\\]+)&quot;,&quot;sourceKey/g)
    const layoutType = matches[matches.length - 1].split('&quot;')[2].replaceAll('\\\\', '\\')
    this.modal.addLayoutType(layoutType)
    newLayout.setType(layoutType)

    // Update this FLD with any changes made so far
    this._history.forEach((item) => {
      if (item instanceof QuickFieldHistoryFieldItem) {
        switch (item.action) {
          case QuickFieldHistoryAction.ADD:
            newLayout.addField(item.component, item.data?.elementSelectors[layoutType] ?? '')
            break
          case QuickFieldHistoryAction.EDIT:
            newLayout.resetField(item.component, item.data?.elementSelectors[layoutType] ?? '', item.data?.selectorHtml ?? '')
            break
          case QuickFieldHistoryAction.REMOVE:
            newLayout.removeField(item.component.id)
        }
      } else if (item instanceof QuickFieldHistoryGroupItem) {
        switch (item.action) {
          case QuickFieldHistoryAction.ADD:
            newLayout.addGroup(item.component, true)
            break
          case QuickFieldHistoryAction.EDIT:
            newLayout.renameGroup(item.component, item.data?.oldName ?? '')
            break
          case QuickFieldHistoryAction.REMOVE:
            newLayout.removeGroup(item.component.id)
        }
      }
    })
  },

  /**
   * Creates field edit buttons.
   *
   * @param $field
   */
  addFieldEditButton: function ($field: JQuery): void {
    const $button = $('<a class="qf-edit icon" title="Edit"></a>')
    this.addFieldEditButtonListener($button)
    $field.append($button)
  },

  addFieldEditButtonListener: function ($button: JQuery): void {
    this.addListener($button, 'activate', '_editField')
  },

  /**
   * Event handler for the New Field button.
   * Creates a modal window that contains new field settings.
   *
   * @private
   */
  _newField: function () {
    this.modal.show()
  },

  /**
   * Event handler for the edit buttons on fields.
   * Opens a modal window that contains the field settings.
   *
   * @param e
   * @private
   */
  _editField: function (e: Event) {
    const $button = $(e.target)
    const $field = $button.parent()
    const id = $field.data('id')

    this.modal.editField(id)
  },

  /**
   * Adds a new unused (dashed border) field to the field layout designer.
   *
   * @param field
   * @param elementSelectors
   * @private
   */
  _addField: function (this: QuickFieldPrivateInterface, field: Field, elementSelectors: Record<string, string>) {
    try {
      this._layouts.forEach((layout) => {
        const layoutType = layout.getType()
        layout.addField(field, elementSelectors[layoutType])
      })
      this._history.push(new QuickFieldHistoryFieldItem(QuickFieldHistoryAction.ADD, field, { elementSelectors }))
    } catch (e) {
      Craft.cp.displayError(Craft.t('quick-field', e.message, { groupName: field.group.name }))
    }
  },

  /**
   * Removes a field from the field layout designer.
   *
   * @param field
   * @private
   */
  _removeField: function (this: QuickFieldPrivateInterface, field: Field) {
    this._layouts.forEach((layout) => layout.removeField(field.id))
    this._history.push(new QuickFieldHistoryFieldItem(QuickFieldHistoryAction.REMOVE, field))
  },

  /**
   * Renames and regroups an existing field on the field layout designer.
   *
   * @param field
   * @param elementSelectors
   * @param selectorHtml
   * @private
   */
  _resetField: function (this: QuickFieldPrivateInterface, field: Field, elementSelectors: Record<string, string>, selectorHtml: string) {
    this._layouts.forEach((layout) => {
      const layoutType = layout.getType()
      layout.resetField(field, elementSelectors[layoutType], selectorHtml)
    })
    this._history.push(new QuickFieldHistoryFieldItem(QuickFieldHistoryAction.EDIT, field, { elementSelectors, selectorHtml }))
  },

  /**
   * Event listener for the new group button
   *
   * @private
   */
  _newGroup: function () {
    this.dialog.addNewGroup()
  },

  /**
   * Adds a new unused group to the field layout designer sidebar.
   *
   * @param group
   * @param resetFldGroups
   * @private
   */
  _addGroup: function (this: QuickFieldPrivateInterface, group: Group, resetFldGroups: boolean) {
    this._layouts.forEach((layout) => layout.addGroup(group, resetFldGroups))
    this._history.push(new QuickFieldHistoryGroupItem(QuickFieldHistoryAction.ADD, group))

    // Add this group to the 'new field' group options if the modal's already been loaded
    if (this.modal.$html !== null) {
      this._addOptionToGroupSelect(
        $(`<option value="${group.id}">${group.name}</option>`),
        this.modal.$html.find('#qf-group'),
        group.name
      )
    }
  },

  /**
   * Opens the field group dialog for renaming a group.
   *
   * @param $group
   */
  openRenameGroupDialog: function ($group: JQuery) {
    const id = $group.data('id')
    const oldName = $group.children('h6').text()
    this.dialog.renameGroup(id, oldName)
  },

  /**
   * Renames a field group.
   *
   * @param group
   * @param oldName
   * @private
   */
  _renameGroup: function (this: QuickFieldPrivateInterface, group: Group, oldName: string) {
    this._layouts.forEach((layout) => layout.renameGroup(group, oldName))
    this._history.push(new QuickFieldHistoryGroupItem(QuickFieldHistoryAction.EDIT, group, { oldName }))

    // Update this group in the 'new field' group options
    const $select = this.modal.$html.find('#qf-group')
    const $options = $select.children()
    const $option = $options.filter(function () {
      return $(this).text() === oldName
    }).detach().text(group.name)
    this._addOptionToGroupSelect($option, $select, group.name)
  },

  /**
   * Adds a field group option to the new field template.
   *
   * @param $option
   * @param $select
   * @param optionText
   * @private
   */
  _addOptionToGroupSelect: function ($option: JQuery, $select: JQuery, optionText: string) {
    const $prevOption = $select.children().filter(function () {
      return $(this).text().toLowerCase() < optionText.toLowerCase()
    }).last()

    if ($prevOption.length > 0) {
      $option.insertAfter($prevOption)
    } else {
      $option.prependTo($select)
    }
  },

  /**
   * Opens the field group dialog for deleting a group.
   *
   * @param $group
   */
  openDeleteGroupDialog: function ($group: JQuery) {
    const group = {
      id: $group.data('id'),
      name: $group.children('h6').text()
    }
    this.dialog.deleteGroup(group)
  },

  /**
   * Removes a deleted field group, and any fields belonging to it.
   *
   * @param group Group
   * @private
   */
  _removeGroup: function (this: QuickFieldPrivateInterface, group: Group) {
    this._layouts.forEach((layout) => layout.removeGroup(group.id))
    this._history.push(new QuickFieldHistoryGroupItem(QuickFieldHistoryAction.REMOVE, group))

    // Remove this group from the 'new field' group options
    this.modal.$html.find('#qf-group').children(`[value="${group.id}"]`).remove()
  }
})

export { QuickField, QuickFieldInterface }
