pragma solidity ^0.5.8;

import "./Operational.sol";

contract Authorizable is Operational{
    bool private authorizable = false;

    mapping(address=>bool) authorizedCallers;

    function isAuthorizedCaller(address _candidate) public view returns(bool){
        return authorizedCallers[_candidate];
    }

    modifier requireAuthorizedCaller(address _candidate){
        require((!authorizable)||(authorizedCallers[_candidate]), "Only authorized callers could call this function");
        _;
    }

    function addAuthorizedCaller(address _candidate) public requireIsOperational requireContractOwner{
        authorizedCallers[_candidate] = true;
    }

    function setAuthorizable(bool _setting) public requireIsOperational requireContractOwner{
        authorizable = _setting;
    }

    function isAuthorizable() public view returns(bool){
        return authorizable;
    }
}
