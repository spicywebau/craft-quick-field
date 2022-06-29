(function($)
{
	/**
	 * GroupDialog class.
	 * Handles the dialog box for creating new field groups.
	 */
	var GroupDialog = Garnish.Base.extend({

		quickField: null,

		/**
		 * The constructor.
		 *
		 * @param qf - An instance of QuickField.
		 */
		init: function(qf)
		{
			this.quickField = qf;
		},

		/**
		 * Requests input for new group name, then creates the group.
		 */
		addNewGroup: function()
		{
			this._saveGroup(
				null,
				'',
				this._triggerGroupUpdateEvent('newGroup')
			);
		},

		/**
		 * Requests input for a new name for an existing group, then updates the group.
		 *
		 * @param id
		 * @param name
		 */
		renameGroup: function(id, name)
		{
			this._saveGroup(
				id,
				name,
				this._triggerGroupUpdateEvent('renameGroup')
			);
		},

		/**
		 * Internal function for saving new or updated groups.
		 *
		 * @param id
		 * @param oldName
		 * @param successCallback
		 * @private
		 */
		_saveGroup: function(id, oldName, successCallback)
		{
			var name = this.promptForGroupName(oldName);

			if(name)
			{
				var data = {
					name: name,
					id: id,
				};

				Craft.postActionRequest('fields/save-group', data, $.proxy(function(response, textStatus)
				{
					var statusSuccess = (textStatus === 'success');

					if(statusSuccess && response.success)
					{
						successCallback(this, response.group, oldName);
					}
					else if(statusSuccess && response.errors)
					{
						var errors = this._flattenErrors(response.errors);
						alert(Craft.t('quick-field', 'Could not save the group:') + "\n\n" + errors.join("\n"));
					}
					else
					{
						Craft.cp.displayError(Craft.t('quick-field', 'An unknown error occurred.'));
					}
				}, this));
			}
		},

		/**
		 * Internal function for triggering a group update event with a given name.
		 *
		 * @param eventName
		 * @private
		 */
		_triggerGroupUpdateEvent: function(eventName)
		{
			return function(target, group, oldName) {
				target.trigger(eventName, {
					target: target,
					group: group,
					oldName: oldName,
				});
			};
		},

		/**
		 * Prompts for confirmation of deleting a field group, then deletes the group.
		 *
		 * @param groupId
		 */
		deleteGroup: function(groupId)
		{
			if(confirm(Craft.t('quick-field', 'Are you sure you want to delete this group and all its fields?')))
			{
				Craft.postActionRequest('fields/delete-group', { id: groupId }, $.proxy(function(response, textStatus)
				{
					var statusSuccess = (textStatus === 'success');

					if(statusSuccess && response.success)
					{
						this.trigger('deleteGroup', { id: groupId });
					}
					else
					{
						Craft.cp.displayError(Craft.t('quick-field', 'Could not delete the group.'));
					}
				}, this));
			}
		},

		/**
		 * Creates and opens the dialog box asking for a group name.
		 *
		 * @return String
		 */
		promptForGroupName: function(oldName)
		{
			return prompt(Craft.t('quick-field', 'What do you want to name the group?'), oldName);
		},

		/**
		 * Utility method that transforms returned errors from an async request into a single dimension array.
		 * This is useful when outputting errors to the screen, so conversion to string is simpler.
		 *
		 * @return Array
		 */
		_flattenErrors: function(responseErrors)
		{
			var errors = [];

			for(var attribute in responseErrors) if(responseErrors.hasOwnProperty(attribute))
			{
				errors = errors.concat(responseErrors[attribute]);
			}

			return errors;
		}
	},
	{
		/**
		 * (Static) Singleton pattern.
		 *
		 * @returns GroupDialog
		 */
		getInstance: function()
		{
			if(!this._instance)
			{
				this._instance = new GroupDialog();
			}

			return this._instance;
		}
	});

	window.QuickField.GroupDialog = GroupDialog;

})(jQuery);
