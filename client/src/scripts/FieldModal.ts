import * as $ from 'jquery'
import { ActionResponse } from './types/ActionResponse'

interface FieldModal extends GarnishModal {
  $main: JQuery
  $html: JQuery
  $js: JQuery
  $css: JQuery
  $currentHtml: JQuery
  $currentJs: JQuery
  $currentCss: JQuery
  $deleteBtn: JQuery
  $deleteSpinner: JQuery
  $saveBtn: JQuery
  $saveSpinner: JQuery
  $observed: JQuery
  executedJs: object
  loadedCss: object
  observer: MutationObserver
  templateLoaded: boolean
  base: () => void
  destroyListeners: () => void
  destroySettings: () => void
  initListeners: () => void
  initSettings: (e?: any) => void
  parseTemplate: (template: any) => void
  promptForDelete: () => boolean
  runExternalScripts: (files: string[]) => void
}

/**
 * FieldModal class
 * Handles the modal window for creating new fields.
 */
export default Garnish.Modal.extend({

  $body: null,
  $content: null,
  $main: null,
  $footer: null,
  $leftButtons: null,
  $rightButtons: null,
  $deleteBtn: null,
  $saveBtn: null,
  $cancelBtn: null,
  $saveSpinner: null,
  $deleteSpinner: null,
  $loadSpinner: null,

  $html: null,
  $js: null,
  $css: null,
  $currentHtml: null,
  $currentJs: null,
  $currentCss: null,

  $observed: null,
  observer: null,

  executedJs: null,
  loadedCss: null,
  templateLoaded: false,

  /**
     * The constructor.
     */
  init: function (settings) {
    this.base()
    this.setSettings(settings, {
      resizable: true
    })

    this.$currentHtml = $()
    this.$currentJs = $()
    this.$currentCss = $()
    this.$observed = $()

    this.executedJs = {}
    this.loadedCss = {}

    // It's important to observe the DOM for new nodes when rendering the field settings template, as more
    // complex fields may be adding elements to the body such as modal windows or helper elements. Since the
    // settings template gets re-rendered each time the modal window is opened, these elements also get
    // recreated, so if the old ones aren't tracked and removed then they start polluting the DOM and
    // potentially affect performance.
    // This feels like a hack, but unfortunately since field type behaviour cannot be predicted (for example,
    // third-party field type plugins) this is the cleanest possible solution.
    this.observer = new window.MutationObserver($.proxy(function (mutations) {
      for (let i = 0; i < mutations.length; i++) {
        this.$observed = this.$observed.add(mutations[i].addedNodes)
      }
    }, this))

    const $container = $('<form class="modal quick-field-modal" style="display: none; opacity: 0;">').appendTo(Garnish.$bod)

    this.$body = $('<div class="body">').appendTo($container)
    this.$content = $('<div class="content">').appendTo(this.$body)
    this.$main = $('<div class="main">').appendTo(this.$content)
    this.$footer = $('<div class="footer">').appendTo($container)
    this.$loadSpinner = $('<div class="spinner big">').appendTo($container)

    this.$leftButtons = $('<div class="buttons left">').appendTo(this.$footer)
    this.$rightButtons = $('<div class="buttons right">').appendTo(this.$footer)

    this.$deleteBtn = $('<a class="delete error hidden">').text(Craft.t('quick-field', 'Delete')).appendTo(this.$leftButtons)
    this.$deleteSpinner = $('<div class="spinner hidden">').appendTo(this.$leftButtons)

    this.$cancelBtn = $('<div class="btn disabled" role="button">').text(Craft.t('quick-field', 'Cancel')).appendTo(this.$rightButtons)
    this.$saveBtn = $('<div class="btn submit disabled" role="button">').text(Craft.t('quick-field', 'Save')).appendTo(this.$rightButtons)
    this.$saveSpinner = $('<div class="spinner hidden">').appendTo(this.$rightButtons)

    this.setContainer($container)
  },

  /**
     * Prepares the field settings template HTML, CSS and Javascript.
     *
     * @param template
     */
  initTemplate: function (this: FieldModal, template) {
    if (this.templateLoaded) {
      return
    }

    const callback = $.proxy(function (e) {
      this.$html = e.$html
      this.$js = e.$js
      this.$css = e.$css

      this.templateLoaded = true
      this.initListeners()

      if (this.visible) {
        this.initSettings()
      }

      this.off('parseTemplate', callback)
    }, this)

    this.on('parseTemplate', callback)
    this.parseTemplate(template)
  },

  /**
     * Takes raw HTML, CSS and Javascript and parses it ready to be used in the DOM.
     * It also loads any external resources if they are needed.
     *
     * @param template
     */
  parseTemplate: function (this: FieldModal, template) {
    const $head = Garnish.$doc.find('head')
    const $html = $(template.html)
    const $js = $(template.js).filter('script')
    const $css = $(template.css).filter('style, link')

    // Ensure that external stylesheets are loaded asynchronously
    const $cssFiles = $css.filter('link').prop('async', true)
    const $cssInline = $css.filter('style')

    $cssFiles.each((_, $cssFile) => {
      const src = $cssFile.prop('href')

      if (typeof this.loadedCss[src] === 'undefined') {
        $head.append($cssFile)
        this.loadedCss[src] = $cssFile
      }
    })

    // Load external JavaScript files asynchronously, and remove them from being executed again.
    // This assumes that external JavaScript files are simply library files, that don't directly and
    // instantly execute code that modifies the DOM. Library files can be loaded and executed once and
    // reused later on.
    // The JavaScript tags that directly contain code are assumed to be context-dependent, so they are
    // saved to be executed each time the modal is opened.
    const $jsFiles = $js.filter('[src]')
    const $jsInline = $js.filter(':not([src])')

    const jsFiles: string[] = []
    $jsFiles.each((_, $jsFile) => {
      const src = $jsFile.prop('src')

      if (typeof this.executedJs[src] === 'undefined') {
        jsFiles.push(src)
        this.executedJs[src] = true
      }
    })

    const callback: () => void = () => {
      this.off('runExternalScripts', callback)

      this.trigger('parseTemplate', {
        target: this,
        $html: $html,
        $js: $jsInline,
        $css: $cssInline
      })
    }

    this.on('runExternalScripts', callback)
    this.runExternalScripts(jsFiles)
  },

  /**
     * Runs external JavaScript files
     *
     * @param files - An array of URLs (as strings) to JavaScript files
     */
  runExternalScripts: function (files) {
    let filesCount = files.length

    if (filesCount > 0) {
      for (let i = 0; i < files.length; i++) {
        const src = files[i]

        $.getScript(src)
          .done((_, status) => {
            if (status === 'success') {
              filesCount--

              if (filesCount === 0) {
                this.trigger('runExternalScripts', {
                  target: this
                })
              }
            } else {
              Craft.cp.displayError(Craft.t('quick-field', 'Could not load all resources.'))
            }
          })
          .catch(() => Craft.cp.displayError(Craft.t('quick-field', 'Could not load all resources.')))
      }
    } else {
      this.trigger('runExternalScripts', {
        target: this
      })
    }
  },

  /**
     * Binds all listeners so the quick field buttons can start working.
     */
  initListeners: function () {
    this.$cancelBtn.removeClass('disabled')
    this.$saveBtn.removeClass('disabled')

    this.addListener(this.$cancelBtn, 'activate', 'closeModal')
    this.addListener(this.$saveBtn, 'activate', 'saveField')
    this.addListener(this.$deleteBtn, 'activate', 'deleteField')

    this.on('show', this.initSettings)
    this.on('fadeOut', this.destroySettings)

    this.enable()
  },

  /**
     * Unbinds all listeners.
     */
  destroyListeners: function () {
    this.$cancelBtn.addClass('disabled')
    this.$saveBtn.addClass('disabled')

    this.removeListener(this.$cancelBtn, 'activate')
    this.removeListener(this.$saveBtn, 'activate')
    this.removeListener(this.$deleteBtn, 'activate')

    this.off('show', this.initSettings)
    this.off('fadeOut', this.destroySettings)

    this.disable()
  },

  /**
     * Initialises the HTML, CSS and JavaScript for the modal window.
     */
  initSettings: function (this: FieldModal, e) {
    const that: FieldModal = e?.target ?? this

    // If the template files aren't loaded yet, just cancel initialisation of the settings.
    if (!that.templateLoaded) {
      return
    }

    that.$currentHtml = e?.$html ?? that.$html.clone()
    that.$currentJs = e?.$js ?? that.$js.clone()
    that.$currentCss = e?.$css ?? that.$css.clone()

    // Save any new nodes that are added to the body during initialisation, so they can be safely removed later.
    that.$observed = $()
    that.observer.observe(Garnish.$bod[0], { childList: true, subtree: false })

    that.$main.append(that.$currentHtml)
    Garnish.$bod.append(that.$currentJs)

    // Only show the delete button if editing a field
    const $fieldId = that.$main.find('input[name="qf[fieldId]"]')
    that.$deleteBtn.toggleClass('hidden', $fieldId.length === 0)

    Craft.initUiElements()

    // Rerun the external scripts as some field types may need to make DOM changes in their external files.
    // This means that libraries are being initialized multiple times, but hopefully they're smart enough to
    // deal with that. So far, no issues.
    const callback: () => void = () => {
      that.off('runExternalScripts', callback)

      // Stop observing after a healthy timeout to ensure all mutations are captured.
      setTimeout(() => that.observer.disconnect(), 1)
    }

    that.on('runExternalScripts', callback)
    that.runExternalScripts(Object.keys(that.executedJs))
  },

  /**
     * Event handler for when the modal window finishes fading out after hiding.
     * Clears out all events and elements of the modal.
     *
     * @param e
     */
  destroySettings: function (e) {
    const that = e?.target ?? this

    that.$currentHtml.remove()
    that.$currentJs.remove()
    that.$currentCss.remove()
    that.$observed.remove()

    that.$deleteBtn.addClass('hidden')
  },

  /**
     * Event handler for the Close button.
     * Hides the modal window from view.
     */
  closeModal: function () {
    this.hide()
  },

  /**
     * Loads a template for editing an existing field.
     *
     * @param id
     */
  editField: function (id) {
    this.destroyListeners()
    this.show()
    this.initListeners()

    this.$loadSpinner.removeClass('hidden')
    const data = { fieldId: id }

    Craft.sendActionRequest('POST', 'quick-field/actions/edit-field', { data })
      .then(response => {
        const callback: (any) => void = (e) => {
          this.destroySettings()
          this.initSettings(e)
          this.off('parseTemplate', callback)
        }

        this.on('parseTemplate', callback)
        this.parseTemplate(response.data.template)
      })
      .catch(response => {
        Craft.cp.displayError(
          response.error ?? Craft.cp.displayError(Craft.t('quick-field', 'An unknown error occurred.'))
        )
        this.hide()
      })
      .finally(() => this.$loadSpinner.addClass('hidden'))
  },

  /**
     * Event handler for the save button.
     * Saves the new field form to the database.
     *
     * @param e
     */
  saveField: function (this: FieldModal, e) {
    e?.preventDefault()

    if (this.$saveBtn.hasClass('disabled') || !this.$saveSpinner.hasClass('hidden')) {
      return
    }

    this.destroyListeners()

    this.$saveSpinner.removeClass('hidden')
    const data = this.$container.serialize()

    const inputId = this.$container.find('input[name="qf[fieldId]"]')
    const id = inputId.length > 0 ? inputId.val() : null

    Craft.sendActionRequest('POST', 'quick-field/actions/save-field', { data })
      .then(response => {
        this.initListeners()
        const eventData = {
          target: this,
          field: response.data.field,
          elementSelector: response.data.elementSelector
        }

        if (id === null) {
          this.trigger('newField', eventData)
          Craft.cp.displayNotice(Craft.t('quick-field', 'New field created.'))
        } else {
          this.trigger('saveField', eventData)
          Craft.cp.displayNotice(Craft.t('quick-field', '\'{name}\' field saved.', { name: response.data.field.name }))
        }

        this.hide()
      })
      .catch((response: ActionResponse) => {
        if (response.data.template !== null) {
          if (this.visible) {
            const callback: (any) => void = (e) => {
              this.initListeners()
              this.destroySettings()
              this.initSettings(e)
              this.off('parseTemplate', callback)
            }

            this.on('parseTemplate', callback)
            this.parseTemplate(response.data.template)
            Garnish.shake(this.$container)
          } else {
            this.initListeners()
          }
        } else {
          this.initListeners()
          Craft.cp.displayError(Craft.t('quick-field', 'An unknown error occurred.'))
        }
      })
      .finally(() => this.$saveSpinner.addClass('hidden'))
  },

  /**
     * Event handler for the delete button.
     * Deletes the field from the database.
     *
     * @param e
     */
  deleteField: function (this: FieldModal, e) {
    e?.preventDefault()

    if (this.$deleteBtn.hasClass('disabled') || !this.$deleteSpinner.hasClass('hidden')) {
      return
    }

    if (this.promptForDelete()) {
      this.destroyListeners()

      this.$deleteSpinner.removeClass('hidden')

      const inputId = this.$container.find('input[name="qf[fieldId]"]')
      const id = inputId.length > 0 ? inputId.val() : null

      if (id === null) {
        Craft.cp.displayError(Craft.t('quick-field', 'An unknown error occurred.'))
        return
      }

      const data = { fieldId: id }

      Craft.sendActionRequest('POST', 'quick-field/actions/delete-field', { data })
        .then(response => {
          this.initListeners()
          this.trigger('deleteField', {
            target: this,
            field: response.data.field
          })

          Craft.cp.displayNotice(Craft.t('quick-field', '\'{name}\' field deleted.', { name: response.data.field.name }))
          this.hide()
        })
        .catch(response => {
          Craft.cp.displayError(
            response.error ?? Craft.cp.displayError(Craft.t('quick-field', 'An unknown error occurred.'))
          )
          this.hide()
        })
        .finally(() => this.$deleteSpinner.addClass('hidden'))
    }
  },

  /**
     * Delete confirmation dialog box.
     */
  promptForDelete: function () {
    return confirm(Craft.t('quick-field', 'Are you sure you want to delete this field?'))
  },

  /**
     * Prevents the modal from closing if it's disabled.
     * This fixes issues if the modal is closed when saving/deleting fields.
     */
  hide: function (this: FieldModal) {
    if (!this._disabled) {
      this.base()
    }
  },

  /**
     * Removes everything to do with the modal form the DOM.
     */
  destroy: function () {
    this.base()

    this.destroyListeners()
    this.destroySettings()

    this.$shade.remove()
    this.$container.remove()

    this.trigger('destroy')
  }
})
