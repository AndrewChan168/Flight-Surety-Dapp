pragma solidity ^0.5.8;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./AirlineData.sol";
import "./InsuranceData.sol";
import "./FlightData.sol";
import "./Authorizable.sol";

contract FlightSuretyData is AirlineData, InsuranceData, FlightData, Authorizable{
    using SafeMath for uint256;

    function registerAirline(string memory _name, address _airline) public requireIsOperational requireAuthorizedCaller(msg.sender){
        addAirline(_name, _airline);
    }

    function vote(address _candidate, address _voter) public requireAuthorizedCaller(msg.sender){
        super.vote(_candidate, _voter);
    }

    function registerFlight(string memory _code, uint256 _timestamp, address _airline) public 
    requireIsOperational requireAirlineFunded(_airline) requireAirlinesHasEnoughFund(_airline) requireAuthorizedCaller(msg.sender){
        addFlight(_code, _timestamp, _airline);
    }

    function registerInsurance(address _buyer, bytes32 _flightKey, uint256 _contractTimestamp, address _airline, uint256 _fee) public
    requireIsOperational requireFlightRegistered(_flightKey){
        addInsurance(_buyer, _flightKey, _contractTimestamp, _airline, _fee);
        bytes32 _insuranceKey = generateInsuranceKey(_buyer, _flightKey, _contractTimestamp);
        addInsuranceKey(_flightKey, _insuranceKey);
    }

    function setFlightOnTime(bytes32 flightKey) public requireAuthorizedCaller(msg.sender){
        super.setFlightOnTime(flightKey);
    }

    function setFlightLateAirline(bytes32 flightKey) public requireAuthorizedCaller(msg.sender){
        super.setFlightLateAirline(flightKey);
    }

     function setFlightLateNotAirline(bytes32 flightKey) public requireAuthorizedCaller(msg.sender){
        super.setFlightLateNotAirline(flightKey);
    }

    function setInsuranceExpired(bytes32 insuranceKey) public requireAuthorizedCaller(msg.sender){
        super.setInsuranceExpired(insuranceKey);
    }

    function setInsuranceCredited(bytes32 insuranceKey) public requireAuthorizedCaller(msg.sender){
        super.setInsuranceCredited(insuranceKey);
    }

    function setInsuranceWithdrawn(bytes32 insuranceKey) public requireAuthorizedCaller(msg.sender){
        super.setInsuranceWithdrawn(insuranceKey);
    }

    function creditInsurees(bytes32 flightKey) public requireIsOperational requireFlightLateAirline(flightKey) requireAuthorizedCaller(msg.sender){
        bytes32[] memory insuranceKeysList = getInsuranceKeysList(flightKey);
        for(uint256 i=0; i<insuranceKeysList.length; i++){
            creditInsurance(insuranceKeysList[i]);
        }
    }
}