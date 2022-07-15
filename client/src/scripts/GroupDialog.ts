import { SaveGroupResponse } from './types/Response'

interface GroupDialogInterface extends GarnishComponent {
  addNewGroup: () => void
  renameGroup: (id: number, name: string) => void
  deleteGroup: (group: Group) => void
  promptForGroupName: (oldName: string) => string
}

type GroupUpdateEventFunction = (target: GarnishComponent, group: Group, oldName: string) => void

/**
 * GroupDialog class.
 * Handles the dialog box for creating new field groups.
 */
const GroupDialog = Garnish.Base.extend({

  /**
   * Requests input for new group name, then creates the group.
   */
  addNewGroup: function () {
    this._saveGroup(
      null,
      '',
      this._triggerGroupUpdateEvent('newGroup')
    )
  },

  /**
   * Requests input for a new name for an existing group, then updates the group.
   *
   * @param id
   * @param name
   */
  renameGroup: function (id: number, name: string) {
    this._saveGroup(
      id,
      name,
      this._triggerGroupUpdateEvent('renameGroup')
    )
  },

  /**
   * Internal function for saving new or updated groups.
   *
   * @param id
   * @param oldName
   * @param successCallback
   * @private
   */
  _saveGroup: function (id: number, oldName: string, successCallback: GroupUpdateEventFunction) {
    const name = this.promptForGroupName(oldName)

    if (name !== null && name !== '' && name !== oldName) {
      const data = {
        name: name,
        id: id
      }

      Craft.sendActionRequest('POST', 'fields/save-group', { data })
        .then((response: SaveGroupResponse) => successCallback(this, response.data.group, oldName))
        .catch(({ response }) => {
          const errorCount = Object.keys(response.data?.errors ?? {}).length

          if (errorCount > 0) {
            const errors: string[] = this._flattenErrors(response.data.errors)
            alert(`${Craft.t('quick-field', 'Could not save the group:')}\n\n${errors.join('\n')}`)
          } else {
            Craft.cp.displayError(Craft.t('quick-field', 'An unknown error occurred.'))
          }
        })
    }
  },

  /**
   * Internal function for triggering a group update event with a given name.
   *
   * @param eventName
   * @private
   */
  _triggerGroupUpdateEvent: function (eventName: string): GroupUpdateEventFunction {
    return (target, group, oldName) => {
      target.trigger(eventName, {
        target: target,
        group: group,
        oldName: oldName
      })
    }
  },

  /**
   * Prompts for confirmation of deleting a field group, then deletes the group.
   *
   * @param group
   */
  deleteGroup: function (group: Group) {
    if (confirm(Craft.t('quick-field', 'Are you sure you want to delete this group and all its fields?'))) {
      const data = {
        id: group.id
      }
      Craft.sendActionRequest('POST', 'fields/delete-group', { data })
        .then(_ => this.trigger('deleteGroup', { group }))
        .catch(_ => Craft.cp.displayError(Craft.t('quick-field', 'Could not delete the group.')))
    }
  },

  /**
   * Creates and opens the dialog box asking for a group name.
   *
   * @return String
   */
  promptForGroupName: function (oldName: string) {
    return prompt(Craft.t('quick-field', 'What do you want to name the group?'), oldName)
  },

  /**
   * Utility method that transforms returned errors from an async request into a single dimension array.
   * This is useful when outputting errors to the screen, so conversion to string is simpler.
   *
   * @return Array
   */
  _flattenErrors: function (responseErrors: Record<string, string>): string[] {
    return Object.keys(responseErrors)
      .reduce((errors: string[], key: string) => errors.concat(responseErrors[key]), [])
  }
})

export { GroupDialog, GroupDialogInterface }
