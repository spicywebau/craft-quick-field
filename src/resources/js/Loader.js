(function($)
{
	/**
	 * Loader class.
	 * Handles loading the data used by Quick Field.
	 */
	var Loader = Garnish.Base.extend({

		UNLOADED: 'unloaded',
		LOADING: 'loading',
		LOADED: 'loaded',
		loadStatus: null,
		groups: null,

		/**
		 * The constructor.
		 */
		init: function()
		{
			this.loadStatus = this.UNLOADED;
			this.load();
		},

		/**
		 * Loads the field settings template file, as well as all the resources that come with it.
		 */
		load: function()
		{
			if(this.loadStatus === this.UNLOADED)
			{
				this.loadStatus = this.LOADING;
				Craft.postActionRequest('quick-field/actions/load', {}, $.proxy(function(response, textStatus)
				{
					if(textStatus === 'success' && response.success)
					{
						this.loadStatus = this.LOADED;
						this.groups = response.groups
						this.trigger('load', {
							template: response.template,
							groups: response.groups,
						});
					}
					else
					{
						this.loadStatus = this.UNLOADED;
						this.trigger('unload');
					}
				}, this));
			}
		},
	},
	{
		/**
		 * (Static) Singleton pattern.
		 *
		 * @returns Loader
		 */
		getInstance: function()
		{
			if(!this._instance)
			{
				this._instance = new Loader();
			}

			return this._instance;
		}
	});

	window.QuickField.Loader = Loader;

})(jQuery);
