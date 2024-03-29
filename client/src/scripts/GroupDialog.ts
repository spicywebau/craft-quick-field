import { SaveGroupResponse } from './types/Response'

/**
 * An interface representing a `GroupDialog`.
 */
interface GroupDialogInterface extends GarnishComponent {
  addNewGroup: () => void
  renameGroup: (id: number, name: string) => void
  deleteGroup: (group: Group) => void
  promptForGroupName: (oldName: string) => string
}

/**
 * A type for a function that is called after updating a field group.
 */
type GroupUpdateEventFunction = (target: GarnishComponent, group: Group, oldName: string) => void

/**
 * GroupDialog class.
 * Handles the dialog box for creating new field groups.
 */
const GroupDialog = Garnish.Base.extend({

  /**
   * Requests input for new group name, then creates the group.
   * @public
   */
  addNewGroup (): void {
    this._saveGroup(
      null,
      '',
      this._triggerGroupUpdateEvent('newGroup')
    )
  },

  /**
   * Requests input for a new name for an existing group, then updates the group.
   * @param id - The group's ID
   * @param name - The group's current name
   * @public
   */
  renameGroup (id: number, name: string): void {
    this._saveGroup(
      id,
      name,
      this._triggerGroupUpdateEvent('renameGroup')
    )
  },

  /**
   * Internal function for saving new or updated groups.
   * @param id - The group's ID
   * @param oldName - The group's current name
   * @param successCallback - A `GroupUpdateEventFunction` to be called after the group is saved
   * @private
   */
  _saveGroup (id: number, oldName: string, successCallback: GroupUpdateEventFunction): void {
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
   * @param eventName - The name of the event to trigger
   * @returns a `GroupUpdateEventFunction` for triggering an event with the given `eventName`
   * @private
   */
  _triggerGroupUpdateEvent (eventName: string): GroupUpdateEventFunction {
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
   * @param group - The group to delete
   * @public
   */
  deleteGroup (group: Group): void {
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
   * @returns a string representing the new group name, or `null` if the prompt was cancelled
   * @public
   */
  promptForGroupName (oldName: string): string|null {
    return prompt(Craft.t('quick-field', 'What do you want to name the group?'), oldName)
  },

  /**
   * Utility method that transforms returned errors from an async request into a single dimension array.
   * This is useful when outputting errors to the screen, so conversion to string is simpler.
   * @returns an array of strings representing the errors that occurred
   * @private
   */
  _flattenErrors (responseErrors: Record<string, string>): string[] {
    return Object.keys(responseErrors)
      .reduce((errors: string[], key: string) => errors.concat(responseErrors[key]), [])
  }
})

export { GroupDialog, GroupDialogInterface }
