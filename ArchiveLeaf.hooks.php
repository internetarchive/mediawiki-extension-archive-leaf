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
        $parser->setHook( 'transliteration', self::renderTag( 'transliteration' ) );
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
        $sanitized = self::sanitizeValue($value);
        $wgOut->setHTMLTitle( $sanitized .' - ' . $wgSitename );
        return $sanitized;
    }

   /**
     * Placeholder for title sanitation
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

    public static function renderTag( $tagName ) {
        return function ( $input, array $args, Parser $parser, PPFrame $frame ) use ( $tagName ) {
            $html = '<div class="' . $tagName . '">' . trim( $input ) . '</div>';
            return array( $html, 'markerType' => 'nowiki' );
        };
    }

    public static function onBeforePageDisplay( OutputPage &$out, Skin &$skin ) {
        $out->addModules( 'ext.archiveleaf.common' );
    }

    public static function onShowEditForm( EditPage &$editor, OutputPage &$out ) {
        if ( $editor->section
          && !($editor->preview || $editor->diff)
          && preg_match( '/\{\{EntryImage/', $editor->textbox1 )
          && preg_match( '/LocalFileName=(.+?)\s*\n/', $editor->textbox1, $matches ) ) {

            $file = wfFindFile( $matches[1] );

            if ( $file && $file->exists() ) {
                $out->addHTML( '<script>var entryImageUrl = "' . $file->getUrl() . '";</script>' );
                $out->addModules( 'ext.archiveleaf.transcriber' );
            }
        }
    }

}
