pragma solidity ^0.5.8;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Authorizable.sol";

contract BuyerData is Authorizable{
    using SafeMath for uint256;

    struct Buyer{
        uint256 credits;
        bool isExist;
        bytes32[] allInsuranceKeys;
        bytes32[] allFlightKeys;
    }

    mapping(address=>Buyer) buyers;

    function isBuyerExist(address _buyer) public view returns(bool){
        return buyers[_buyer].isExist;
    }

    modifier requireBuyerExist(address _buyer) {
        require(isBuyerExist(_buyer), "Buyer doesn't exist");
        _;
    }

    function addBuyer(address _buyer) internal {
        require(!isBuyerExist(_buyer), "Buyer exists");
        bytes32[] memory _allInsuranceKeys;
        bytes32[] memory _allFlightKeys;
        buyers[_buyer] = Buyer({
            credits:0, isExist:true, 
            allInsuranceKeys:_allInsuranceKeys,
            allFlightKeys:_allFlightKeys
        });
    }

    modifier autoAddBuyer(address _buyer){
        if(!isBuyerExist(_buyer)){
            addBuyer(_buyer);
        }
        _;
    }

    function appendInsurance(address _buyer, bytes32 _insuranceKey) public autoAddBuyer(_buyer){
        buyers[_buyer].allInsuranceKeys.push(_insuranceKey);
    }

    function appendFlight(address _buyer, bytes32 _flightKey) public autoAddBuyer(_buyer){
        buyers[_buyer].allFlightKeys.push(_flightKey);
    }

    function addCreditsToBuyer(address _buyer, uint256 _credits) public requireBuyerExist(_buyer){
        buyers[_buyer].credits += _credits;
    }

    function deductCredits(address _buyer) public requireBuyerExist(_buyer){
        buyers[_buyer].credits = 0;
    }

    function queryBuyerInsuranceKeys(address _buyer) public view requireBuyerExist(_buyer) returns(bytes32[] memory){
        return buyers[_buyer].allInsuranceKeys;
    }

    function queryBuyerFlightKeys(address _buyer) public view requireBuyerExist(_buyer) returns(bytes32[] memory){
        return buyers[_buyer].allInsuranceKeys;
    }

    function queryBuyerCredit(address _buyer) public view requireBuyerExist(_buyer) returns(uint256){
        return buyers[_buyer].credits;
    }
}