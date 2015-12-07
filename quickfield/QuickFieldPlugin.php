<?php
namespace Craft;

/**
 * Class QuickFieldPlugin
 *
 * Thank you for using Craft Quick Field!
 * @see https://github.com/benjamminf/craft-quick-field
 * @package Craft
 */
class QuickFieldPlugin extends BasePlugin
{
	function getName()
	{
		return Craft::t('Quick Field');
	}

	function getVersion()
	{
		return '0.1.1';
	}

	public function getSchemaVersion()
	{
		return '1.0.0';
	}

	function getDeveloper()
	{
		return 'Benjamin Fleming';
	}

	function getDeveloperUrl()
	{
		return 'http://benf.co';
	}

	public function getDocumentationUrl()
	{
		return 'https://github.com/benjamminf/craft-quick-field/blob/0.1.1/README.md';
	}

	public function init()
	{
		parent::init();

		if($this->isCraftRequiredVersion())
		{
			$this->includeResources();
		}
	}

	public function isCraftRequiredVersion()
	{
		return version_compare(craft()->getVersion(), '2.5', '>=');
	}

	protected function includeResources()
	{
		if(!craft()->request->isAjaxRequest() && craft()->userSession->isAdmin())
		{
			craft()->templates->includeCssResource('quickfield/css/main.css');

			craft()->templates->includeJsResource('quickfield/js/QuickField.js');
			craft()->templates->includeJsResource('quickfield/js/FieldModal.js');
			craft()->templates->includeJsResource('quickfield/js/GroupDialog.js');
			craft()->templates->includeJsResource('quickfield/js/main.js');
		}
	}
}
