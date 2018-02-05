const Moment = require("moment");
const Constant = require("../lib/constant.js");
const Converter = require("../lib/converter.js");

var storage = {
    setProdMode : function(opts){
        // Нужно заполнить!!!
        this.etherRateInCents = 110000;

        this.teamTokenAmount = 15 * Constant.MILLION;
        this.advisorsTokenAmount = 3 * Constant.MILLION;
        this.referalTokenAmount = 2 * Constant.MILLION;
        this.reserveTokenAmount = 35 * Constant.MILLION;

        this.afterSuccessTokenDistributionAmount = this.teamTokenAmount + this.advisorsTokenAmount + this.referalTokenAmount + this.reserveTokenAmount;

        this.ownerAddress = '0xd794763E54EeCb87A7879147b5A17BfA6663a33C';
        // Адрес, куда будут переводится платежи за токены
        this.destinationWalletAddress = '0x06553d1befb814f44f2e6aa26e36a43819c2f18e';
        this.sumpWalletAddress = '0x7f27ff6fe89aa12120a2ead95e8348b05dc08f8a';
        this.presaleWalletAddress = '0xAAd697c4c54838E5e9e64D44428eEf3B37d71e7d';

        this.presaleStartDate = "2018-02-01 00:00:00";
        this.presaleEndDate = "2018-03-15 23:59:59";

        this.startDate = "2018-03-16 00:00:00";
        this.endDate = "2018-05-31 23:59:59";

        // Можно поменять начальное кол-во токенов, которое будет продаваться
        this.tokenSymbol = 'MAGE';
        this.tokenName = 'Ethernal Heroes Token';
        this.tokenDecimals = 18;

        // Сколько токенов доступно для продажи
        this.tokenForSale = 100 * Constant.MILLION;
        this.tokenTotalSupply = this.tokenForSale + this.afterSuccessTokenDistributionAmount;

        this.startDateTimestamp = Moment(this.startDate).unix();
        this.endDateTimestamp = Moment(this.endDate).unix();

        this.presaleStartDateTimestamp = Moment(this.presaleStartDate).unix();
        this.presaleEndDateTimestamp = Moment(this.presaleEndDate).unix();

        this.minimumFundingGoalInCents = 2000000 * Constant.DOLLAR;
        this.maximumFundingGoalInCents = 5000000 * Constant.DOLLAR;

        this.teamWalletAddress = '0x06553D1befb814f44f2E6aa26e36a43819C2f18E';
        this.advisorsWalletAddress = '0xB3B778A62EAdF1D2C88c64E820D43EAF6ACf49f8';
        this.referalWalletAddress = '0xa03430C31903447E2c6F2b84E60d183De62faAA6';
        this.reserveWalletAddress = '0x528b0BE8b7dc9bDC61CDd1379Aa2c0769a10f2dd';
    },

    setDevMode : function(opts){
        this.etherRateInCents = 36000;

        opts.ownerAddress = opts.ownerAddress || '0x0';
        opts.teamWalletAddress = opts.teamWalletAddress || '0x0';
        opts.advisorsWalletAddress = opts.advisorsWalletAddress || '0x0';
        opts.referalWalletAddress = opts.referalWalletAddress || '0x0';
        opts.reserveWalletAddress = opts.reserveWalletAddress || '0x0';

        this.teamTokenAmount = 15 * Constant.MILLION;
        this.advisorsTokenAmount = 3 * Constant.MILLION;
        this.referalTokenAmount = 2 * Constant.MILLION;
        this.reserveTokenAmount = 35 * Constant.MILLION;

        this.afterSuccessTokenDistributionAmount = this.teamTokenAmount + this.advisorsTokenAmount + this.referalTokenAmount + this.reserveTokenAmount;

        this.ownerAddress = opts.ownerAddress;

        // Адрес, куда будут переводится платежи за токены
        this.destinationWalletAddress = opts.destinationWalletAddress || '0x0';
        this.sumpWalletAddress = opts.sumpWalletAddress || '0x0';
        this.presaleWalletAddress = '0x29e5a7db449cb85dcff4FC95da02dCa357dEa8fC';


        // Можно поменять начальное кол-во токенов, которое будет продаваться
        this.tokenSymbol = 'MAGE';
        this.tokenName = 'Ethernal Heroes Token';
        this.tokenDecimals = 18;

        // Сколько токенов доступно
        // для продажи
        this.tokenForSale = 100 * Constant.MILLION;
        //всего
        this.tokenTotalSupply = this.tokenForSale + this.afterSuccessTokenDistributionAmount;

        this.presaleStartDateTimestamp = Moment().add(1, "days").unix();
        this.presaleEndDateTimestamp = Moment().add(5, "days").unix();
        this.startDateTimestamp = Moment().add(6, "days").unix();
        this.endDateTimestamp = Moment().add(10, "days").unix();

        this.presaleStartDate = Moment.unix(this.presaleStartDateTimestamp).format("YYYY-MM-DD HH:mm:ss");
        this.presaleEndDate = Moment.unix(this.presaleEndDateTimestamp).format("YYYY-MM-DD HH:mm:ss");
        this.startDate = Moment.unix(this.startDateTimestamp).format("YYYY-MM-DD HH:mm:ss");
        this.endDate = Moment.unix(this.endDateTimestamp).format("YYYY-MM-DD HH:mm:ss");

        this.minimumFundingGoalInCents = 2000000 * Constant.DOLLAR;

        this.teamWalletAddress = opts.teamWalletAddress;
        this.advisorsWalletAddress = opts.advisorsWalletAddress;
        this.referalWalletAddress = opts.referalWalletAddress;
        this.reserveWalletAddress = opts.reserveWalletAddress;
    }
};

module.exports = storage;