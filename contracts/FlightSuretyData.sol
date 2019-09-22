pragma solidity ^0.5.8;

import "./AirlineData.sol";
import "./InsuranceData.sol";
import "./FlightData.sol";
import "./Authorizable.sol";

contract FlightSuretyData is AirlineData, InsuranceData, FlightData, Authorizable{
    //address contractOwner;
    //constructor() public {
    //    contractOwner = msg.sender;
    //}

    function registerAirline(string memory _name, string memory _code, address _airline) public requireIsOperational requireAuthorizedCaller(msg.sender){
        addAirline(_name, _code, _airline);
    }

    function fund(uint256 _funds, address _funder) public payable requireAuthorizedCaller(msg.sender){
        super.fund(_funds, _funder);
    }

    function vote(address _candidate, address _voter) public requireAuthorizedCaller(msg.sender){
        super.vote(_candidate, _voter);
    }

    function registerFlight(string memory _code, uint256 _timestamp, address _airline) public requireIsOperational requireAirlineFunded(_airline) requireAuthorizedCaller(msg.sender) returns(bytes32){
        bytes32 flightKey = addFlight(_code, _timestamp, _airline);
        return flightKey;
    }

    function setFlightOnTime(bytes32 _flightID) public requireAuthorizedCaller(msg.sender){
        super.setFlightOnTime(_flightID);
    }

    function setFlightLateAirline(bytes32 _flightID) public requireAuthorizedCaller(msg.sender){
        super.setFlightLateAirline(_flightID);
    }

     function setFlightLateNotAirline(bytes32 _flightID) public requireAuthorizedCaller(msg.sender){
        super.setFlightLateNotAirline(_flightID);
    }

    function buy(string memory _flightCode, address _airline, uint256 _departTimestamp, uint256 _insureTimestamp, address _buyer, uint256 _fee) public payable requireIsOperational requireAuthorizedCaller(msg.sender)
        returns(bytes32){
            require(isAirlineFunded(_airline),"Airline must be in funded status");
            bytes32 flightKey = generateFlightKey(_flightCode, _departTimestamp);
            require(isFlightExist(flightKey), "Flight does not exist");
            bytes32 insuranceKey = buyInsurance(flightKey, _airline, _insureTimestamp, _buyer, _fee);
            addInsuranceKey(flightKey, insuranceKey);
            return insuranceKey;
        }

    function creditInsurees(bytes32 flightKey) public requireIsOperational requireFlightLateAirline(flightKey) requireAuthorizedCaller(msg.sender){
        bytes32[] memory insuranceKeysList = getInsuranceKeysList(flightKey);
        for(uint256 i=0; i<insuranceKeysList.length; i++){
            creditInsurance(insuranceKeysList[i]);
        }
    }
    
    function payInsurees(bytes32 flightKey, address _airline) public payable requireIsOperational requireFlightOwner(_airline, flightKey) requireAuthorizedCaller(msg.sender){
        bytes32[] memory insuranceKeysList = getInsuranceKeysList(flightKey);
        for(uint256 i=0;i<insuranceKeysList.length;i++){
            payInsurance(insuranceKeysList[i], _airline);
        }
    }

    function proceedFlightNoCreditCase(bytes32 flightKey) public requireIsOperational requireAuthorizedCaller(msg.sender){
        bytes32[] memory insuranceKeysList = getInsuranceKeysList(flightKey);
        for(uint256 i=0;i<insuranceKeysList.length;i++){
            setInsuranceExpired(insuranceKeysList[i]);
        }
    }
}