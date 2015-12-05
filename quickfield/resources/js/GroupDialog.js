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

			this.addListener(this.quickField.$groupButton, 'activate', 'addNewGroup');
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
							var group = response.group;
							this.addGroupTab(group.name, group.id);
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
		 * Adds a new unused (dashed border) group tab to the field layout designer.
		 *
		 * @param name
		 * @param id
		 */
		addGroupTab: function(name, id)
		{
			var fld = this.quickField.fld;
			var settings = fld.settings;
			var container = fld.$unusedFieldContainer;
			var grid = fld.unusedFieldGrid;
			var drag = fld.tabDrag;

			var $tab = $(
				'<div class="fld-tab unused">' +
					'<div class="tabs">' +
						'<div class="tab sel">' +
							'<span>' + name + '</span>' +
						'</div>' +
					'</div>' +
					'<div class="fld-tabcontent"></div>' +
				'</div>'
			).appendTo(container);

			grid.addItems($tab);

			if(settings.customizableTabs)
			{
				drag.addItems($tab);
			}

			grid.refreshCols(true);
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

	window.QuickField.GroupDialog = GroupDialog;

})(jQuery);
