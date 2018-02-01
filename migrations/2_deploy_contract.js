const Storage = require("../lib/storage.js");
const Converter = require("../lib/converter.js");

// Подключение смарт контрактов
const BurnableCrowdsaleToken = artifacts.require("./token/BurnableCrowdsaleToken.sol");
const RefundableAllocatedCappedCrowdsale = artifacts.require("./RefundableAllocatedCappedCrowdsale.sol");

module.exports = function (deployer, network, accounts) {

     Storage.setDevMode({
         ownerAddress : accounts[0],
         destinationWalletAddress : accounts[9],
         sumpWalletAddress : accounts[8],

         teamWalletAddress : accounts[4],
         advisorsWalletAddress : accounts[5],
         referalWalletAddress : accounts[6],
         reserveWalletAddress : accounts[7]
    });

    // Storage.setProdMode();

    const destinationWalletAddress = Storage.destinationWalletAddress;
    const sumpWalletAddress = Storage.sumpWalletAddress;

    const symbol = Storage.tokenSymbol;
    const name = Storage.tokenName;
    const decimals = Storage.tokenDecimals;
    const totalSupply = Storage.tokenTotalSupply;

    // Даты начала и окончания продаж
    const startDateTimestamp = Storage.startDateTimestamp;
    const endDateTimestamp = Storage.endDateTimestamp;

    const teamWalletAddress = Storage.teamWalletAddress;
    const advisorsWalletAddress = Storage.advisorsWalletAddress;
    const referalWalletAddress = Storage.referalWalletAddress;
    const reserveWalletAddress = Storage.reserveWalletAddress;

    // Нижележащие значения используются только для тестирования
    const minimumFundingGoalInCents = Storage.minimumFundingGoalInCents;
    const teamTokenAmount = Storage.teamTokenAmount;
    const advisorsTokenAmount = Storage.advisorsTokenAmount;
    const referalTokenAmount = Storage.referalTokenAmount;
    const reserveTokenAmount = Storage.reserveTokenAmount;
    //
    // Деплой
    // Контракт токена
    return deployer.deploy(BurnableCrowdsaleToken, name, symbol, Converter.getTokenValue(totalSupply, decimals), decimals).then(() => {
        // Контракт для пресейла
        return deployer.deploy(
            RefundableAllocatedCappedCrowdsale,

            BurnableCrowdsaleToken.address,

            destinationWalletAddress,
            sumpWalletAddress,

            startDateTimestamp,
            endDateTimestamp,

            teamWalletAddress,
            advisorsWalletAddress,
            referalWalletAddress,
            reserveWalletAddress
        );
    });

};