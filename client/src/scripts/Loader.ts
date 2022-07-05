/**
 * Loader class.
 * Handles loading the data used by Quick Field.
 */
export default Garnish.Base.extend({

  UNLOADED: 'unloaded',
  LOADING: 'loading',
  LOADED: 'loaded',
  loadStatus: null,

  /**
     * The constructor.
     */
  init: function () {
    this.loadStatus = this.UNLOADED
    this.load()
  },

  /**
     * Loads the field settings template file, as well as all the resources that come with it.
     */
  load: function () {
    if (this.loadStatus === this.UNLOADED) {
      this.loadStatus = this.LOADING
      Craft.sendActionRequest('POST', 'quick-field/actions/load', {})
        .then(response => {
          this.loadStatus = this.LOADED
          this.trigger('load', {
            template: response.data.template,
            groups: response.data.groups
          })
        })
        .catch(_ => {
          this.loadStatus = this.UNLOADED
          this.trigger('unload')
        })
    }
  }
})
