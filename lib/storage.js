const Moment = require("moment");
const Constant = require("../lib/constant.js");
const Converter = require("../lib/converter.js");

var storage = {
    setProdMode : function(opts){
        this.etherRateInCents = 80700;

        this.teamTokenAmount = 15 * Constant.MILLION;
        this.advisorsTokenAmount = 3 * Constant.MILLION;
        this.referalTokenAmount = 2 * Constant.MILLION;
        this.reserveTokenAmount = 35 * Constant.MILLION;
        this.presaleTokenAmount = 5 * Constant.MILLION;

        this.afterSuccessTokenDistributionAmount = this.teamTokenAmount + this.advisorsTokenAmount + this.referalTokenAmount + this.reserveTokenAmount + this.presaleTokenAmount;

        this.ownerAddress = '0xa165950EfE0Bce322AbB1Fe9FF3Bf16a73628D04';
        // Адрес, куда будут переводится платежи за токены
        this.destinationWalletAddress = '0x2ed7762fe69c1133433593c4370fe038e28021a1';
        this.sumpWalletAddress = '0x1c19B47651D8e3230d0347B37198c762a1a9a045';
        this.presaleWalletAddress = '0xA63E6911093a4ea28F92C0E0A2b2e9E54640cED3';

        this.presaleStartDate = "2018-02-01 00:00:00";
        this.presaleEndDate = "2018-03-15 23:59:59";

        this.startDate = "2018-03-16 00:00:00";
        this.endDate = "2018-05-31 23:59:59";

        this.teamTokenIssueDate = "2018-12-01 00:00:00";

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

        this.teamTokenIssueDateTimestamp = Moment(this.teamTokenIssueDate).unix();

        this.minimumFundingGoalInCents = 2000000 * Constant.DOLLAR;
        this.maximumFundingGoalInCents = 4600000 * Constant.DOLLAR;

        this.teamWalletAddress = '0xfbCBC1c7A59f63F32d35F59D6b9A24c9B4F20B79';
        this.advisorsWalletAddress = '0x3c3FF16063514422A25C3F34C8df325680C64da9';
        this.referalWalletAddress = '0xbd42F45ECe8b754AA672Bf6bB0e2A3B4c21C29CC';
        this.reserveWalletAddress = '0x11f1A2027A1119908422e2e1032b90117Bf8683C';
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