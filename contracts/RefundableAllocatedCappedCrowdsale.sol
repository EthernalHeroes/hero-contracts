pragma solidity ^0.4.8;

import "./AllocatedCappedCrowdsale.sol";
import "./vault/FundsVault.sol";

import './zeppelin/contracts/math/SafeMath.sol';

/**
* Контракт продажи заранее созданных токенов, с заранее заданным кол-вом.
* Возврат средств поддерживается только тем, кто купил токены и не производил с ними дальнейших манипуляций.
* Таким образом, если инвесторы будут обмениваться токенами, то вернуть можно будет только тем, у кого в контракте продаж
* такая же сумма токенов, как и в контракте токена, в противном случае, перевод будет невозможен или будет решаться в индивидуальном порядке.
*/
contract RefundableAllocatedCappedCrowdsale is AllocatedCappedCrowdsale {
    using SafeMath for uint;

    /** Хранилище, куда будут собираться средства, делается для того, чтобы гарантировать возвраты
    */
    FundsVault public fundsVault;

    /* Адрес, куда будут направляться средства, в случае возврата средств при манипуляциях с токенами во время TGE  */
    address public sumpWallet;

    /** Мапа адрес инвестора - был ли совершен возврат среств */
    mapping (address => bool) public refundedBuyers;

    function RefundableAllocatedCappedCrowdsale(address _token, address _destinationWallet, address _presaleWallet, address _sumpWallet, uint _presaleStart, uint _presaleEnd, uint _start, uint _end, address _teamWallet, address _advisorsWallet, address _referalWallet, address _reserveWallet, uint _teamTokensIssueDate) AllocatedCappedCrowdsale(_token, _destinationWallet, _presaleWallet, _presaleStart, _presaleEnd, _start, _end, _teamWallet, _advisorsWallet, _referalWallet, _reserveWallet, _teamTokensIssueDate){
        requireValidAddress(_sumpWallet);

        sumpWallet = _sumpWallet;

        // Создаем от контракта продаж новое хранилище, доступ к нему имеет только контракт продаж
        // При успешном завершении продаж, все собранные средства поступят на _destinationWallet
        // В противном случае могут быть переведены обратно инвесторам
        fundsVault = new FundsVault(_destinationWallet, _sumpWallet);

    }

    /** Функция меняющая адрес аккаунта, куда будут направляться средства, в случае возврата средств при манипуляциях с токенами во время TGE
    */
    function setSumpWallet(address destinationAddress) public onlyOwner isNotFinalized {
        sumpWallet = destinationAddress;

        fundsVault.setSump(sumpWallet);
    }

    /** Финализация
    */
    function internalFinalize() internal {
        super.internalFinalize();

        fundsVault.close();
    }

    function internalEnableRefunds() internal {
        fundsVault.enableRefunds();
    }

    /** Переопределение функции принятия допозита на счет, в данном случае, идти будет через vault
    */
    function internalSaleDeposit(address receiver, uint weiAmount) internal {
        // Шлем на кошелёк эфир
        fundsVault.deposit.value(weiAmount)(msg.sender);
    }

    /** Устанавливаем новый адрес
    */
    function internalSetDestinationWallet(address destinationAddress) internal {
        fundsVault.setWallet(destinationAddress);

        super.internalSetDestinationWallet(destinationAddress);
    }

    /** Переопределение функции возврата, возврат можно сделать только раз
    */
    function internalRefund(address receiver) internal {
        // Поддерживаем только 1 возврат
        if (refundedBuyers[receiver]) revert();

        // Получаем значение, которое нам было переведено в эфире
        uint weiValue = investedAmountOf[receiver];

        require(weiValue != 0);

        // Кол-во токенов на балансе, берем 2 значения: контракт продаж и контракт токена
        // Вернуть wei можем только тогда, когда эти значения совпадают, если не совпадают, значит были какие-то
        // манипуляции с токенами и такие ситуации будут решаться в индивидуальном порядке, по запросу
        uint saleContractTokenCount = tokenAmountOf[receiver];
        uint tokenContractTokenCount = token.balanceOf(receiver);

        // Нормальная ситуация
        if(saleContractTokenCount == tokenContractTokenCount){
            fundsVault.normalRefund(receiver, weiValue);
        }else{
            // С манипуляциями
            fundsVault.sumpRefund(receiver, weiValue);
        }

        investedAmountOf[receiver] = 0;
        weiRefunded = weiRefunded.add(weiValue);

        refundedBuyers[receiver] = true;
    }

}
