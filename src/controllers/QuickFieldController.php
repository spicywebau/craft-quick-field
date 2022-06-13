<?php

namespace spicyweb\quickfield\controllers;

use Craft;
use craft\base\Field;
use craft\fieldlayoutelements\CustomField;
use craft\fields\PlainText;
use craft\helpers\ArrayHelper;
use craft\web\Controller;
use spicyweb\quickfield\Plugin as QuickField;

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
     * @throws HttpException
     */
    public function actionLoad()
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
     * @throws HttpException
     */
    public function actionEditField()
    {
        $this->requireAdmin();
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $fieldsService = Craft::$app->getFields();
        $id = Craft::$app->getRequest()->getRequiredBodyParam('fieldId');
        $field = $fieldsService->getFieldById($id);

        if(!$field)
        {
            return $this->asJson([
                'success' => false,
                'error'   => Craft::t('quick-field', 'The field requested to edit no longer exists.'),
            ]);
        }

        $group = $fieldsService->getGroupById($field->groupId);

        return $this->asJson([
            'success' => true,
            'field'   => [
                'id'           => $field->id,
                'name'         => $field->name,
                'handle'       => $field->handle,
                'instructions' => $field->instructions,
                // 'translatable' => $field->translatable,
                'group'        => !$group ? [] : [
                    'id'   => $group->id,
                    'name' => $group->name,
                ],
            ],
            'template' => $this->_getTemplate($field),
        ]);
    }

    /**
     * Saves a new field to the database.
     *
     * @throws HttpException
     * @throws \Exception
     */
    public function actionSaveField()
    {
        $this->requireAdmin();
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $fieldsService = Craft::$app->getFields();
        $request = Craft::$app->getRequest();
        $config = [
            'id' => $request->getBodyParam('qf.fieldId'),
            'groupId' => $request->getRequiredBodyParam('qf.group'),
            'name' => $request->getBodyParam('qf.name'),
            'handle' => $request->getBodyParam('qf.handle'),
            'instructions' => $request->getBodyParam('qf.instructions'),
            // 'translatable' => $request->getBodyParam('qf.translatable'),
            'type' => $request->getRequiredBodyParam('qf.type'),
        ];
        $typeSettings = $request->getBodyParam('qf.types');

        if(isset($typeSettings[$config['type']]))
        {
            $config['settings'] = $typeSettings[$config['type']];
        }

        $field = $fieldsService->createField($config);
        $group = $fieldsService->getGroupById($field->groupId);
        $success = $group && $fieldsService->saveField($field);

        return $this->asJson([
            'success' => $success,
            'errors'  => $field->getErrors(),
            'field'   => [
                'id'           => $field->id,
                'name'         => $field->name,
                'handle'       => $field->handle,
                'instructions' => $field->instructions,
                // 'translatable' => $field->translatable,
                'group'        => !$group ? [] : [
                    'id'   => $group->id,
                    'name' => $group->name,
                ],
            ],
            'elementSelector' => !$success ? null : Craft::$app->getView()->renderTemplate('quick-field/_elementselector', [
                'field' => new CustomField($field),
            ]),
            'template' => $success ? null : $this->_getTemplate($field),
        ]);
    }

    /**
     * Deletes a field from the database.
     *
     * @throws HttpException
     */
    public function actionDeleteField()
    {
        $this->requireAdmin();
        $this->requirePostRequest();
        $this->requireAcceptsJson();

        $fieldsService = Craft::$app->getFields();
        $id = Craft::$app->getRequest()->getRequiredBodyParam('fieldId');
        $field = $fieldsService->getFieldById($id);

        if(!$field)
        {
            return $this->asJson([
                'success' => false,
                'error'   => Craft::t('quick-field', 'The field requested to delete no longer exists.'),
            ]);
        }

        $group = $fieldsService->getGroupById($field->groupId);
        $data = [
            'field' => [
                'id'           => $field->id,
                'name'         => $field->name,
                'handle'       => $field->handle,
                'instructions' => $field->instructions,
                // 'translatable' => $field->translatable,
                'group'        => !$group ? [] : [
                    'id'   => $group->id,
                    'name' => $group->name,
                ],
            ],
        ];

        try
        {
            $fieldsService->deleteField($field);
            $data['success'] = true;
        }
        catch(\Exception $e)
        {
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
    private function _getTemplate(Field $field = null)
    {
        // Make sure a field group exists first
        $groups = ArrayHelper::index(Craft::$app->getFields()->getAllGroups(), 'id');

        if (empty($groups)) {
            return [
                'error' => Craft::t('quick-field', 'No field groups exist.'),
            ];
        }

        $fieldTypes = QuickField::$plugin->service->getFieldTypes();
        $fieldTypeOptions = [];
        
        foreach ($fieldTypes as $fieldType) {
            $fieldTypeOptions[] = [
                'label' => $fieldType::displayName(),
                'value' => $fieldType,
            ];
        };

        ArrayHelper::multisort($fieldTypeOptions, 'label');

        $data = [
            'field' => $field ?? Craft::$app->getFields()->createField(PlainText::class),
            'fieldTypes' => $fieldTypes,
            'fieldTypeOptions' => $fieldTypeOptions,
            'groups' => $groups,
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
}
