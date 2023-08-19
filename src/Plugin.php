<?php

namespace spicyweb\quickfield;

use Craft;
use craft\base\Plugin as BasePlugin;
use craft\web\Application;
use spicyweb\quickfield\assets\QuickFieldAsset;
use spicyweb\quickfield\controllers\QuickFieldController;

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
     * @var Plugin|null
     */
    public static ?Plugin $plugin = null;

    /**
     * @inheritdoc
     */
    public $controllerMap = [
        'actions' => QuickFieldController::class,
    ];

    /**
     * @inheritdoc
     */
    public function init(): void
    {
        parent::init();
        self::$plugin = $this;
        $this->_includeResources();
    }

    /**
     * Includes the style/script resources for Quick Field for admin users in the Craft control panel.
     */
    private function _includeResources(): void
    {
        Craft::$app->on(Application::EVENT_INIT, function() {
            $request = Craft::$app->getRequest();

            if (
                $request->getIsCpRequest() &&
                !$request->getIsAjax() &&
                Craft::$app->getUser()->getIsAdmin() &&
                Craft::$app->getConfig()->getGeneral()->allowAdminChanges
            ) {
                Craft::$app->getView()->registerAssetBundle(QuickFieldAsset::class);
            }
        });
    }
}
