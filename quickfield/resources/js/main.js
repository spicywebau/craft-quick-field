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
			this.$groupButton = $('<div class="btn add icon" tabindex="0">').text(Craft.t('New Group')).appendTo(this.$container);
			this.$fieldButton = $('<div class="btn add icon" tabindex="0">').text(Craft.t('New Field')).appendTo(this.$container);

			this.dialog = new QuickField.GroupDialog(this);

			this.addListener(this.$fieldButton, 'activate', 'newField');
		},

		/**
		 * Event handler for the New Field button.
		 * Creates a modal window that contains new field settings.
		 */
		newField: function()
		{
			this.modal = new QuickField.FieldModal(this);
		}
	});

	/**
	 * FieldModal class
	 * Handles the modal window for creating new fields.
	 */
	QuickField.FieldModal = Garnish.Modal.extend({

		$body:        null,
		$content:     null,
		$main:        null,
		$footer:      null,
		$buttons:     null,
		$saveBtn:     null,
		$cancelBtn:   null,
		$saveSpinner: null,
		$loadSpinner: null,

		$js:          null,
		$css:         null,

		quickField:   null,

		/**
		 * The constructor.
		 */
		init: function(qf, settings)
		{
			this.base();

			this.setSettings(settings, {
				resizable: true
			});

			this.quickField = qf;

			var $container    = $('<form class="modal quick-field-modal">').appendTo(Garnish.$bod);

			this.$body        = $('<div class="body">').appendTo($container);
			this.$content     = $('<div class="content">').appendTo(this.$body);
			this.$main        = $('<div class="main">').appendTo(this.$content);
			this.$footer      = $('<div class="footer">').appendTo($container);
			this.$loadSpinner = $('<div class="spinner big">').appendTo($container);

			this.$buttons     = $('<div class="buttons right">').appendTo(this.$footer);
			this.$cancelBtn   = $('<div class="btn">').text(Craft.t('Cancel')).appendTo(this.$buttons);
			this.$saveBtn     = $('<div class="btn submit disabled" role="button">').text(Craft.t('Save')).appendTo(this.$buttons);
			this.$saveSpinner = $('<div class="spinner hidden">').appendTo(this.$buttons);

			this.setContainer($container);
			this.show();

			Craft.postActionRequest('quickField/getFieldSettings', {}, $.proxy(function(response, textStatus)
			{
				this.$loadSpinner.remove();

				if(textStatus == 'success')
				{
					this.$saveBtn.removeClass('disabled');
					this.buildModal(response);
				}

			}, this));

			this.addListener(this.$cancelBtn, 'activate', 'closeModal');
			this.addListener(this.$saveBtn,   'activate', 'saveField');
		},

		/**
		 * Initialises the HTML, CSS and Javascript for the modal window.
		 *
		 * @param response - The AJAX response from the QuickFieldController::actionGetFieldSettings controller method
		 */
		buildModal: function(response)
		{
			this.$js  = $(response.fieldSettingsJs);
			this.$css = $(response.fieldSettingsCss);

			Garnish.$bod.append(this.$css);

			this.$body.html(response.fieldSettingsHtml);

			Garnish.$bod.append(this.$js);

			Craft.initUiElements();
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
			this.$js.remove();
			this.$css.remove();

			this.removeListener(this.$closeBtn, 'click');
		},

		/**
		 * Event handler for the Close button.
		 * Hides the modal window from view.
		 */
		closeModal: function()
		{
			this.hide();
		},

		/**
		 * Event handler for the save button.
		 * Saves the new field form to the database.
		 *
		 * @param e
		 */
		saveField: function(e)
		{
			if(e) e.preventDefault();

			if(this.$saveBtn.hasClass('disabled') || !this.$saveSpinner.hasClass('hidden'))
			{
				return;
			}

			this.$saveSpinner.removeClass('hidden');
			var data = this.$container.serialize();

			Craft.postActionRequest('quickField/saveField', data, $.proxy(function(response, textStatus)
			{
				this.$saveSpinner.addClass('hidden');

				if(textStatus == 'success' && response.success)
				{
					console.log(response.field);

					Craft.cp.displayNotice(Craft.t('New field created'));

					this.hide();
				}
				else
				{
					var error = (textStatus == 'success' && response.error ? response.error : Craft.t('An unknown error occurred.'));

					Craft.cp.displayError(error);
				}
			}, this));
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
