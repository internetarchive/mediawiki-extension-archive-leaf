<?php

use MediaWiki\MediaWikiServices;
use MediaWiki\Revision\SlotRecord;

/**
 * Class for ArchiveLeaf extension
 *
 * @file
 * @ingroup Extensions
 */
class ArchiveLeaf {

    public static function onParserFirstCallInit( Parser &$parser ) {
        $parser->setFunctionHook( 'sanitize_leaf_title', [ self::class, 'renderFunctionSanitize' ] );

        $parser->setHook( 'transcription', self::renderTag( 'transcription' ) );
        $parser->setHook( 'transliteration', self::renderTag( 'transliteration', 'Auto-transliteration' ) );
        $parser->setHook( 'translation', self::renderTag( 'translation', [ self::class, 'getTranslationHeading' ] ) );
    }

    public static function onParserBeforeInternalParse( Parser &$parser, &$text, StripState &$stripState ) {
        $text = preg_replace( '/\n{2,}(<(?:transcription|transliteration|translation)[> ])/', "\n$1", $text );
        $text = preg_replace( '/(<\/(?:transcription|transliteration|translation)>)\n{2,}/', "$1\n", $text );
        return true;
    }

    /**
     * @param Parser $parser
     * @param string $value
     *
     * @return mixed
     */
    public static function renderFunctionSanitize( $parser, $value ) {
        global $wgOut, $wgSitename;
        $sanitized = self::sanitizeValue($value);
        $wgOut->setHTMLTitle( $sanitized .' - ' . $wgSitename );
        return $sanitized;
    }

    public static function renderTag( $tagName, $headingTitle = NULL ) {
        return function ( $input, array $args, Parser $parser, PPFrame $frame ) use ( $tagName, $headingTitle ) {
            $html = '<div class="' . $tagName . '">';

            if ( isset( $headingTitle ) ) {
                if ( is_callable( $headingTitle ) ) {
                    $headingTitle = $headingTitle( $args );
                }

                $html .= "<div class='heading-small'><strong>$headingTitle</strong></div>";
            }

            $html .= trim( $input ) . '</div>';

            return array( $html, 'markerType' => 'nowiki' );
        };
    }

    public static function getTranslationHeading( $args ) {
        if ( array_key_exists( 'language', $args ) ) {
            $iso639 = self::getData( 'iso-639-3' );

            if ( array_key_exists( $args['language'], $iso639 ) ) {
                return $iso639[ $args['language'] ] . ' translation';
            }
        }

        return 'Translation';
    }

    public static function onBeforePageDisplay( OutputPage &$out, Skin &$skin ) {
        $out->addModules( 'ext.archiveleaf.common' );
    }

    public static function onLinkerMakeExternalLink( &$url, &$text, &$link, &$attribs, $linkType ) {
        $config = ConfigFactory::getDefaultInstance()->makeConfig( 'archiveleaf' );

        if ( $config->get( 'ArchiveLeafArchiveOrgRewrite' ) ) {
            $url = preg_replace( '#^https?://archive.org\b#', $config->get( 'ArchiveLeafArchiveOrgRewrite' ), $url );
        }
    }

    public static function onShowEditForm( EditPage &$editor, OutputPage &$out ) {
        global $wgScriptPath;

        $config = ConfigFactory::getDefaultInstance()->makeConfig( 'archiveleaf' );

        if ( !($editor->preview || $editor->diff)
          && preg_match( '/\{\{EntryImage/', $editor->textbox1 )
          && preg_match( '/\bEntryID=(\S+).*?\bTitle=(\S+).*?\bFullSize=([0-9]+)x([0-9]+).*?\bLocalFileName=(\S+)/s', $editor->textbox1, $matches ) ) {

            if ( $config->get( 'ArchiveLeafAutoTransliterate' ) && $config->get( 'ArchiveLeafTransliterateUrl' ) ) {
                $editor->textbox1 = preg_replace( '/<transliteration>.*?<\/transliteration>/s', '', $editor->textbox1 );
            }

            if ( $editor->section ) {

                $file = wfFindFile( $matches[5] );

                if ( $file && $file->exists() ) {
                    $transcriberData = array(
                        'mode'              =>  'edit',
                        'archiveItem'       =>  array('id' => $matches[1], 'leaf' => $matches[2]),
                        'imageUrl'          =>  $file->getUrl(),
                        'iiifDimensions'    =>  array('width' => $matches[3], 'height' => $matches[4]),
                        'mediawikiApi'      =>  $wgScriptPath . '/api.php',
                    );

                    if ( $config->get( 'ArchiveLeafIiifBaseUrl' ) ) {
                        $transcriberData['iiifBaseUrl'] = $config->get( 'ArchiveLeafIiifBaseUrl' );
                    }

                    $wikitext = $editor->getArticle()->getPage()->getContent()->getNativeData();
                    if ( preg_match( '/\bScript=(\S+)/', $wikitext, $matches ) ) {
                        $transcriberData['script'] = strtolower( $matches[1] );
                    }

                    $out->addHTML( '<script>var transcriberData = ' . json_encode($transcriberData) . ';</script>' );
                    $out->addModules( 'ext.archiveleaf.transcriber' );
                }

            }
        }
    }

