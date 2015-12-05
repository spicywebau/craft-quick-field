(function($)
{
	var FLD = Craft.FieldLayoutDesigner;
	var FLDinit = FLD.prototype.init;

	/**
	 * Override the current FieldLayoutDesigner "constructor" so news buttons can be initialised.
	 */
	FLD.prototype.init = function()
	{
		FLDinit.apply(this, arguments);

		new QuickField(this);
	};

	/**
	 * QuickField class
	 * Handles the buttons for creating new groups and fields inside a FieldLayoutDesigner
	 */
	var QuickField = Garnish.Base.extend({

		$container:   null,
		$groupButton: null,
		$fieldButton: null,

		fld:          null,
		dialog:       null,
		modal:        null,

		/**
		 * The constructor.
		 *
		 * @param fld - An instance of Craft.FieldLayoutDesigner
		 */
		init: function(fld)
		{
			if(!(fld instanceof Craft.FieldLayoutDesigner))
			{
				// Fail silently - just means the quick field feature will not be initialised, no big deal
				return;
			}

			this.fld = fld;

			this.$container   = $('<div class="newfieldbtn-container">').insertAfter(fld.$unusedFieldContainer);
			this.$groupButton = $('<div class="btn add icon" tabindex="0">New Group</div>').appendTo(this.$container);
			this.$fieldButton = $('<div class="btn add icon" tabindex="0">New Field</div>').appendTo(this.$container);

			this.dialog = new QuickField.GroupDialog(this);

			this.addListener(this.$fieldButton, 'activate', 'newField');
		},

		/**
		 * Event handler for the New Field button.
		 * Creates a modal window that contains new field settings.
		 */
		newField: function()
		{
			this.modal = new QuickField.FieldModal();
		}
	});

	/**
	 * FieldModal class
	 * Handles the modal window for creating new fields.
	 */
	QuickField.FieldModal = Garnish.Modal.extend({

		$buttons:  null,
		$closeBtn: null,

		/**
		 * The constructor.
		 */
		init: function()
		{
			var $container = $('<div class="modal quickfieldmodal">').appendTo(Garnish.$bod);
			var $body      = $('<div class="body">').appendTo($container);
			var $content   = $('<div class="content">').appendTo($body);
			var $main      = $('<div class="main">').appendTo($content);
			var $footer    = $('<div class="footer">').appendTo($container);

			this.base($container, {

			});

			this.$buttons  = $('<div class="buttons rightalign first">').appendTo($footer);
			this.$closeBtn = $('<div class="btn">' + Craft.t('Close') + '</div>').appendTo(this.$buttons);

			this.addListener(this.$closeBtn, 'activate', 'closeModal');
		},

		/**
		 * Event handler for when the modal window finishes fading out after hiding.
		 * Clears out all events and elements of the modal.
		 */
		onFadeOut: function()
		{
			this.destroy();
			this.$shade.remove();
			this.$container.remove();

			this.removeListener(this.$closeBtn, 'click');
		},

		/**
		 * Event handler for the Close button.
		 * Hides the modal window from view.
		 */
		closeModal: function()
		{
			this.hide();
		}
	});

	/**
	 * GroupDialog class.
	 * Handles the dialog box for creating new field groups.
	 */
	QuickField.GroupDialog = Garnish.Base.extend({

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
					if(textStatus == 'success')
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
		 * @return string
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
		 * @return array
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

})(jQuery);
