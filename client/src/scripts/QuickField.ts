import * as $ from 'jquery'
import { FieldModal, FieldModalInterface } from './FieldModal'
import { GroupDialog, GroupDialogInterface } from './GroupDialog'
import { Loader, LoaderInterface } from './Loader'
import { LoadResponseData } from './types/Response'
import Event from './types/Event'

/**
 * An interface representing a `QuickField`.
 */
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

/**
 * An interface representing a `QuickField`, for private use.
 */
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

/**
 * An event that is triggered when a group settings menu option is selected.
 */
interface OptionEvent extends Event {
  option: string
}

/**
 * An event that is triggered when a field action occurs.
 */
interface FieldEvent extends Event {
  field: Field
}

/**
 * An event that is triggered when a field is saved.
 */
interface SaveFieldEvent extends FieldEvent {
  elementSelectors: Record<string, string>
  selectorHtml: string
}

/**
 * An event that is triggered when a field group is deleted.
 */
interface DeleteGroupEvent extends Event {
  group: Group
}

/**
 * An event that is triggered when a field group is saved.
 */
interface SaveGroupEvent extends Event {
  group: Group
  oldName: string
}

/**
 * An action that has occurred in the history of a `QuickField` instance.
 */
interface QuickFieldHistoryItemInterface {
  action: QuickFieldHistoryAction
  component: Field|Group
  data?: QuickFieldHistoryItemData
}

/**
 * Field data for a Quick Field history action.
 */
interface QuickFieldHistoryFieldData {
  elementSelectors: Record<string, string>
  selectorHtml?: string
}

/**
 * Group data for a Quick Field history action.
 */
interface QuickFieldHistoryGroupData {
  oldName: string
}

/**
 * Data for a Quick Field history action.
 */
type QuickFieldHistoryItemData = QuickFieldHistoryFieldData|QuickFieldHistoryGroupData

/**
 * A Quick Field history action.
 */
class QuickFieldHistoryItem implements QuickFieldHistoryItemInterface {
  private readonly _action: QuickFieldHistoryAction

  constructor (action: QuickFieldHistoryAction, public component: Field|Group, public data?: QuickFieldHistoryItemData) {
    this._action = action
  }

  get action (): QuickFieldHistoryAction {
    return this._action
  }
}

/**
 * A Quick Field history action on a field.
 */
class QuickFieldHistoryFieldItem extends QuickFieldHistoryItem {
  constructor (action: QuickFieldHistoryAction, public component: Field, public data?: QuickFieldHistoryFieldData) {
    super(action, component, data)
  }
}

/**
 * A Quick Field history action on a group.
 */
class QuickFieldHistoryGroupItem extends QuickFieldHistoryItem {
  constructor (action: QuickFieldHistoryAction, public component: Group, public data?: QuickFieldHistoryGroupData) {
    super(action, component, data)
  }
}

/**
 * The kind of Quick Field history action that occurred.
 */
enum QuickFieldHistoryAction {
  ADD,
  EDIT,
  REMOVE
}

/**
 * A container for managing Quick Field features on a field layout.
 */
class QuickFieldLayout {
  /**
   * The container for the new group/field buttons.
   * @public
   */
  public $container

  /**
   * The new group button.
   * @public
   */
  public $groupButton

  /**
   * The new field button.
   * @public
   */
  public $fieldButton

  /**
   * The observer for changes to groups.
   * @private
   */
  private readonly _groupObserver: MutationObserver

  /**
   * The observer for changes to groups.
   * @private
   */
  private _type: string

  /**
   * Functions for replacing placeholder text in the field layout element sidebar.
   * @private
   */
  private _replacePlaceholder: Record<number, Function>

  /**
   * The constructor.
   * @param _quickField - The Quick Field instance.
   * @param fld - A field layout designer to initialise for usage with Quick Field.
   * @public
   */
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

  /**
   * Gets the type of this `QuickFieldLayout` instance's field layout.
   * @returns the field layout type.
   * @public
   */
  public getType (): string {
    return this._type
  }

  /**
   * Sets the type of this `QuickFieldLayout` instance's field layout.
   * @public
   */
  public setType (type: string): void {
    this._type = type
  }

