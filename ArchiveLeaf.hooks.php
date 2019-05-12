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

        $parser->setHook( 'transcription', [ self::class, 'renderTagTranscription' ] );
        $parser->setHook( 'transliteration', [ self::class, 'renderTagTransliteration' ] );
        $parser->setHook( 'translation', [ self::class, 'renderTagTranslation' ] );
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

    public static function renderTagTranscription( $input, array $args, Parser $parser, PPFrame $frame ) {
        $input = trim( $input );
        return $parser->recursiveTagParse( $input, $frame );
    }

    public static function renderTagTransliteration( $input, array $args, Parser $parser, PPFrame $frame ) {
        $input = trim( $input );
        return $parser->recursiveTagParse( $input, $frame );
    }

    public static function renderTagTranslation( $input, array $args, Parser $parser, PPFrame $frame ) {
        $input = trim( $input );
        return $parser->recursiveTagParse( $input, $frame );
    }

    public static function onBeforePageDisplay( OutputPage &$out, Skin &$skin ) {
        $out->addModules( 'ext.archiveleaf.font' );
    }

    public static function onShowEditForm( EditPage &$editor, OutputPage &$out ) {
        if ( preg_match( '/\{\{EntryImage/', $editor->textbox1 )
          && preg_match( '/LocalFileName=(.+?)\s*\n/', $editor->textbox1, $matches ) ) {

            $file = wfFindFile( $matches[1] );

            if ( $file && $file->exists() ) {
                $out->addHTML( '<script>var entryImageUrl = "' . $file->getUrl() . '";</script>' );
                $out->addModules( 'ext.archiveleaf.transcriber' );
            }
        }
    }

}
