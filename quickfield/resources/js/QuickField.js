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

			this.fld.$container.addClass('quick-field');

			this.$container   = $('<div class="newfieldbtn-container">').insertAfter(fld.$unusedFieldContainer);
			this.$groupButton = $('<div class="btn add icon" tabindex="0">').text(Craft.t('New Group')).appendTo(this.$container);
			this.$fieldButton = $('<div class="btn add icon" tabindex="0">').text(Craft.t('New Field')).appendTo(this.$container);

			this.initButtons();

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
				var group = field.group;
				this.addField(field.id, field.name, group.name);
			}, this));

			this.modal.on('saveField', $.proxy(function(e)
			{
				var field = e.field;
				var group = field.group;
				this.resetField(field.id, group.name, field.name);
			}, this));

			this.modal.on('deleteField', $.proxy(function(e)
			{
				var field = e.field;
				this.removeField(field.id);
			}, this));
		},

		/**
		 * Adds edit buttons to existing fields.
		 */
		initButtons: function()
		{
			var that = this;

			var $tabs = this.fld.$unusedFieldContainer.find('.fld-tab .tab.sel');
			var $fields = this.fld.$unusedFieldContainer.find('.fld-field.unused');

			/*
			$tabs.each(function()
			{
				var $tab = $(this);
				var $button = $('<a class="qf-settings icon" title="Edit"></a>');

				// Add the extra space in there for consistent padding
				$tab.append('&nbsp;').append($button);
			});
			*/

			$fields.each(function()
			{
				var $field = $(this);
				var $button = $('<a class="qf-edit icon" title="Edit"></a>');

				that.addListener($button, 'activate', 'editField');

				$field.prepend($button);
			});
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
		 * Event handler for the edit buttons on fields.
		 * Opens a modal window that contains the field settings.
		 *
		 * @param e
		 */
		editField: function(e)
		{
			var $button = $(e.target);
			var $field = $button.parent();
			var id = $field.data('id');

			this.modal.editField(id);
		},

		/**
		 * Adds a new unused (dashed border) field to the field layout designer.
		 *
		 * @param id
		 * @param name
		 * @param groupName
		 */
		addField: function(id, name, groupName)
		{
			var fld = this.fld;
			var grid = fld.unusedFieldGrid;
			var drag = fld.fieldDrag;
			var fields = fld.$allFields;
			var $group = this._getGroupByName(groupName);

			if($group)
			{
				var $groupContent = $group.children('.fld-tabcontent');
				var $field = $([
					'<div class="fld-field unused" data-id="', id, '">',
						'<span>', name, '</span>',
						'<a class="qf-edit icon" title="Edit"></a>',
					'</div>'
				].join('')).appendTo($groupContent);

				fld.$allFields = fields.add($field);

				$group.removeClass('hidden');
				drag.addItems($field);
				grid.refreshCols(true);
			}
			else
			{
				Craft.cp.displayError(Craft.t('Invalid field group:') + groupName);
			}
		},

		/**
		 * Removes a field from the field layout designer.
		 * 
		 * @param id
		 */
		removeField: function(id)
		{
			var fld = this.fld;
			var grid = fld.unusedFieldGrid;
			var drag = fld.fieldDrag;
			var $container = fld.$container;
			var $fields = fld.$allFields;
			var $field = $container.find('.fld-field[data-id="' + id + '"]');

			$field.remove();
			fld.$allFields = $fields.not($field);
			drag.removeItems($field);
			grid.refreshCols(true);
		},

		/**
		 * Renames and regroups an existing field on the field layout designer.
		 *
		 * @param id
		 * @param groupName
		 * @param name
		 */
		resetField: function(id, groupName, name)
		{
			var fld = this.fld;
			var grid = fld.unusedFieldGrid;
			var $container = fld.$container;
			var $group = this._getGroupByName(groupName);
			var $content = $group.children('.fld-tabcontent');
			var $field = $container.find('.fld-field[data-id="' + id + '"]');
			var $unusedField = $field.filter('.unused');
			var $currentGroup = $unusedField.closest('.fld-tab');
			var $span = $field.children('span');

			$span.text(name);

			if($currentGroup[0] !== $group[0])
			{
				$content.append($unusedField);
				grid.refreshCols(true);
			}
		},

		/**
		 * Event listener for the new group button
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
			var $tab = $([
				'<div class="fld-tab unused">',
					'<div class="tabs">',
						'<div class="tab sel">',
							'<span>', name, '</span>',
							// '&nbsp;<a class="qf-settings icon" title="Edit"></a>',
						'</div>',
					'</div>',
					'<div class="fld-tabcontent"></div>',
				'</div>'
			].join('')).appendTo($container);

			grid.addItems($tab);

			if(settings.customizableTabs)
			{
				drag.addItems($tab);
			}

			grid.refreshCols(true);
		},

		/**
		 * Finds the group tab element from it's name.
		 *
		 * @param name
		 * @returns {*}
		 * @private
		 */
		_getGroupByName: function(name)
		{
			var $container = this.fld.$unusedFieldContainer;
			var $groups = $container.children('.fld-tab');
			var $group = null;

			$groups.each(function()
			{
				var $this = $(this);
				var $tab = $this.children('.tabs').children('.tab.sel');
				var $span = $tab.children('span');

				if($span.text() === name)
				{
					$group = $this;
					return false;
				}
			});

			return $group;
		}
	});

	window.QuickField = QuickField;

})(jQuery);
