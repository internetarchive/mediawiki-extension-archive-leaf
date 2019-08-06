<?php

class ArchiveLeafTransliterateApi extends ApiBase {
    public function execute() {

        $params = $this->extractRequestParams();
        $result = $this->getResult();

        $txt = ArchiveLeaf::transliterate($params["transliterator"], $params["text"]);
        $result->addValue(null, 'transliteration', $txt);

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
