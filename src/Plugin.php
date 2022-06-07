<?php

namespace spicyweb\quickfield;

use craft\base\Plugin as BasePlugin;

/**
 * Class Plugin
 *
 * @package spicyweb\quickfield
 * @author Spicy Web <plugins@spicyweb.com.au>
 * @author Benjamin Fleming
 * @since 1.0.0
 */
class Plugin extends BasePlugin
{
    /**
     * @var Plugin
     */
    public static $plugin;

    /**
     * @inheritdoc
     */
    public function init()
    {
        parent::init();
        self::$plugin = $this;

        /*
        if(craft()->request->isCpRequest() && $this->isCraftRequiredVersion())
        {
            $this->includeResources();
        }
        */
    }

    /*
    protected function includeResources()
    {
        if(!craft()->request->isAjaxRequest() && craft()->userSession->isAdmin())
        {
            craft()->templates->includeCssResource('quickfield/css/main.css');

            craft()->templates->includeJsResource('quickfield/js/QuickField.js');
            craft()->templates->includeJsResource('quickfield/js/FieldModal.js');
            craft()->templates->includeJsResource('quickfield/js/GroupDialog.js');
            craft()->templates->includeJsResource('quickfield/js/main.js');
        }
    }
    */
}
