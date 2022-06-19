<?php

namespace spicyweb\quickfield\assets;

use craft\web\AssetBundle;
use craft\web\assets\cp\CpAsset;
use craft\web\assets\fieldsettings\FieldSettingsAsset;

/**
 * Class QuickFieldAsset
 *
 * @package spicyweb\quickfield\assets
 * @author Spicy Web <plugins@spicyweb.com.au>
 * @since 1.0.0
 */
class QuickFieldAsset extends AssetBundle
{
    /**
     * @inheritdoc
     */
    public function init()
    {
        $this->sourcePath = '@spicyweb/quickfield/resources';

        $this->depends = [
            CpAsset::class,
            FieldSettingsAsset::class,
        ];

        $this->css = [
            'css/main.css',
        ];
        $this->js = [
            'js/main.js',
            'js/QuickField.js',
            'js/FieldModal.js',
            'js/GroupDialog.js',
            'js/Loader.js',
        ];

        parent::init();
    }
}
