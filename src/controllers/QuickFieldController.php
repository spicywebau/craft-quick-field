<?php

namespace spicyweb\quickfield\controllers;

use benf\neo\Field as NeoField;
use Craft;
use craft\base\Field;
use craft\fieldlayoutelements\CustomField;
use craft\fields\PlainText;
use craft\helpers\ArrayHelper;
use craft\helpers\Html;
use craft\models\FieldLayout;
use craft\web\Controller;
use yii\web\BadRequestHttpException;
use yii\web\ForbiddenHttpException;
use yii\web\Response;

/**
 * Class QuickFieldController
 *
 * @package spicyweb\quickfield\controllers
 * @author Spicy Web <plugins@spicyweb.com.au>
 * @author Benjamin Fleming
 * @since 1.0.0
 */
class QuickFieldController extends Controller
{
    /**
     * Loads a field settings page and field group data.
     *
     * @return Response
     * @throws BadRequestHttpException if the request doesn't accept JSON
     * @throws ForbiddenHttpException if the user isn't an admin
     */
    public function actionLoad(): Response
    {
        $this->requireAdmin();
        $this->requireAcceptsJson();

        $data = [];
        $template = $this->_getTemplate();

        if (isset($template['error'])) {
            $data['success'] = false;
            $data['error'] = $template['error'];
        } else {
            $data['success'] = true;
            $data['template'] = $template;
            $data['groups'] = Craft::$app->getFields()->getAllGroups();
        }

        return $this->asJson($data);
    }

