<?php

use MediaWiki\Revision\SlotRecord;

/**
 * Class for ArchiveLeaf extension
 *
 * @file
 * @ingroup Extensions
 */
class ArchiveLeaf {

    /**
     * @param string $id
     *
     * @return bool
     */
    public static function checkRemoteID( $id ) {

        global $wgArchiveLeafApiURL;

        $response = @file_get_contents( $wgArchiveLeafApiURL.'/books/'.$id.'/ia_manifest' );

        return $response ? true : false;

    }

    /**
     * @param string $id
     *
     * @return bool|array('title' => Title, 'collection' => WikiPage)
     */
    public static function importItemByID( $id ) {

        global $wgArchiveLeafBaseURL, $wgArchiveLeafApiURL, $wgArchiveLeafTemplateName,
               $wgArchiveLeafTemplateImageName, $wgArchiveLeafImportScript, $wgUser;

        $log = array();

        $response = @file_get_contents( $wgArchiveLeafApiURL.'/books/'.$id.'/ia_manifest' );

        if ( !$response ) {
            return false;
        }

        $response = json_decode( $response, true );

        if ( !$response || !array_key_exists('leafNums', $response) || !count($response['leafNums']) ) {
            return false;
        }

        // Page remote url
        $remoteUrl = $response['url'];
        // Prepare leafs
        $leafs = $response['leafNums'];
        // Sub-preifx for browse url
        $subPrefix = $response['subPrefix'];

        // look up collection page
        $collection_map = self::getData( 'collection' );
        if ( array_key_exists( $response['collection'], $collection_map ) ) {
            $collection = $collection_map[ $response['collection'] ];
            $collection_wikipage = new WikiPage( Title::newFromText( $collection['wikipage'] ) );
        }

        // look up language (for category)
        $language_name_map = self::getData( 'language_name' );
        if ( $response['language'] && preg_match( '/^(?:[a-z]{3}|[A-Z]{3})$/', $response['language'] ) ) {
            $language_code = strtolower( $response['language'] );
        } elseif ( $response['language'] && array_key_exists( $response['language'], $language_name_map ) ) {
            $language_code = $language_name_map[ $response['language'] ];
        } elseif ( $collection && $collection['language'] ) {
            $language_code = $collection['language'];
        }
        if ( $language_code ) {
            $iso639 = self::getData( 'iso-639-3' );
            $language = $iso639[ $language_code ];
        }

        if ( $response['script'] && preg_match( '/^[A-Z][a-z]{3}$/', $response['language'] ) ) {
            $script_code = $response['script'];
        } elseif ( $language_code ) {
            $language_script = self::getData( 'language_script' );
            if ( array_key_exists( $language_code, $language_script ) ) {
                $script_code = $language_script[ $language_code ];
            }
        }

        $template = "{{" . $wgArchiveLeafTemplateName;
        $template .= "\n|Title=" . $id;
        $template .= "\n|Url=" . $remoteUrl;
        if ( $script_code ) {
            $template .= "\n|Script=" . $script_code;
        }
        $template .= "\n}}";
        $template .= "\n==== Description ====";
        $template .= "\n===== Bahasa Indonesia =====";
        $template .= "\n===== English =====";

        $log[] = "Parsing item '{$remoteUrl}' ...";

        foreach ($leafs as $imageNum => $leaf) {

            //$log[] = "Generating template for leaf #{$leaf}";

            $leafBrowseUrl = $wgArchiveLeafBaseURL.'/stream/'.$id.'/'.$subPrefix.'#page/n'.$imageNum.'/mode/1up';

            // import images
            // not efficient to import large images into wiki, shrink to 2000px
            $imageUrlFull = $wgArchiveLeafBaseURL.'/download/'.$id.'/page/leaf'.$leaf.'_w2000.jpg';
            $uploader = new UploadFromUrl();
            $localFileName = '';

            try {
                $uploader->initialize( $id . '_' . $leaf, $imageUrlFull );
                $downloadStatus = $uploader->fetchFile();

                if ( $downloadStatus->isOK() ) {
                    $verification = $uploader->verifyUpload();
                    if ( $verification['status'] === UploadBase::OK ) {
                        $localFile = $uploader->getLocalFile();

                        // check if exact file already exists
                        if ( $localFile && $localFile->getSha1() === $uploader->getTempFileSha1Base36() ) {
                            $localFileName = $localFile->getName();
                            $uploader->cleanupTempFile();

                            $log[] = "Exact image already exists so it was not re-imported.";
                        } else {
                            $imageText = "Original page: {$remoteUrl}\nOriginal file: [{$imageUrlFull} see]";

                            $uploadStatus = $uploader->performUpload( 'imported by ArchiveLeaf', $imageText, false, $wgUser );

                            if ( $uploadStatus->isOK() ) {

                                $localFile = $uploader->getLocalFile();
                                $localFileName = $localFile->getName();

                                // Pre-generate thumb for 400px to be used in page template
                                $localFile->createThumb(400);

                                $log[] = "Image was imported successfully.";
                            } else {
                                $log[] = "Error importing image: {$uploadStatus->getMessage()}";
                            }
                        }
                    }
                } else {
                    $log[] = "Error downloading file from url.";
                }
            } catch(Exception $e) {
                $log[] = "Exception during image downloading: '{$e->getMessage()}' !";
            }

            // Create template markup

            if ( $imageNum == 0 ) {
                $template .= "\n==== Front and Back Covers ====";
            } else {
                $template .= "\n==== Leaf {$imageNum} ====";
            }

            $template .= "\n{{" . $wgArchiveLeafTemplateImageName;
            $template .= "\n|EntryID=" . $id;
            $template .= "\n|Title=" . $imageNum;
            //$template .= "\n|Image=" . $wgArchiveLeafBaseURL.'/download/'.$id.'/page/leaf'.$leaf.'_w400.jpg';
            //$template .= "\n|ImageBig=" . $wgArchiveLeafBaseURL.'/download/'.$id.'/page/leaf'.$leaf.'_w800.jpg';
            $template .= "\n|FullSize=" . $response['pageWidths'][$imageNum] . 'x' . $response['pageHeights'][$imageNum];
            $template .= "\n|ImageBrowse=" . $leafBrowseUrl;
            $template .= "\n|LocalFileName=" . $localFileName;
            $template .= "\n}}";

            $template .= "\n\n<transcription>\n\n</transcription>";

            //$log[] = "Template generated successfully.";

        }

        $template .= "\n\n";

        if ( isset($language) ) {
            $template .= "[[Category:" . $language . "]]\n";
        }
        if ( array_key_exists( 'category', $collection ) ) {
            $template .= "[[Category:" . $collection['category'] . "]]\n";
        }

        $title = Title::newFromText( $id );
        $page = new WikiPage( $title );

        $updater = $page->newPageUpdater( $wgUser );
        $updater->setContent( SlotRecord::MAIN, new WikitextContent( $template ) );
        #$updater->setRcPatrolStatus( RecentChange::PRC_PATROLLED );
        $updater->saveRevision( new CommentStoreComment( null, 'Imported from Archive.org' ) );

        $log[] = "Page '{$id}' successfully created.";

        foreach ($log as $l) {
            wfDebug('[ArchiveLeaf]: '.$l);
        }

        # update IA item metadata
        if ( $wgArchiveLeafImportScript ) {
            exec( $wgArchiveLeafImportScript . ' ' . escapeshellarg( $id ) . ' &' );
        }

        return array(
            'title'         => $title,
            'collection'    => $collection_wikipage,
        );

    }

