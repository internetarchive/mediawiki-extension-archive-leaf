<?php

/**
 * Class for ArchiveLeaf extension
 *
 * @file
 * @ingroup Extensions
 */
class ArchiveLeaf {

    /**
     * @param string $id
     *
     * @return bool
     */
    public static function checkRemoteID( $id ) {

        global $wgArchiveLeafApiURL;

        $response = @file_get_contents( $wgArchiveLeafApiURL.'/books/'.$id.'/ia_manifest' );

        return $response ? true : false;

    }

    /**
     * @param string $id
     *
     * @return bool|Title
     */
    public static function importPageByID( $id ) {

        global $wgArchiveLeafBaseURL, $wgArchiveLeafApiURL, $wgArchiveLeafTemplateName,
               $wgArchiveLeafTemplateImageName, $wgUser;

        $log = array();

        $response = @file_get_contents( $wgArchiveLeafApiURL.'/books/'.$id.'/ia_manifest' );

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

        // language
        if ( $response['language'] ) {
            $iso639 = file_get_contents( 'extensions/ArchiveLeaf/iso-639-3.json' );
            $iso639 = json_decode( $iso639, true );
            $language = $iso639[ $response['language'] ];
        }

        $template = "{{" . $wgArchiveLeafTemplateName;
        $template .= "\n|Description=<!-- put your general description text here -->";
        $template .= "\n|Title=" . $id;
        $template .= "\n|Url=" . $remoteUrl;
        $template .= "\n}}";

        $log[] = "Parsing item '{$remoteUrl}' ...";

        foreach ($leafs as $imageNum => $leaf) {

            //$log[] = "Generating template for leaf #{$leaf}";

            $leafBrowseUrl = $wgArchiveLeafBaseURL.'/stream/'.$id.'/'.$subPrefix.'#page/n'.$imageNum.'/mode/1up';

            // Import image
            // TODO: actually we can't import so large images into wiki, shrink to 2000px
            $imageUrlFull = $wgArchiveLeafBaseURL.'/download/'.$id.'/page/leaf'.$leaf.'_w2000.jpg';
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

                                //TODO: apparently thumb being purged during deferred update for uploaded files
                                DeferredUpdates::clearPendingUpdates();

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

            $template .= "\n{{" . $wgArchiveLeafTemplateImageName;
            $template .= "\n|EntryID=" . $id;
            $template .= "\n|Title=" . $imageNum;
            //$template .= "\n|Image=" . $wgArchiveLeafBaseURL.'/download/'.$id.'/page/leaf'.$leaf.'_w400.jpg';
            //$template .= "\n|ImageBig=" . $wgArchiveLeafBaseURL.'/download/'.$id.'/page/leaf'.$leaf.'_w800.jpg';
            $template .= "\n|ImageBrowse=" . $leafBrowseUrl;
            $template .= "\n|LocalFileName=" . $localFileName;
            $template .= "\n}}";

            $template .= "\n\n<transcription>\n\n</transcription>";

            //$log[] = "Template generated successfully.";

        }

        if ( $language ) {
            $template .= "\n\n[[Category:" . $language . "]]";
        }

        $title = Title::newFromText($id);
        $page = new WikiPage($title);

        $page->doEditContent( new WikitextContent( $template ), 'Imported from Archive.org' );
        $page->doEditUpdates( $page->getRevision(), $wgUser );

        $log[] = "Page '{$id}' successfully created.";

        foreach ($log as $l) {
            wfDebug('[ArchiveLeaf]: '.$l);
        }

        return $title;

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
        if ( $title && $title->exists() ) {
            return true;
        }
        return false;
    }

}
