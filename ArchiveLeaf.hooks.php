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
        $parser->setHook( 'translation', self::renderTag( 'translation' ) );
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
            $html = '';

            if ( isset( $headingTitle) ) {
                #$html .= $parser->recursiveTagParse( "===== $headingTitle =====", $frame );
            }

            $html .= '<div class="' . $tagName . '">' . trim( $input ) . '</div>';

            return array( $html, 'markerType' => 'nowiki' );
        };
    }

    public static function onBeforePageDisplay( OutputPage &$out, Skin &$skin ) {
        $out->addModules( 'ext.archiveleaf.common' );
    }

    public static function onShowEditForm( EditPage &$editor, OutputPage &$out ) {

        global $wgArchiveLeafAutoTransliterate;

        if ( !($editor->preview || $editor->diff)
          && preg_match( '/\{\{EntryImage/', $editor->textbox1 )
          && preg_match( '/LocalFileName=(.+?)\s*\n/', $editor->textbox1, $matches ) ) {

            if ( $wgArchiveLeafAutoTransliterate ) {
                $editor->textbox1 = preg_replace( '/<transliteration>.*?<\/transliteration>/s', '', $editor->textbox1 );
            }

            if ( $editor->section ) {

                $file = wfFindFile( $matches[1] );

                if ( $file && $file->exists() ) {
                    $out->addHTML( '<script>var entryImageUrl = "' . $file->getUrl() . '";</script>' );
                    $out->addModules( 'ext.archiveleaf.transcriber' );
                }

            }
        }
    }

    public static function onAttemptSave( EditPage $editor ) {

        global $wgArchiveLeafAutoTransliterate;

        if ( $wgArchiveLeafAutoTransliterate ) {

            $editor->textbox1 = preg_replace( '/<transliteration>.*?<\/transliteration>/', '', $editor->textbox1 );

            $editor->textbox1 = preg_replace_callback( '/<transcription>\s*(.*?)\s*<\/transcription>/s', function( $match ) {
                if (strlen( $match[1] ) ) {
                    return $match[0] . '<transliteration>' . ArchiveLeaf::transliterate( 'Balinese-ban_001', $match[1] ) . '</transliteration>';
                } else {
                    return $match[0];
                }

            }, $editor->textbox1 );

        }

    }

}
