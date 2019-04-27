<?php

/**
 * Hooks for ArchiveLeaf extension
 *
 * @file
 * @ingroup Extensions
 */
class ArchiveLeafHooks {

    /**
     * Registers parser function hook
     * @param Parser $parser
     */
    public static function onParserFirstCallInit( $parser ) {
        $parser->setFunctionHook('sanitize_leaf_title', 'ArchiveLeaf::parserSanitize');

        $parser->setHook( 'transcription', [ self::class, 'renderTagTranscription' ] );
    }

    public static function renderTagTranscription( $input, array $args, Parser $parser, PPFrame $frame ) {
        $output = $parser->recursiveTagParse( $input, $frame );
        return $output;
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
                $out->addHTML( '<div id="transcriber"></div>' );
            }
        }
    }

}