  /**
   * Attaches the 'new field' button to the button container.
   * @public
   */
  public attachFieldButton (): void {
    this.$fieldButton.appendTo(this.$container)
  }

  /**
   * Detaches the 'new field' button from the button container.
   * @public
   */
  public detachFieldButton (): void {
    this.$fieldButton.detach()
  }

  /**
   * Adds edit buttons to existing fields.
   * @public
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
   * @public
   */
  public addGroupMenus (): void {
    this.fld.$fieldGroups.each((_: number, group: HTMLElement) => this._addGroupMenu($(group)))
  }

  /**
   * Creates a field group rename/delete menu.
   * @param $group - A jQuery object representing the group to create a menu for
   * @private
   */
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
   * @param groups - The groups to have their ID data added to their respective sidebar elements.
   * @public
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

  /**
   * Adds a field to the field layout designer.
   * @param field - The field to add
   * @param elementSelector - The element selector for the field
   * @public
   */
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

  /**
   * Removes a field from the field layout designer.
   * @param id - The ID of the field to remove
   * @public
   */
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

  /**
   * Renames and regroups an existing field on the field layout designer.
   * @param field - The field to reset
   * @param elementSelector - The element selector to use on the field layout sidebar
   * @param selectorHtml - The selector HTML to replace the existing selector HTML, if the field is on a field layout
   * @public
   */
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

  /**
   * Updates a field on the field layout.
   * @param field - The field to update
   * @param selectorHtml - The selector HTML to replace the existing selector HTML
   * @private
   */
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

  /**
   * Adds a group to the field layout sidebar.
   * @param group - The group to add.
   * @param resetFldGroups - Whether to reset the field layout designer's record of existing field groups
   * @public
   */
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

  /**
   * Renames a field group on the field layout sidebar.
   * @param group - The group to rename
   * @param oldName - The group's previous name
   * @public
   */
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

  /**
   * Removes a group from the field layout sidebar, along with all of its fields.
   * @param id - The ID of the group to remove
   * @public
   */
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
   * @param field - The field to insert into the correct position
   * @param elementSelector - The element selector to use on the field layout sidebar
   * @param $group - A jQuery object representing the group to insert the field into
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
   * Attaches a group to the correct position in the field layout sidebar.
   * @param $group - A jQuery object representing the group to attach
   * @param resetFldGroups - Whether to reset the field layout designer's record of existing field groups
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
   * @private
   */
  private _resetFldGroups (): void {
    this.fld.$fieldGroups = this.fld.$sidebar.find('.fld-field-group')
  }

