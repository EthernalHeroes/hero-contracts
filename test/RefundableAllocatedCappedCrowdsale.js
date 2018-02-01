const Constant = require("../lib/constant.js");
const TestUtil = require("../lib/testUtil.js");
const StringUtil = require("string-format");
const Converter = require("../lib/converter.js");
const Storage = require("../lib/storage.js");

const BurnableCrowdsaleToken = artifacts.require("./token/BurnableCrowdsaleToken.sol");
const AllocatedRefundableCappedCrowdsale = artifacts.require("./RefundableAllocatedCappedCrowdsale.sol");

// Состояния из контракта не получается получить
// enum State{PreFunding, Funding, Success, Failure, Finalized, Refunding}
const saleStates = {
    preFunding: 0,
    funding: 1,
    success: 2,
    failure: 3,
    finalized: 4,
    refunding: 5
};

const scenarioTypes = {
    allTokensSold: 0,
    softCapGoalReached: 1,
    refunding: 2,
    pauseStart: 3
};

// Преобразование состояния в строку
let salesStateStr = {};
salesStateStr[saleStates.preFunding] = 'PreFunding';
salesStateStr[saleStates.funding] = 'Funding';
salesStateStr[saleStates.success] = 'Success';
salesStateStr[saleStates.failure] = 'Failure';
salesStateStr[saleStates.finalized] = 'Finalized';
salesStateStr[saleStates.refunding] = 'Refunding';

// Подключаем форматирование строк
StringUtil.extend(String.prototype);

// Проверенные состояния, в которых не было ошибок:
// scenarioTypes.allTokensSold
// scenarioTypes.softCapGoalReached
// scenarioTypes.refunding
// scenarioTypes.pauseStart

let scenario = scenarioTypes.softCapGoalReached;

it("Запуск", function () {
});

