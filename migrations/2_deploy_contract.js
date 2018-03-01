const Storage = require("../lib/storage.js");
const Converter = require("../lib/converter.js");

// Подключение смарт контрактов
const BurnableCrowdsaleToken = artifacts.require("./token/BurnableCrowdsaleToken.sol");
const RefundableAllocatedCappedCrowdsale = artifacts.require("./RefundableAllocatedCappedCrowdsale.sol");

module.exports = function (deployer, network, accounts) {

    //  Storage.setDevMode({
    //      ownerAddress : accounts[0],
    //      destinationWalletAddress : accounts[9],
    //      presaleWalletAddress : accounts[8],
    //      sumpWalletAddress : accounts[7],
    //
    //      teamWalletAddress : accounts[6],
    //      advisorsWalletAddress : accounts[5],
    //      referalWalletAddress : accounts[4],
    //      reserveWalletAddress : accounts[3]
    // });

    Storage.setProdMode();

    const destinationWalletAddress = Storage.destinationWalletAddress;
    const presaleWalletAddress = Storage.presaleWalletAddress;
    const sumpWalletAddress = Storage.sumpWalletAddress;

    const symbol = Storage.tokenSymbol;
    const name = Storage.tokenName;
    const decimals = Storage.tokenDecimals;
    const totalSupply = Storage.tokenTotalSupply;

    // Даты начала и окончания продаж
    const presaleStartDateTimestamp = Storage.presaleStartDateTimestamp;
    const presaleEndDateTimestamp = Storage.presaleEndDateTimestamp;

    const startDateTimestamp = Storage.startDateTimestamp;
    const endDateTimestamp = Storage.endDateTimestamp;
    const teamTokenIssueDateTimestamp = Storage.teamTokenIssueDateTimestamp;

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
            presaleWalletAddress,
            sumpWalletAddress,

            presaleStartDateTimestamp,
            presaleEndDateTimestamp,

            startDateTimestamp,
            endDateTimestamp,

            teamWalletAddress,
            advisorsWalletAddress,
            referalWalletAddress,
            reserveWalletAddress,

            teamTokenIssueDateTimestamp
        );
    });

};