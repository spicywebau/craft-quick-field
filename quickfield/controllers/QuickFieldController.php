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
		$this->requireAjaxRequest();

		$this->returnJson($this->_getTemplate());
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
	 * Loads the field settings template and returns all HTML, CSS and Javascript.
	 *
	 * @param FieldModel|null $field
	 * @return array
	 */
	private function _getTemplate(FieldModel $field = null)
	{
		$html = craft()->templates->render('quickfield/_fieldsettings', $field ? array('field' => $field) : array());
		$js   = craft()->templates->getFootHtml();
		$css  = craft()->templates->getHeadHtml();

		return array(
			'html' => $html,
			'js'   => $js,
			'css'  => $css
		);
	}
}
