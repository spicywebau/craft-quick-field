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
			var name = this.promptForGroupName('');

			if(name)
			{
				var data = {
					name: name
				};

				Craft.postActionRequest('fields/saveGroup', data, $.proxy(function(response, textStatus)
				{
					if(textStatus === 'success')
					{
						if(response.success)
						{
							this.trigger('newGroup', {
								target: this,
								group: response.group
							});
						}
						else if(response.errors)
						{
							var errors = this._flattenErrors(response.errors);
							alert(Craft.t('Could not create the group:') + "\n\n" + errors.join("\n"));
						}
						else
						{
							Craft.cp.displayError();
						}
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
			return prompt(Craft.t('What do you want to name your group?'), oldName);
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
	});

	var instance = null;
	GroupDialog.getInstance = function()
	{
		if(!instance)
		{
			instance = new GroupDialog();
		}

		return instance;
	};

	window.QuickField.GroupDialog = GroupDialog;

})(jQuery);
