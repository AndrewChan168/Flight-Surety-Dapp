pragma solidity ^0.5.8;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightData{
    using SafeMath for uint256;
    uint256 constant MIN_FUND = 10 ether;

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
    bytes32[] allFlightKeys;

    event FlightAdded(string flightCode, uint256 deparTimestamp, address airline, bytes32 flightKey);
    //event InsuranceAdded(string flightCode, uint256 deparTimestamp, address airline, bytes32 insuranceKey);
    event FlightArrival(string flightCode, uint256 deparTimestamp, address airline, bytes32 flightKey, FlightStatus state);
    
    // the key for extracting flight data
    function generateFlightKey(string memory _code, uint256 _timestamp) public pure returns (bytes32){
        return keccak256(abi.encodePacked(_code, _timestamp));
    }
    /**
    functions for checking flight condition and modifiers
     */
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

   function isFlightLateAirline(bytes32 _flightID) public view returns(bool){
       return flights[_flightID].status == FlightStatus.LateAirline;
   }

   modifier requireFlightLateAirline(bytes32 _flightID){
       isFlightLateAirline(_flightID);
       _;
   }

    /**
    functions for adding flight and appening insurance keys to flight
     */
    
    function addFlight(string memory _code, uint256 _timestamp, address _airline) internal{
        bytes32 flightKey = generateFlightKey(_code, _timestamp);
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
        allFlightKeys.push(flightKey);
        emit FlightAdded(_code, _timestamp, _airline, flightKey);
    }
    
    function addInsuranceKey(bytes32 _flightKey,bytes32 _insuranceKey) public {
        require(isFlightExist(_flightKey), "The flight does not exist");
        require(isFlightRegistered(_flightKey), "The flight must be in registered status");
        require(!isFlightHasThisInsuranceKey(_flightKey, _insuranceKey), "The flight has already got the insurance");
        flights[_flightKey].insuranceKeys[_insuranceKey] = true;
        flights[_flightKey].insuranceKeysList.push(_insuranceKey);
    }

    /**
    functions for setting flight status
     */
    function setFlightOnTime(bytes32 _flightID) public requireFlightRegistered(_flightID) requireFlightExist(_flightID){
       flights[_flightID].status = FlightStatus.OnTime;
       emit FlightArrival(flights[_flightID].code,
        flights[_flightID].timestamp,
        flights[_flightID].airline,
        _flightID,flights[_flightID].status);
   }

   function setFlightLateAirline(bytes32 _flightID) public requireFlightRegistered(_flightID){
       flights[_flightID].status = FlightStatus.LateAirline;
       emit FlightArrival(flights[_flightID].code,
        flights[_flightID].timestamp,
        flights[_flightID].airline,
        _flightID,flights[_flightID].status);
   }

   function setFlightLateNotAirline(bytes32 _flightID) public requireFlightRegistered(_flightID){
       flights[_flightID].status = FlightStatus.LateNotAirline;
       emit FlightArrival(flights[_flightID].code,
        flights[_flightID].timestamp,
        flights[_flightID].airline,
        _flightID,flights[_flightID].status);
   }

   /**
   functions for querying flights status
    */
    
   
   function queryFlightInfo(bytes32 _flightID) public view returns( string memory code, address airline, uint256 timestamp, FlightStatus status){
       code = flights[_flightID].code;
       airline = flights[_flightID].airline;
       timestamp = flights[_flightID].timestamp;
       status = flights[_flightID].status;
   }
   
   function getInsuranceKeysList(bytes32 _flightID) public view requireFlightExist(_flightID) returns(bytes32[] memory){
       return flights[_flightID].insuranceKeysList;
   }

    function getAllFlightKeys() public view returns(bytes32[] memory){
        return allFlightKeys;
    }

   function getNumberOfInsurance(bytes32 _flightID) public view requireFlightExist(_flightID) returns(uint256){
       return flights[_flightID].insuranceKeysList.length;
   }
}