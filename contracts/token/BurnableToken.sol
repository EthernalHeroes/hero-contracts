///// [review] Лучше поднять версию до текущей релизной
pragma solidity ^0.4.8;

import "../validation/ValidationUtil.sol";
import '../zeppelin/contracts/token/StandardToken.sol';
import "../zeppelin/contracts/ownership/Ownable.sol";

import '../zeppelin/contracts/math/SafeMath.sol';

/**
 * Шаблон для токена, который можно сжечь
 *
 */

///// [review] В OpenZeppelin есть BurnableToken, возможно можно заменить на него 
///// [review] https://github.com/OpenZeppelin/zeppelin-solidity/blob/release/v1.5.0/contracts/token/BurnableToken.sol
contract BurnableToken is StandardToken, Ownable, ValidationUtil {
    using SafeMath for uint;

    ///// [review] Лучше всегда явно ставить значение по умолчанию, для наглядности
    address public tokenOwnerBurner;

    /** Событие, сколько токенов мы сожгли */
    event Burned(address burner, uint burnedAmount);

    function setOwnerBurner(address _tokenOwnerBurner) public onlyOwner invalidOwnerBurner{
        // Проверка, что адрес не пустой
        requireValidAddress(_tokenOwnerBurner);

        ///// [review] Мне кажется, что лучше убрать requireValidAddress и делать просто:
        /*
        require(!isAddressEmpty(_tokenOwnerBurner));
        */

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

        ///// [review] Я бы убрал requireValidAddress вообще и сделал бы так:
        /*
        require(isAddressNotEmpty(tokenOwnerBurner));
        */

        _;
    }

    modifier invalidOwnerBurner() {
        // Проверка, что адрес не пустой
        ///// [review] Правильный комментарий: "Проверка, что адрес пустой"
        require(!isAddressNotEmpty(tokenOwnerBurner));

        _;
    }
}
