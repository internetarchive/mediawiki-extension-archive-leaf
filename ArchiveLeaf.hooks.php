<?php

/**
 * Hooks for ArchiveLeaf extension
 *
 * @file
 * @ingroup Extensions
 */
class ArchiveLeafHooks {

    public static function onParserFirstCallInit( Parser &$parser ) {
        $parser->setFunctionHook('sanitize_leaf_title', 'ArchiveLeaf::parserSanitize');

        $parser->setHook( 'transcription', [ self::class, 'renderTagTranscription' ] );
    }

    public static function renderTagTranscription( $input, array $args, Parser $parser, PPFrame $frame ) {
        $input = trim( $input );
        return $parser->recursiveTagParse( $input, $frame );
    }

    public static function onParserBeforeInternalParse( Parser &$parser, &$text, StripState &$stripState ) {
        $text = preg_replace( '/\n{2,}(<transcription[> ])/', "\n$1", $text );
        $text = preg_replace( '/(<\/transcription>)\n{2,}/', "$1\n", $text );
        return true;
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
                $out->addModules( 'ext.archiveleaf.transcriber' );
            }
        }
    }

}
