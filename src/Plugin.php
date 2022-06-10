<?php

namespace spicyweb\quickfield;

use Craft;
use craft\base\Plugin as BasePlugin;
use spicyweb\quickfield\assets\QuickFieldAsset;
use spicyweb\quickfield\services\QuickFieldService;

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

        $this->setComponents([
            'service' => QuickFieldService::class,
        ]);

        $this->_includeResources();
    }

    private function _includeResources()
    {
        $request = Craft::$app->getRequest();

        if ($request->getIsCpRequest() && !$request->getIsAjax() && Craft::$app->getUser()->getIsAdmin()) {
            Craft::$app->getView()->registerAssetBundle(QuickFieldAsset::class);
        }
    }
}
