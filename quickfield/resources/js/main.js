(function($)
{
	// Urgh this is not a nice way of getting access to field layout instances... but it must be done

	var FLD = Craft.FieldLayoutDesigner;
	var FLDinit = FLD.prototype.init;

	FLD.prototype.init = function()
	{
		FLDinit.apply(this, arguments);
		init(this);
	};

	var QuickFieldModal = Garnish.Modal.extend({

		$buttons: null,
		$closeBtn: null,

		init: function()
		{
			var $container = $('<div class="modal quickfieldmodal"></div>').appendTo(Garnish.$bod);
			var $body = $('<div class="body"></div>').appendTo($container);
			var $content = $('<div class="content"></div>').appendTo($body);
			var $main = $('<div class="main"></div>').appendTo($content);
			var $footer = $('<div class="footer"/>').appendTo($container);

			this.base($container, {

			});

			this.$buttons = $('<div class="buttons rightalign first"/>').appendTo($footer);
			this.$closeBtn = $('<div class="btn">' + Craft.t('Close') + '</div>').appendTo(this.$buttons);

			this.addListener(this.$closeBtn, 'activate', 'closeModal');
		},

		onFadeOut: function()
		{
			this.destroy();
			this.$shade.remove();
			this.$container.remove();

			this.removeListener(this.$closeBtn, 'click');
		},

		closeModal: function()
		{
			this.hide();
		}

	});

	var GroupDialog = Garnish.Base.extend({

		$button: null,
		fld: null,

		init: function($button, fld)
		{
			this.$button = $button;
			this.fld = fld;

			this.addListener(this.$button, 'activate', 'addNewGroup');
		},

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
							var errors = this.flattenErrors(response.errors);
							alert(Craft.t('Could not create the group:')+ "\n\n" + errors.join("\n"));
						}
						else
						{
							Craft.cp.displayError();
						}
					}
				}, this));
			}
		},

		promptForGroupName: function(oldName)
		{
			return prompt(Craft.t('What do you want to name your group?'), oldName);
		},

		flattenErrors: function(responseErrors)
		{
			var errors = [];

			for(var attribute in responseErrors) if(responseErrors.hasOwnProperty(attribute))
			{
				errors = errors.concat(responseErrors[attribute]);
			}

			return errors;
		},

		addGroupTab: function(name, id)
		{
			var settings = this.fld.settings;
			var container = this.fld.$unusedFieldContainer;
			var grid = this.fld.unusedFieldGrid;
			var drag = this.fld.tabDrag;

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
		}
	});

	function init(fld)
	{
		var container = $('<div class="newfieldbtn-container">').insertAfter(fld.$unusedFieldContainer);
		var groupButton = $('<div class="btn add icon" tabindex="0">New Group</div>').appendTo(container);
		var fieldButton = $('<div class="btn add icon" tabindex="0">New Field</div>').appendTo(container);

		var dialog = new GroupDialog(groupButton, fld);

		fieldButton.on('click', function(e)
		{
			fieldButton.trigger('blur');

			var modal = new QuickFieldModal();
		});
	}

})(jQuery);