  /**
   * Finds the group element from its name.
   * @param name - The name of the group to find
   * @returns A JQuery object representing the found group
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
 * Handles the buttons for creating new groups and fields inside a FieldLayoutDesigner.
 */
const QuickField = Garnish.Base.extend({

  dialog: null,
  modal: null,
  loader: null,

  _layouts: null,
  _history: null,
  _initialGroups: null,

  /**
   * The QuickField constructor.
   * @public
   */
  init (this: QuickFieldPrivateInterface): void {
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

  /**
   * Adds a field layout designer to be initialised for use by Quick Field.
   * @param fld - The field layout designer to add
   * @public
   */
  addFld (this: QuickFieldPrivateInterface, fld: FieldLayoutDesigner): void {
    const newLayout = new QuickFieldLayout(this, fld)
    this._layouts.push(newLayout)
    this.addListener(newLayout.$groupButton, 'activate', '_newGroup')
    this.addListener(newLayout.$fieldButton, 'activate', '_newField')

    newLayout.addFieldEditButtons()
    newLayout.addGroupMenus()

    if (this._initialGroups !== null) {
      newLayout.addGroupIdData(this._initialGroups)
    }

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
   * Creates field edit buttons and attaches them to the field.
   * @param $field - A jQuery object representing the field to add an edit button to
   * @public
   */
  addFieldEditButton ($field: JQuery): void {
    const $button = $('<a class="qf-edit icon" title="Edit"></a>')
    this.addFieldEditButtonListener($button)
    $field.append($button)
  },

  /**
   * Adds a listener to a field edit button.
   * @param $button - A jQuery object representing the field edit button
   * @public
   */
  addFieldEditButtonListener ($button: JQuery): void {
    this.addListener($button, 'activate', '_editField')
  },

  /**
   * Event handler for the New Field button.
   * Creates a modal window that contains new field settings.
   * @private
   */
  _newField (): void {
    this.modal.show()
  },

  /**
   * Event handler for the edit buttons on fields.
   * Opens a modal window that contains the field settings.
   * @param e - The event
   * @private
   */
  _editField (e: Event): void {
    const $button = $(e.target)
    const $field = $button.parent()
    const id = $field.data('id')

    this.modal.editField(id)
  },

  /**
   * Adds a new unused field to the field layout designers.
   * @param field - The field to add
   * @param elementSelectors - The element selectors to use on the field layouts, depending on the layout types
   * @private
   */
  _addField (this: QuickFieldPrivateInterface, field: Field, elementSelectors: Record<string, string>): void {
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
   * Removes a field from the field layout designers.
   * @param field - The field to remove
   * @private
   */
  _removeField (this: QuickFieldPrivateInterface, field: Field): void {
    this._layouts.forEach((layout) => layout.removeField(field.id))
    this._history.push(new QuickFieldHistoryFieldItem(QuickFieldHistoryAction.REMOVE, field))
  },

  /**
   * Renames and regroups an existing field on the field layout designers.
   * @param field - The field to reset
   * @param elementSelectors - The element selectors to use on the field layout sidebars, depending on the layout types
   * @param selectorHtml - The selector HTML to replace the existing selector HTML, if the field is on a field layout
   * @private
   */
  _resetField (this: QuickFieldPrivateInterface, field: Field, elementSelectors: Record<string, string>, selectorHtml: string): void {
    this._layouts.forEach((layout) => {
      const layoutType = layout.getType()
      layout.resetField(field, elementSelectors[layoutType], selectorHtml)
    })
    this._history.push(new QuickFieldHistoryFieldItem(QuickFieldHistoryAction.EDIT, field, { elementSelectors, selectorHtml }))
  },

  /**
   * Event listener for the new group button
   * @private
   */
  _newGroup (): void {
    this.dialog.addNewGroup()
  },

  /**
   * Adds a new unused field group to the field layout designer sidebar.
   * @param group - The group to add
   * @param resetFldGroups - Whether to reset the field layout designers' records of existing field groups
   * @private
   */
  _addGroup (this: QuickFieldPrivateInterface, group: Group, resetFldGroups: boolean): void {
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
   * @param $group - A jQuery object representing the field group to rename
   */
  openRenameGroupDialog ($group: JQuery): void {
    const id = $group.data('id')
    const oldName = $group.children('h6').text()
    this.dialog.renameGroup(id, oldName)
  },

  /**
   * Renames a field group.
   * @param group - The field group to rename
   * @param oldName - The field group's previous name
   * @private
   */
  _renameGroup (this: QuickFieldPrivateInterface, group: Group, oldName: string): void {
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
   * @param $option - A jQuery object representing the option to add to the group select
   * @param $select - A jQuery object representing the group select
   * @param optionText - The text being used for the new option
   * @private
   */
  _addOptionToGroupSelect ($option: JQuery, $select: JQuery, optionText: string): void {
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
   * @param $group - A jQuery object representing the field group to rename
   * @public
   */
  openDeleteGroupDialog ($group: JQuery): void {
    const group = {
      id: $group.data('id'),
      name: $group.children('h6').text()
    }
    this.dialog.deleteGroup(group)
  },

  /**
   * Removes a deleted field group, and any fields belonging to it.
   * @param group - The field group to delete
   * @private
   */
  _removeGroup (this: QuickFieldPrivateInterface, group: Group): void {
    this._layouts.forEach((layout) => layout.removeGroup(group.id))
    this._history.push(new QuickFieldHistoryGroupItem(QuickFieldHistoryAction.REMOVE, group))

    // Remove this group from the 'new field' group options
    this.modal.$html.find('#qf-group').children(`[value="${group.id}"]`).remove()
  }
})

export { QuickField, QuickFieldInterface }
