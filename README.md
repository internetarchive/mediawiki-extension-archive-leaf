# Importing pages from Archive.org

This extension provides ability to import some information from Archive.org via API

## Requirements

* Mediawiki 1.27+
* PHP 5.6+
* Composer
* ParserFunctions extension (bundled with Mediawiki and usually enabled by default)

## Installation

1. Clone or extract extension files into `extensions/ArchiveLeaf`
2. Within Mediawiki root run [Composer](https://getcomposer.org/) to install [httpful](http://phphttpclient.com/) library `composer require "nategood/httpful"`
3. Add to the bottom of `LocalSettings.php` file, see comments for details:

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

# Allow users to import pages (by default only "sysops" allowed to improt pages)
$wgGroupPermissions['user']['archiveleaf'] = true;

# Base URL, by default it's pointing to archive.org as below
$wgArchiveLeafBaseURL = 'https://archive.org';

# Api URL, by default it's pointing to api.archivelab.org as below:
$wgArchiveLeafApiURL = 'https://api.archivelab.org';

# Name of the template that will be used as primary page template
$wgArchiveLeafTemplateName = 'Entry';

# Name of the template that will be used as per-image template
$wgArchiveLeafTemplateImageName = 'EntryImage';
```

4. Find `templates.xml` file inside `sources` directory of the repository
5. Login into your wiki as administrator and navigate to `Special:Import`
6. Import `templates.xml` file
7. Done, navigate to `Special:ArchiveLeaf` to start importing pages

## Default templates

Extension creates two type of templates on imported pages, each template will contain
list of parameters as below:

* Primary template ( by default named `Entry` )
** `Title` - contains item ID, eg.: `tutur-smara-bhuwana`
** `Url` - contains item URL at Archvie.org

* Per-image template ( by default named `EntryImage` )
** `Title` - contains leaf page number, eg.: `0`
** `EntryID` - same as `Title` of primary template
** `Image` - contains image url ( 400px width ) to be displayed as thumbnail
** `ImageBig` - contains image url ( 800px width ), not used
** `ImageBrowse` - contains link to image browser, displayed as link near thumbnail
** `Description` - placeholder for user-provided text

## Additional notes

This extension disabled `[edit]` section links because it may confuse users and lead 
to template being edited instead of actual page contents.

## Notes about user contribution on imported pages

Imported pages will have structure similar to this one:

```
{{{Entry
|Title...
...
}}}
{{{Entry Image
|Title=0
|Description=<!-- place your text here -->
}}}
{{{Entry Image
|Title=1
|Description=<!-- place your text here -->
}}}
{{{Entry Image
|Title=2
|Description=<!-- place your text here -->
}}}
```

As comment says `Description` parameter is the only parameter that should be modified
when user wants to add some text near particular page image.
