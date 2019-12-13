# ArchiveLeaf

ArchiveLeaf is a [MediaWiki](https://mediawiki.org) extension which implements essential features for [palmleaf.org](https://palmleaf.org), including importing from [Archive.org](https://archive.org) and font/input support.

## Requirements

* Mediawiki 1.32+
* PHP 7+
* [node.js](https://nodejs.org) 12+ and [yarn](https://yarnpkg.com)

## Installation

1. Clone the repository, or extract the downloaded zip file, into a directory `ArchiveLeaf` inside the MediaWiki install’s `extensions` directory.
2. From the `ArchiveLeaf` directory:
    * Run `maintenance/transcriber-install` to install the transcriber’s dependencies with `yarn`.
    * Run `maintenance/transcriber-build` to create a production build of the transcriber React app.
    * Run `maintenance/templates-import` to import the required `Template:Entry` and `Template:EntryImage` pages into MediaWiki.
3. Install the [Metrolook](https://www.mediawiki.org/wiki/Skin:Metrolook) skin into the MediaWiki install’s `skins` directory (as `Metrolook`).

In order to pull a new version from GitHub and build it, you can run the following command from the `ArchiveLeaf` directory:

```
git pull && maintenance/transcriber-install && maintenance/transcriber-build
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

# script to run after importing IA item as a new wiki page. item identifier is passed as an argument.
$wgArchiveLeafImportScript = '/path/to/script';
```

### Web server

Make sure that `/transcriber/static` is aliased to the `transcriber/build/static` directory. Nginx example:

```
location /transcriber/static {
    alias /var/www/palmleaf/extensions/ArchiveLeaf/transcriber/build/static;
}
```

### Common.css (optional)

To improve page rendering, add the following CSS to the `MediaWiki:Common.css` page on the wiki:

```css
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

### Webfonts (optional)

If you wish to load webfonts from custom locations, you can edit `scss/fonts-custom.scss` and provide custom values that will override one or more of the variables in `scss/fonts.scss`. You will need to re-run `maintenance/transcriber-build` to apply the changes.

## Usage

* To import items from Archive.org, navigate to wiki page `Special:ArchiveLeaf`. When the import completes, a link to the imported page will appear.
* To transcribe a leaf, first navigate to an imported page. Choose a leaf and click Edit to work on it. The transcriber interface will appear.
* When you have finished working on the leaf, close the transcriber by clicking the X in the upper right. The regular MediaWiki edit page will appear, with your transcribed text inside the `<transcription>` tag.
* Click *Save changes* to save your work.

### Transcriber

The transcriber interface allows for a more seamless transcription experience for users. It overlays on top of the regular wiki edit page and reads and writes to the edit box when opened and closed. It is designed primarily as a mobile interface, but will work fine on desktop machines as well.

The transcriber consists of three sections:
1. The image to be transcribed, which can be zoomed in and out.
2. A text edit box that displays the current working text of the transcriber.
3. An onscreen keyboard.

The transcriber reads from the `<transcription>` tag within the edit box, and when closed, writes back to the tag. After the transcriber is closed, the user must manually save the wiki edit.

One keyboard layout is currently available: Balinese. More are planned for the future.

#### Balinese keyboard notes

* The Balinese onscreen keyboard is designed to type any characters found in Balinese, while preventing the typing of malformed sequences.
* To type a consonant-vowel syllable, first type the consonant, and then the vowel marks for that consonant will be displayed in the upper right section.
* Type all vowels after their consonant (in spoken order), even if they are written to the left of the consonant, like "ᬳᬾ".
* To type consonant clusters, type the first consonant, then adeg-adeg (in the vowel marks section), then the following consonant. The keyboard will adjust to demonstrate the character to be typed.
* If an explicit adeg-adeg is needed in a place that would normally cause a consonanant cluster (such as "ᬦ᭄‌ᬪ"), type the first consonant, then the adeg-adeg, then a Zero-Width Non-Joiner (the key to the right of the space bar), then the next consonant. The Zero-Width Non-Joiner blocks the adeg-adeg from creating a consonant cluster.
* Sanskrit-specific consonants and less common vowel marks can be found by pressing the shift key.
* To type numbers and punctuation marks, press the bottom-left key "᭗᭘᭙".

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
