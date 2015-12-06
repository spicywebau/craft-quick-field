(function($)
{
	var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

	// If mutation observer is not supported, create a harness for it for graceful degradation.
	// Older browsers could be supported through the DOMNodeInserted event, but that can be saved for another day...
	if(!MutationObserver)
	{
		MutationObserver = function(){};
		MutationObserver.prototype.observe = function(){};
		MutationObserver.prototype.disconnect = function(){};
	}

	/**
	 * FieldModal class
	 * Handles the modal window for creating new fields.
	 */
	var FieldModal = Garnish.Modal.extend({

		$body:        null,
		$content:     null,
		$main:        null,
		$footer:      null,
		$buttons:     null,
		$saveBtn:     null,
		$cancelBtn:   null,
		$saveSpinner: null,
		$loadSpinner: null,

		$html:        null,
		$js:          null,
		$css:         null,
		$currentHtml: null,
		$currentJs:   null,

		$observed:    null,
		observer:     null,

		/**
		 * The constructor.
		 */
		init: function(settings)
		{
			this.base();

			this.setSettings(settings, {
				resizable: true
			});

			// It's important to observe the DOM for new nodes when rendering the field settings template, as more
			// complex fields may be adding elements to the body such as modal windows or helper elements. Since the
			// settings template gets re-rendered each time the modal window is opened, these elements also get
			// recreated, so if the old ones aren't tracked and removed then they start polluting the DOM and
			// potentially affect performance.
			// This feels like a hack, but unfortunately since field type behaviour cannot be predicted (for example,
			// third-party field type plugins) this is the cleanest possible solution.
			this.observer = new MutationObserver($.proxy(function(mutations)
			{
				for(var i = 0; i < mutations.length; i++)
				{
					this.$observed = this.$observed.add(mutations[i].addedNodes);
				}
			}, this));

			var $container    = $('<form class="modal quick-field-modal" style="display: none; opacity: 0;">').appendTo(Garnish.$bod);

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

			// Loads the field settings template file, as well as all the resources that come with it
			Craft.postActionRequest('quickField/getFieldSettings', {}, $.proxy(function(response, textStatus)
			{
				if(textStatus === 'success')
				{
					this.$loadSpinner.remove();
					this.initTemplate(response);
				}
				else
				{
					this.destroy();
				}
			}, this));
		},

		/**
		 * Prepares the field settings template HTML, CSS and Javascript.
		 *
		 * @param response
		 */
		initTemplate: function(response)
		{
			this.$saveBtn.removeClass('disabled');

			var $html = $(response.fieldSettingsHtml);
			var $js   = $(response.fieldSettingsJs).filter('script');
			var $css  = $(response.fieldSettingsCss).filter('style, link');

			// Watch for new groups so they can be added to the group select field
			var $group = $html.find('#group');
			var dialog = QuickField.GroupDialog.getInstance();
			dialog.on('newGroup', $.proxy(function(e)
			{
				$group.append($('<option>', {
					value: e.group.id,
					text:  e.group.name
				}));
			}, this));

			// Ensure that external stylesheets are loaded asynchronously
			$css.filter('link').prop('async', true);

			// Load external Javascript files asynchronously, and remove them from being executed again.
			// This assumes that external Javascript files are simply library files, that don't directly and
			// instantly execute code that modifies the DOM. Library files can be loaded and executed once and
			// reused later on.
			// The Javascript tags that directly contain code are assumed to be context-dependent, so they are
			// saved to be executed each time the modal is opened.
			var jsFiles = [];
			var $jsInline = $js.filter(function()
			{
				var $this = $(this);
				var src = $this.prop('src');
				var hasSrc = !!src;

				if(hasSrc)
				{
					jsFiles.push(src);
				}

				return !hasSrc;
			});

			var jsFilesCount = jsFiles.length;
			for(var i = 0; i < jsFiles.length; i++)
			{
				var src = jsFiles[i];

				$.getScript(src, $.proxy(function(data, status)
				{
					if(status === 'success')
					{
						jsFilesCount--;

						if(jsFilesCount === 0)
						{
							this.initListeners();

							if(this.visible)
							{
								this.initSettings();
							}
						}
					}
				}, this));
			}

			this.$html = $html;
			this.$js   = $jsInline;
			this.$css  = $css;

			Garnish.$doc.find('head').append(this.$css);
		},

		/**
		 * Binds all listeners so the quick field buttons can start working.
		 */
		initListeners: function()
		{
			this.addListener(this.$cancelBtn, 'activate', 'closeModal');
			this.addListener(this.$saveBtn,   'activate', 'saveField');

			this.on('show',    this.initSettings);
			this.on('fadeOut', this.destroySettings);
		},

		/**
		 * Unbinds all listeners.
		 */
		destroyListeners: function()
		{
			this.removeListener(this.$cancelBtn, 'activate');
			this.removeListener(this.$saveBtn,   'activate');

			this.off('show');
			this.off('fadeOut');
		},

		/**
		 * Initialises the HTML, CSS and Javascript for the modal window.
		 */
		initSettings: function(e)
		{
			var that = e && e.target ? e.target : this;

			that.$currentHtml = that.$html.clone();
			that.$currentJs   = that.$js.clone();

			// Save any new nodes that are added to the body during initialisation, so they can be safely removed later.
			that.$observed = $();
			that.observer.observe(Garnish.$bod[0], {childList: true, subtree: false});

			that.$main.append(that.$currentHtml);
			Garnish.$bod.append(that.$currentJs);

			Craft.initUiElements();

			// Stop observing after a healthy timeout to ensure all mutations are captured.
			setTimeout(function()
			{
				that.observer.disconnect();
			}, 1);
		},

		/**
		 * Event handler for when the modal window finishes fading out after hiding.
		 * Clears out all events and elements of the modal.
		 */
		destroySettings: function(e)
		{
			var that = e && e.target ? e.target : this;

			that.$currentHtml.remove();
			that.$currentJs.remove();
			that.$observed.remove();
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

				var statusSuccess = (textStatus === 'success');

				if(statusSuccess && response.success)
				{
					this.trigger('newField', {
						target: this,
						field: response.field
					});

					Craft.cp.displayNotice(Craft.t('New field created'));

					this.hide();
				}
				else if(statusSuccess && response.error)
				{
					Craft.cp.displayError(response.error);
				}
				else
				{
					Craft.cp.displayError(Craft.t('An unknown error occurred.'));
				}
			}, this));
		},

		/**
		 * Removes everything to do with the modal form the DOM.
		 */
		destroy: function()
		{
			this.base.destroy();

			this.destroyListeners();
			this.destroySettings();

			this.$shade.remove();
			this.$container.remove();

			this.trigger('destroy');
		}
	},
	{
		/**
		 * (Static) Singleton pattern.
		 *
		 * @returns FieldModal
		 */
		getInstance: function()
		{
			if(!this._instance)
			{
				this._instance = new FieldModal();
			}

			return this._instance;
		}
	});

	window.QuickField.FieldModal = FieldModal;

})(jQuery);
