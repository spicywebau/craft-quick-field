import { LoadResponse } from './types/Response'

/**
 * An interface representing a `Loader`.
 */
interface LoaderInterface extends GarnishComponent {
  isUnloaded: () => boolean
  load: () => void
}

/**
 * The state of a `Loader`.
 */
enum LoadStatus {
  UNLOADED,
  LOADING,
  LOADED
}

/**
 * Loader class.
 * Handles loading the data used by Quick Field.
 */
const Loader = Garnish.Base.extend({

  loadStatus: null,

  /**
   * The constructor.
   * @public
   */
  init (): void {
    this.loadStatus = LoadStatus.UNLOADED
    this.load()
  },

  /**
   * Loads the field settings template file, as well as all the resources that come with it.
   * @public
   */
  load (): void {
    if (this.loadStatus === LoadStatus.UNLOADED) {
      this.loadStatus = LoadStatus.LOADING
      Craft.sendActionRequest('POST', 'quick-field/actions/load', {})
        .then((response: LoadResponse) => {
          this.loadStatus = LoadStatus.LOADED
          this.trigger('load', {
            template: response.data.template,
            groups: response.data.groups
          })
        })
        .catch(_ => {
          this.loadStatus = LoadStatus.UNLOADED
          this.trigger('unload')
        })
    }
  },

  /**
   * Whether the initial load of Quick Field data hasn't occurred.
   * @returns Whether the load status is unloaded
   * @public
   */
  isUnloaded (): boolean {
    return this.loadStatus === LoadStatus.UNLOADED
  }
})

export { Loader, LoaderInterface }
