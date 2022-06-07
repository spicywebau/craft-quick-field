<?php
namespace Craft;

class QuickFieldService extends BaseApplicationComponent
{
	public function getFieldTypes()
	{
		$fieldTypes = craft()->fields->getAllFieldTypes();

		if(craft()->plugins->getPlugin('neo'))
		{
			return array_filter($fieldTypes, function($fieldType)
			{
				return !($fieldType instanceof NeoFieldType);
			});
		}

		return $fieldTypes;
	}
}
