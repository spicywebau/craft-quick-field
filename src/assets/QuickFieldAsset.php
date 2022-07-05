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
        ];

        parent::init();
    }

    /**
     * @inheritdoc
     */
    public function registerAssetFiles($view)
    {
        $view->registerTranslations('quick-field', [
            '\'{name}\' field saved.',
            '\'{name}\' field deleted.',
            'An unknown error occurred.',
            'Are you sure you want to delete this field?',
            'Are you sure you want to delete this group and all its fields?',
            'Cancel',
            'Could not delete the group.',
            'Could not load all resources.',
            'Could not save the group:',
            'Delete',
            'Invalid field group: {groupName}',
            'New Field',
            'New field created.',
            'New Group',
            'Rename',
            'Save',
            'Settings',
            'What do you want to name the group?',
        ]);

        parent::registerAssetFiles($view);
    }
}
