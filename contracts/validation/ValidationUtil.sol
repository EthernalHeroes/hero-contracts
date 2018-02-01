pragma solidity ^0.4.8;

/**
 * Различные валидаторы
 */

contract ValidationUtil {
    function requireValidAddress(address value){
        require(isAddressNotEmpty(value));
    }

    function isAddressNotEmpty(address value) internal returns (bool result){
        return value != 0;
    }
}
