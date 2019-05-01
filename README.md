# Importing pages from Archive.org

This extension provides ability to import some information from Archive.org via API

## Requirements

* Mediawiki 1.27+
* PHP 5.6+

## Installation

1. Clone or extract extension files into `extensions/ArchiveLeaf`
2. Add to the bottom of `LocalSettings.php` file, see comments for details:

```php
# These options are necessary for proper extension work
$wgAllowExternalImages = true;
$wgAllowImageTag = true;
$wgCapitalLinks = false;
$wgAllowDisplayTitle = true;
$wgRestrictDisplayTitle = false;
$wgAllowCopyUploads = true;
$wgEnableUploads = true;
ini_set('max_execution_time', 0);

# Loads extension
wfLoadExtension('ArchiveLeaf');

# All options below are optional and can be omitted:

# Allow users to import pages (by default only "sysops" allowed to import pages)
$wgGroupPermissions['user']['archiveleaf'] = true;

# Base URL (default shown):
$wgArchiveLeafBaseURL = 'https://archive.org';

# Api URL (default shown):
$wgArchiveLeafApiURL = 'https://api.archivelab.org';

# Name of the template that will be used as primary page template (default shown):
$wgArchiveLeafTemplateName = 'Entry';

# Name of the template that will be used as per-image template (default shown):
$wgArchiveLeafTemplateImageName = 'EntryImage';
```

3. Find `templates.xml` file inside `sources` directory of the repository
4. Login into your wiki as administrator and navigate to `Special:Import`
5. Import `templates.xml` file
6. Navigate to `Special:ArchiveLeaf` to start importing pages

## Default templates

Extension creates two type of templates on imported pages, each template will contain
list of parameters as below:

* Primary template (by default named `Entry`)
** `Title` - contains item ID, eg.: `tutur-smara-bhuwana`
** `Url` - contains item URL at Archvie.org

* Per-image template (by default named `EntryImage`)
** `Title` - contains leaf page number, eg.: `0`
** `EntryID` - same as `Title` of primary template
** `Image` - contains image url (400px width) to be displayed as thumbnail
** `ImageBig` - contains image url (800px width), not used
** `ImageBrowse` - contains link to image browser, displayed as link near thumbnail

## Notes about user contribution on imported pages

Imported pages will have structure similar to this one:

```
{{Entry
|Title=...
...
}}

{{EntryImage
|Title=0
...
}}

{{EntryImage
|Title=1
...
}}

{{Entry Image
|Title=2
...
}}
```
