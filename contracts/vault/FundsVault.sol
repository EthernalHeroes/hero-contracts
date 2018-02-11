///// [review] Лучше поднять версию до текущей релизной
pragma solidity ^0.4.8;

import "../zeppelin/contracts/ownership/Ownable.sol";
import "../validation/ValidationUtil.sol";

import '../zeppelin/contracts/math/SafeMath.sol';
import '../zeppelin/contracts/math/Math.sol';

/**
 * Шаблон класса хранилища средств, которое используется в контракте продаж
 * Поддерживает возврат средств, а такте перевод средств на кошелек, в случае успешного проведения продаж
*/

contract FundsVault is Ownable, ValidationUtil {

    using SafeMath for uint;
    using Math for uint;

    ///// [review] Если я все правильно понял, то после Refunding невозможен переход в Active/Closed опять.
    enum State {Active, Refunding, Closed}

    State public state;

    mapping (address => uint) public deposited;

    // Адрес, куда будут переведены средства, в случае успеха
    address public wallet;

    // Адрес, куда будут направляться средства, в случае наступления режима возврата средств, при совершении сомнительных операциях с токенами
    // В случае, если по данным контракта продаж и контракта токена расходится информация о кол-ве токенов, то в таком
    // случае средства из подвала переводятся на спец. кошелек, и возврат будет делаться в ручном режиме
    address public sump;

    event Closed();
    event RefundsEnabled();
    event Refunded(address indexed beneficiary, uint weiAmount);
    event RefundedToSump(address indexed beneficiary, uint weiAmount);

    /**
     * Указываем на какой кошелек будут потом переведены собранные средства, в случае, если будет вызвана функция close()
     * Поддерживает возврат средств, а также перевод средств на кошелек, в случае успешного проведения продаж
     */
    function FundsVault(address _wallet, address _sump) {
        requireValidAddress(_wallet);
        requireValidAddress(_sump);

        wallet = _wallet;
        sump = _sump;

        ///// [review] Crowdsale будет активен начиная с 1ой секунды, как закончится деплой?
        ///// [review] Может быть нужно добавить методы по запуску/паузе?
        state = State.Active;
    }

    /**
     * Положить депозит в хранилище
     */
    function deposit(address investor) public payable onlyOwner inState(State.Active) {
        deposited[investor] = deposited[investor].add(msg.value);
    }

    /**
     * Перевод собранных средств на указанный кошелек
     */
    function close() public onlyOwner inState(State.Active) {
        state = State.Closed;

        Closed();

        wallet.transfer(this.balance);
    }

    /**
     * Установливаем для переводов средств
     */
    function setWallet(address walletAddress) public onlyOwner inState(State.Active) {
        wallet = walletAddress;
    }

    /**
     * Установливаем для переводов сомнительных средств
     */
    function setSump(address walletAddress) public onlyOwner inState(State.Active) {
        sump = walletAddress;
    }

    /**
     * Установить режим возврата денег
     */
    function enableRefunds() public onlyOwner inState(State.Active) {
        state = State.Refunding;

        RefundsEnabled();
    }

    /**
     * Функция возврата средств
     */

    // При нормальных обстоятельств, если пользователь не манипулировал токенами
    function normalRefund(address investor, uint weiAmount) public onlyOwner inState(State.Refunding){
        uint depositedValue = weiAmount.min256(deposited[investor]);
        deposited[investor] = 0;

        investor.transfer(depositedValue);

        Refunded(investor, depositedValue);
    }

    // В случае, если пользователь делал переводы через контракт токена
    function sumpRefund(address investor, uint weiAmount) public onlyOwner inState(State.Refunding){
        uint depositedValue = weiAmount.min256(deposited[investor]);
        deposited[investor] = 0;

        sump.transfer(depositedValue);

        RefundedToSump(investor, depositedValue);
    }

    /** Только, если текущее состояние соответсвует состоянию  */
    modifier inState(State _state) {
        require(state == _state);

        _;
    }

    ///// [review] Сюда лучше добавить пустую function(){}

}