    public static function onAttemptSave( EditPage $editor ) {
        $config = ConfigFactory::getDefaultInstance()->makeConfig( 'archiveleaf' );

        if ( $config->get( 'ArchiveLeafAutoTransliterate' ) && $config->get( 'ArchiveLeafTransliterateUrl' ) ) {

            $editor->textbox1 = preg_replace( '/<transliteration>.*?<\/transliteration>/', '', $editor->textbox1 );

            $content = $editor->getArticle()->getPage()->getContent();

            if ( $content && preg_match( '/\bScript=(\S+)/', $content->getNativeData(), $matches ) ) {

                $script = strtolower( $matches[1] );
                $transliterator_map = self::getData( 'transliterator' );

                if ( array_key_exists( $script, $transliterator_map ) ) {

                    $transliterator = $transliterator_map[$script];

                    $editor->textbox1 = preg_replace_callback( '/<transcription>\s*(.*?)\s*<\/transcription>/s', function( $match ) use ( $transliterator ) {
                        if (strlen( $match[1] ) ) {
                            return $match[0] . '<transliteration>' . self::transliterate( $transliterator, $match[1] ) . '</transliteration>';
                        } else {
                            return $match[0];
                        }

                    }, $editor->textbox1 );

                }

            }

        }

    }

    public static function onArticleViewFooter( $article, $patrolFooterShown ) {
        global $wgScriptPath;

        $config = ConfigFactory::getDefaultInstance()->makeConfig( 'archiveleaf' );
        $wikitext = $article->getPage()->getContent()->getNativeData();

        if ( preg_match_all( '/\bFullSize=([0-9]+)x([0-9]+).*?\bLocalFileName=(\S+)/s', $wikitext, $match_sets, PREG_SET_ORDER ) ) {

            $imageData = array();

            foreach ( $match_sets as $matches ) {
                $file = wfFindFile( $matches[3] );

                if ( $file && $file->exists() ) {
                    array_push( $imageData, array (
                        'url' => $file->getUrl(),
                        'w'   => $matches[1],
                        'h'   => $matches[2],
                    ) );
                }
            }

            if ( count ( $imageData ) ) {
                $transcriberData = array(
                    'mode'          => 'view',
                    'imageData'     => $imageData,
                    'archiveItem'   => array('id' => $article->getTitle()->getText(), 'leaf' => 0),
                    'mediawikiApi'  => $wgScriptPath . '/api.php',
                );

                if ( $config->get( 'ArchiveLeafIiifBaseUrl' ) ) {
                    $transcriberData['iiifBaseUrl'] = $config->get( 'ArchiveLeafIiifBaseUrl' );
                }

                if ( preg_match( '/\bScript=(\S+)/', $wikitext, $matches ) ) {
                    $transcriberData['script'] = strtolower( $matches[1] );
                }

                $out = $article->getContext()->getOutput();
                $out->addHTML('<script>var transcriberData = ' . json_encode($transcriberData) . ';</script>');
                $out->addModules( 'ext.archiveleaf.transcriber' );
            }

        }

    }

    /**
     * @param string $id
     *
     * @return bool
     */
    public static function checkRemoteID( $id ) {
        $config = ConfigFactory::getDefaultInstance()->makeConfig( 'archiveleaf' );
        $response = @file_get_contents( $config->get( 'ArchiveLeafApiURL' ).'/books/'.$id.'/ia_manifest' );
        return !!$response;
    }

    /**
     * @param string $id
     *
     * @return bool|array('title' => Title, 'collection' => WikiPage)
     */
    public static function importItemByID( $id ) {
        global $wgUser;

        $config = ConfigFactory::getDefaultInstance()->makeConfig( 'archiveleaf' );
        $log = array();
        $response = @file_get_contents( $config->get( 'ArchiveLeafApiURL' ).'/books/'.$id.'/ia_manifest' );

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

        $template = "{{" . $config->get( 'ArchiveLeafTemplateName' );
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

            $leafBrowseUrl = $config->get( 'ArchiveLeafBaseURL' ).'/stream/'.$id.'/'.$subPrefix.'#page/n'.$imageNum.'/mode/1up';

            // import images
            // not efficient to import large images into wiki, shrink to 2000px
            $imageUrlFull = $config->get( 'ArchiveLeafBaseURL' ).'/download/'.$id.'/page/leaf'.$leaf.'_w2000.jpg';
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

            $template .= "\n{{" . $config->get( 'ArchiveLeafTemplateImageName' );
            $template .= "\n|EntryID=" . $id;
            $template .= "\n|Title=" . $imageNum;
            //$template .= "\n|Image=" . $config->get( 'ArchiveLeafBaseURL' ).'/download/'.$id.'/page/leaf'.$leaf.'_w400.jpg';
            //$template .= "\n|ImageBig=" . $config->get( 'ArchiveLeafBaseURL' ).'/download/'.$id.'/page/leaf'.$leaf.'_w800.jpg';
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
        if ( $config->get( 'ArchiveLeafImportScript' ) ) {
            exec( $config->get( 'ArchiveLeafImportScript' ) . ' ' . escapeshellarg( $id ) . ' &' );
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
        return !!( $title && $title->exists() );
    }

    /**
     * Adds link to page on collection page
     *
     * @param Title $title
     * @param WikiPage $page
     */
    public static function addLinkOnCollectionPage( $title, $page ) {
        global $wgUser;

        if ( ! isset( $page ) ) return;

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
        $config = ConfigFactory::getDefaultInstance()->makeConfig( 'archiveleaf' );

        $opts = array('http' =>
            array(
                'method' => 'POST',
                'content' => $str,
            )
        );

        return @file_get_contents( $config->get( 'ArchiveLeafTransliterateUrl' ).'/'.$transliterator, false, stream_context_create($opts) );
    }

    private static $data;

    public static function getData( $id ) {
        if ( !( self::$data && array_key_exists( $id, self::$data ) ) ) {
            self::$data[ $id ] = json_decode( file_get_contents( "extensions/ArchiveLeaf/data/${id}.json" ), true );
        }

        return self::$data[ $id ];
    }
}
