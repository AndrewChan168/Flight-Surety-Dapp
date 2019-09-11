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
    }
    
    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) internal oracleResponses;
    

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);
    
    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);
    
    function getMyIndexes() view public returns(uint8[3] memory) {
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
    function registerOracle() public payable{
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");
        
        uint8[3] memory indexes = generateIndexes(msg.sender);
        
        //oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
        Oracle memory oracle;
        oracle.isRegistered = true;
        oracle.indexes = indexes;
        oracles[msg.sender] = oracle;
    }

    function queryOracle(address oracleAddress) public view returns(bool isRegistered, uint8[3] memory indexes){
        isRegistered = oracles[oracleAddress].isRegistered;
        indexes = oracles[oracleAddress].indexes;
    }
}