contract('AllocatedRefundableCappedCrowdsale', async function (accounts) {
    let token = await BurnableCrowdsaleToken.deployed();
    let sale = await AllocatedRefundableCappedCrowdsale.deployed();

    const promisify = (inner) => new Promise((resolve, reject) =>
        inner((err, res) => {
            if (err) {
                reject(err);
            };
            resolve(res);
        })
    );

    function getNotOwnerAccountAddress() {
        let result = null;

        for (let account in accounts) {
            if (account != Storage.ownerAddress) {
                return account;
            };
        };

        return result;
    };

    function checkFloatValuesEquality(val1, val2, epsilon) {
        epsilon = epsilon || 0.001;
        return (new web3.BigNumber(val1).minus(new web3.BigNumber(val2))).abs().lte(epsilon);
    };

    function sendEther(fromAccount, contractInstance, wei) {
        // На всех аккаунтах по 100 эфира, 0 аккаунт - владелец
        // Пробуем перевести 1 эфир на контракт токена, с 1 - го аккаунта
        return new Promise(async (resolve, reject) => {
            try {
                let result = await contractInstance.sendTransaction({from: fromAccount, value: wei});

                resolve(null, result);

            } catch (ex) {
                //console.log(ex);

                resolve(ex, null);

            };
        });
    };

    function sendEtherTo(toAccount, fromAccount, wei) {
        return new Promise(async (resolve, reject) => {
            web3.eth.sendTransaction({from: fromAccount, to: toAccount, value: wei}, function (err, transactionHash) {
                if (err) {
                    resolve(err, null);
                } else {
                    resolve(null, transactionHash);
                };
            });
        });
    };

    function sendEtherFromBackend(toAccount, fromAccount, contractInstance, wei){
        return new Promise(async (resolve, reject) => {
            try{
                const currencyType = 1;
                const currencyAmount = 1;

                let result = await contractInstance.backendBuy(toAccount, wei, currencyType, currencyAmount, {from: fromAccount});

                resolve(null, result);

            }catch(ex){
                resolve(ex, null);
            };
        });
    };

    function callEnableRedunds(fromAccount){
        return new Promise(async (resolve, reject) => {
            try{
                let result = await sale.enableRefunds({from: fromAccount});

                resolve(null, result);

            }catch(ex){
                resolve(ex, null);
            };
        });
    };

    function callEnableRefundsAndExpectSuccess(fromAccount){
        return callEnableRedunds(fromAccount).then((err , success) => {
            assert.equal(err, null, 'При вызове метода включения возврата средств, не должно возникать ошибки');
        });
    };

    function callEnableRefundsAndExpectError(fromAccount){
        return callEnableRedunds(fromAccount).then((err , success) => {
            assert.notEqual(err, null, 'При вызове метода включения возврата средств, должна возникать ошибка');
        });
    };

    function callHalt(fromAccount) {
        return new Promise(async (resolve, reject) => {

            try {
                await sale.halt({from: fromAccount});

                resolve(null, true);
            } catch (ex) {
                resolve(ex, null);
            };
        });
    };

    function callHaltAndExpectError(fromAccount) {
        return callHalt(fromAccount).then((err, success) => {
            assert.notEqual(err, null, 'Вызов halt() не владельцем должен возвращать ошибку');
        });
    };

    function callHaltAndExpectSuccess(fromAccount) {
        return callHalt(fromAccount).then((err, success) => {
            assert.equal(err, null, 'Вызов halt() допускается только владельцем');
        });
    };

    function callUnhalt(fromAccount) {
        return new Promise(async (resolve, reject) => {

            try {
                await sale.unhalt({from: fromAccount});

                resolve(null, true);
            } catch (ex) {
                resolve(ex, null);
            };
        });
    };

    function callUnhaltAndExpectError(fromAccount) {
        return callUnhalt(fromAccount).then((err, success) => {
            assert.notEqual(err, null, 'Вызов unhalt() не владельцем должен возвращать ошибку');
        });
    };

    function callUnhaltAndExpectSuccess(fromAccount) {
        return callUnhalt(fromAccount).then((err, success) => {
            assert.equal(err, null, 'Вызов unhalt() допускается только владельцем');
        });
    };

    function sendEtherAndExpectError(fromAccount, contractAddress, wei) {
        // На всех аккаунтах по 100 эфира, 0 аккаунт - владелец
        // Пробуем перевести 1 эфир на контракт токена, с 1 - го аккаунта
        return sendEther(fromAccount, contractAddress, wei).then((err, success) => {
            assert.notEqual(err, null, 'При переводе эфира на контракт должна возникать ошибка');
        });
    };

    function sendEtherAndExpectSuccess(fromAccount, contractInstance, wei) {
        // На всех аккаунтах по 100 эфира, 0 аккаунт - владелец
        // Пробуем перевести 1 эфир на контракт токена, с 1 - го аккаунта
        return sendEther(fromAccount, contractInstance, wei).then(function (err, success) {
            assert.equal(err, null, 'При переводе эфира на контракт не должно возникать ошибки');
        });
    };

    function sendEtherFromBackendAndExpectSuccess(toAccount, fromAccount, contractInstance, wei) {
        return sendEtherFromBackend(toAccount, fromAccount, contractInstance, wei).then(function (err, success) {
            assert.equal(err, null, 'При переводе эфира на контракт не должно возникать ошибки');
        });
    };

    function sendEtherToAndExpectSuccess(toAccount, fromAccount, wei) {
        return sendEtherTo(toAccount, fromAccount, wei).then(function (err, success) {
            assert.equal(err, null, 'При переводе эфира на другой аккаунт не должно возникать ошибки');
        });
    };

    function callRefund(fromAccount) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await sale.refund({from: fromAccount});

                resolve(null, result);

            } catch (ex) {
                resolve(ex, null);
            };
        });
    };

    function callRefundAndExpectSuccess(fromAccount) {
        return callRefund(fromAccount).then((err, success) => {
            assert.equal(err, null, 'При вызове возврата средств, не должно возникать ошибки');
        });
    }

    function callRefundAndExpectError(fromAccount) {
        return callRefund(fromAccount).then((err, success) => {
            assert.notEqual(err, null, 'При вызове возврата средств, должна возникать ошибка');
        });
    }

    function callFinalize(fromAccount) {
        return new Promise(async (resolve, reject) => {
            try {
                let result = await sale.finalize({from: fromAccount});

                resolve(null, result);

            } catch (ex) {
                resolve(ex, null);
            };
        });
    };

    function callFinalizeAndExpectSuccess(fromAccount) {
        return callFinalize(fromAccount).then((err, success) => {
            assert.equal(err, null, 'При вызове финализатора не должно возникать ошибки');
        });
    }

    async function checkSendEtherTo(toAccount, fromAccount, wei) {
        await sendEtherToAndExpectSuccess(toAccount, fromAccount, wei);
    };

    async function checkNotAcceptEther(fromAccount, contractAddress, wei) {
        await sendEtherAndExpectError(fromAccount, contractAddress, wei);
    };

    async function checkContractFallbackWithError(accountFrom, contractInstance) {
        await sendEtherAndExpectError(accountFrom, contractInstance, web3.toWei(1, 'ether'));
    };

    async function checkSaleState(expectedState) {
        let currentState = await sale.getState.call();
        assert.equal(currentState.valueOf(), expectedState, 'Cостояние должно быть {0}, текущее состояние: {1}'.format(salesStateStr[expectedState], salesStateStr[currentState.valueOf()]));
    };

    async function checkFinalizeSuccess(fromAccount) {
        await callFinalizeAndExpectSucces(fromAccount);
    };

    async function checkAccountTokenBalance(account, expectedValue) {
        let balanceCall = await token.balanceOf.call(account);

        assert.equal(balanceCall.valueOf(), expectedValue, 'Значение баланса аккаунта: {0} ({1}), не соответствует значению: {2}'.format(account, balanceCall.valueOf(), expectedValue));
    };

    async function checkRefund(fromAccount, expectedWeiAmount, weiEpsilon) {
        let refundAccount = fromAccount;
        let balanceBefore = await getBalance(refundAccount);

        await callRefundAndExpectSuccess(refundAccount);
        let balanceAfter = await getBalance(refundAccount);

        let refundAmount = new web3.BigNumber(balanceAfter).minus(new web3.BigNumber(balanceBefore));
        let checkResult = checkFloatValuesEquality(refundAmount.toString(), expectedWeiAmount, weiEpsilon);

        assert.isTrue(checkResult, 'Возврат должен соответствовать переводу');
    };

    async function checkRefundWithError(account) {
        await callRefundAndExpectError(account);
    }

    async function checkSendEther(fromAccount, wei) {
        await sendEtherAndExpectSuccess(fromAccount, sale, wei);
    }

    async function checkSendEtherAndGetBonus(fromAccount, wei, expectedBonus) {
        let oneTokenInWeiCall = await sale.getOneTokenInWei.call();
        let oneTokenInWei = new web3.BigNumber(oneTokenInWeiCall.toString());

        // Баланс токенов на счете владельца
        let ownerBalanceBeforeCall = await token.balanceOf.call(AllocatedRefundableCappedCrowdsale.address);
        let ownerBalanceBefore = ownerBalanceBeforeCall.valueOf();

        // Баланс токенов на счете плательщика
        let payerBalanceBeforeCall = await token.balanceOf.call(fromAccount);
        let payerBalanceBefore = payerBalanceBeforeCall.valueOf();

        await sendEtherAndExpectSuccess(fromAccount, sale, wei);

        let payerBalanceAfterCall = await token.balanceOf.call(fromAccount);
        let payerBalanceAfter = payerBalanceAfterCall.valueOf();

        let tokensWithoutBonus = new web3.BigNumber(wei).div(new web3.BigNumber(oneTokenInWei));
        let tokensWithBonus = new web3.BigNumber(tokensWithoutBonus).mul(new web3.BigNumber(100 + expectedBonus * 100)).div(100);

        let multiplier = Math.pow(10, Storage.tokenDecimals);

        let payerDeltaBalance = new web3.BigNumber(payerBalanceAfter).minus(new web3.BigNumber(payerBalanceBefore)).div(multiplier);

        assert.equal(checkFloatValuesEquality(payerDeltaBalance, tokensWithBonus), true, 'Должен быть начислен бонус {0}%, payerDeltaBalance: {1}, tokesWithBonus: {2}'.format(expectedBonus * 100, payerDeltaBalance, tokensWithBonus));

        let ownerBalanceAfterCall = await token.balanceOf.call(AllocatedRefundableCappedCrowdsale.address);
        let ownerBalanceAfter = ownerBalanceAfterCall.valueOf();

        // Кол-во токенов на аккаунте владельца должно уменьшиться
        let ownerDeltaBalance = new web3.BigNumber(ownerBalanceBefore).minus(new web3.BigNumber(ownerBalanceAfter)).div(new web3.BigNumber(multiplier));

        assert.equal(checkFloatValuesEquality(ownerDeltaBalance, tokensWithBonus), true, 'Со счета владельца должны быть списаны токены');
    };

    async function checkSendEtherFromBackendAndGetBonus(fromAccount, wei, expectedBonus) {
        let oneTokenInWeiCall = await sale.getOneTokenInWei.call();
        let oneTokenInWei = new web3.BigNumber(oneTokenInWeiCall.toString());

        // Баланс токенов на счете владельца
        let ownerBalanceBeforeCall = await token.balanceOf.call(AllocatedRefundableCappedCrowdsale.address);
        let ownerBalanceBefore = ownerBalanceBeforeCall.valueOf();

        // Баланс токенов на счете плательщика
        let payerBalanceBeforeCall = await token.balanceOf.call(fromAccount);
        let payerBalanceBefore = payerBalanceBeforeCall.valueOf();

        await sendEtherFromBackendAndExpectSuccess(fromAccount, accounts[0], sale, wei);

        let payerBalanceAfterCall = await token.balanceOf.call(fromAccount);
        let payerBalanceAfter = payerBalanceAfterCall.valueOf();

        let tokensWithoutBonus = new web3.BigNumber(wei).div(new web3.BigNumber(oneTokenInWei));
        let tokensWithBonus = new web3.BigNumber(tokensWithoutBonus).mul(new web3.BigNumber(100 + expectedBonus * 100)).div(100);

        let multiplier = Math.pow(10, Storage.tokenDecimals);

        let payerDeltaBalance = new web3.BigNumber(payerBalanceAfter).minus(new web3.BigNumber(payerBalanceBefore)).div(multiplier);

        assert.equal(checkFloatValuesEquality(payerDeltaBalance, tokensWithBonus), true, 'Должен быть начислен бонус {0}%, payerDeltaBalance: {1}, tokesWithBonus: {2}'.format(expectedBonus * 100, payerDeltaBalance, tokensWithBonus));

        let ownerBalanceAfterCall = await token.balanceOf.call(AllocatedRefundableCappedCrowdsale.address);
        let ownerBalanceAfter = ownerBalanceAfterCall.valueOf();

        // Кол-во токенов на аккаунте владельца должно уменьшиться
        let ownerDeltaBalance = new web3.BigNumber(ownerBalanceBefore).minus(new web3.BigNumber(ownerBalanceAfter)).div(new web3.BigNumber(multiplier));

        assert.equal(checkFloatValuesEquality(ownerDeltaBalance, tokensWithBonus), true, 'Со счета владельца должны быть списаны токены');
    };

    async function checkContractOwner(contractInstance, contractName, expectedOwner) {
        let ownerCall = await contractInstance.owner.call();
        assert.equal(ownerCall.valueOf(), expectedOwner, 'Владелец в контракте {0}, не совпадает со значением, которое задано в настройках'.format(contractName));
    };

    async function checkContractHalt(expectedValue) {
        let haltedCall = await sale.halted.call();
        assert.equal(haltedCall.valueOf(), expectedValue, 'Значение переменной halted в контракте продаж должно быть установлено в {0}'.format(expectedValue ? 'true' : 'false'));
    };

    async function getBalance(accountAddress, at) {
        return promisify(cb => web3.eth.getBalance(accountAddress, at, cb));
    };

    // Начало теста
    it('Служебный вызов, перевод 1 эфира с адреса accounts[0] на accounts[1]', async function () {
        let amount = web3.toWei(1, 'ether');
        let accountFrom = accounts[0];
        let accountTo = accounts[1];

        let balanceBeforeCall = await getBalance(accountTo);
        let balanceBefore = balanceBeforeCall.valueOf();
        await checkSendEtherTo(accountTo, accountFrom, amount);

        let balanceAfterCall = await getBalance(accountTo);
        let balanceAfter = balanceAfterCall.valueOf();

        let balanceMustBe = new web3.BigNumber(balanceBefore).add(new web3.BigNumber(amount));

        assert.equal(balanceAfter, balanceMustBe, 'Баланс account[1] должен быть пополнен');
    });

    it('Владелец контрактов должен быть задан корректно', async function () {
        await checkContractOwner(token, 'BurnableCrowdsaleToken', Storage.ownerAddress);
        await checkContractOwner(sale, 'AllocatedRefundableCappedCrowdsale', Storage.ownerAddress);
    });

    it('Даты начала и окончания должны быть заданы корректно', async function () {
        let startDateCall = await sale.startsAt.call();
        assert.equal(startDateCall.valueOf(), Storage.startDateTimestamp, 'Дата старта в контракте не совпадает с датой, которая задана в настройках');

        let endDateCall = await sale.endsAt.call();
        assert.equal(endDateCall.valueOf(), Storage.endDateTimestamp, 'Дата окончания в контракте не совпадает с датой, которая задана в настройках');
    });

    it('Наименование токена, символ, кол-во знаков, и тип токена должны быть заданы корректно', async function () {
        let symbolCall = await token.symbol.call();
        assert.equal(symbolCall.valueOf(), Storage.tokenSymbol, 'Символ токена в контракте не совпадает со значением, которое задано в настройках');

        let nameCall = await token.name.call();
        assert.equal(nameCall.valueOf(), Storage.tokenName, 'Имя токена в контракте не совпадает со значением, которое задано в настройках');

        let decimalsCall = await token.decimals.call();
        assert.equal(decimalsCall.valueOf(), Storage.tokenDecimals, 'Кол-во знаков в контракте не совпадает со значением, которое задано в настройках');
    });

    it('Кошелек для сбора средств должен быть задан корректно', async function () {
        let destinationWalletAddressCall = await sale.multisigOrSimpleWallet.call();

        assert.equal(destinationWalletAddressCall.valueOf(), Storage.destinationWalletAddress, 'Адрес кошелька для сбора средства не совпадает со значением, которое задано в настройках');
    });

    it('Начальное состояние контракта продаж, для тестируемых значений должно быть PreFunding', async function () {
        await checkSaleState(saleStates.preFunding);
    });

    it('На балансе контракта AllocatedRefundableCappedCrowdsale, всего должно находится {0} токенов'.format(Storage.tokenTotalSupply), async function () {
        let totalTokensCall = await token.balanceOf.call(sale.address);

        let totalTokens = totalTokensCall.valueOf();

        assert.equal(totalTokens, Converter.getTokenValue(Storage.tokenTotalSupply, Storage.tokenDecimals), 'Количество токенов на балансе контракта не совпадает со значением, которое задано в настройках ');
    });

    it('На балансе контракта AllocatedRefundableCappedCrowdsale, должно находится {0} токенов для продажи'.format(Storage.tokenForSale), async function () {
        let tokensLeftCall = await sale.getTokensLeftForSale.call();
        let tokensLeft = tokensLeftCall.valueOf();

        // Можем продавать все токены сразу
        assert.equal(tokensLeft, Converter.getTokenValue(Storage.tokenForSale, Storage.tokenDecimals), 'Количество токенов на балансе контракта не совпадает со значением, которое задано в настройках ');
    });

    it("Переводы в состоянии Prefund не должны работать", async function () {
        await checkContractFallbackWithError(accounts[1], sale);
    });

    // Проверка fallback для отгруженных контрактов, транзакции проходить не должны
    it("Fallback перевод на контракт BurnableCrowdsaleToken должен возвращать ошибку", async function () {
        await checkContractFallbackWithError(accounts[1], token);
    });

    // 2 дня после старта, будет период продаж
    it("Перевели время на 2 дня вперед", async function () {
        await TestUtil.increaseTime(2 * Constant.DAY);
    });

    it('Состояние, после изменения времени на 2 дня вперед, должно быть Funding', async function () {
        await checkSaleState(saleStates.funding);
    });

    it('В кошельке для сбора средств должна быть 0 сумма', async function () {
        let destinationWalletAddressCall = await sale.multisigOrSimpleWallet.call();

        let balanceCall = await getBalance(destinationWalletAddressCall.toString());

        assert.equal(balanceCall.toString(), 0, 'На адресе кошелька для сбора должна быть 0 сумма');
    });

    if (scenario != scenarioTypes.refunding){
        // Проверка ценовой стратегии
        // При переводе эфира, бонус определяется исходя из кол-ва проданных токенов
        // 0 - 10 млн. - 20%
        // 10 - 25 млн. - 15%
        // 25 - 50 млн. - 10%
        // 50 - 75 млн. - 5%
        // 75 - 92 млн. - 0%
        it("Бонус 20%, при условии, что кол-во проданных токенов от [0, 10 млн.)", async function () {
            // 7200 * x * 1.2 = 10 млн.
            // Сумму берем с округление до следующего десятичного знака, чтобы перейти к след. условию
            let sendingEtherValueInWei = web3.toWei(1157.45, 'ether');

            await checkSendEtherAndGetBonus(accounts[0], sendingEtherValueInWei, 0.2);

            let tokensSoldCall = await sale.tokensSold.call();
            console.log("Токенов продано: {0}".format(tokensSoldCall.toString(10)));
        });

        // Проверим, что деньги не поступают на прямой адрес кошелька для сборов, а идут в спец. хранилище
        it("Проверка, что средства поступают в подвал, а не на прямую в кошелек", async function () {
            let destinationWalletAddressCall = await sale.multisigOrSimpleWallet.call();
            let tokenWalletBalance = await getBalance(destinationWalletAddressCall.valueOf());

            assert.equal(tokenWalletBalance.toString(), '0', 'Баланс на кошельке токена должен быть равен 0');

            let vaultAddressCall = await sale.fundsVault.call();
            let vaultBalance = await getBalance(vaultAddressCall.valueOf());

            assert.notEqual(vaultBalance.toString(), '0', 'Баланс на кошельке токена должен быть равен 0');

            console.log('Количество wei на балансе подвала: {0} wei'.format(vaultBalance.toString()));
        });

        it("Бонус 15%, при условии, что кол-во проданных токенов от [10, 25 млн.), проверка покупки через бэкенд", async function () {
            // 7200 * x * 1.15 = 15 млн.
            let sendingEtherValueInWei = web3.toWei(1811.6, 'ether');

            await checkSendEtherFromBackendAndGetBonus(accounts[0], sendingEtherValueInWei, 0.15);

            let tokensSoldCall = await sale.tokensSold.call();
            console.log("Токенов продано: {0}".format(tokensSoldCall.toString(10)));
        });

        it("Бонус 10%, при условии, что кол-во проданных токенов от [25, 50 млн.)", async function () {
            // 7200 * x * 1.1 = 25 млн.
            let sendingEtherValueInWei = web3.toWei(3156.6, 'ether');

            await checkSendEtherAndGetBonus(accounts[0], sendingEtherValueInWei, 0.1);

            let tokensSoldCall = await sale.tokensSold.call();
            console.log("Токенов продано: {0}".format(tokensSoldCall.toString(10)));
        });

        if (scenario != scenarioTypes.softCapGoalReached){
            it("Бонус 5%, при условии, что кол-во проданных токенов от [50, 75 млн.)", async function () {
                // 7200 * x * 1.05 = 25 млн.
                let sendingEtherValueInWei = web3.toWei(3306.789, 'ether');

                let getTokensLeftForSaleCall = await sale.getTokensLeftForSale.call();

                console.log("Осталось токенов: {0}".format(getTokensLeftForSaleCall.toString(10)));

                await checkSendEtherAndGetBonus(accounts[0], sendingEtherValueInWei, 0.05);

                let tokensSoldCall = await sale.tokensSold.call();
                console.log("Токенов продано: {0}".format(tokensSoldCall.toString(10)));
            });

        };

    };


    // Основные сценарии

    // Сценарий успешной продажи всех токенов
    if (scenario == scenarioTypes.allTokensSold) {
        it("Бонус отсутствует, при условии, что кол-во проданных токенов от [75, 100 млн.)", async function () {
            // 7200 * x  = 25 млн.
            let sendingEtherValueInWei = web3.toWei(3472.22, 'ether');

            let balanceBefore = await getBalance(accounts[0]);

            await checkSendEtherAndGetBonus(accounts[0], sendingEtherValueInWei, 0);

            let balanceAfter = await getBalance(accounts[0]);

            let gasAmount = new web3.BigNumber(balanceBefore).minus(new web3.BigNumber(balanceAfter)).minus(new web3.BigNumber(sendingEtherValueInWei));

            console.log('Стоимость использованного газа: {0} wei'.format(gasAmount.toString()));
        });

        // добираем остатки без бонуса
        it("Бонус отсутствует, при условии, что кол-во проданных токенов от [75, 100 млн.)", async function () {
            let oneTokenInWeiCall = await sale.getOneTokenInWei.call();
            let oneTokenInWei = oneTokenInWeiCall.valueOf();

            let tokensLeftCall = await sale.getTokensLeftForSale.call();
            let tokensLeft = new web3.BigNumber(tokensLeftCall.valueOf()).div(Converter.getTokenValue(1, 18));

            let balanceBefore = await getBalance(accounts[0]);

            let sendingEtherValueInWei = new web3.BigNumber(tokensLeft).mul(oneTokenInWei).round().plus(web3.toWei(1, 'ether')).toString();

            console.log(tokensLeft, sendingEtherValueInWei);

            await checkSendEther(accounts[0], sendingEtherValueInWei);

            let balanceAfter = await getBalance(accounts[0]);

            let gasAmount = new web3.BigNumber(balanceBefore).minus(new web3.BigNumber(balanceAfter)).minus(new web3.BigNumber(sendingEtherValueInWei));

            console.log('Стоимость использованного газа: {0} wei'.format(gasAmount.toString()));
        });

        it('Вызов финализатора', async function () {
            await checkSaleState(saleStates.success);

            let fromAccount = accounts[0];

            let totalTokensCall = await token.balanceOf.call(sale.address);
            let totalTokens = totalTokensCall.toString();

            console.log('Кол-во токенов до финализации: ', totalTokens);

            await callFinalizeAndExpectSuccess(fromAccount);

            totalTokensCall = await token.balanceOf.call(sale.address);
            totalTokens = totalTokensCall.toString();

            console.log('Кол-во токенов после финализации: ', totalTokens);
        });
    };


    // Сценарий сбора минимальной кепки или всех проданных токенов
    if (scenario == scenarioTypes.softCapGoalReached || scenario == scenarioTypes.allTokensSold) {

        // проверка того, что оставшиеся токены сожгуться
        if (scenario == scenarioTypes.softCapGoalReached) {

            // it("Финальная покупка для закрытия кепки", async function () {
            //     let sendingEtherValueInWei = web3.toWei(1183, 'ether');
            //
            //     let tokensLeftCall = await sale.getTokensLeftForSale.call();
            //     let tokensLeft = new web3.BigNumber(tokensLeftCall.valueOf()).div(Converter.getTokenValue(1, 18));
            //
            //     console.log('Кол-во оставшихся токенов до финального перевода: ', tokensLeft);
            //
            //     await checkSendEtherAndGetBonus(accounts[0], sendingEtherValueInWei, 0);
            // });

            // Передвигаем дату за пределы проведения ICO, т.к. собралась минимальная сумма, то продажи считаем успешными
            it("Перевели время на 5 дней вперед", async function () {
                await TestUtil.increaseTime(5 * Constant.DAY);
            });

            it('Состояние, после изменения времени на 5 дней вперед, должно быть Success', async function () {
                await checkSaleState(saleStates.success);
            });

            // на этом этапе, минимальную кепку уже собрали, просто вызываем финализатор
            it('Вызов финализатора', async function () {
                await checkSaleState(saleStates.success);

                let fromAccount = accounts[0];

                let totalTokensCall = await token.balanceOf.call(sale.address);
                let totalTokens = totalTokensCall.toString();

                console.log('Кол-во токенов до финализации: ', totalTokens);

                await callFinalizeAndExpectSuccess(fromAccount);

                totalTokensCall = await token.balanceOf.call(sale.address);
                totalTokens = totalTokensCall.toString();

                console.log('Кол-во токенов после финализации: ', totalTokens);
            });

            it('Перевод средств и выдача токенов в соятоянии Finalized - запрещена', async function () {
                await checkContractFallbackWithError(accounts[0], sale);
            });

            it("Проверка сжигания токенов", async function () {
                let tokensLeftCall = await sale.getTokensLeftForSale.call();
                let tokensLeft = new web3.BigNumber(tokensLeftCall.valueOf()).div(Converter.getTokenValue(1, 18));

                console.log('Токенов осталось:', tokensLeft);
                assert.equal(tokensLeft.toNumber(), 0, 'Остаток токенов должен быть сожжен, оставшихся токенов быть не должно');
            });
        };

        it("Проверка, что средства поступили на кошелек для сборов", async function () {
            let destinationWalletAddressCall = await sale.multisigOrSimpleWallet.call();
            let tokenWalletBalance = await getBalance(destinationWalletAddressCall.valueOf());

            console.log('Количество wei на балансе кошелька: {0} wei'.format(tokenWalletBalance.toString()));

            assert.notEqual(tokenWalletBalance.toString(), '0', 'Баланс на кошельке токена не должен быть равен 0');

            let vaultAddressCall = await sale.fundsVault.call();
            let vaultBalance = await getBalance(vaultAddressCall.valueOf());

            console.log('Количество wei на балансе подвала: {0} wei'.format(vaultBalance.toString()));
            assert.equal(vaultBalance.toString(), '0', 'Баланс на подвале должен быть равен 0');
        });

        // Проверка распределения долей токенов после продаж
        let teamTokenAmount = Converter.getTokenValue(Storage.teamTokenAmount, Storage.tokenDecimals);
        it("Количество токенов на аккаунте команды должно быть = {0}".format(teamTokenAmount), async function () {
            let teamTokenAmountCall = await token.balanceOf.call(Storage.teamWalletAddress);

            assert.equal(teamTokenAmountCall.toString(), teamTokenAmount, 'Баланс токенов на аккаунте команды должен быть корректен');
        });

        let advisorsTokenAmount = Converter.getTokenValue(Storage.advisorsTokenAmount, Storage.tokenDecimals);
        it("Количество токенов на аккаунте адвизоров должно быть = {0}".format(advisorsTokenAmount), async function () {
            let advisorsTokenAmountCall = await token.balanceOf.call(Storage.advisorsWalletAddress);

            assert.equal(advisorsTokenAmountCall.toString(), advisorsTokenAmount, 'Баланс токенов на аккаунте адвизоров должен быть корректен');
        });

        let referalTokenAmount = Converter.getTokenValue(Storage.referalTokenAmount, Storage.tokenDecimals);
        it("Количество токенов на аккаунте адвизоров должно быть = {0}".format(referalTokenAmount), async function () {
            let referalTokenAmountCall = await token.balanceOf.call(Storage.referalWalletAddress);

            assert.equal(referalTokenAmountCall.toString(), referalTokenAmount, 'Баланс токенов на аккаунте реферальной программы должен быть корректен');
        });

        let reserveTokenAmount = Converter.getTokenValue(Storage.reserveTokenAmount, Storage.tokenDecimals);
        it("Количество токенов на аккаунте адвизоров должно быть = {0}".format(reserveTokenAmount), async function () {
            let reserveTokenAmountCall = await token.balanceOf.call(Storage.reserveWalletAddress);

            assert.equal(reserveTokenAmountCall.toString(), reserveTokenAmount, 'Баланс токенов на аккаунте оборотного резерва должен быть корректен');
        });
    };

    // Сценарий возврата средств
    if (scenario == scenarioTypes.refunding) {

        // делаем доп. платежи, чтобы проверить возвраты
        it("2 Платежа, на 10 и 1 eth, для проверки возврата платежа", async function () {
            let sendingEtherValueInWei = web3.toWei(10, 'ether');
            await checkSendEtherAndGetBonus(accounts[1], sendingEtherValueInWei, 0.2);

            sendingEtherValueInWei = web3.toWei(30, 'ether');
            await checkSendEtherAndGetBonus(accounts[2], sendingEtherValueInWei, 0.2);
        });

        it("Перевели время на 5 дней вперед", async function () {
            await TestUtil.increaseTime(5 * Constant.DAY);
        });

        it('Состояние, после изменения времени на 5 дней вперед, должно быть Failure', async function () {
            await checkSaleState(saleStates.failure);
        });

        it('Перевод контракта в режим возврата', async function () {
            await callEnableRefundsAndExpectSuccess(accounts[0]);
        });

        it('Состояние должно быть Refunding', async function () {
            await checkSaleState(saleStates.refunding);
        });

        it('Перевод средств и выдача токенов в соятоянии Refunding - запрещена', async function () {
            await checkContractFallbackWithError(accounts[1], sale);
        });

        it('Возврат средств на аккаунт [4]', async function () {
            await checkRefund(accounts[1], web3.toWei(10, 'ether'), web3.toWei(0.5, 'ether'));
        });

        it('Возврат средств на аккаунт [5]', async function () {
            await checkRefund(accounts[2], web3.toWei(30, 'ether'), web3.toWei(0.5, 'ether'));
        });

        it('Возврат можно провести только 1 раз', async function () {
            await checkRefundWithError(accounts[2], web3.toWei(30, 'ether'));
        });
    };

    // Сценарий остановки торгов
    if (scenario == scenarioTypes.pauseStart) {

        // Остановка торгов
        it("Остановить торги может только владелец", async function () {
            // Берем произвольный аккаунт не являющийся владельцем
            await callHaltAndExpectError(getNotOwnerAccountAddress());
            await callHaltAndExpectSuccess(Storage.ownerAddress);
        });

        it('После вызовы halt(), у контракта продаж, переменная halted, должна быть установлена в true', async function () {
            await checkContractHalt(true);
        });

        it("После экстренной остановки продаж, переводы эфира на контракт не должны работать", async function () {
            await checkNotAcceptEther(accounts[0], sale, web3.toWei(20, 'ether'));
        });

        it("Возобновить торги может только владелец", async function () {
            // Берем произвольный аккаунт не являющийся владельцем
            await callUnhaltAndExpectError(getNotOwnerAccountAddress());
            await callUnhaltAndExpectSuccess(Storage.ownerAddress);
        });

        it('После вызовы unhalt(), у контракта продаж, переменная halted, должна быть установлена в false', async function () {
            await checkContractHalt(false);
        });

        it("Перевели время на 5 дня вперед", async function () {
            await TestUtil.increaseTime(5 * Constant.DAY);
        });
    };

    it("После окончания продаж, переводы - запрещены", async function () {
        await checkNotAcceptEther(accounts[1], sale, web3.toWei(1, 'ether'));
    });

});
