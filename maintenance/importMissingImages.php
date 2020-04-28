<?php

require_once __DIR__ . '/../../../maintenance/Maintenance.php';
require_once __DIR__ . '/../ArchiveLeaf.class.php';

/**
 * Maintenance script to make a page edit.
 *
 * @ingroup Maintenance
 */
class ImportMissingImages extends Maintenance {
    public function __construct() {
        parent::__construct();
        $this->addArg( 'title', 'Title of page to fix' );
    }

    public function execute() {
        $id = $this->getArg( 0 );
        $title = Title::newFromText( $id );
        if ( !$title ) {
            $this->fatalError( "$id is not a valid title.\n" );
        }

        $rev = Revision::newFromTitle( $title );
        if ( !$rev ) {
            $this->fatalError( "Page $id does not exist.\n" );
        }

        $config = ConfigFactory::getDefaultInstance()->makeConfig( 'archiveleaf' );
        $response = @file_get_contents( $config->get( 'ArchiveLeafApiURL' ).'/books/'.$id.'/ia_manifest' );

        if ( !$response ) {
            $this->fatalError( "Could not download IA manifest" );
        }

        $response = json_decode( $response, true );

        if ( !$response || !isset( $response['leafNums'] ) || !count( $response['leafNums'] ) ) {
            $this->fatalError( "IA manifest was invalid" );
        }

        $remoteUrl = $response['url'];

        $leafs = $response['leafNums'];

        foreach ($leafs as $imageNum => $leaf) {

            $this->output("importing leaf $leaf ...\n");

            $log = array();
            $localFileName = ArchiveLeaf::importSingleLeaf( $id, $leaf, $remoteUrl, $log );
            foreach ($log as $l) {
                $this->output( $l."\n" );
            }
        }
    }
}

$maintClass = ImportMissingImages::class;
require_once RUN_MAINTENANCE_IF_MAIN;
