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

			this.$container = $('<div class="newfieldbtn-container btngroup small fullwidth">').prependTo(fld.$fieldLibrary);
			this.$groupButton = $('<div class="btn small add icon" tabindex="0">').text(Craft.t('quick-field', 'New Group')).appendTo(this.$container);
			this.$fieldButton = $('<div class="btn small add icon" tabindex="0">').text(Craft.t('quick-field', 'New Field')).appendTo(this.$container);
			this._fieldButtonAttached = true;
			this._loaded = false;

			this.initButtons();

			this.dialog = QuickField.GroupDialog.getInstance();
			this.modal  = QuickField.FieldModal.getInstance();
			this._load();

			this.addListener(this.$groupButton, 'activate', 'newGroup');
			this.addListener(this.$fieldButton, 'activate', 'newField');

			this.dialog.on('newGroup', $.proxy(function(e)
			{
				var group = e.group;
				this.addGroup(group.name, true).data('id', e.group.id);

				if(!this._fieldButtonAttached)
				{
					this._load();
				}
			}, this));

			this.dialog.on('renameGroup', $.proxy(function(e)
			{
				this.renameGroup(e.oldName, e.group.name);
			}, this));

			this.dialog.on('deleteGroup', $.proxy(function(e)
			{
				this.deleteGroup(e.id);
			}, this));

			this.modal.on('newField', $.proxy(function(e)
			{
				this.addField(e.field, e.elementSelector);
			}, this));

			this.modal.on('saveField', $.proxy(function(e)
			{
				var field = e.field;
				var group = field.group;
				this.resetField(field.id, group.name, field.name);
			}, this));

			this.modal.on('deleteField', $.proxy(function(e)
			{
				this.removeField(e.field.id);
			}, this));

			this.modal.on('destroy', $.proxy(function()
			{
				this.$fieldButton.detach();
				this._fieldButtonAttached = false;
			}, this));
		},

		/**
		 * Loads the field settings template file, as well as all the resources that come with it.
		 */
		_load: function()
		{
			if(!this._loaded)
			{
				Craft.postActionRequest('quick-field/actions/load', {}, $.proxy(function(response, textStatus)
				{
					if(textStatus === 'success' && response.success)
					{
						this.modal.$loadSpinner.addClass('hidden');
						this.modal.initTemplate(response.template);
						this._initGroups(response.groups);
						this._loaded = true;

						if(!this._fieldButtonAttached)
						{
							this.$fieldButton.appendTo(this.$container);
							this._fieldButtonAttached = true;
						}

						this.trigger('load');
					}
					else
					{
						this.modal.destroy();
					}
				}, this));
			}
		},

		_initGroups: function(groups)
		{
			// Loop through the groups in reverse so we don't have to reset `fld.$fieldGroups` every
			// time to get empty groups in the right place
			for(var i = groups.length - 1; i >= 0; i--)
			{
				var group = groups[i];
				var $group = this._getGroupByName(group.name);

				if($group.length === 0)
				{
					$group = this.addGroup(group.name, false);
				}

				$group.data('id', group.id);
			}

			this._resetFldGroups()
		},

		/**
		 * Adds edit buttons to existing fields.
		 */
		initButtons: function()
		{
			var that = this;

			var $groups = this.fld.$fieldGroups;
			var $fields = this.fld.$fields.filter('.unused');

			$groups.each(function()
			{
				that._addGroupMenu($(this));
			});

			$fields.each(function()
			{
				that._addFieldButton($(this));
			});
		},

		_addGroupMenu: function($group)
		{
			var $button = $('<button class="qf-settings icon menubtn" title="' + Craft.t('app', 'Settings') + '" role="button" type="button"></button>');
			var $menu = $([
				'<div class="menu">',
					'<ul class="padded">',
						'<li><a data-icon="edit" data-action="rename">', Craft.t('quick-field', 'Rename'), '</a></li>',
						'<li><a class="error" data-icon="remove" data-action="delete">', Craft.t('quick-field', 'Delete'), '</a></li>',
					'</ul>',
				'</div>',
			].join(''));
			$group.prepend($menu).prepend($button);

			var that = this;
			var settingsMenu = new Garnish.MenuBtn($button);
			settingsMenu.on('optionSelect', function(e) {
				switch ($(e.option).attr('data-action')) {
					case 'rename': that._openRenameGroupDialog($group); break;
					case 'delete': that._openDeleteGroupDialog($group);
				}
			});
		},

		_addFieldButton: function($field)
		{
			var $button = $('<a class="qf-edit icon" title="Edit"></a>');
			this.addListener($button, 'activate', 'editField');
			$field.prepend($button);
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
		 * @param field
		 * @param elementSelector
		 */
		addField: function(field, elementSelector)
		{
			var fld = this.fld;
			var drag = fld.elementDrag;
			var $group = this._getGroupByName(field.group.name);

			if($group)
			{
				var lowerCaseName = field.name.toLowerCase();
				var $field = $(elementSelector);
				var $prevElement = $group.children('.fld-element').filter(function() {
					return $(this).find('h4').text().toLowerCase() < lowerCaseName;
				}).last();

				if($prevElement.length === 0)
				{
					$prevElement = $group.children('h6');
				}

				$field.insertAfter($prevElement);
				drag.addItems($field);
				this._addFieldButton($field);
				fld.$fields = fld.$fieldGroups.children('.fld-element');
			}
			else
			{
				Craft.cp.displayError(Craft.t('quick-field', 'Invalid field group: {groupName}', {groupName: groupName}));
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
			var $fields = fld.$fields;
			var $field = $fields.filter('.fld-field[data-id="' + id + '"]');

			$field.remove();
			fld.$fields = $fields.not($field);
			fld.elementDrag.removeItems($field);
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
				$group.removeClass('hidden');
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
		 * Adds a new unused group to the field layout designer sidebar.
		 *
		 * @param name
		 * @param resetFldGroups
		 */
		addGroup: function(name, resetFldGroups)
		{
			var lowerCaseName = name.toLowerCase();
			var $newGroup = $([
				'<div class="fld-field-group" data-name="', lowerCaseName, '">',
					'<h6>', name, '</h6>',
				'</div>'
			].join(''));
			this._addGroupMenu($newGroup);
			this._attachGroup($newGroup, resetFldGroups);

			return $newGroup;
		},

		_openRenameGroupDialog: function($group)
		{
			var id = $group.data('id');
			var oldName = $group.children('h6').text();
			this.dialog.renameGroup(id, oldName);
		},

		renameGroup: function(oldName, newName)
		{
			var $group = this._getGroupByName(oldName);

			if($group.length > 0)
			{
				var lowerCaseName = newName.toLowerCase();
				$group.detach()
					.attr('data-name', lowerCaseName)
					.data('name', lowerCaseName)
					.children('h6').text(newName);
				this._attachGroup($group, true);
			}
		},

		_openDeleteGroupDialog: function($group)
		{
			var id = $group.data('id');
			this.dialog.deleteGroup(id);
		},

		deleteGroup: function(id)
		{
			var fld = this.fld;
			var $deletedGroup = fld.$fieldGroups
				.filter(function() {
					return $(this).data('id') === id;
				});

			// Remove any fields from this group from the tabs
			var $usedFields = $deletedGroup.find('.fld-field.hidden');
			var filterSelector = $usedFields.map(function() {
				return '[data-id="' + $(this).data('id') + '"]';
			}).get().join(',');
			fld.$tabContainer
				.find('.fld-field')
				.filter(filterSelector)
				.remove();

			$deletedGroup.remove();
		},

		/**
		 * Attaches a group to the correct position in the sidebar.
		 *
		 * @param $group
		 * @param resetFldGroups
		 * @private
		 */
		_attachGroup: function($group, resetFldGroups)
		{
			var fld = this.fld;
			var lowerCaseName = $group.attr('data-name');
			var $prevElement = fld.$fieldGroups.filter(function() {
				var $this = $(this);
				return $this.hasClass('hidden') || $this.data('name') < lowerCaseName;
			}).last();

			if($prevElement.length === 0)
			{
				$prevElement = fld.$fieldSearch.parent();
			}

			$group.insertAfter($prevElement);

			if(resetFldGroups)
			{
				this._resetFldGroups();
			}
		},

		_resetFldGroups: function()
		{
			this.fld.$fieldGroups = this.fld.$sidebar.find('.fld-field-group');
		},

		/**
		 * Finds the group element from its name.
		 *
		 * @param name
		 * @returns {*}
		 * @private
		 */
		_getGroupByName: function(name)
		{
			return this.fld.$fieldGroups.filter('[data-name="' + name.toLowerCase() + '"]');
		}
	});

	window.QuickField = QuickField;

})(jQuery);
