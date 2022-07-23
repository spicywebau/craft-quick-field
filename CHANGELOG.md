# Changelog

## Unreleased

### Fixed
- Fixed a bug where Quick Field edit icons were displaying on non-custom fields
- Fixed a bug on field layout designers for element types that have native fields, where Quick Field group action menus were displaying on the Native Fields group

## 2.0.0 - 2022-07-16

### Added
- Added Craft 4 compatibility (requires Craft 4.1.0 or later)
- Added the 'Save as a new field' option when editing existing fields
- Added the ability to edit and delete fields on the field layout

### Removed
- Removed Craft 3 compatibility

### Fixed
- Fixed an issue where Quick Field wasn't being initialised for Craft Commerce variant field layout designers

## 1.0.1 - 2022-07-19

### Fixed
- Fixed a bug where deleted field groups would still appear on new Neo block type field layouts

## 1.0.0 - 2022-06-29

### Added
- Added Craft 3 compatibility (requires Craft 3.7.0 or later)
- Added the ability to rename and delete field groups from the field layout designer

### Changed
- Moved the new field and new group buttons to the sidebar of the new field layout designer
- Moved the `Craft\QuickFieldPlugin` class to `spicyweb\quickfield\Plugin`
- Moved the `Craft\QuickFieldController` class to `spicyweb\quickfield\controllers\QuickFieldController`
- Renamed `Craft\QuickFieldController::actionGetFieldSettings()` to `spicyweb\quickfield\controllers\QuickFieldController::actionLoad()`

### Removed
- Removed Craft 2 compatibility
- Removed the `Craft\QuickFieldService` class
- Removed the `Craft\QuickFieldVariable` class

### Fixed
- Fixed a bug where the new field button would still appear if the Craft install had no field groups
- Fixed a bug where newly-created groups would not appear as options for new fields

## 0.3.4 - 2016-09-10

### Fixed
- Fixed issue with Neo where editing fields of certain types wasn't working

## 0.3.3 - 2016-04-24

### Added
- Added support for the Neo plugin/field type

## 0.3.2 - 2016-03-04

### Changed
- Updated the plugin icon

### Fixed
- Fixed bug where changing a field's group to a hidden one wouldn't show the group
- Fixed bug where newly created fields couldn't be edited
- Edit icon on fields now stays visible when dragging

## 0.3.1 - 2016-01-12

### Added
- Added compatibility with the PimpMyMatrix plugin

### Changed
- Improved layout of buttons on the field layout designer
- Changed vertical alignment of the edit button to the top for long named fields

## 0.3.0 - 2015-12-22

### Added
- Added ability to edit and delete current fields ([\#3](https://github.com/benjamminf/craft-quick-field/issues/3))
- Added plugin icon

### Fixed
- Now prevents modal from closing when saving (and deleting)

## 0.2.2 - 2015-12-16

### Added
- Added release feed for convenient updating
- Added plugin description

### Fixed
- Fixed issues with certain third-party field types where their Javascript wasn't executing correctly

## 0.2.1 - 2015-12-16

### Changed
- Added a modal window shake if there are errors when creating a field

### Fixed
- Plugin's resources no longer load in the frontend ([\#5](https://github.com/benjamminf/craft-quick-field/pull/5) - thanks @mmikkel)
- Fixed bug where external CSS files for field types weren't getting loaded

## 0.2.0 - 2015-12-07

### Changed
- Implemented much better error reporting when saving fields ([\#1](https://github.com/benjamminf/craft-quick-field/issues/1))

### Fixed
- Fixed issue with duplicate HTML id's ([\#2](https://github.com/benjamminf/craft-quick-field/issues/2))

## 0.1.1 - 2015-12-06

### Added
- Added documentation links

## 0.1.0 - 2015-12-06

### Added
- Initial release
