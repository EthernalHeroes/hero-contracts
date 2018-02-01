pragma solidity ^0.4.8;

import "./BurnableToken.sol";
import "./CrowdsaleToken.sol";

/**
 * Шаблон для продаж токена, который можно сжечь
 *
 */
contract BurnableCrowdsaleToken is BurnableToken, CrowdsaleToken {

    function BurnableCrowdsaleToken(string _name, string _symbol, uint _initialSupply, uint _decimals) CrowdsaleToken(_name, _symbol, _initialSupply, _decimals) BurnableToken(){

    }

}
