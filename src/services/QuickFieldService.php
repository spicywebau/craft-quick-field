<?php

namespace spicyweb\quickfield\services;

use benf\neo\Field as NeoField;
use Craft;
use yii\base\Component;

/**
 * Class QuickFieldService
 *
 * @package spicyweb\quickfield\services
 * @author Spicy Web <plugins@spicyweb.com.au>
 * @author Benjamin Fleming
 * @since 1.0.0
 */
class QuickFieldService extends Component
{
    public function getFieldTypes()
    {
        $fieldTypes = Craft::$app->getFields()->getAllFieldTypes();

        if (Craft::$app->getPlugins()->getPlugin('neo')) {
            return array_filter($fieldTypes, function($fieldType) {
                return !($fieldType === NeoField::class);
            });
        }

        return $fieldTypes;
    }
}
