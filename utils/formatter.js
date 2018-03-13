module.exports = {

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
    }

}