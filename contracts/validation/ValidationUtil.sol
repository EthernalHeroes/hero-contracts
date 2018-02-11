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

    ///// [review] Я бы убрал второй метод и сделал так:
    /*
    function isAddressEmpty(address _value) internal constant returns (bool result){
          return (0x0!=value);
    }
    */
}
