pragma solidity ^0.5.8;

contract OracleManagement{
    //Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;
    
    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;
    
    // Number of oracles that must respond for valid status
    uint256 internal constant MIN_RESPONSES = 3;
    
    struct Oracle{
        bool isRegistered;
        uint8[3] indexes; 
    }
    
    // Track all registered oracles
    mapping(address => Oracle) internal oracles;
    
    // Model for responses from oracles
    struct ResponseInfo{
        address requester; 
        bool isOpen;
        mapping(uint8 => address[]) responses;
        mapping(address => uint8) responsedRecords;
        address[] responsedOracles;
        bool isExist;
        uint8 statusCode;
    }
    
    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) internal oracleResponses;

    bytes32[] internal allResponseKeys;

    function isResponseExist(bytes32 responseKey) public view returns(bool){
        return oracleResponses[responseKey].isExist;
    }

    modifier requireResponseExist(bytes32 responseKey){
        require(isResponseExist(responseKey), "ResponseInfo doesn't exist");
        _;
    }

    function isResponseOpen(bytes32 responseKey) public view returns(bool){
        return oracleResponses[responseKey].isOpen;
    }

    function setResponseClose(bytes32 responseKey, uint8 _statusCode) internal {
        if (oracleResponses[responseKey].isOpen = true){
            oracleResponses[responseKey].isOpen = false;
            oracleResponses[responseKey].statusCode = _statusCode;
        }
    }

    function createResponseInfo(bytes32 responseKey, address _requester) internal{
        require(!isResponseExist(responseKey), "ResponseInfo created before");
        ResponseInfo memory responseInfo;
        responseInfo.requester = _requester;
        responseInfo.isOpen = true;
        responseInfo.isExist = true;
        oracleResponses[responseKey] = responseInfo;
    }

    function addOneResponse(bytes32 responseKey, address oracle, uint8 responsedCode) internal requireResponseExist(responseKey){
        oracleResponses[responseKey].responses[responsedCode].push(oracle);
        oracleResponses[responseKey].responsedRecords[oracle] = responsedCode;
        oracleResponses[responseKey].responsedOracles.push(oracle);
    }

    function queryResponseInfo(bytes32 _fetchKey) public view 
        returns(address requester, bool isOpen, address[] memory responsedOracles, uint8 statusCode){
            requester = oracleResponses[_fetchKey].requester;
            isOpen = oracleResponses[_fetchKey].isOpen;
            responsedOracles = oracleResponses[_fetchKey].responsedOracles;
            statusCode = oracleResponses[_fetchKey].statusCode;
    }
     
    function getAllResponseKeys() public view returns(bytes32[] memory){
        return allResponseKeys;
    }

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);
    
    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);
    
    function getMyIndexes() public view returns(uint8[3] memory) {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");
        return oracles[msg.sender].indexes;
    }
    
    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account) internal returns(uint8[3] memory){
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }
    
    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account)internal returns (uint8){
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }
    
    // Register an oracle with the contract
    function registerOracle() external payable{
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");
        
        uint8[3] memory indexes = generateIndexes(msg.sender);
        
        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function queryOracle(address oracleAddress) public view returns(bool isRegistered, uint8[3] memory indexes){
        isRegistered = oracles[oracleAddress].isRegistered;
        indexes = oracles[oracleAddress].indexes;
    }
}