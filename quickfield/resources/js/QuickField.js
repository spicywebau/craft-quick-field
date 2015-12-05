(function($)
{
	/**
	 * QuickField class
	 * Handles the buttons for creating new groups and fields inside a FieldLayoutDesigner
	 */
	var QuickField = Garnish.Base.extend({

		$container:   null,
		$groupButton: null,
		$fieldButton: null,
		$settings:    null,

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
			this.modal  = new QuickField.FieldModal(this);

			this.addListener(this.$fieldButton, 'activate', 'newField');
		},

		/**
		 * Event handler for the New Field button.
		 * Creates a modal window that contains new field settings.
		 */
		newField: function()
		{
			this.modal.show();
		}
	});

	window.QuickField = QuickField;

})(jQuery);
