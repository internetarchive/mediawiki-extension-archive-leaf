# ArchiveLeaf

ArchiveLeaf is a [MediaWiki](https://mediawiki.org) extension which implements essential features for [palmleaf.org](https://palmleaf.org), including importing from [Archive.org](https://archive.org) and font/input support.

## Requirements

* Mediawiki 1.27+
* PHP 5.6+
* [node.js](https://nodejs.org) and [yarn](https://yarnpkg.com)

## Installation

1. Clone the repository or extract files into a directory `ArchiveLeaf` inside the MediaWiki install’s `extensions` directory.

2. From the `ArchiveLeaf` directory:
    * Run `maintenance/transcriber-install` to install the transcriber’s dependencies with `yarn`.
    * Run `maintenance/transcriber-build` to create a production build of the transcriber React app.

3. Install the [Metrolook](https://www.mediawiki.org/wiki/Skin:Metrolook) skin into the MediaWiki install’s `skins` directory (as `Metrolook`).

4. Import templates:
    * Login into your wiki as administrator and navigate to `Special:Import`.
    * Import the `templates.xml` file located in this repository’s `sources` directory.

Note that the `maintenance/transcriber-build` script modifies `extension.json`. In order to pull a new version from GitHub, you should run the following command from the `ArchiveLeaf` directory:

```
git reset --hard && git pull && maintenance/transcriber-install && maintenance/transcriber-build
```

## Configuration

### LocalSettings.php

Ensure that the following settings are in the MediaWiki install’s `LocalSettings.php` file:

```php
$wgAllowExternalImages = true;
$wgAllowImageTag = true;
$wgCapitalLinks = false;
$wgAllowDisplayTitle = true;
$wgRestrictDisplayTitle = false;
$wgAllowCopyUploads = true;
$wgEnableUploads = true;
ini_set('max_execution_time', 0);

# recommended (requires ImageMagick install)
$wgUseImageMagick = true;

# load extension
wfLoadExtension( 'ArchiveLeaf' );

# use Metrolook (required for mobile)
wfLoadSkin( 'Metrolook' );
$wgMetrolookDownArrow = false;
$wgMetrolookUploadButton = false;
$wgDefaultSkin = 'Metrolook';
```

The following optional settings are also available:

```php
# allow users to import pages (by default only "sysops" allowed)
$wgGroupPermissions['user']['archiveleaf'] = true;

$wgArchiveLeafBaseURL = 'https://archive.org'; # base URL (default shown)
$wgArchiveLeafApiURL = 'https://api.archivelab.org'; # API URL (default shown)
$wgArchiveLeafTemplateName = 'Entry'; # primary template (default shown)
$wgArchiveLeafTemplateImageName = 'EntryImage'; # per-image template (default shown)
```

### Common.css

Add the following to the `MediaWiki:Common.css` page on the wiki:

```css
body {
    font-family: "Noto Serif Balinese", sans-serif;
}

.mw-editfont-monospace {
    font-family: "Noto Serif Balinese", monospace, monospace;
}

.mw-jump {
    display: none;
}

.thumbinner {
    max-width: 100%;
}

img.thumbimage {
    width: 100%;
    height: auto;
}
```

### Web server

Make sure that `/transcriber/static` is aliased to the `transcriber/build/static` directory. Nginx example:

```
location /transcriber/static {
    alias /var/www/palmleaf/extensions/ArchiveLeaf/transcriber/build/static;
}
```

## Usage

* To import items from Archive.org, navigate to `Special:ArchiveLeaf`. When the import completes, a link will appear for the imported page.
* To transcribe, first navigate to an imported page. Choose a leaf and click Edit to work on it. The transcriber interface will appear.
* When you have finished working on the leaf, close the transcriber by clicking the X in the upper right. The regular MediaWiki edit page will appear, with your transcribed text inside the `<transcription>` tag.
* Click *Save changes* to save your work.

## Implementation

### Templates

The extension uses two templates on imported pages, which contain the following parameters:

* Primary template (by default `Entry`):
    - `Description`: contains general item description.
    - `Title`: contains Archive.org identifier, for example `tutur-smara-bhuwana`.
    - `Url`: contains Archive.org item URL.

* Per-image template (by default `EntryImage`):
    - `EntryID`: matches `Title` of primary template.
    - `Title`: leaf number, for example `0`.
    - `LocalFileName`: image filename, displayed as 400px thumbnail.
    - `ImageBrowse`: link to Archive.org image browser, displayed as link near thumbnail.

### Imported pages

Imported pages have the following structure:

```
{{Entry
|Title=…
…
}}
==== Front and Back Covers ====
{{EntryImage
|Title=0
…
}}

<transcription>

</transcription>
==== Leaf 1 ====
{{EntryImage
|Title=1
…
}}

<transcription>

</transcription>
==== Leaf 2 ====
{{EntryImage
|Title=2
…
}}

<transcription>

</transcription>
```

Transcribed text should be placed in the `<transcription>` tag. The transcriber does this automatically, but manual editing is also possible.
