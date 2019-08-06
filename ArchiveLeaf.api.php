class ArchiveLeafApi extends ApiBase {
    pubic function execute() {

        $params = $this->extractRequestParameters();

        $result = $this->getResult();

    }

    public function getAllowedParams() {

        return [
            'id' =>  [
                ApiBase::PARAM_TYPE => 'string',
                ApiBase::PARAM_REQUIRED => true,
            ],
        ];

    }
}
