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

			this.dialog = QuickField.GroupDialog.getInstance();
			this.modal  = QuickField.FieldModal.getInstance();

			this.addListener(this.$groupButton, 'activate', 'newGroup');
			this.addListener(this.$fieldButton, 'activate', 'newField');

			this.dialog.on('newGroup', $.proxy(function(e)
			{
				var group = e.group;
				this.addGroup(group.id, group.name);
			}, this));

			this.modal.on('newField', $.proxy(function(e)
			{
				var field = e.field;
				this.addField(field.id, field.name, field.groupId);
			}, this));
		},

		/**
		 * Event handler for the New Field button.
		 * Creates a modal window that contains new field settings.
		 */
		newField: function()
		{
			this.modal.show();
		},

		/**
		 * Adds a new unused (dashed border) field to the field layout designer.
		 *
		 * @param id
		 * @param name
		 * @param groupId
		 */
		addField: function(id, name, groupId)
		{
			var fld = this.fld;
			var grid = fld.unusedFieldGrid;
			var drag = fld.fieldDrag;

			var $container = fld.$unusedFieldContainer;
			var $group = $container.children('.fld-tab').first();
			var $groupContent = $group.children('.fld-tabcontent');
			var $field = $(
				'<div class="fld-field unused" data-id="' + id + '">' +
					'<span>' + name + '</span>' +
				'</div>'
			).appendTo($groupContent);

			drag.addItems($field);
		},

		/**
		 *
		 */
		newGroup: function()
		{
			this.dialog.addNewGroup();
		},

		/**
		 * Adds a new unused (dashed border) group tab to the field layout designer.
		 *
		 * @param name
		 * @param id
		 */
		addGroup: function(id, name)
		{
			var fld = this.fld;
			var settings = fld.settings;
			var grid = fld.unusedFieldGrid;
			var drag = fld.tabDrag;

			var $container = fld.$unusedFieldContainer;
			var $tab = $(
				'<div class="fld-tab unused">' +
					'<div class="tabs">' +
						'<div class="tab sel">' +
							'<span>' + name + '</span>' +
						'</div>' +
					'</div>' +
					'<div class="fld-tabcontent"></div>' +
				'</div>'
			).appendTo($container);

			grid.addItems($tab);

			if(settings.customizableTabs)
			{
				drag.addItems($tab);
			}

			grid.refreshCols(true);
		}
	});

	window.QuickField = QuickField;

})(jQuery);
