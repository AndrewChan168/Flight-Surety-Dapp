pragma solidity ^0.5.8;

contract Operational {
    //using SafeMath for uint256;
    
    //Account used to deploy contract
    address private contractOwner;
    //Blocks all state changes throughout the contract if false
    bool private operational = true;

    constructor() public {
        contractOwner = msg.sender;
    }

    function getOwner() public view returns(address){
        return contractOwner;
    }

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    function isOperational() public view returns (bool){
        return operational;
    }

    modifier requireIsOperational(){
        require(isOperational(), "Contract is currently not operational");
        _;
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner(){
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    function setOperatingStatus(bool mode) public requireContractOwner{
        operational = mode;
    }
}