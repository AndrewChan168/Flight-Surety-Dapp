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

    constructor(address dataContractAddress) public{
        flightSuretyData = FlightSuretyDataInterface(dataContractAddress);
        contractOwner = msg.sender;
    }
    
    function registerAirline(string memory _name, address _airline) public{
        flightSuretyData.registerAirline(_name, _airline);
    }

    function airlineVote(address _candidate, address _voter) public{
        flightSuretyData.vote(_candidate, _voter);
    }

    function airlineFund() public payable{
        flightSuretyData.addFund(msg.sender, msg.value);
    }

    function registerFlight(string memory _code, uint256 _timestamp, address _airline) public returns(bytes32 flightKey){
        flightKey = flightSuretyData.registerFlight(_code, _timestamp, _airline);
    }

    function passenagerBuyInsurance(bytes32 _flightKey, uint256 _contractTimestamp, address _airline) public payable returns(bytes32 insuranceKey){
        insuranceKey = flightSuretyData.addInsurance(msg.sender, _flightKey, _contractTimestamp, _airline, msg.value);
    }

    function creditInsurance(bytes32 _insuranceKey) internal{
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
            flightSuretyData.setInsuranceWithdrawn(_insurancesKeys[i]);
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
                flightSuretyData.setFlightLateAirline(flightKey);
                creditAllInsurances(flightKey);
            } else {
                proceedFlightNoCreditCase(flightKey);
                if (statusCode == STATUS_CODE_ON_TIME) {
                    flightSuretyData.setFlightOnTime(flightKey);
                } else {
                    flightSuretyData.setFlightLateNotAirline(flightKey);
                }
            }
        }
    }

    function queryContractBalance() public view returns(uint256){
        return address(this).balance;
    }
}

contract FlightSuretyDataInterface{
    function registerAirline(string calldata _name, address _airline) external;
    function vote(address _candidate, address _voter) external;
    function couldFund(address _candidate) external returns(bool);
    function addFund(address _airline, uint256 _fund) external;
    function registerFlight(string calldata _code, uint256 _timestamp, address _airline) external returns (bytes32);
    function addInsurance(address _buyer, bytes32 _flightKey, uint256 _contractTimestamp, address _airline, uint256 _fee) external returns(bytes32 insuranceKey);
    function creditInsurance(bytes32 _insuranceKey) external returns(uint256);
    function deductInsurance(bytes32 _insuranceKey, address _airline) external returns(uint256);
    function queryInsuranceBuyer(bytes32 _insuranceKey) external returns(address);
    function generateFlightKey(string calldata flightCode, uint256 timestamp) external returns(bytes32);
    function getInsuranceKeysList(bytes32 flightKey) external returns(bytes32[] memory);
    function setInsuranceWithdrawn(bytes32 insuranceKey) external;
    function queryBuyerCredit(address _buyer) external returns(uint256);
    function deductCredits(address _buyer) external;
    function setFlightOnTime(bytes32 _flightID) external;
    function setFlightLateAirline(bytes32 _flightID) external;
    function setFlightLateNotAirline(bytes32 _flightID) external; 
}