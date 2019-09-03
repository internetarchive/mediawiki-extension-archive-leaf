<?php

/**
 * ArchiveLeaf SpecialPage for ArchiveLeaf extension
 *
 * @file
 * @ingroup Extensions
 */
class SpecialArchiveLeaf extends SpecialPage {

    private $templater;

    public function __construct() {
        parent::__construct( 'ArchiveLeaf' );
        $this->templater = new TemplateParser( dirname(__FILE__).'/../templates/', true );
    }

    /**
     * Show the page to the user
     *
     * @param string $sub The subpage string argument (if any).
     *  [[Special:ArchiveLeaf/subpage]].
     *
     * @return bool|void
     */
    public function execute( $sub ) {

        global $wgArchiveLeafBaseURL, $wgArchiveLeafApiURL, $wgArchiveLeafTemplateName, $wgArchiveLeafTemplateImageName;

        // Check permissions
        if ( !$this->getUser()->isAllowed('archiveleaf') ) {
            $this->displayRestrictionError();
            return;
        }

        // Add modules
        $out = $this->getOutput();
        $out->addModules( 'ext.archiveleaf.special' );

        // Modify title
        $out->setPageTitle( $this->msg( 'archiveleaf-special-title' ) );
        //$out->addHelpLink( 'How to become a MediaWiki hacker', true );

        if (
            empty($wgArchiveLeafBaseURL) ||
            empty($wgArchiveLeafApiURL) ||
            empty($wgArchiveLeafTemplateImageName) ||
            empty($wgArchiveLeafTemplateName)
        ) {
            $this->printErrorConfig();
            return;
        }

        $templateMain = Title::newFromText( $wgArchiveLeafTemplateName, NS_TEMPLATE );
        $templateImage = Title::newFromText( $wgArchiveLeafTemplateImageName, NS_TEMPLATE );
        if ( !$templateMain->exists() || !$templateImage->exists() ) {
            $this->printTemplatesError();
            return;
        }

        if ( !UploadFromUrl::isEnabled() ) {
            $this->printErrorUpload();
            return;
        }

        // Process input & render form
        if ( $this->getRequest()->wasPosted() ) {
            $this->processResult();
        } else {
            $this->printNormal();
        }

    }

    /**
     * Prints error message when upload or upload from url is disabled in wiki
     */
    private function printErrorUpload() {
        $this->getOutput()->addHTML(
            wfMessage('archiveleaf-special-page-error-upload-disabled')->plain()
        );
    }

    /**
     * Prints error messages related to missing templates
     */
    private function printTemplatesError() {

        global $wgArchiveLeafTemplateName, $wgArchiveLeafTemplateImageName;

        $this->getOutput()->addHTML( wfMessage('archiveleaf-special-page-error-template')
            ->params( $wgArchiveLeafTemplateName, $wgArchiveLeafTemplateImageName )
            ->parse() );

    }

    /**
     * Prints error message related to config issues
     */
    private function printErrorConfig() {

        $this->getOutput()->addHTML( wfMessage('archiveleaf-special-page-error-config')->parse() );

    }

    /**
     * Processes user input and takes an actions
     */
    private function processResult() {
        $id = $this->getRequest()->getVal('import_id');

        // Sanitize to common format
        $id = preg_replace( '/\//', '', mb_strtolower($id) );

        if ( ArchiveLeaf::isPageExists( $id ) ) {
            // Display error
            $this->printNormal( $id, $this->msg('archiveleaf-special-page-exists-error')->params($id)->parse() );
        } else {
            // Process input and generate the page
            if ( !ArchiveLeaf::checkRemoteID( $id ) ) {
                // Handle missing id
                $this->printNormal( $id, $this->msg('archiveleaf-special-page-remote-not-exists-error')->plain() );
            } else {
                // Process
                $result = ArchiveLeaf::importItemByID( $id );

                if ( $result ) {
                    ArchiveLeaf::addLinkOnCollectionPage( $result['title'], $result['collection'] );
                    $this->printSuccess( $result['title'], $result['collection'] );
                } else {
                    $this->printNormal( $id, $this->msg('archiveleaf-special-page-unknown-error')->plain() );
                }
            }
        }
    }

    /**
     * @param Title $title
     * @param WikiPage $collection
     */
    private function printSuccess( $title, $collection ) {

        if ( isset( $collection) ) {
            $collection_title = $collection->getTitle();
            $collection_url = $collection_title->getFullURL();
            $collection_text = $collection_title->getBaseText();
        } else {
            $collection_url = '#';
            $collection_text = '(unknown)';
        }

        $this->getOutput()->addHTML( wfMessage('archiveleaf-special-page-success-text')
            ->params(
                $title->getFullURL(),
                $title->getBaseText(),
                $collection_url,
                $collection_text,
                SpecialPage::getTitleFor('ArchiveLeaf')->getFullURL() )->plain()
            );

    }

    /**
     * Prints form & displays errors if necessary
     * @param bool $error
     */
    private function printNormal( $value = '', $error = false ) {
        $this->getOutput()->addWikiMsg( 'archiveleaf-special-text' );

        $data = array(
            'error' => $error,
            'import_id_value' => $value,
            'loading_message' => wfMessage('archiveleaf-special-page-loading-message')->plain(),
            'submit_value' => wfMessage('archiveleaf-special-input-submit')->plain(),
        );

        $formHtml = $this->templater->processTemplate('form', $data);

        $this->getOutput()->addHTML( $formHtml );
    }

    /**
     * Returns special page group name to be grouped at Special:SpecialPages
     * @return string
     */
    protected function getGroupName() {
        return 'other';
    }
}
