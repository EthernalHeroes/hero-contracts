var converter = {
    getTokenValue : function(count, decimals){
        return count * Math.pow(10, decimals);
    }
};

module.exports = converter;