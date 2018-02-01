const Storage = require("../lib/storage.js");

const BurnableCrowdsaleToken = artifacts.require("./token/BurnableCrowdsaleToken.sol");
const AllocatedRefundableCappedCrowdsale = artifacts.require("./RefundableAllocatedCappedCrowdsale.sol");

module.exports = function (deployer, network, accounts) {

    const ownerAddress = Storage.ownerAddress;

    let allocatedRefundableCappedCrowdsaleInstance = null;

    // Устанавливаем того, кто может уничтожить токены
    let burnableCrowdsaleTokenInstance = null;

    BurnableCrowdsaleToken.deployed().then((instance) => {
        burnableCrowdsaleTokenInstance = instance;

        return burnableCrowdsaleTokenInstance.initialSupply(AllocatedRefundableCappedCrowdsale.address, {from: ownerAddress});
    }).then((result) => {
        return burnableCrowdsaleTokenInstance.setOwnerBurner(AllocatedRefundableCappedCrowdsale.address, {from : ownerAddress});
    });

    AllocatedRefundableCappedCrowdsale.deployed().then((instance) => {
        allocatedRefundableCappedCrowdsaleInstance = instance;

        return allocatedRefundableCappedCrowdsaleInstance.setCurrentEtherRateInCents(Storage.etherRateInCents, {from : ownerAddress});
    });


};