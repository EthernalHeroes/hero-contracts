pragma solidity ^0.4.8;


import "./validation/ValidationUtil.sol";
import "./Haltable.sol";
import "./token/BurnableCrowdsaleToken.sol";

import './zeppelin/contracts/math/SafeMath.sol';

/**
 * Базовый контракт для продаж
 *
 * Содержит
 * - Дата начала и конца
 */

/* Продажи могут быть остановлены в любой момент по вызову halt() */

contract AllocatedCappedCrowdsale is Haltable, ValidationUtil {
    using SafeMath for uint;

    // Кол-во токенов для распределения
    uint teamTokenAmount = 15000000;
    uint advisorsTokenAmount = 3000000;
    uint referalTokenAmount = 2000000;
    uint reserveTokenAmount = 35000000;
    uint presaleTokenAmount = 5000000;

    /* Кол-во токенов которые нужно будет распределить после успешного завершения торгов */
    uint afterSuccessTokenDistributionAmount;

    /* Токен, который продаем */
    BurnableCrowdsaleToken public token;

    /* Адрес, куда будут переводится собранные средства, в случае успеха */
    address public destinationWallet;

    /* Адрес, куда будут направляться средства от пресейла */
    address public presaleWallet;

    /* Старт пресейла в формате UNIX timestamp */
    uint public presaleStartsAt;

    /* Конец пресейла в формате UNIX timestamp */
    uint public presaleEndsAt;

    /* Дата, когда можно забрать токены для команды, в формате UNIX timestamp */
    uint public teamTokensIssueDate;

    /* Старт продаж в формате UNIX timestamp */
    uint public startsAt;

    /* Конец продаж в формате UNIX timestamp */
    uint public endsAt;

    /* Кол-во проданных токенов*/
    uint public tokensSold;

    /* Кол-во проданных токенов*/
    uint public presaleTokensSold;

    /* Кол-во проданных presale токенов*/
    uint public presaleTokensLeft;

    /* Если не набрали минимальной суммы, то инвесторы могут запросить refund */
    uint public softCapGoalInCents = 100000000;

    uint public hardCapGoalInCents = 460000000;

    /* Сколько wei мы получили 10^18 wei = 1 ether */
    uint public weiRaised;

    /* Кол-во уникальных адресов, которые у наc получили токены */
    uint public buyerCount;

    /*  Сколько wei отдали инвесторам */
    uint public weiRefunded;

    /* Флаг вызова финализатора */
    bool public isFinalized;

    /* Флаг состояния возврата средств */
    bool isRefunding;

    /*  Текущий курс eth в центах */
    uint public currentEtherRateInCents;

    /* Текущая стоимость токена в центах */
    uint public oneTokenInCents = 5;

    /** Мапа, адрес инвестора - кол-во эфира собранного на пресейле */
    mapping (address => uint) public presaleInvestedAmountOf;

    /** Мапа адрес инвестора - кол-во выданных токенов */
    mapping (address => uint) public tokenAmountOf;

    /** Мапа, адрес инвестора - кол-во эфира */
    mapping (address => uint) public investedAmountOf;

    /** Адреса, куда будут распределены токены */
    address public teamWallet;
    address public advisorsWallet;
    address public referalWallet;
    address public reserveWallet;

    /** Возможные состояния
     *
     * - Prefunding: Префандинг, еще не задали дату окончания
     * - Funding: Продажи
     * - Success: Достигли условия завершения, в этом режиме стоимость токена определяется биржами
     * - Failure: Что-то пошло не так, продажи не завершились успешно
     * - Finalized: Сработал финализатор
     * - Refunding: Возвращаем эфир, который загружен на контракт
     */
    enum State{PreFunding, Funding, Success, Failure, Finalized, Refunding}

    // Событие покупки токена
    event Invested(address receiver, uint weiAmount, uint tokenAmount);

    // Событие покупки токена из бэкенда
    event BackendInvested(address receiver, uint weiAmount, uint tokenAmount, uint8 currencyType, uint currencyAmount);

    // Событие изменения даты начала пресейла
    event PresaleStartsAtChanged(uint time);

    // Событие изменения даты окончания пресейла
    event PresaleEndsAtChanged(uint time);

    // Событие изменения даты начала
    event StartsAtChanged(uint time);

    // Событие изменения даты окончания
    event EndsAtChanged(uint time);

    // Событие изменения минимальной суммы сборов
    event SoftCapGoalChanged(uint newGoal);

    // Событие изменения максимальной суммы сборов
    event HardCapGoalChanged(uint newGoal);

    // Событие изменения курса eth
    event ExchangeRateChanged(uint newExchangeRate);

    // Конструктор, в целях безопасности, агента изменения можно установить только в конструкторе
    function AllocatedCappedCrowdsale(address _token, address _destinationWallet, address _presaleWallet, uint _presaleStart, uint _presaleEnd, uint _start, uint _end, address _teamWallet, address _advisorsWallet, address _referalWallet, address _reserveWallet, uint _teamTokensIssueDate){
        // Проверка адресов
        requireValidAddress(_token);

        requireValidAddress(_destinationWallet);
        requireValidAddress(_presaleWallet);
        requireValidAddress(_teamWallet);
        requireValidAddress(_advisorsWallet);
        requireValidAddress(_referalWallet);
        requireValidAddress(_reserveWallet);

        // Проверяем даты
        require(_presaleStart != 0);
        require(_presaleEnd != 0);

        require(_start != 0);
        require(_end != 0);

        require(_presaleStart < _presaleEnd);
        require(_start < _end);

        // Проверяем, что дата начала TGE больше даты окончания пресейла
        require(_start > _presaleEnd);

        //Проверяем дату для выдачи токенов команде
        require(_teamTokensIssueDate != 0);

        // Токен, который поддерживает сжигание
        token = BurnableCrowdsaleToken(_token);

        destinationWallet = _destinationWallet;
        presaleWallet = _presaleWallet;

        presaleStartsAt = _presaleStart;
        presaleEndsAt = _presaleEnd;

        startsAt = _start;
        endsAt = _end;

        teamTokensIssueDate = _teamTokensIssueDate;

        // Адреса аккаунтов для команды, адвизоров, бонусов
        teamWallet = _teamWallet;
        advisorsWallet = _advisorsWallet;
        referalWallet = _referalWallet;
        reserveWallet = _reserveWallet;

        // Кол-вол токенов к распределению, в случае успеха
        afterSuccessTokenDistributionAmount = teamTokenAmount.add(advisorsTokenAmount).add(referalTokenAmount).add(reserveTokenAmount).add(presaleTokenAmount);

        presaleTokensLeft = presaleTokenAmount.mul(10 ** token.decimals());
    }

    /**
     * Функция, возвращающая текущую стоимость 1 токена в wei
     */
    function getOneTokenInWei() public constant returns(uint) {
        return oneTokenInCents.mul(10 ** 18).div(currentEtherRateInCents);
    }

    /**
     * Функция, которая переводит wei в центы по текущему курсу
     */
    function getWeiInCents(uint value) public constant returns(uint) {
        return currentEtherRateInCents.mul(value).div(10 ** 18);
    }

    /**
     * Проверяет собрана ли минимальная сумма
     */
    function isSoftCapGoalReached() public constant returns (bool reached) {
        return getWeiInCents(weiRaised) >= softCapGoalInCents;
    }

    /**
     * Проверяет собрана ли максимальная сумма
     */
    function isHardCapGoalReached() public constant returns (bool reached) {
        return getWeiInCents(weiRaised) >= hardCapGoalInCents;
    }

    /**
     * Все распродано?
     * Когда кол-во оставшихся токенов = 0 - все распродано
     */
    function isAllTokensSold() public constant returns (bool) {
        return getTokensLeftForSale() == 0;
    }

    /**
     * Возвращает кол-во нераспроданных токенов, которые можно продать
     */
    function getTokensLeftForSale() public constant returns (uint) {
        // Кол-во токенов, которое адрес контракта можеть снять у owner'а и есть кол-во оставшихся токенов, из этой суммы нужно вычесть кол-во которое не участвует в продаже
        uint tokenBalance = token.balanceOf(address(this)).add(presaleTokensSold);
        uint tokensForDistribution = afterSuccessTokenDistributionAmount.mul(10 ** token.decimals());

        if (tokenBalance <= tokensForDistribution){
            return 0;
        }

        return tokenBalance.sub(tokensForDistribution);
    }

    /**
     * Возвращает кол-во токенов, которое может быть продано на текущий момент
     */
    function getAvailableTokens(uint tokenAmount) private constant returns (uint) {
        uint tokensLeft = getTokensLeftForSale();

        // Краевой случай, когда запросили больше, чем можем выдать
        if (tokenAmount > tokensLeft){
            return tokensLeft;
        } else {
            return tokenAmount;
        }
    }

    /**
     * Кол-во токенов к выдаче, в соответствии с Token Policy
     */
    function calcTokenAmount(address receiver, uint weiAmount) private returns(uint) {
        uint defaultBonus = 0;

        uint bonusPercentage = defaultBonus;

        uint multiplier = 10 ** token.decimals();

        // [0M - 10M)
        if (tokensSold >= 0 && tokensSold < multiplier.mul(10000000)){
            bonusPercentage = 20;
            // [10M - 25M)
        } else if (tokensSold >= multiplier.mul(10000000) && tokensSold < multiplier.mul(25000000)){
            bonusPercentage = 15;
            // [25M - 50M)
        } else if (tokensSold >= multiplier.mul(25000000) && tokensSold < multiplier.mul(50000000)){
            bonusPercentage = 10;
            // [50M - 75M)
        } else if (tokensSold >= multiplier.mul(50000000) && tokensSold < multiplier.mul(75000000)){
            bonusPercentage = 5;
            // [75M - 92M)
        } else if (tokensSold >= multiplier.mul(75000000)){
            bonusPercentage = 0;
        } else {
            revert();
        }

        uint resultValue = weiAmount.mul(multiplier).div(getOneTokenInWei());
        uint tokenAmount = getAvailableTokens(resultValue.mul(bonusPercentage.add(100)).div(100));

        // Кол-во токенов к выдаче = 0?, делаем откат
        require(tokenAmount != 0);

        return tokenAmount;
    }

    /**
     * Получаем стейт
     *
     * Не пишем в переменную, чтобы не было возможности поменять извне, только вызов функции может отразить текущее состояние
     */
    function getState() public constant returns (State) {
        if (isFinalized) return State.Finalized;

        if (isRefunding) return State.Refunding;
        else if (block.timestamp < presaleStartsAt) return State.PreFunding;
        else if (block.timestamp <= endsAt && !isAllTokensSold()) return State.Funding;
        else if (isSoftCapGoalReached()) return State.Success;
        else return State.Failure;
    }

    /**
     * Fallback функция вызывающаяся при переводе эфира
     */
    function() payable stopInEmergency isEtherRateAndTokenPriceAssigned canReceivePayments {
        address receiver = msg.sender;
        uint weiAmount = msg.value;

        uint tokenAmount = calcTokenAmount(receiver, weiAmount);

        internalAssignTokens(receiver, weiAmount, tokenAmount);

        // Пресейл
        if (block.timestamp >= presaleStartsAt && block.timestamp <= presaleEndsAt){
            internalPresaleDeposit(presaleWallet, weiAmount);
        } else if (block.timestamp >= startsAt && block.timestamp <= endsAt){
            // TGE
            internalSaleDeposit(destinationWallet, weiAmount);
        }

        // Вызываем событие
        Invested(receiver, weiAmount, tokenAmount);
    }

    /**
     * Покупка токенов через бэкенд, кидаем токены на адрес отправителя
     * Эта функция нужна в случае перевода альтернативных валют через бэкенд
     */
    function backendBuy(address receiver, uint weiAmount, uint8 currencyType, uint currencyAmount) external onlyOwner stopInEmergency isEtherRateAndTokenPriceAssigned canReceivePayments {
        uint tokenAmount = calcTokenAmount(receiver, weiAmount);

        internalAssignTokens(receiver, weiAmount, tokenAmount);

        // Вызываем событие
        BackendInvested(receiver, weiAmount, tokenAmount, currencyType, currencyAmount);
    }

    /**
     * Выдача бонусных токенов из пресейла
     */
    function backendSendBonusTokensFromPresale(address receiver, uint tokenAmount) external onlyOwner stopInEmergency {
        uint tokenToSend = tokenAmount;

        if (tokenToSend > presaleTokensLeft){
            tokenToSend = presaleTokensLeft;
        }

        require(tokenToSend > 0);

        //Сохранение в контракте продаж - не делаем, т.к. это не часть TGE
        token.transfer(receiver, tokenToSend);

        presaleTokensLeft = presaleTokensLeft.sub(tokenToSend);
        presaleTokensSold = presaleTokensSold.add(tokenToSend);
    }

    /* В случае успеха, заблокированные токены для команды могут быть переведены только если наступила определенная дата */
    function issueTeamTokens() public onlyOwner inState(State.Finalized) {
        require(block.timestamp >= teamTokensIssueDate);

        uint teamTokenTransferAmount = teamTokenAmount.mul(10 ** token.decimals());

        if (!token.transfer(teamWallet, teamTokenTransferAmount)) revert();
    }

    /* Включение режима возвратов */
    function enableRefunds() external onlyOwner {
        require(!isRefunding);

        isRefunding = true;

        internalEnableRefunds();
    }

    /**
     * Спец. функция, которая позволяет продавать токены вне ценовой политики, доступка только владельцу
     */
    function preallocate(address receiver, uint weiAmount, uint tokenAmount) external onlyOwner {
        // Новый инвестор?
        if (investedAmountOf[receiver] == 0) {
            buyerCount++;
        }

        // Переводим токены инвестору
        // Если перевод не удался, будет вызван throw
        token.transfer(receiver, tokenAmount);

        weiRaised = weiRaised.add(weiAmount);
        tokensSold = tokensSold.add(tokenAmount);

        investedAmountOf[receiver] = investedAmountOf[receiver].add(weiAmount);
    }

    /**
     * Функция, которая задает текущий курс eth в центах
     */
    function setCurrentEtherRateInCents(uint value) external onlyOwner {
        // Если случайно задали 0, то откатываем транзакцию
        require(value > 0);

        currentEtherRateInCents = value;

        ExchangeRateChanged(value);
    }

    /**
     * Функция, которая устанавливает новый адрес, куда будут переведены средства, в случаем
     */
    function setDestinationWallet(address destinationAddress) external onlyOwner isNotFinalized{
        destinationWallet = destinationAddress;

        internalSetDestinationWallet(destinationAddress);
    }

    /**
     * Позволяет менять владельцу дату начала пресейла
     */
    function setPresaleStartsAt(uint time) external onlyOwner {
        presaleStartsAt = time;

        // Вызываем событие
        PresaleStartsAtChanged(presaleStartsAt);
    }

    /**
     * Позволяет менять владельцу дату окончания пресейла
     */
    function setPresaleEndsAt(uint time) external onlyOwner {
        presaleEndsAt = time;

        // Вызываем событие
        PresaleEndsAtChanged(presaleEndsAt);
    }

    /**
     * Позволяет менять владельцу дату окончания
     */
    function setEndsAt(uint time) external onlyOwner {
        endsAt = time;

        // Вызываем событие
        EndsAtChanged(endsAt);
    }

    /**
     * Позволяет менять владельцу дату начала
     */
    function setStartsAt(uint time) external onlyOwner {
        startsAt = time;

        // Вызываем событие
        StartsAtChanged(startsAt);
    }

    /**
     * Инвесторы могут затребовать возврат средств, только в случае, если текущее состояние - Refunding
     */
    function refund() external inState(State.Refunding) {
        internalRefund(msg.sender);
    }

    /**
     * Устанавливает минимальную сумму для сбора, установить может только владелец
     */
    function setSoftCapGoalInCents(uint value) external onlyOwner {
        softCapGoalInCents = value;

        // Вызываем событие
        SoftCapGoalChanged(value);
    }

    /**
     * Устанавливает максимальную сумму для сбора, установить может только владелец
     */
    function setHardCapGoalInCents(uint value) external onlyOwner {
        hardCapGoalInCents = value;

        // Вызываем событие
        HardCapGoalChanged(value);
    }

    /**
     * Финализатор, вызвать может только владелец и только в случае успеха
     */
    function finalize() external onlyOwner inState(State.Success) {
        // Продажи должны быть не завершены
        require(!isFinalized);

        internalFinalize();
    }

    /**
     * Внутренняя функция перевода токенов
     */
    function internalAssignTokens(address receiver, uint weiAmount, uint tokenAmount) internal {
        // Новый инвестор?
        if (investedAmountOf[receiver] == 0 && presaleInvestedAmountOf[receiver] == 0) {
            buyerCount++;
        }

        // Переводим токены инвестору
        // Если перевод не удался, будет вызван throw
        token.transfer(receiver, tokenAmount);

        // Обновляем стату
        updateStat(receiver, weiAmount, tokenAmount);
    }

    /**
     * Низкоуровневая функция перевода эфира на контракт для стадии продаж, функция доступна для переопределения в дочерних классах, но не публична
     */
    function internalSaleDeposit(address receiver, uint weiAmount) internal {
        // переопределяется в наследниках
    }

    /**
     * Низкоуровневая функция перевода эфира на контракт для стадии пресейла, функция доступна для переопределения в дочерних классах, но не публична
     */
    function internalPresaleDeposit(address receiver, uint weiAmount) internal {
        // Может переопредяться в наследниках

        presaleWallet.transfer(weiAmount);
    }

    /**
     * Низкоуровневая функция для возврата средств, функция доступна для переопределения в дочерних классах, но не публична
     */
    function internalRefund(address receiver) internal {
        // переопределяется в наследниках
    }

    /**
     * Низкоуровневая функция включения механизма возврата средств
     */
    function internalEnableRefunds() internal {
        // Определяется в наследниках
    }

    /**
     * Низкоуровневая функция финализации продаж
     */
    function internalFinalize() internal {
        // 1. Сжигаем остатки
        uint tokensLeft = getTokensLeftForSale();

        // Если кол-во оставшихся токенов > 0, то сжигаем их
        if (tokensLeft > 0){
            token.burnOwnerTokens(tokensLeft);
        }

        // 2. Переводим на адреса кошельков: team, advisor, referal, reserve
        uint teamTokenTransferAmount = teamTokenAmount.mul(10 ** token.decimals());
        uint advisorsTokenTransferAmount = advisorsTokenAmount.mul(10 ** token.decimals());
        uint referalTokenTransferAmount = referalTokenAmount.mul(10 ** token.decimals());
        uint reserveTokenTransferAmount = reserveTokenAmount.mul(10 ** token.decimals());

        if (!token.transfer(advisorsWallet, advisorsTokenTransferAmount)) revert();
        if (!token.transfer(referalWallet, referalTokenTransferAmount)) revert();
        if (!token.transfer(reserveWallet, reserveTokenTransferAmount)) revert();

        // Токены для команды можно получить позже через метод issueTeamTokens

        isFinalized = true;

        // Переопределяется в наследниках
    }

    /**
     * Функция, которая переопределяется в надледниках и выполняется после установки адреса аккаунта для перевода средств
     */
    function internalSetDestinationWallet(address destinationAddress) internal{
    }

    /**
     * Обновление статистики
     */
    function updateStat(address receiver, uint weiAmount, uint tokenAmount) private {
        weiRaised = weiRaised.add(weiAmount);
        tokensSold = tokensSold.add(tokenAmount);

        tokenAmountOf[receiver] = tokenAmountOf[receiver].add(tokenAmount);

        // Пресейл
        if (block.timestamp >= presaleStartsAt && block.timestamp <= presaleEndsAt){
            presaleInvestedAmountOf[receiver] = presaleInvestedAmountOf[receiver].add(weiAmount);
        } else if (block.timestamp >= startsAt && block.timestamp <= endsAt){
            // TGE
            investedAmountOf[receiver] = investedAmountOf[receiver].add(weiAmount);
        }
    }

    /**
    * Модификаторы
    */

    /** Только, если текущее состояние соответсвует состоянию  */
    modifier inState(State state) {
        require(getState() == state);

        _;
    }

    /** Когда можем принимать платежи: идут продажи, при этом не достигнут hard cap  */
    modifier canReceivePayments() {
        State currentState = getState();

        require(currentState == State.Funding && !isHardCapGoalReached());

        _;
    }

    /** Курс эфира и стоимость токена установлены  */
    modifier isEtherRateAndTokenPriceAssigned() {
        require(currentEtherRateInCents > 0 && oneTokenInCents > 0);

        _;
    }

    /** Только, если продажи не завершены успехом */
    modifier isNotFinalized(){
        require(!isFinalized);

        _;
    }
}