<?php
namespace Craft;

/**
 * Class QuickFieldController
 * @package Craft
 */
class QuickFieldController extends BaseElementsController
{
	/**
	 * Gets the HTML, CSS and Javascript of a field setting page.
	 *
	 * @throws HttpException
	 */
	public function actionGetFieldSettings()
	{
		$this->requireAdmin();

		$html = craft()->templates->render('quickfield/_fieldsetting');
		$js   = craft()->templates->getFootHtml();
		$css  = craft()->templates->getHeadHtml();

		$this->returnJson(array(
			'fieldSettingsHtml' => $html,
			'fieldSettingsJs'   => $js,
			'fieldSettingsCss'  => $css
		));
	}

	/**
	 * Saves a new field to the database.
	 *
	 * @throws HttpException
	 * @throws \Exception
	 */
	public function actionSaveField()
	{
		$this->requirePostRequest();
		$this->requireAjaxRequest();

		$field = new FieldModel();

		$field->id           = craft()->request->getPost('fieldId');
		$field->groupId      = craft()->request->getRequiredPost('group');
		$field->name         = craft()->request->getPost('name');
		$field->handle       = craft()->request->getPost('handle');
		$field->instructions = craft()->request->getPost('instructions');
		$field->translatable = (bool) craft()->request->getPost('translatable');

		$field->type = craft()->request->getRequiredPost('type');

		$typeSettings = craft()->request->getPost('types');

		if(isset($typeSettings[$field->type]))
		{
			$field->settings = $typeSettings[$field->type];
		}

		$success = craft()->fields->saveField($field);

		$this->returnJson(array(
			'success' => $success,
			'field' => array(
				'id' => $field->id,
				'groupId' => $field->groupId,
				'name' => $field->name,
				'handle' => $field->handle,
				'instructions' => $field->instructions,
				'translatable' => $field->translatable,
			),
		));
	}
}
