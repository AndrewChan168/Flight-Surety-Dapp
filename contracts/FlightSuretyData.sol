pragma solidity ^0.5.8;

import "./AirlineData.sol";
import "./InsuranceData.sol";
import "./FlightData.sol";
import "./Operational.sol";

contract FlightSuretyData is AirlineData, InsuranceData, FlightData, Operational{
    address contractOwner;
    constructor() public {
         contractOwner = msg.sender;
    }

    function registerAirline(string memory _name, string memory _code) public requireIsOperational{
        addAirline(_name, _code);
    }

    function registerFlight(string memory _code, uint256 _timestamp) public requireIsOperational requireAirlineFunded(msg.sender) returns(bytes32){
        //return addFlight(_code, _timestamp);
        bytes32 flightKey = addFlight(_code, _timestamp);
        return flightKey;
    }

    function buy(string memory _flightCode, address _airline, uint256 _departTimestamp, uint256 _insureTimestamp) public payable requireIsOperational
        returns(
            bytes32 insuranceKey, address buyer, bytes32 flightKey, address airline, string memory flightCode,
            uint256 timestamp, uint256 fee, uint256 credits, uint256 contractTimestamp, InsuranceStatus returnStatus
        ){
            airline = _airline;
            require(isAirlineFunded(airline),"Airline must be in funded status");
            flightCode = _flightCode;
            timestamp = _departTimestamp;
            flightKey = generateFlightKey(flightCode, _departTimestamp);
            require(isFlightExist(flightKey), "Flight does not exist");
            fee = msg.value;
            insuranceKey = buyInsurance(flightKey, airline, _insureTimestamp);
            addInsuranceKey(flightKey, insuranceKey);
            (buyer, , , , credits, contractTimestamp, returnStatus) = queryInsuranceInfo(insuranceKey);
    }

    function creditInsurees(bytes32 flightKey) public requireIsOperational requireFlightLateAirline(flightKey){
        bytes32[] memory insuranceKeysList = getInsuranceKeysList(flightKey);
        for(uint256 i=0; i<insuranceKeysList.length; i++){
            creditInsurance(insuranceKeysList[i]);
        }
    }
    
    function payInsurees(bytes32 flightKey) public payable requireIsOperational requireFlightOwner(msg.sender, flightKey){
        bytes32[] memory insuranceKeysList = getInsuranceKeysList(flightKey);
        for(uint256 i=0;i<insuranceKeysList.length;i++){
            payInsurance(insuranceKeysList[i]);
        }
    }

    function proceedFlightNoCreditCase(bytes32 flightKey) public requireIsOperational{
        bytes32[] memory insuranceKeysList = getInsuranceKeysList(flightKey);
        for(uint256 i=0;i<insuranceKeysList.length;i++){
            setInsuranceExpired(insuranceKeysList[i]);
        }
    }
}