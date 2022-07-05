/**
 * GroupDialog class.
 * Handles the dialog box for creating new field groups.
 */
export default Garnish.Base.extend({

  quickField: null,

  /**
     * The constructor.
     *
     * @param qf - An instance of QuickField.
     */
  init: function (qf) {
    this.quickField = qf
  },

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
  renameGroup: function (id, name) {
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
  _saveGroup: function (id, oldName, successCallback) {
    const name = this.promptForGroupName(oldName)

    if (name !== '') {
      const data = {
        name: name,
        id: id
      }

      Craft.sendActionRequest('POST', 'fields/save-group', { data })
        .then(response => successCallback(this, response.data.group, oldName))
        .catch(response => {
          if (response.errors.length > 0) {
            const errors: string[] = this._flattenErrors(response.errors)
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
  _triggerGroupUpdateEvent: function (eventName) {
    return function (target, group, oldName) {
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
     * @param groupId
     */
  deleteGroup: function (groupId) {
    if (confirm(Craft.t('quick-field', 'Are you sure you want to delete this group and all its fields?'))) {
      const data = {
        id: groupId
      }
      Craft.sendActionRequest('POST', 'fields/delete-group', { data })
        .then(_ => this.trigger('deleteGroup', { id: groupId }))
        .catch(_ => Craft.cp.displayError(Craft.t('quick-field', 'Could not delete the group.')))
    }
  },

  /**
     * Creates and opens the dialog box asking for a group name.
     *
     * @return String
     */
  promptForGroupName: function (oldName) {
    return prompt(Craft.t('quick-field', 'What do you want to name the group?'), oldName)
  },

  /**
     * Utility method that transforms returned errors from an async request into a single dimension array.
     * This is useful when outputting errors to the screen, so conversion to string is simpler.
     *
     * @return Array
     */
  _flattenErrors: function (responseErrors: object): string[] {
    return Object.keys(responseErrors)
      .reduce((errors: string[], key: string) => errors.concat(responseErrors[key]), [])
  }
})
