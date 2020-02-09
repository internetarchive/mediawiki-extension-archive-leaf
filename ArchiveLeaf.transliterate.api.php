<?php

class ArchiveLeafTransliterateApi extends ApiBase {
    public function execute() {

        global $wgArchiveLeafTransliterateUrl;

        if ( $wgArchiveLeafTransliterateUrl ) {
            $params = $this->extractRequestParams();
            $result = $this->getResult();

            $txt = ArchiveLeaf::transliterate($params["transliterator"], $params["text"]);
            $result->addValue(null, 'transliteration', $txt);
        } else {
            $this->dieWithError( ApiMessage::create( 'apierror-moduledisabled', null, ['transliterate'] ) );
        }

    }

    public function getAllowedParams() {

        return [
            'transliterator' =>  [
                ApiBase::PARAM_TYPE => 'string',
                ApiBase::PARAM_REQUIRED => true,
            ],

            'text' => [
                ApiBase::PARAM_TYPE => 'string',
                ApiBase::PARAM_REQUIRED => true,
            ],
        ];

    }
}
