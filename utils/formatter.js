const steem = require('steem');

module.exports = {

    age: function(created, toString, showZero, precision) {
        const ageMilliseconds = new Date(new Date() - new Date(created));
        const age = {
            years: ageMilliseconds.getFullYear() - 1970,
            months: ageMilliseconds.getMonth(),
            days: ageMilliseconds.getDate(),
            hours: ageMilliseconds.getHours(),
            minutes: ageMilliseconds.getMinutes(),
            seconds: ageMilliseconds.getSeconds(),
            milliseconds: ageMilliseconds.getMilliseconds()
        };
        if(toString) {
            let toReturn = '';
            switch(precision) {
                case 'ms':
                case 'milliseconds':
                    if(showZero || age.milliseconds > 0) toReturn = age.milliseconds + ' milliseconds';
                case 's':
                case 'sec':
                case 'seconds':
                    toReturn = (showZero || age.seconds > 0 ? age.seconds + ' seconds' + (toReturn.length > 0 ? ', ' : '')  : '') + toReturn;
                case 'min':
                case 'minutes':
                    toReturn = (showZero || age.minutes > 0 ? age.minutes + ' minutes' + (toReturn.length > 0 ? ', ' : '')  : '') + toReturn;
                case 'h':
                case 'hours':
                    toReturn = (showZero || age.hours > 0 ? age.hours + ' hours' + (toReturn.length > 0 ? ', ' : '')  : '') + toReturn;
                case 'd':
                case 'days':
                    toReturn = (showZero || age.days > 0 ? age.days + ' days' + (toReturn.length > 0 ? ', ' : '')  : '') + toReturn;
                case 'm':
                case 'months':
                    toReturn = (showZero || age.months > 0 ? age.months + ' months' + (toReturn.length > 0 ? ', ' : '')  : '') + toReturn;
                default:
                    toReturn = (showZero || age.years > 0 ? age.years + ' years' + (toReturn.length > 0 ? ', ' : '')  : '') + toReturn;
                    return toReturn;
            }
        }
        return age;
    },

    backslash: function(text) {
        return text.replace(/[`]/g, '\\$&');
    },

    bytes: function(number, decimals) {
        const units = ['bytes', 'kb', 'mb', 'gb', 'tb', 'pb', 'eb', 'zb', 'yb'];
        let conversions = 0;
        number = parseInt(number) || 0;
        while(number >= 1024 && ++conversions) {
            number = number/1024;
        }
        return number.toFixed(conversions < 2 ? 0 : (decimals ? parseInt(decimals) : 2)) + ' ' + units[conversions];
    },

    capitalize: function(string) {
        return string[0].toUpperCase() + string.slice(1);
    },

    currency: function(number, decimals, locales, currency) {
        if(!locales || typeof locales !== 'string') {
            locales = 'en-US';
            if(!currency || typeof currency !== 'string') currency = 'USD';
        };
        return new Intl.NumberFormat(locales, { style: 'currency', currency: currency.toUpperCase(), maximumFractionDigits: parseInt(decimals), maximumFractionDigits: parseInt(decimals) }).format(number);
    },

    currentBandwidth: function(account, dynamicGlobalProperties) {
        const week = 60 * 60 * 24 * 7;
        const vests = parseFloat(account.vesting_shares);
        const receivedVests = parseFloat(account.received_vesting_shares);
        const delegatedVests = parseFloat(account.delegated_vesting_shares);
        const totalVests = parseFloat(dynamicGlobalProperties.total_vesting_shares);
        const maxVirtualBandwidth = parseInt(dynamicGlobalProperties.max_virtual_bandwidth);
        const averageBandwidth = parseInt(account.average_bandwidth);
        // Delay between now and the last bandwidth update (in seconds)
        const bandwidthDelay = (new Date() - new Date(account.last_bandwidth_update + 'Z')) / 1000;
        // Calculating the bandwidth allocated to the account
        const bandwidthAllocated = Math.round((maxVirtualBandwidth * (vests + receivedVests - delegatedVests)) / (totalVests * 1000000));
        // Updating the bandwidth used based on delay
        const bandwidthUsed = bandwidthDelay < week ? Math.round((((week - bandwidthDelay) * averageBandwidth) / week) / 1000000) : 0;
        return {allocated: bandwidthAllocated, used: bandwidthUsed};
    },

    currentSteemPower: function(account, dynamicGlobalProperties) {
        const steemPower = steem.formatter.vestToSteem(parseFloat(account.vesting_shares), dynamicGlobalProperties.total_vesting_shares, dynamicGlobalProperties.total_vesting_fund_steem);
        const delegatedSteemPower = steem.formatter.vestToSteem(parseFloat(account.delegated_vesting_shares), dynamicGlobalProperties.total_vesting_shares, dynamicGlobalProperties.total_vesting_fund_steem);
        const receivedSteemPower = steem.formatter.vestToSteem(parseFloat(account.received_vesting_shares), dynamicGlobalProperties.total_vesting_shares, dynamicGlobalProperties.total_vesting_fund_steem);
        return {owned: steemPower, delegated: delegatedSteemPower, received: receivedSteemPower};
    },

    currentVotingPower: function(account, toPercentage) {
        const fullFillingTime = 60 * 60 * 24 * 5;
        const delay = (new Date() - new Date(account.last_vote_time + 'Z')) / 1000;
        const votingPower = account.voting_power + (10000 * delay / fullFillingTime);
        return toPercentage ? Math.min(votingPower / 100, 100).toFixed(2) : Math.min(votingPower, 10000);
    },

    encodedURL: function(url) {
        return url.replace(/[*_()-]/g, match => '%' + match.charCodeAt(0).toString(16));
    },

    estimateVoteValue: function(account, rewardFund, feedPrice) {
        const effectiveVests = (parseFloat(account.vesting_shares) - parseFloat(account.delegated_vesting_shares) + parseFloat(account.received_vesting_shares)) * 1000000;
        const voteVests = (effectiveVests * 0.02) * (account.voting_power / 10000);
        const vestsShare = voteVests / parseInt(rewardFund.recent_claims);
        const voteSteemValue = vestsShare * parseFloat(rewardFund.reward_balance);
        const voteSBDValue = voteSteemValue * parseFloat(feedPrice.base) / parseFloat(feedPrice.quote);
        return voteSBDValue;
    },

    number: function(number, decimals, locales) {
        if(!locales || typeof locales !== 'string') locales = 'en-US'; 
        return new Intl.NumberFormat(locales, { style: 'decimal', maximumFractionDigits: parseInt(decimals), minimumFractionDigits: parseInt(decimals) }).format(number);
    },

    params: function(params, allowedLastParamValues) {

        let number;
    
        // Keeps only strings and parses the number
        // If there is more than one number, the last one is kept
        params = params.filter(param => {
            if(isNaN(param)) return true;
            number = parseInt(param);
            return false;
        });
    
        // Add the number parsed at the start of array or add 10 if no number has been parsed
        params.unshift(number ? number : 10);
    
        if(allowedLastParamValues) {
            // If there is at least one string
            if(params.length >= 2) {
                // If the first string is an allowed last param value
                if(allowedLastParamValues.includes(params[1])) {
                    const tmp = params.length == 3 ? params[2] : '';
                    params[2] = params[1];
                    params[1] = tmp;
                // Else, set the second string to default if it doesn't exist or isn't an allowed last param value
                } else if(!params[2] || !allowedLastParamValues.includes(params[2])) {
                    params[2] = 'both';
                }
            // If just the number exists, set to default
            } else {
                params = params.concat('', 'both');
            }
        // If just the number exists for a regular set of params, set to default
        } else if(!params[1]) {
            params[1] = ''; 
        }
    
        return params;
    
    },

    reputation: function(reputation) {
        if(reputation == null) return 25;
        reputation = parseInt(reputation);
        let rep = String(reputation);
        const neg = rep.charAt(0) === '-';
        rep = neg ? rep.substring(1) : rep;
        const str = rep;
        const leadingDigits = parseInt(str.substring(0, 4));
        const log = Math.log(leadingDigits) / Math.log(10);
        const n = str.length - 1;
        let out = n + (log - parseInt(log));
        if(isNaN(out)) out = 0;
        out = Math.max(out - 9, 0) * (neg ? -1 : 1);
        return (out * 9 + 25).toFixed(2);
    },

    split: function(string, limit) {
        return string.match(new RegExp('[\\s\\S]{1,' + --limit + '}(?:\\s|$)', 'g')) || [];
    }

}