pragma solidity ^0.5.8;
import "./OracleManagement.sol";
import "./Operational.sol";

contract FlightSuretyApp is OracleManagement, Operational{
    FlightSuretyDataInterface flightSuretyData;
    address private contractOwner;
    
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;
    
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);
    
    constructor(address dataContractAddress) public{
        flightSuretyData = FlightSuretyDataInterface(dataContractAddress);
        contractOwner = msg.sender;
    }

    function registerAirline(string memory _name, string memory _code) public{
        flightSuretyData.registerAirline(_name, _code, msg.sender);
    }
    
    function registerFlight(string memory _code, uint256 _departureTimestamp) public requireIsOperational{
        flightSuretyData.registerFlight(_code, _departureTimestamp, msg.sender);
    }

    function generateFlightKey(string memory _flightCode, uint256 _timestamp) public returns(bytes32){
        return flightSuretyData.generateFlightKey(_flightCode, _timestamp);
    }

    function getResponseKey(uint8 randomIndex, address airline, string memory flight,uint256 timestamp) public pure returns(bytes32){
        return  keccak256(abi.encodePacked(randomIndex, airline, flight, timestamp));
    }

    function fetchFlightStatus(address airline, string memory flightCode, uint256 timestamp) public requireIsOperational{
          uint8 fetchIndex = getRandomIndex(msg.sender);
          // Generate a unique key for storing the request
          //bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
          bytes32 fetchKey = getResponseKey(fetchIndex, airline, flightCode, timestamp);
          allResponseKeys.push(fetchKey);
          
          createResponseInfo(fetchKey, msg.sender);

          emit OracleRequest(fetchIndex, airline, flightCode, timestamp);
    } 
    
    /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus(string memory flight, uint256 timestamp, uint8 statusCode) public requireIsOperational{
        //if (statusCode == STATUS_CODE_LATE_AIRLINE) creditInsurees(flight)
        bytes32 flightKey = flightSuretyData.generateFlightKey(flight, timestamp);
        if (statusCode != STATUS_CODE_UNKNOWN) {
            if (statusCode == STATUS_CODE_LATE_AIRLINE){
                flightSuretyData.setFlightLateAirline(flightKey);
                flightSuretyData.creditInsurees(flightKey);
            } else {
                flightSuretyData.proceedFlightNoCreditCase(flightKey);
                if (statusCode == STATUS_CODE_ON_TIME) {
                    flightSuretyData.setFlightOnTime(flightKey);
                } else {
                    flightSuretyData.setFlightLateNotAirline(flightKey);
                }
            }
        }
    }
    
    
    function checkAllIndexes(uint8 index, address requester) public view returns(bool){
        return ((oracles[requester].indexes[0] == index) || (oracles[requester].indexes[1] == index) || (oracles[requester].indexes[2] == index));
    }

    modifier requireCorrectIndexes(uint8 index, address oracle){
        require(checkAllIndexes(index, oracle), "Index does not match oracle request");
        _;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(uint8 fetchIndex, address airline, string memory  flight, uint256 timestamp, uint8 statusCode) public requireIsOperational requireCorrectIndexes(fetchIndex, msg.sender){
        //require(((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index)), "Index does not match oracle request");

        //bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        bytes32 key = getResponseKey(fetchIndex, airline, flight, timestamp);
        require(oracleResponses[key].isExist, "Generated response key does not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if ((oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES)&&(isResponseOpen(key))) {
            setResponseClose(key, statusCode);
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(flight, timestamp, statusCode);
        }
    }

    function airlineFund(uint256 _funds) public payable{
        flightSuretyData.fund(_funds, msg.sender);
    }

    function airlineVote(address _candidate) public{
        flightSuretyData.vote(_candidate, msg.sender);
    }

    function passenagerBuyInsurance(string memory _flightCode, address _airline, uint256 _departTimestamp, uint256 _insureTimestamp) public payable{
        flightSuretyData.buy(_flightCode, _airline, _departTimestamp, _insureTimestamp, msg.sender, msg.value);
    }

    function generateInsuranceKey(bytes32 _flightKey, uint256 _contractTimestamp) public returns (bytes32){
        return flightSuretyData.generateInsuranceKey(msg.sender, _flightKey, _contractTimestamp);
    }

    function airlinePayInsurees(bytes32 flightKey) public {
        flightSuretyData.payInsurees(flightKey, msg.sender);
    }
}

contract FlightSuretyDataInterface{
    function registerAirline(string calldata _name, string calldata _code, address _airline) external;
    function registerFlight(string calldata _code, uint256 timestamp, address _airline) external returns(bytes32);
    function fund(uint256 _funds, address _funder) external;
    function vote(address _candidate, address _voter) external;
    function buy(string calldata _flightCode, address _airline, uint256 _departTimestamp, uint256 _insureTimestamp, address _buyer, uint256 _fee) external;
    function creditInsurees(bytes32 flightKey) external;
    function payInsurees(bytes32 flightKey, address _airline) external;
    function setFlightOnTime(bytes32 _flightID) external;
    function setFlightLateAirline(bytes32 _flightID) external;
    function setFlightLateNotAirline(bytes32 _flightID) external;
    function proceedFlightNoCreditCase(bytes32 _flightID) external;
    function generateFlightKey(string calldata _flightCode, uint256 _timestamp) external returns(bytes32);
    function generateInsuranceKey(address _owner, bytes32 _flightKey, uint256 _contractTimestamp) external returns(bytes32);
}