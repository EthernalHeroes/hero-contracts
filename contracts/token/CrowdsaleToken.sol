///// [review] Лучше поднять версию до текущей релизной
pragma solidity ^0.4.8;

import '../zeppelin/contracts/token/StandardToken.sol';
import "../zeppelin/contracts/ownership/Ownable.sol";

/**
 * Токен продаж
 *
 * ERC-20 токен, для ICO
 *
///// [review] Не понятно, как это условие выполняется. Думаю, лучше убрать этот комментарий или поменять логику.
 * - Токен может быть с верхним лимитом или без него
 *
 */

contract CrowdsaleToken is StandardToken, Ownable {

    /* Описание см. в конструкторе */
    string public name;
    string public symbol;
    uint public decimals;

    bool public isInitialSupplied = false;

    /** Событие обновления токена (имя и символ) */
    event UpdatedTokenInformation(string name, string symbol);

    /**
     * Конструктор
     *
     * Токен должен быть создан только владельцем через кошелек (либо с мультиподписью, либо без нее)
     *
     * @param _name - имя токена
     * @param _symbol - символ токена
     * @param _initialSupply - со сколькими токенами мы стартуем
     * @param _decimals - кол-во знаков после запятой
     */
    function CrowdsaleToken(string _name, string _symbol, uint _initialSupply, uint _decimals) {
        require(_initialSupply != 0);

        name = _name;
        symbol = _symbol;
        decimals = _decimals;

        ////// [review] Вот здесь странно, что totalSupply устновлен, но никому не начислен баланс. 
        ////// [reivew] То есть уже по стандарту расхождение. Я бы переделал семантику так, чтобы либо: 
        ////// [review] 1) убрать initialSupply и делать все в конструкторе; 
        ////// [review] 2) либо делать все в initialSupply
        totalSupply = _initialSupply;
    }

    /**
     * Владелец должен вызвать эту функцию, чтобы присвоить начальный баланс
     */
    function initialSupply(address _toAddress) external onlyOwner {
        require(!isInitialSupplied);

        // Создаем начальный баланс токенов на кошельке
        balances[_toAddress] = totalSupply;

        isInitialSupplied = true;
    }

    /**
     * Владелец может обновить инфу по токену
     */
    ////// [review] Странный функционал, если честно. Это точно необходимо?
    ////// [review] Тогда не понятно, почему decimals не меняются втч.
    function setTokenInformation(string _name, string _symbol) external onlyOwner {
        name = _name;
        symbol = _symbol;

        // Вызываем событие
        UpdatedTokenInformation(name, symbol);
    }

}
