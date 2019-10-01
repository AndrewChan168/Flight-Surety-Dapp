pragma solidity ^0.5.8;
import "./OracleManagement.sol";
import "./Operational.sol";

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyApp is OracleManagement, Operational{
    using SafeMath for uint256;
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
    

    function registerAirline(string memory _name) public{
        flightSuretyData.registerAirline(_name, msg.sender);
    }

    function airlineVote(address _candidate) public{
        flightSuretyData.vote(_candidate, msg.sender);
    }

    function airlineFund() public payable{
        flightSuretyData.addFund(msg.sender, msg.value);
    }

    //function registerFlight(string memory _code, uint256 _timestamp) public view returns(address){
    function registerFlight(string memory _code, uint256 _timestamp) public{
        flightSuretyData.registerFlight(_code, _timestamp, msg.sender);
        //return msg.sender;
    }

    function generateFlightKey(string memory _code, uint256 _timestamp) public returns(bytes32){
        return flightSuretyData.generateFlightKey(_code, _timestamp);
    }

    function passenagerBuyInsurance(bytes32 _flightKey, uint256 _contractTimestamp, address _airline) public payable{
        flightSuretyData.registerInsurance(msg.sender, _flightKey, _contractTimestamp, _airline, msg.value);
        //registerInsurance(address _buyer, bytes32 _flightKey, uint256 _contractTimestamp, address _airline, uint256 _fee) external
    }

    //address _buyer, bytes32 _flightKey, uint256 _contractTimestamp
    function generateInsuranceKey(address _buyer, bytes32 _flightKey, uint256 _contractTimestamp) public returns(bytes32){
        return flightSuretyData.generateInsuranceKey(_buyer, _flightKey, _contractTimestamp);
    }

    function creditInsurance(bytes32 _insuranceKey) public{
        flightSuretyData.creditInsurance(_insuranceKey);
    }

    function creditAllInsurances(bytes32 _flightKey) public{
        bytes32[] memory _insurancesKeys = flightSuretyData.getInsuranceKeysList(_flightKey);
        for(uint256 i=0; i<_insurancesKeys.length; i++){
            creditInsurance(_insurancesKeys[i]);
        }
    }

    function passenagerWithdrawCredits() public payable{
        uint256 credits = flightSuretyData.queryBuyerCredit(msg.sender);
        require(queryContractBalance()>credits, "Application's ether is not enough");
        flightSuretyData.deductCredits(msg.sender);
        msg.sender.transfer(credits);
    }

    function proceedFlightNoCreditCase(bytes32 flightKey) public{
        bytes32[] memory _insurancesKeys = flightSuretyData.getInsuranceKeysList(flightKey);
        for(uint256 i=0; i<_insurancesKeys.length; i++){
            //flightSuretyData.setInsuranceWithdrawn(_insurancesKeys[i]);
            flightSuretyData.setInsuranceExpired(_insurancesKeys[i]);
        }
    }

    /**
    * Handling oracles
    */
    function generateResponseKey(uint8 randomIndex, address airline, string memory flight,uint256 timestamp) public pure returns(bytes32){
        return  keccak256(abi.encodePacked(randomIndex, airline, flight, timestamp));
    }

    function fetchFlightStatus(address airline, string memory flightCode, uint256 flightTimestamp) public requireIsOperational{
        uint8 fetchIndex = getRandomIndex(msg.sender);
        bytes32 reponseKey = generateResponseKey(fetchIndex, airline, flightCode, flightTimestamp);
        allResponseKeys.push(reponseKey);
        createResponseInfo(reponseKey, msg.sender);

        emit OracleRequest(fetchIndex, airline, flightCode, flightTimestamp);
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
        bytes32 key = generateResponseKey(fetchIndex, airline, flight, timestamp);
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

    /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus(string memory flight, uint256 timestamp, uint8 statusCode) public requireIsOperational{
        //if (statusCode == STATUS_CODE_LATE_AIRLINE) creditInsurees(flight)
        bytes32 flightKey = flightSuretyData.generateFlightKey(flight, timestamp);
        if (statusCode != STATUS_CODE_UNKNOWN) {
            if (statusCode == STATUS_CODE_LATE_AIRLINE){
                setFlightLateAirline(flightKey);
                creditAllInsurances(flightKey);
            } else {
                proceedFlightNoCreditCase(flightKey);
                if (statusCode == STATUS_CODE_ON_TIME) {
                    setFlightOnTime(flightKey);
                } else {
                    setFlightLateNotAirline(flightKey);
                }
            }
        }
    }

    function queryContractBalance() public view returns(uint256){
        return address(this).balance;
    }

    function setFlightOnTime(bytes32 flightKey) public{
        flightSuretyData.setFlightOnTime(flightKey);
    }

    function setFlightLateAirline(bytes32 flightKey) public{
        flightSuretyData.setFlightLateAirline(flightKey);
    }

    function setFlightLateNotAirline(bytes32 flightKey) public{
        flightSuretyData.setFlightLateNotAirline(flightKey);
    }
}

contract FlightSuretyDataInterface{
    function registerAirline(string calldata _name, address _airline) external;
    function vote(address _candidate, address _voter) external;
    function couldFund(address _candidate) external returns(bool);
    function addFund(address _airline, uint256 _fund) external;
    function registerFlight(string calldata _code, uint256 _timestamp, address _airline) external;
    function registerInsurance(address _buyer, bytes32 _flightKey, uint256 _contractTimestamp, address _airline, uint256 _fee) external;
    function creditInsurance(bytes32 _insuranceKey) external returns(uint256);
    function deductInsurance(bytes32 _insuranceKey, address _airline) external returns(uint256);
    function queryInsuranceBuyer(bytes32 _insuranceKey) external returns(address);
    function generateFlightKey(string calldata flightCode, uint256 timestamp) external returns(bytes32);
    function generateInsuranceKey(address _buyer, bytes32 _flightKey, uint256 _contractTimestamp) external returns(bytes32);
    function getInsuranceKeysList(bytes32 flightKey) external returns(bytes32[] memory);
    function setInsuranceWithdrawn(bytes32 insuranceKey) external;
    function setInsuranceExpired(bytes32 insuranceKey) external;
    function queryBuyerCredit(address _buyer) external returns(uint256);
    function deductCredits(address _buyer) external;
    function setFlightOnTime(bytes32 _flightID) external;
    function setFlightLateAirline(bytes32 _flightID) external;
    function setFlightLateNotAirline(bytes32 _flightID) external; 
}