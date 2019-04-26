<?php

/**
 * Hooks for ArchiveLeaf extension
 *
 * @file
 * @ingroup Extensions
 */
class ArchiveLeafHooks {

    public static function onExtensionLoad() {
    }

    /**
     * Registers parser function hook
     * @param Parser $parser
     */
    public static function onParserFirstCallInit( $parser ) {
        $parser->setFunctionHook('sanitize_leaf_title', 'ArchiveLeaf::parserSanitize');

        $parser->setHook( 'transcription', [ self::class, 'renderTagTranscription' ] );
    }

    public static function renderTagTranscription( $input, array $args, Parser $parser, PPFrame $frame ) {
        $script = strtolower( detectScript( $input ) );
        $output = $parser->recursiveTagParse( $input, $frame );
        return '<div class="transcription script-' . $script . '">' . $output . '</div>';
    }

    public static function onDoEditSectionLink( $skin, $title, $section, $tooltip, &$result, $lang = false ) {
        //$result = '';
    }

    public static function onBeforePageDisplay( OutputPage &$outputPage, Skin &$skin ) {
        $outputPage->addModules( 'ext.archiveleaf.font' );
    }

}

function detectScript( $text ) {
    $value_name = array();

    $len = min( mb_strlen($text), 10 );

    for ($i = 0; $i < $len; $i++) {
        $script = IntlChar::getIntPropertyValue( mb_substr( $text, $i, 1 ), IntlChar::PROPERTY_SCRIPT );

        if ( !array_key_exists( $script, $value_name ) ) {
            $value_name[ $script ] = IntlChar::getPropertyValueName( IntlChar::PROPERTY_SCRIPT, $script, IntlChar::SHORT_PROPERTY_NAME );
        }

        $script = $value_name[ $script ];

        # ignore Latin, Common, Inherited
        if ( $script !== 'Latn' && $script !== 'Zyyy' && $script !== 'Zinh' ) {
            return $script;
        }
    }

    return 'Latn';
}
