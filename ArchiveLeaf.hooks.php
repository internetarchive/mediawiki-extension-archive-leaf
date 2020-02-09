<?php

/**
 * Hooks for ArchiveLeaf extension
 *
 * @file
 * @ingroup Extensions
 */
class ArchiveLeafHooks {

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
        $sanitized = ArchiveLeaf::sanitizeValue($value);
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
            $iso639 = ArchiveLeaf::getData( 'iso-639-3' );

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
        global $wgArchiveLeafArchiveOrgRewrite;

        if ( $wgArchiveLeafArchiveOrgRewrite ) {
            $url = preg_replace( '#^https?://archive.org\b#', $wgArchiveLeafArchiveOrgRewrite, $url );
        }
    }

    public static function onShowEditForm( EditPage &$editor, OutputPage &$out ) {

        global $wgArchiveLeafAutoTransliterate, $wgArchiveLeafTransliterateUrl, $wgArchiveLeafIiifBaseUrl, $wgScriptPath;

        if ( !($editor->preview || $editor->diff)
          && preg_match( '/\{\{EntryImage/', $editor->textbox1 )
          && preg_match( '/\bEntryID=(\S+).*?\bTitle=(\S+).*?\bFullSize=([0-9]+)x([0-9]+).*?\bLocalFileName=(\S+)/s', $editor->textbox1, $matches ) ) {

            if ( $wgArchiveLeafAutoTransliterate && $wgArchiveLeafTransliterateUrl ) {
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

                    if ( $wgArchiveLeafIiifBaseUrl ) {
                        $transcriberData['iiifBaseUrl'] = $wgArchiveLeafIiifBaseUrl;
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

        global $wgArchiveLeafAutoTransliterate, $wgArchiveLeafTransliterateUrl;

        if ( $wgArchiveLeafAutoTransliterate && $wgArchiveLeafTransliterateUrl ) {

            $editor->textbox1 = preg_replace( '/<transliteration>.*?<\/transliteration>/', '', $editor->textbox1 );

            $content = $editor->getArticle()->getPage()->getContent();

            if ( $content && preg_match( '/\bScript=(\S+)/', $content->getNativeData(), $matches ) ) {

                $script = strtolower( $matches[1] );
                $transliterator_map = ArchiveLeaf::getData( 'transliterator' );

                if ( array_key_exists( $script, $transliterator_map ) ) {

                    $transliterator = $transliterator_map[$script];

                    $editor->textbox1 = preg_replace_callback( '/<transcription>\s*(.*?)\s*<\/transcription>/s', function( $match ) use ( $transliterator ) {
                        if (strlen( $match[1] ) ) {
                            return $match[0] . '<transliteration>' . ArchiveLeaf::transliterate( $transliterator, $match[1] ) . '</transliteration>';
                        } else {
                            return $match[0];
                        }

                    }, $editor->textbox1 );

                }

            }

        }

    }

    public static function onArticleViewFooter( $article, $patrolFooterShown ) {

        global $wgArchiveLeafIiifBaseUrl, $wgScriptPath;

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

                if ( $wgArchiveLeafIiifBaseUrl ) {
                    $transcriberData['iiifBaseUrl'] = $wgArchiveLeafIiifBaseUrl;
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

}
