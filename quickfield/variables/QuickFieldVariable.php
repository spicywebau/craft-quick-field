<?php
namespace Craft;

class QuickFieldVariable
{
	public function getFieldTypes()
	{
		$fieldTypes = craft()->quickField->getFieldTypes();
		return FieldTypeVariable::populateVariables($fieldTypes);
	}
}
