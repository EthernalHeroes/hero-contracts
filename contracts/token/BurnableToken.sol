pragma solidity ^0.4.8;

import "../validation/ValidationUtil.sol";
import '../zeppelin/contracts/token/StandardToken.sol';
import "../zeppelin/contracts/ownership/Ownable.sol";

import '../zeppelin/contracts/math/SafeMath.sol';

/**
 * Шаблон для токена, который можно сжечь
 *
 */

contract BurnableToken is StandardToken, Ownable, ValidationUtil {
    using SafeMath for uint;

    address public tokenOwnerBurner;

    /** Событие, сколько токенов мы сожгли */
    event Burned(address burner, uint burnedAmount);

    function setOwnerBurner(address _tokenOwnerBurner) public onlyOwner invalidOwnerBurner{
        // Проверка, что адрес не пустой
        requireValidAddress(_tokenOwnerBurner);

        tokenOwnerBurner = _tokenOwnerBurner;
    }

    /**
     * Сжигаем токены на балансе burner'а
     */
    function internalBurnTokens(address burner, uint burnAmount) internal {
        balances[burner] = balances[burner].sub(burnAmount);
        totalSupply = totalSupply.sub(burnAmount);

        // Вызываем событие
        Burned(burner, burnAmount);
    }

    /**
     * Сжигаем токены на балансе владельца токенов может только адрес tokenOwnerBurner
     */
    function burnOwnerTokens(uint burnAmount) public onlyTokenOwnerBurner validOwnerBurner{
        internalBurnTokens(tokenOwnerBurner, burnAmount);
    }

    /** Модификаторы
     */
    modifier onlyTokenOwnerBurner() {
        require(msg.sender == tokenOwnerBurner);

        _;
    }

    modifier validOwnerBurner() {
        // Проверка, что адрес не пустой
        requireValidAddress(tokenOwnerBurner);

        _;
    }

    modifier invalidOwnerBurner() {
        // Проверка, что адрес не пустой
        require(!isAddressNotEmpty(tokenOwnerBurner));

        _;
    }
}