    /**
     * Edits an existing field.
     *
     * @return Response
     * @throws BadRequestHttpException if the request doesn't accept JSON, or isn't a POST request
     * @throws ForbiddenHttpException if the user isn't an admin
     */
    public function actionEditField(): Response
    {
        $this->requireAdmin();
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $fieldsService = Craft::$app->getFields();
        $id = Craft::$app->getRequest()->getRequiredBodyParam('fieldId');
        $field = $fieldsService->getFieldById($id);

        if (!$field) {
            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-field', 'The field requested to edit no longer exists.'),
            ]);
        }

        $group = $fieldsService->getGroupById($field->groupId);

        return $this->asJson([
            'success' => true,
            'field' => [
                'id' => $field->id,
                'name' => $field->name,
                'handle' => $field->handle,
                'instructions' => $field->instructions,
                'translationMethod' => $field->translationMethod,
                'translationKeyFormat' => $field->translationKeyFormat,
                'group' => !$group ? [] : [
                    'id' => $group->id,
                    'name' => $group->name,
                ],
            ],
            'template' => $this->_getTemplate($field),
        ]);
    }

    /**
     * Saves a new field to the database.
     *
     * @return Response
     * @throws BadRequestHttpException if the request doesn't accept JSON, or isn't a POST request
     * @throws ForbiddenHttpException if the user isn't an admin
     */
    public function actionSaveField(): Response
    {
        $this->requireAdmin();
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $fieldsService = Craft::$app->getFields();
        $request = Craft::$app->getRequest();
        $view = Craft::$app->getView();

        $config = [
            'id' => $request->getBodyParam('qf.fieldId'),
            'groupId' => $request->getRequiredBodyParam('qf.group'),
            'name' => $request->getBodyParam('qf.name'),
            'handle' => $request->getBodyParam('qf.handle'),
            'instructions' => $request->getBodyParam('qf.instructions'),
            'translationMethod' => $request->getBodyParam('qf.translationMethod'),
            'translationKeyFormat' => $request->getBodyParam('qf.translationKeyFormat'),
            'type' => $request->getRequiredBodyParam('qf.type'),
        ];
        $typeSettings = $request->getBodyParam('qf.types');
        $layoutTypes = $request->getRequiredBodyParam('qf.layoutTypes');

        if (isset($typeSettings[$config['type']])) {
            $config['settings'] = $typeSettings[$config['type']];
        }

        $field = $fieldsService->createField($config);
        $group = $fieldsService->getGroupById($field->groupId);
        $success = $group && $fieldsService->saveField($field);

        if (!$group || !$fieldsService->saveField($field)) {
            return $this->asFailure(data: [
                'errors' => $field->getErrors(),
                'template' => $this->_getTemplate($field),
            ]);
        }

        // Create the element selector HTML to be inserted into the sidebar
        // This is based on `\craft\helpers\Cp::_fldElementSelectorHtml()` (but rewritten to accommodate our need for
        // multiple element selectors, since we might have more than one FLD on a page with different element types,
        // e.g. Craft Commerce product types and variants)
        $layoutField = new CustomField($field);
        $selectorHtml = $layoutField->selectorHtml();

        $classAttr = [
            'fld-element',
            'unused'
        ];
        $dataAttr = [
            'keywords' => implode(' ', array_map('mb_strtolower', $layoutField->keywords())),
            'config' => ['type' => CustomField::class] + $layoutField->toArray(),
            'has-custom-width' => true,
        ];
        $elementSelectors = [];

        $oldNamespace = $view->getNamespace();
        $namespace = $view->namespaceInputName('element-ELEMENT_UID');
        $view->setNamespace($namespace);

        foreach ($layoutTypes as $layoutType) {
            $layoutField->setLayout(new FieldLayout(['type' => $layoutType]));
            $view->startJsBuffer();
            $settingsHtml = $view->namespaceInputs($layoutField->getSettingsHtml());
            $settingsJs = $view->clearJsBuffer(false);

            $elementSelectors[$layoutType] = Html::modifyTagAttributes($selectorHtml, [
                'class' => $classAttr,
                'data' => $dataAttr + [
                    'settings-namespace' => $namespace,
                    'settings-html' => $settingsHtml ?: false,
                    'settings-js' => $settingsJs ?: false,
                ],
            ]);
        }

        $view->setNamespace($oldNamespace);

        return $this->asSuccess(data: [
            'field' => [
                'id' => $field->id,
                'name' => $field->name,
                'handle' => $field->handle,
                'instructions' => $field->instructions,
                'translationMethod' => $field->translationMethod,
                'translationKeyFormat' => $field->translationKeyFormat,
                'group' => !$group ? [] : [
                    'id' => $group->id,
                    'name' => $group->name,
                ],
            ],
            'elementSelectors' => $elementSelectors,
        ]);
    }

    /**
     * Deletes a field from the database.
     *
     * @return Response
     * @throws BadRequestHttpException if the request doesn't accept JSON, or isn't a POST request
     * @throws ForbiddenHttpException if the user isn't an admin
     */
    public function actionDeleteField(): Response
    {
        $this->requireAdmin();
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $fieldsService = Craft::$app->getFields();
        $id = Craft::$app->getRequest()->getRequiredBodyParam('fieldId');
        $field = $fieldsService->getFieldById($id);

        if (!$field) {
            return $this->asJson([
                'success' => false,
                'error' => Craft::t('quick-field', 'The field requested to delete no longer exists.'),
            ]);
        }

        $group = $fieldsService->getGroupById($field->groupId);
        $data = [
            'field' => [
                'id' => $field->id,
                'name' => $field->name,
                'handle' => $field->handle,
                'instructions' => $field->instructions,
                'translationMethod' => $field->translationMethod,
                'translationKeyFormat' => $field->translationKeyFormat,
                'group' => !$group ? [] : [
                    'id' => $group->id,
                    'name' => $group->name,
                ],
            ],
        ];

        try {
            $fieldsService->deleteField($field);
            $data['success'] = true;
        } catch (\Exception $e) {
            $data += [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }

        return $this->asJson($data);
    }

    /**
     * Loads the field settings template and returns all HTML, CSS and Javascript.
     *
     * @param Field|null $field
     * @return array
     */
    private function _getTemplate(Field $field = null): array
    {
        // Make sure a field group exists first
        $groups = ArrayHelper::index(Craft::$app->getFields()->getAllGroups(), 'id');

        if (empty($groups)) {
            return [
                'error' => Craft::t('quick-field', 'No field groups exist.'),
            ];
        }

        $fieldsService = Craft::$app->getFields();
        $fieldTypes = $this->_getFieldTypes();
        $fieldTypeOptions = [];
        $supportedTranslationMethods = [];
        $compatibleFieldTypes = [];

        if ($field) {
            foreach ($fieldsService->getCompatibleFieldTypes($field) as $compatibleFieldType) {
                $compatibleFieldTypes[$compatibleFieldType] = true;
            }
        }

        foreach ($fieldTypes as $fieldType) {
            $warning = $field && !isset($compatibleFieldTypes[$fieldType]) ? ' ⚠️' : '';
            $fieldTypeOptions[] = [
                'label' => $fieldType::displayName() . $warning,
                'value' => $fieldType,
            ];
            $supportedTranslationMethods[$fieldType] = $fieldType::supportedTranslationMethods();
        };

        ArrayHelper::multisort($fieldTypeOptions, 'label');

        $data = [
            'field' => $field ?? $fieldsService->createField(PlainText::class),
            'fieldTypes' => $fieldTypes,
            'fieldTypeOptions' => $fieldTypeOptions,
            'groups' => $groups,
            'supportedTranslationMethods' => $supportedTranslationMethods,
        ];

        if ($data['field']->id !== null) {
            $data['fieldId'] = $data['field']->id;
        }

        $view = Craft::$app->getView();
        $html = $view->renderTemplate('quick-field/_fieldsettings', $data);

        return [
            'html' => $html,
            'js' => $view->getBodyHtml(),
            'css' => $view->getHeadHtml(),
        ];
    }

    /**
     * Returns the field types that Quick Field supports creating.
     *
     * @return string[]
     */
    private function _getFieldTypes(): array
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
