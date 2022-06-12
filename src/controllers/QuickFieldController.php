<?php

namespace spicyweb\quickfield\controllers;

use Craft;
use craft\base\Field;
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
        $this->requireAjaxRequest();

        $id = craft()->request->getPost('fieldId');

        $field = craft()->fields->getFieldById($id);

        if($field)
        {
            $group = craft()->fields->getGroupById($field->groupId);

            $this->returnJson(array(
                'success' => true,
                'field'   => array(
                    'id'           => $field->id,
                    'name'         => $field->name,
                    'handle'       => $field->handle,
                    'instructions' => $field->instructions,
                    'translatable' => $field->translatable,
                    'group'        => !$group ? array() : array(
                        'id'   => $group->id,
                        'name' => $group->name,
                    ),
                ),
                'template' => $this->_getTemplate($field),
            ));
        }
        else
        {
            $this->returnJson(array(
                'success' => false,
                'error'   => Craft::t('The field requested to edit no longer exists.'),
            ));
        }
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
        $this->requireAjaxRequest();

        $field = new FieldModel();

        $field->id           = craft()->request->getPost('qf.fieldId');
        $field->groupId      = craft()->request->getRequiredPost('qf.group');
        $field->name         = craft()->request->getPost('qf.name');
        $field->handle       = craft()->request->getPost('qf.handle');
        $field->instructions = craft()->request->getPost('qf.instructions');
        $field->translatable = (bool) craft()->request->getPost('qf.translatable');

        $field->type = craft()->request->getRequiredPost('qf.type');

        $typeSettings = craft()->request->getPost('qf.types');

        if(isset($typeSettings[$field->type]))
        {
            $field->settings = $typeSettings[$field->type];
        }

        $group = craft()->fields->getGroupById($field->groupId);
        $success = $group && craft()->fields->saveField($field);

        $this->returnJson(array(
            'success' => $success,
            'errors'  => $field->getAllErrors(),
            'field'   => array(
                'id'           => $field->id,
                'name'         => $field->name,
                'handle'       => $field->handle,
                'instructions' => $field->instructions,
                'translatable' => $field->translatable,
                'group'        => !$group ? array() : array(
                    'id'   => $group->id,
                    'name' => $group->name,
                ),
            ),
            'template' => $success ? false : $this->_getTemplate($field),
        ));
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
        $this->requireAjaxRequest();

        $id = craft()->request->getPost('fieldId');

        $field = craft()->fields->getFieldById($id);

        if($field)
        {
            $group = craft()->fields->getGroupById($field->groupId);
            $returnField = array(
                'id'           => $field->id,
                'name'         => $field->name,
                'handle'       => $field->handle,
                'instructions' => $field->instructions,
                'translatable' => $field->translatable,
                'group'        => !$group ? array() : array(
                    'id'   => $group->id,
                    'name' => $group->name,
                ),
            );

            try
            {
                craft()->fields->deleteField($field);

                $this->returnJson(array(
                    'success' => true,
                    'field'   => $returnField,
                ));
            }
            catch(\Exception $e)
            {
                $this->returnJson(array(
                    'success' => false,
                    'field'   => $returnField,
                    'error'   => $e->getMessage(),
                ));
            }
        }
        else
        {
            $this->returnJson(array(
                'success' => false,
                'error'   => Craft::t('The field requested to delete no longer exists.'),
            ));
        }
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
