import * as $ from 'jquery'
import FieldModal from './FieldModal'
import GroupDialog from './GroupDialog'
import { Loader, LoaderInterface } from './Loader'
import { ActionResponseData } from './types/ActionResponse'
import Event from './types/Event'

interface QuickFieldInterface extends GarnishComponent {
  _groupObserver: MutationObserver
  $container: JQuery
  $fieldButton: JQuery
  $groupButton: JQuery
  fld: FieldLayoutDesigner
  dialog: any
  loader: LoaderInterface
  modal: any
  _getGroupByName: (name: string) => JQuery
  _initGroups: (groups: Group[]) => void
  addField: (field: Field, elementSelector: string) => void
  resetField: (field: Field, elementSelector: string) => void
  removeField: (id: number) => void
  addGroup: (group: Group, resetFldGroups: boolean) => void
  removeGroup: (id: number) => void
  renameGroup: (group: Group, oldName: string) => void
  initButtons: () => void
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

/**
 * QuickField class
 * Handles the buttons for creating new groups and fields inside a FieldLayoutDesigner
 */
const QuickField = Garnish.Base.extend({

  $container: null,
  $groupButton: null,
  $fieldButton: null,
  $settings: null,

  fld: null,
  dialog: null,
  modal: null,

  /**
     * The constructor.
     *
     * @param fld - An instance of Craft.FieldLayoutDesigner
     */
  init: function (this: QuickFieldInterface, fld: FieldLayoutDesigner) {
    this.fld = fld
    this.fld.$container.addClass('quick-field')

    this.$container = $('<div class="newfieldbtn-container btngroup small fullwidth">').prependTo(fld.$fieldLibrary)
    this.$groupButton = $('<div class="btn small add icon" tabindex="0">').text(Craft.t('quick-field', 'New Group')).appendTo(this.$container)
    this.$fieldButton = $('<div class="btn small add icon" tabindex="0">').text(Craft.t('quick-field', 'New Field')).appendTo(this.$container)
    let fieldButtonAttached = true

    this.initButtons()

    this.dialog = new GroupDialog()
    this.modal = new FieldModal()
    this.loader = new Loader()

    this.addListener(this.$groupButton, 'activate', 'newGroup')
    this.addListener(this.$fieldButton, 'activate', 'newField')

    this.dialog.on('newGroup', (e: SaveGroupEvent) => {
      const group = e.group
      this.addGroup(group, true)
      this._getGroupByName(group.name).data('id', e.group.id)

      if (this.loader.isUnloaded()) {
        this.loader.load()
      } else if (!fieldButtonAttached) {
        this.$fieldButton.appendTo(this.$container)
        fieldButtonAttached = true
      }
    })

    this.dialog.on('renameGroup', (e: SaveGroupEvent) => this.renameGroup(e.group, e.oldName))
    this.dialog.on('deleteGroup', (e: DeleteGroupEvent) => {
      this.removeGroup(e.id)

      if (this.fld.$fieldGroups.not('.hidden').length === 0) {
        this.$fieldButton.detach()
        fieldButtonAttached = false
      }
    })

    this.modal.on('newField', (e: SaveFieldEvent) => this.addField(e.field, e.elementSelector))
    this.modal.on('saveField', (e: SaveFieldEvent) => this.resetField(e.field, e.elementSelector))
    this.modal.on('deleteField', (e: FieldEvent) => this.removeField(e.field.id))
    this.modal.on('destroy', () => {
      this.$fieldButton.detach()
      fieldButtonAttached = false
    })

    this.loader.on('load', (e: ActionResponseData) => {
      this.modal.$loadSpinner.addClass('hidden')
      this.modal.initTemplate(e.template)
      this._initGroups(e.groups)

      if (!fieldButtonAttached) {
        this.$fieldButton.appendTo(this.$container)
        fieldButtonAttached = true
      }
    })
    this.loader.on('unload', () => this.modal.destroy())

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
  },

  /**
     * Initialises groups with ID data.
     *
     * @param groups
     * @private
     */
  _initGroups: function (groups: Group[]) {
    // Loop through the groups in reverse so we don't have to reset `fld.$fieldGroups` every
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
  },

  /**
     * Adds edit buttons to existing fields.
     */
  initButtons: function () {
    const $groups = this.fld.$fieldGroups
    const $fields = this.fld.$fields.filter('.unused')

    $groups.each((_: number, group: HTMLElement) => this._addGroupMenu($(group)))
    $fields.each((_: number, field: HTMLElement) => this._addFieldButton($(field)))
  },

  /**
     * Creates field group rename/delete menus.
     *
     * @param $group
     * @private
     */
  _addGroupMenu: function ($group: JQuery) {
    const $button = $('<button class="qf-settings icon menubtn" title="' + Craft.t('quick-field', 'Settings') + '" role="button" type="button"></button>')
    const $menu = $([
      '<div class="menu">',
      '<ul class="padded">',
      '<li><a data-icon="edit" data-action="rename">', Craft.t('quick-field', 'Rename'), '</a></li>',
      '<li><a class="error" data-icon="remove" data-action="delete">', Craft.t('quick-field', 'Delete'), '</a></li>',
      '</ul>',
      '</div>'
    ].join(''))
    $group.prepend($menu).prepend($button)

    const settingsMenu = new Garnish.MenuBtn($button)
    settingsMenu.on('optionSelect', (e: OptionEvent) => {
      switch ($(e.option).attr('data-action')) {
        case 'rename': this._openRenameGroupDialog($group); break
        case 'delete': this._openDeleteGroupDialog($group)
      }
    })
  },

  /**
     * Creates field edit buttons.
     *
     * @param $field
     * @private
     */
  _addFieldButton: function ($field: JQuery) {
    const $button = $('<a class="qf-edit icon" title="Edit"></a>')
    this.addListener($button, 'activate', 'editField')
    $field.prepend($button)
  },

  /**
     * Event handler for the New Field button.
     * Creates a modal window that contains new field settings.
     */
  newField: function () {
    this.modal.show()
  },

  /**
     * Event handler for the edit buttons on fields.
     * Opens a modal window that contains the field settings.
     *
     * @param e
     */
  editField: function (e: Event) {
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
     */
  addField: function (field: Field, elementSelector: string) {
    const $group = this._getGroupByName(field.group.name)

    if ($group !== null) {
      this._insertFieldElementIntoGroup(field, $(elementSelector), $group)
    } else {
      Craft.cp.displayError(Craft.t('quick-field', 'Invalid field group: {groupName}', { groupName: field.group.name }))
    }
  },

  /**
     * Inserts a field element into the correct position in its group.
     *
     * @param field
     * @param $element
     * @param $group
     * @private
     */
  _insertFieldElementIntoGroup: function (field: Field, $element: JQuery, $group: JQuery) {
    const fld = this.fld
    const lowerCaseName = field.name.toLowerCase()
    let $prevElement = $group.children('.fld-element').filter(function () {
      return $(this).find('h4').text().toLowerCase() < lowerCaseName
    }).last()

    if ($prevElement.length === 0) {
      $prevElement = $group.children('h6')
    }

    $element.insertAfter($prevElement)
    fld.elementDrag.addItems($element)
    this._addFieldButton($element)
    fld.$fields = fld.$fieldGroups.children('.fld-element')
  },

  /**
     * Removes a field from the field layout designer.
     *
     * @param id
     */
  removeField: function (id: number) {
    const fld = this.fld
    const $fields = fld.$fields
    const $field = $fields.filter(`.fld-field[data-id="${id}"]`)

    $field.remove()
    fld.$fields = $fields.not($field)
    fld.elementDrag.removeItems($field)
  },

  /**
     * Renames and regroups an existing field on the field layout designer.
     *
     * @param field
     * @param elementSelector
     */
  resetField: function (field: Field, elementSelector: string) {
    const fld = this.fld
    const $group = this._getGroupByName(field.group.name)

    // Remove the old element from the sidebar
    const $oldElement = fld.$fields.filter(`[data-id="${field.id}"]`)
    fld.elementDrag.removeItems($oldElement)
    $oldElement.remove()

    this._insertFieldElementIntoGroup(field, $(elementSelector), $group)
  },

  /**
     * Event listener for the new group button
     */
  newGroup: function () {
    this.dialog.addNewGroup()
  },

  /**
     * Adds a new unused group to the field layout designer sidebar.
     *
     * @param group
     * @param resetFldGroups
     */
  addGroup: function (group: Group, resetFldGroups: boolean) {
    const name = group.name
    const lowerCaseName = name.toLowerCase()
    const $newGroup = $([
      '<div class="fld-field-group" data-name="', lowerCaseName, '">',
      '<h6>', name, '</h6>',
      '</div>'
    ].join(''))
    this._addGroupMenu($newGroup)
    this._attachGroup($newGroup, resetFldGroups)

    // Add this group to the 'new field' group options if the modal's already been loaded
    if (this.modal.$html !== null) {
      this._addOptionToGroupSelect(
        $(`<option value="${group.id}">${name}</option>`),
        this.modal.$html.find('#qf-group'),
        name
      )
    }
  },

  /**
     * Opens the field group dialog for renaming a group.
     *
     * @param $group
     * @private
     */
  _openRenameGroupDialog: function ($group: JQuery) {
    const id = $group.data('id')
    const oldName = $group.children('h6').text()
    this.dialog.renameGroup(id, oldName)
  },

  /**
     * Renames a field group.
     *
     * @param group
     * @param oldName
     */
  renameGroup: function (group: Group, oldName: string) {
    const $group = this._getGroupByName(oldName)
    const newName = group.name

    if ($group.length > 0) {
      const lowerCaseName = newName.toLowerCase()
      $group.detach()
        .attr('data-name', lowerCaseName)
        .data('name', lowerCaseName)
        .children('h6').text(newName)
      this._attachGroup($group, true)
    }

    // Update this group in the 'new field' group options
    const $select = this.modal.$html.find('#qf-group')
    const $options = $select.children()
    const $option = $options.filter(function () {
      return $(this).text() === oldName
    }).detach().text(newName)
    this._addOptionToGroupSelect($option, $select, newName)
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
     * @private
     */
  _openDeleteGroupDialog: function ($group: JQuery) {
    const id = $group.data('id')
    this.dialog.deleteGroup(id)
  },

  /**
     * Removes a deleted field group, and any fields belonging to it.
     *
     * @param id
     */
  removeGroup: function (id: number) {
    const fld = this.fld
    const $deletedGroup = fld.$fieldGroups
      .filter(function () {
        return $(this).data('id') === id
      })

    // Remove any fields from this group from the tabs
    const $usedFields = $deletedGroup.find('.fld-field.hidden')
    const filterSelector = $usedFields.map((_: number, $field: JQuery) => {
      const fieldId: string = $field.data('id')
      return `[data-id="${fieldId}"]`
    }).get().join(',')
    fld.$tabContainer
      .find('.fld-field')
      .filter(filterSelector)
      .remove()

    $deletedGroup.remove()
    this._resetFldGroups()

    // Remove this group from the 'new field' group options
    this.modal.$html.find('#qf-group').children(`[value="${id}"]`).remove()
  },

  /**
     * Attaches a group to the correct position in the sidebar.
     *
     * @param $group
     * @param resetFldGroups
     * @private
     */
  _attachGroup: function ($group: JQuery, resetFldGroups: boolean) {
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
  },

  /**
     * Resets Craft's record of the field groups in the field layout designer sidebar.
     *
     * @private
     */
  _resetFldGroups: function () {
    this.fld.$fieldGroups = this.fld.$sidebar.find('.fld-field-group')
  },

  /**
     * Finds the group element from its name.
     *
     * @param name
     * @returns {*}
     * @private
     */
  _getGroupByName: function (name: string): JQuery {
    // Filtering `this.fld.$sidebar.find('.fld-field-group')` instead of `this.fld.$fieldGroups`, in case we're
    // adding groups and we haven't reset `this.fld.$fieldGroups` yet
    return this.fld.$sidebar.find('.fld-field-group').filter(`[data-name="${name.toLowerCase()}"]`)
  }
})

export { QuickField, QuickFieldInterface }
