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
        flightSuretyData.registerAirline(_name, _code);
    }
    
    function registerFlight(string calldata _code, uint256 _departureTimestamp, uint256 _arrivalTimestamp) external requireIsOperational returns(bytes32 flightKey) {
        flightKey = flightSuretyData.addFlight(_code, _departureTimestamp, _arrivalTimestamp);
    }

    function fetchFlightStatus(string memory flightCode, uint256 timestamp) public{
        //uint8 index = getRandomIndex(msg.sender);

        bytes32 flightKey = flightSuretyData.generateFlightKey(flightCode, timestamp);
        ResponseInfo memory responseInfo;
        responseInfo.requester = msg.sender;
        responseInfo.isOpen = true;
        oracleResponses[flightKey] = responseInfo;
    }
    
    /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus(string memory flight, uint256 timestamp, uint8 statusCode) internal requireIsOperational{
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
    
    
    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(uint8 index, address airline, string memory  flight, uint256 timestamp, uint8 statusCode) public requireIsOperational{
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(flight, timestamp, statusCode);
        }
    }
}

contract FlightSuretyDataInterface{
    function registerAirline(string calldata _name, string calldata _code) external;
    function vote(string calldata _name, string calldata _code) external;
    function buy(string calldata _flightCode, address _airline, uint256 _fee, uint256 _departureTimestamp, uint256 _arrivalTimestamp) external;
    function creditInsurees(bytes32 flightKey) external;
    function payInsurees(bytes32 flightKey) external;
    function addFlight(string calldata _code, uint256 timestamp, uint256 _arrivalTimestamp) external returns(bytes32);
    function setFlightOnTime(bytes32 _flightID) external;
    function setFlightLateAirline(bytes32 _flightID) external;
    function setFlightLateNotAirline(bytes32 _flightID) external;
    function proceedFlightNoCreditCase(bytes32 _flightID) external;
    function generateFlightKey(string calldata _flightCode, uint256 _timestamp) external returns(bytes32);
}