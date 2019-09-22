pragma solidity ^0.5.8;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightData{
    struct Flight{
        string code;
        uint256 timestamp;
        address airline;
        bytes32[] insuranceKeysList;
        mapping(bytes32=>bool) insuranceKeys;
        FlightStatus status;
        bool isExist;
    }
    enum FlightStatus{Registered, OnTime, LateAirline, LateNotAirline}
    mapping(bytes32=>Flight) flights;//code+departureTimestamp is the key
    
    function generateFlightKey(string memory _code, uint256 _timestamp) public pure returns (bytes32){
        return keccak256(abi.encodePacked(_code, _timestamp));
    }

    function isFlightExist(bytes32 _id) public view returns (bool){
        return flights[_id].isExist;
    }

    modifier requireFlightExist(bytes32 _id) {
        require(isFlightExist(_id), "Flight does not exist");
        _;
    }

    modifier requireFlightNotExist(bytes32 _id){
        require(isFlightExist(_id), "Flight must not register");
        _;
    }

    function isFlightRegistered(bytes32 _id) public view returns (bool){
        return flights[_id].status == FlightStatus.Registered;
    }

    modifier requireFlightRegistered(bytes32 _id) {
        require(isFlightRegistered(_id), "Flight must be in Registered status");
        _;
    }
    
    function addFlight(string memory _code, uint256 _timestamp, address _airline) internal returns (bytes32 flightKey){
        flightKey = generateFlightKey(_code, _timestamp);
        require(!isFlightExist(flightKey), "Flight has been registered before");
        bytes32[] memory emptyList;
        Flight memory flight;
        flight.code = _code;
        flight.airline = _airline;
        flight.timestamp = _timestamp;
        flight.status = FlightStatus.Registered;
        flight.isExist = true;
        flight.insuranceKeysList = emptyList;
        flights[flightKey] = flight;
    }
    
    function addInsuranceKey(bytes32 _flightKey,bytes32 _insuranceKey) public {
        require(isFlightExist(_flightKey), "The flight does not exist");
        require(isFlightRegistered(_flightKey), "The flight must be in registered status");
        require(!isFlightHasThisInsuranceKey(_flightKey, _insuranceKey), "The flight has already got the insurance");
        flights[_flightKey].insuranceKeys[_insuranceKey] = true;
        flights[_flightKey].insuranceKeysList.push(_insuranceKey);
    }
    
    function isFlightHasThisInsuranceKey(bytes32 _flightKey,bytes32 _insuranceKey) public view requireFlightExist(_flightKey) returns(bool){
        return flights[_flightKey].insuranceKeys[_insuranceKey];
    }
    

   function isFlightOwner(address _airline, bytes32 _flightKey) public view requireFlightExist(_flightKey) returns(bool){
       return flights[_flightKey].airline == _airline;
   }
   
   modifier requireFlightOwner(address _airline, bytes32 _flightKey){
       require(isFlightOwner(_airline,_flightKey), "Airline must be owner of flight");
       _;
   }
   
   function queryFlightInfo(bytes32 _flightID) public view returns( string memory code, address airline, uint256 timestamp, FlightStatus status){
       code = flights[_flightID].code;
       airline = flights[_flightID].airline;
       timestamp = flights[_flightID].timestamp;
       status = flights[_flightID].status;
   }
   
   function getInsuranceKeysList(bytes32 _flightID) public view requireFlightExist(_flightID) returns(bytes32[] memory){
       return flights[_flightID].insuranceKeysList;
   }

   function getNumberOfInsurance(bytes32 _flightID) public view requireFlightExist(_flightID) returns(uint256){
       return flights[_flightID].insuranceKeysList.length;
   }

   function setFlightOnTime(bytes32 _flightID) public requireFlightRegistered(_flightID) requireFlightExist(_flightID){
       flights[_flightID].status = FlightStatus.OnTime;
   }

   function setFlightLateAirline(bytes32 _flightID) public requireFlightRegistered(_flightID){
       flights[_flightID].status = FlightStatus.LateAirline;
   }

   function setFlightLateNotAirline(bytes32 _flightID) public requireFlightRegistered(_flightID){
       flights[_flightID].status = FlightStatus.LateNotAirline;
   }

   function isFlightLateAirline(bytes32 _flightID) public view returns(bool){
       return flights[_flightID].status == FlightStatus.LateAirline;
   }

   modifier requireFlightLateAirline(bytes32 _flightID){
       isFlightLateAirline(_flightID);
       _;
   }
}