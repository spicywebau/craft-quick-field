import * as $ from 'jquery'
import FieldModal from './FieldModal'
import GroupDialog from './GroupDialog'
import { Loader, LoaderInterface } from './Loader'
import { LoadResponseData } from './types/Response'
import Event from './types/Event'

interface QuickFieldInterface extends GarnishComponent {
  _groupObserver: MutationObserver
  _layouts: QuickFieldLayout[]
  dialog: any
  loader: LoaderInterface
  modal: any
  addFld: (fld: FieldLayoutDesigner) => void
  addFieldEditButtonListener: ($button: JQuery) => void
  openDeleteGroupDialog: ($group: JQuery) => void
  openRenameGroupDialog: ($group: JQuery) => void
  _newField: () => void
  _addField: (field: Field, elementSelector: string) => void
  _resetField: (field: Field, elementSelector: string) => void
  _removeField: (id: number) => void
  _addGroup: (group: Group, resetFldGroups: boolean) => void
  _removeGroup: (id: number) => void
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
  elementSelector: string
}

interface DeleteGroupEvent extends Event {
  id: number
}

interface SaveGroupEvent extends Event {
  group: Group
  oldName: string
}

class QuickFieldLayout {
  public $container
  public $groupButton
  public $fieldButton
  private readonly _groupObserver: MutationObserver

  constructor (private readonly _quickField: QuickFieldInterface, public fld: FieldLayoutDesigner) {
    this.fld.$container.addClass('quick-field')

    this.$container = $('<div class="newfieldbtn-container btngroup small fullwidth">').prependTo(fld.$fieldLibrary)
    this.$groupButton = $('<div class="btn small add icon" tabindex="0">').text(Craft.t('quick-field', 'New Group')).appendTo(this.$container)
    this.$fieldButton = $('<div class="btn small add icon" tabindex="0">').text(Craft.t('quick-field', 'New Field')).appendTo(this.$container)

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
    const addFieldEditButton: (_: number, field: HTMLElement) => void = (_, field) => this.addFieldEditButton($(field))

    // The fields on the sidebar
    this.fld.$fields.filter('.unused').each(addFieldEditButton)

    // The fields on tabs
    this.fld.$tabContainer.find('.fld-field[data-id]').each(addFieldEditButton)
  }

  /**
   * Creates field edit buttons.
   *
   * @param $field
   */
  public addFieldEditButton ($field: JQuery): void {
    const $button = $('<a class="qf-edit icon" title="Edit"></a>')
    this._quickField.addFieldEditButtonListener($button)
    $field.append($button)
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

    $field.remove()
    fld.$fields = $fields.not($field)
    fld.elementDrag.removeItems($field)
  }

  public resetField (field: Field, elementSelector: string): void {
    const fld = this.fld
    const $group = this._getGroupByName(field.group.name)

    // Remove the old element from the sidebar
    const $oldElement = fld.$fields.filter(`[data-id="${field.id}"]`)
    fld.elementDrag.removeItems($oldElement)
    $oldElement.remove()

    this._insertFieldElementIntoGroup(field, elementSelector, $group)
  }

  public addGroup (group: Group, resetFldGroups: boolean): void {
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
    this.addFieldEditButton($element)
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

  /**
   * The constructor.
   */
  init: function (this: QuickFieldInterface) {
    let fieldButtonAttached = true

    this._layouts = []
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
      this._removeGroup(e.id)

      this._layouts.forEach((layout) => {
        if (layout.fld.$fieldGroups.not('.hidden').length === 0) {
          layout.detachFieldButton()
          fieldButtonAttached = false
        }
      })
    })

    this.modal.on('newField', (e: SaveFieldEvent) => this._addField(e.field, e.elementSelector))
    this.modal.on('saveField', (e: SaveFieldEvent) => this._resetField(e.field, e.elementSelector))
    this.modal.on('deleteField', (e: FieldEvent) => this._removeField(e.field.id))
    this.modal.on('destroy', () => {
      this._layouts.forEach((layout) => layout.detachFieldButton())
      fieldButtonAttached = false
    })

    this.loader.on('load', (e: LoadResponseData) => {
      this.modal.$loadSpinner.addClass('hidden')
      this.modal.initTemplate(e.template)
      this._layouts.forEach((layout) => layout.addGroupIdData(e.groups))

      if (!fieldButtonAttached) {
        this._layouts.forEach((layout) => layout.$fieldButton.appendTo(layout.$container))
        fieldButtonAttached = true
      }
    })
    this.loader.on('unload', () => this.modal.destroy())
  },

  addFld: function (fld: FieldLayoutDesigner) {
    const newLayout = new QuickFieldLayout(this, fld)
    this._layouts.push(newLayout)
    this.addListener(newLayout.$groupButton, 'activate', '_newGroup')
    this.addListener(newLayout.$fieldButton, 'activate', '_newField')

    newLayout.addFieldEditButtons()
    newLayout.addGroupMenus()
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
   * @param elementSelector
   * @private
   */
  _addField: function (this: QuickFieldInterface, field: Field, elementSelector: string) {
    try {
      this._layouts.forEach((layout) => layout.addField(field, elementSelector))
    } catch (e) {
      Craft.cp.displayError(Craft.t('quick-field', e.message, { groupName: field.group.name }))
    }
  },

  /**
   * Removes a field from the field layout designer.
   *
   * @param id
   * @private
   */
  _removeField: function (this: QuickFieldInterface, id: number) {
    this._layouts.forEach((layout) => layout.removeField(id))
  },

  /**
   * Renames and regroups an existing field on the field layout designer.
   *
   * @param field
   * @param elementSelector
   * @private
   */
  _resetField: function (this: QuickFieldInterface, field: Field, elementSelector: string) {
    this._layouts.forEach((layout) => layout.resetField(field, elementSelector))
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
  _addGroup: function (this: QuickFieldInterface, group: Group, resetFldGroups: boolean) {
    this._layouts.forEach((layout) => layout.addGroup(group, resetFldGroups))

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
  _renameGroup: function (this: QuickFieldInterface, group: Group, oldName: string) {
    this._layouts.forEach((layout) => layout.renameGroup(group, oldName))

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
    const id = $group.data('id')
    this.dialog.deleteGroup(id)
  },

  /**
   * Removes a deleted field group, and any fields belonging to it.
   *
   * @param id
   * @private
   */
  _removeGroup: function (this: QuickFieldInterface, id: number) {
    this._layouts.forEach((layout) => layout.removeGroup(id))

    // Remove this group from the 'new field' group options
    this.modal.$html.find('#qf-group').children(`[value="${id}"]`).remove()
  }
})

export { QuickField, QuickFieldInterface }