    /**
     * Checks if title exists
     *
     * @param string $value
     *
     * @return bool
     */
    public static function isPageExists( $value ) {
        $title = Title::newFromText($value);
        if ( $title && $title->exists() ) {
            return true;
        }
        return false;
    }

    /**
     * Adds link to page on collection page
     *
     * @param Title $title
     * @param WikiPage $page
     */
    public static function addLinkOnCollectionPage( $title, $page ) {

        if ( ! isset( $page ) ) return;

        global $wgUser;

        $key = $title->getDBKey();

        $updater = $page->newPageUpdater( $wgUser );

        if ($page->exists()) {
            $parent = $updater->grabParentRevision();
            $content = $parent->getContent( SlotRecord::MAIN );
            $text = ContentHandler::getContentText( $content );

            if ( preg_match( '/\[\[' . preg_quote( $key, '/' ) . '\b/', $text ) ) return;

            $text = rtrim( $text ) . "\n";
            $flag = EDIT_UPDATE;

        } else {
            $text = '';
            $flag = EDIT_NEW;
        }

        $text .= "* [[$key|" . self::sanitizeValue( $key ) . "]]\n";

        $updater->setContent( SlotRecord::MAIN, new WikitextContent( $text ) );
        #$updater->setRcPatrolStatus( RecentChange::PRC_PATROLLED );
        $result = $updater->saveRevision( new CommentStoreComment( null, "added link to '$key'" ), $flag );

    }

   /**
     * Title sanitization
     *
     * @param string $value
     *
     * @return mixed
     */
    public static function sanitizeValue( $value ) {
        $result = array();
        $value = str_replace('-', ' ', $value);
        $value = explode(' ', $value);
        foreach ($value as $word) {
            $result[] = ucfirst( $word );
        }
        return join(' ', $result);
    }

    public static function transliterate( $transliterator, $str ) {
        global $wgArchiveLeafTransliterateUrl;

        $opts = array('http' =>
            array(
                'method' => 'POST',
                'content' => $str,
            )
        );

        return @file_get_contents( $wgArchiveLeafTransliterateUrl.'/'.$transliterator, false, stream_context_create($opts) );
    }

    private static $data;

    public static function getData( $id ) {
        if ( !array_key_exists( $id, self::$data ) ) {
            self::$data[ $id ] = json_decode( file_get_contents( "extensions/ArchiveLeaf/data/${id}.json" ), true );
        }

        return self::$data[ $id ];
    }
}
