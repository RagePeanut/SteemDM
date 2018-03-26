const steem = require('steem');
const MongoClient = require('mongodb').MongoClient;

const formatter = require('./formatter');
const factory = require('./factory');
const markdown = require('./markdown');

const commands = require('../objects/commands.json');
const history = {};
let settings = {};

// Connection string for MongoDB
const CONNECTION_STRING = 'mongodb://steemit:steemit@mongo1.steemdata.com:27017/SteemData'

module.exports = {
    // Handles the 'account' command
    account: function(param, userId) {
        if(!settings[userId]) settings[userId] = factory.createUserSettingsObject(false, true);
        return new Promise(function(resolve, reject) {
            if(!param) {
                if(settings[userId].steem_account) param = settings[userId].steem_account;
                else {
                    return reject(new Error('You have to specify a username.'));
                }
            }
        
            steem.api.getAccounts([param], function(err, res) {
                if(err) reject(err);
                else {
                    const account = res[0];
                    account.profile = JSON.parse(account.json_metadata).profile;
                    const canParse = settings[userId].styling;
                    steem.api.getDynamicGlobalProperties(function(error, global) {
                        if(error) reject(error);
                        else {
                            steem.api.getAccountVotes(param, function(votesErr, votes) {
                                if(votesErr) votes = [];
                                steem.api.getAccountHistory(param, -1, 300, function(historyErr, history) {
                                    if(historyErr) history = [];
                                    const bandwidth = formatter.currentBandwidth(account, global);
                                    const steemPower = formatter.currentSteemPower(account, global);
                                    steem.api.getRewardFund('post', function(rewardErr, rewardFund) {
                                        if(rewardErr) rewardFund = {recent_claims: '0', reward_balance: '0.000 STEEM'};
                                        steem.api.getCurrentMedianHistoryPrice(async function(feedErr, feedPrice) {
                                            if(feedErr) feedPrice = {base: '0.000 SBD', quote: '1.000 STEEM'};
                                            let text = (canParse ? markdown.parser.bold('**Account**') : 'Account')
                                                     + '\nName: ' + (account.profile.name ? account.profile.name + ' (' + param + ')' : param)
                                                     + '\nReputation: ' + formatter.reputation(account.reputation)
                                                     + (account.profile.about ? '\nAbout: ' + account.profile.about : '')
                                                     + '\nAge: ' + formatter.age(account.created + 'Z', true, false, 'days')
                                                     + (account.profile.location ? '\nLocation: ' + account.profile.location : '')
                                                     + (account.profile.website || account.profile.github || account.profile.twitter ? '\n\n' + 'Links' : '')
                                                     + (account.profile.website ? '\nWebsite: ' + account.profile.website : '')
                                                     + (account.profile.github ? '\nGitHub: https://github.com/' + account.profile.github : '')
                                                     + (account.profile.twitter ? '\nTwitter: https://twitter.com/' + account.profile.twitter : '')
                                                     + '\n\n' + (canParse ? markdown.parser.bold('**Donations**') : 'Donations')
                                                     + (account.profile.bitcoin ? '\nBitcoin: ' + account.profile.bitcoin : '')
                                                     + (account.profile.ethereum ? '\nEthereum: ' + account.profile.ethereum : '')
                                                     + '\nSteem: ' + param
                                                     + '\n\n' + (canParse ? markdown.parser.bold('**Voting**') : 'Voting')
                                                     + '\nVoting Weight: ' + formatter.number(steemPower.owned - steemPower.delegated + steemPower.received, 3, 'en-US') + ' SP (' + formatter.currency(formatter.estimateVoteValue(account, rewardFund, feedPrice), 2, 'en-US', 'USD') +  ')'
                                                     + '\nVoting Power: ' + formatter.currentVotingPower(account, true)  + '%'
                                                     + '\nBandwith Remaining: ' + Math.floor((100 - (100 * bandwidth.used / bandwidth.allocated)) * 100) / 100 + '% (used ' + formatter.bytes(bandwidth.used) + ' of ' + formatter.bytes(bandwidth.allocated) + ')' 
                                                     + '\nVote Count: ' + formatter.number(votes.length, 0, 'en-US') + ' votes'
                                                     + '\nVote Count (24 hours): ' + formatter.number(votes.filter(vote => Date.now() - new Date(vote.time) <= 24 * 60 * 60 * 1000).length, 0, 'en-US') + ' votes'
                                                     + '\n\n' + (canParse ? markdown.parser.bold('**Posts**') : 'Posts')
                                                     + '\nPost Count: ' + formatter.number(account.post_count, 0, 'en-US')  + ' posts'
                                                     + '\nPost Count (24 hours): ' + history.filter(trx => Date.now() - new Date(trx[1].timestamp) <= 24 * 60 * 60 * 1000 && trx[1].op[0] === 'comment' && trx[1].op[1].author === param && !/@@ -\d+,?\d+ \+\d+,?\d+ @@/.test(trx[1].op[1].body)).length + ' posts'
                                                     + '\n\n' + (canParse ? markdown.parser.bold('**Wallet**') : 'Wallet')
                                                     + '\nAccount Value: ' + formatter.currency(await steem.formatter.estimateAccountValue(account), 2, 'en-US', 'USD')
                                                     + '\nSteem Power: ' + formatter.number(steemPower.owned, 3, 'en-US') + ' STEEM (' + (steemPower.delegated < steemPower.received ? '+' : '') + formatter.number(-steemPower.delegated + steemPower.received, 3, 'en-US') + ' STEEM)'
                                                     + '\nBalance: ' + account.balance  + ' / ' + account.sbd_balance
                                                     + '\nSavings: ' + account.savings_balance + ' / ' + account.savings_sbd_balance
                                                     + '\n\n' + (canParse ? markdown.parser.bold('**Witnesses**') : 'Witnesses')
                                                     + '\nWitness Vote Count: ' + account.witnesses_voted_for
                                                     + (account.witnesses_voted_for > 0 ? '\nWitness Votes: ' + account.witness_votes.join(', ') : '');
                                            resolve(text);
                                        });
                                    });
                                });
                            }); 
                        }
                    })
                }
            })
        });
    },

    // Handles the 'close' subcommand
    close: function(userId) {
        if(!settings[userId]) settings[userId] = factory.createUserSettingsObject(false, true);
        return new Promise(function(resolve, reject) {
            if(history.hasOwnProperty(userId)) {
                const allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'mentions', 'replies', 'trending'];
                if(allowedCommandNames.includes(history[userId].last_command.name)) {
                    const allowedSubcommandNames = ['open'];
                    if(allowedSubcommandNames.includes(history[userId].last_subcommand.name)) {
                        history[userId].last_subcommand = {name: '', param: ''};
                        return resolve(history[userId].last_query_result.text);
                    }
                }
            }
            reject(new Error('Close can\'t be called on the previous command.'));
        });
    },

    // Handles the 'help' command
    help: function(command, userId) {
        if(!settings[userId]) settings[userId] = factory.createUserSettingsObject(false, true);
        const lineBreak = '\n--------------------';
        return new Promise(function(resolve, reject) {
            if(command){
                if(!commands[command]) {
                    return reject(new Error('The command \'' + command + '\' doesn\'t exist.\nPlease, write \'help\' to get a list of existing commands.'));
                }
                let response = commands[command].desc_start + lineBreak + '\nUse this command through one of these keywords:\n' + commands[command].keywords.join(', ') + lineBreak;
                if(commands[command].params.length > 0) {
                    response += '\nParameters:';
                    commands[command].params.forEach(param => {
                        response += '\n- ' + param.name + ' : ' + param.text;
                    });
                } else response = response.concat('\nThere is no parameters available.');
                if(commands[command].desc_end !== '') response += lineBreak + commands[command].desc_end;
                resolve(response);
            } else {
                let text = 'Here is a list of existing commands:\n';
                const keys = Object.keys(commands);
                const arr = [];
                for(let i = 0; i < keys.length; i++) {
                    arr.push('- ' + keys[i] + ' : ' + commands[keys[i]].quick_desc);
                    if(commands[keys[i]].important_param) arr.push('- ' + keys[i] + ' ' + commands[keys[i]].important_param.name + ' : ' + commands[keys[i]].important_param.text);
                }
                text += arr.join('\n') + lineBreak + '\nIf you can\'t see the commands names, type \'set styling false\'.';
                const data = {array: arr, raw: commands, text: text};
                history[userId] = factory.createUserObject(data, 'help', []);
                resolve(data);
            }
        });
    },

    // Handles the 'mentions' command
    mentions: function(params, userId) {
        if(!settings[userId]) settings[userId] = factory.createUserSettingsObject(false, true);
        
        params.shift();

        params = formatter.params(params, ['comments', 'coms', 'c', 'posts', 'p', 'both', 'b']);
        return new Promise(function(resolve, reject) {
            if(params[1] === '') {
                params[1] = settings[userId].steem_account;
                if(!params[1]) {
                    return reject(new Error('You have to specify a username.'));
                }
            }
    
            MongoClient.connect(CONNECTION_STRING, (err, client) => {
                if(!err) {
    
                    const db = client.db('SteemData');
    
                    // If it starts with 'c', it's 'comments', 'coms' or 'c'
                    if(params[2][0] === 'c') getDocsArray(['Comments'], 0, []);
                    // If it starts with 'p', it's 'posts' or 'p'
                    else if(params[2][0] === 'p') getDocsArray(['Posts'], 0, []);
                    // If it doesn't start with 'c' nor 'p', it's both
                    else getDocsArray(['Comments', 'Posts'], 0, []);
    
                    function getDocsArray(types, index, docs) {
                        db.collection(types[index])
                            .find({body: new RegExp('.*@' + params[1] + '.*')})
                            .sort({created: -1})
                            .limit(params[0])
                            .toArray((err, queried) => {
                                if(err) reject(new Error('There was an error querying the SteemData database.'));
                                else {
                                    docs = docs.concat(queried);
                                    if(++index < types.length) getDocsArray(types, index, docs);
                                    else {
                                        client.close();
    
                                        if(docs.length == 0) reject(new Error('No mention. Either the specified user never got mentioned or the user \'' + params[1] + '\' doesn\'t exist.'));
                                        else if(types.length > 1) docs = docs.sort((a, b) => b.created - a.created).slice(0, docs.length > params[0] ? params[0] : docs.length);
    
                                        const arr = [];
                                        for(let i = 0; i < docs.length; i++) {
                                            arr.push((i + 1) + '. @' + docs[i].author + ' mentioned this user in ' + (docs[i].parent_author === '' ? docs[i].title : 'a comment on ' + docs[i].root_title));
                                        }
                                        const text = arr.join('\n');
                                        const data = {array: arr, raw: docs, text: text};
                                        history[userId] = factory.createUserObject(data, 'mentions', params);
                                        resolve(data);
                                    }
                                }
                            });
                    }
                } else reject(new Error('There was an error connecting to the SteemData database.'));
    
            });
        });

    },

    // Handles the 'next' subcommand
    next: function(userId) {
        if(!settings[userId]) settings[userId] = factory.createUserSettingsObject(false, true);
        if(history.hasOwnProperty(userId)) {
            const allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'mentions', 'replies', 'trending'];
            if(allowedCommandNames.includes(history[userId].last_command.name)) {
                const allowedSubcommandNames = ['open'];
                if(allowedSubcommandNames.includes(history[userId].last_subcommand.name)) {
                    return this.open(++history[userId].last_subcommand.param, userId);
                }
            }
        }
    },

    // Handles the 'open' subcommand
    open: function(index, userId) {
        if(!settings[userId]) settings[userId] = factory.createUserSettingsObject(false, true);
        index = index ? index - 1 : 0;
        return new Promise(function(resolve, reject) {
            if(history.hasOwnProperty(userId)) {
                // Checking if the last command supports the 'open' subcommand
                const allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'mentions', 'replies', 'trending'];
                if(allowedCommandNames.includes(history[userId].last_command.name)) {
                    if(index >= 0 && index < history[userId].last_query_result.array.length) {
                        const post = history[userId].last_query_result.raw[index];
                        let payoutline;
                        if('mentions' === history[userId].last_command.name) {
                            payoutLine = post.last_payout.getTime() === 0 ? 'Pending Payout: ' + post.pending_payout_value.amount + '$'
                                                                          : 'Author Payout: ' + post.total_payout_value.amount + '$';
                        } else {
                            payoutLine = new Date(post.last_payout + 'Z') === 0 ? 'Pending Payout: ' + post.pending_payout_value.replace(/ SBD/, '$')
                                                                                : 'Author Payout: ' + post.total_payout_value.replace(/ SBD/, '$');
                        }
                        let text = (post.parent_author === '' ? '' : 'RE: ') + (post.root_title || post.title)
                                 + '\n--------------------'
                                 + '\n' + markdown.parse(post.body, settings[userId].styling)
                                 + '\n--------------------'
                                 + '\n' + payoutLine
                                 + '\n' + post.net_votes + ' upvote' + (post.net_votes !== 1 ? 's' : '') + ', ' + post.children + ' comment' + (post.children !== 1 ? 's' : '');
                        saveSubcommandInformations('open', ++index, userId);
                        resolve(text);
                    } else reject(new Error('The index you specified is either too high or too low.'));
                } else reject(new Error('You can\'t open the result of the previous command.'));
            } else reject(new Error('You must get a list of posts first.'));
        });
    },

    // Handles all the commands that request for posts (except user related ones) since they all have the same request/response structure
    postsCommand: function(fn, params, userId) {
        if(!settings[userId]) settings[userId] = factory.createUserSettingsObject(false, true);

        const command = params.shift().replace(/\//, '');

        params = formatter.params(params);

        let query = {
            tag: params[1],
            limit: params[0]
        }

        return new Promise(function(resolve, reject) {
            fn(query, function(err, res) {
                if(err) reject(err);
                else {
                    const arr = [];
                    const canParse = settings[userId].styling;
                    for(let i = 0; i < res.length; i++) {
                        arr.push((i + 1) + '. @' + res[i].author + (canParse ? markdown.parser.bold(' **posted** ') : ' posted ') + res[i].title);
                    }
                    const text = arr.join('\n');
                    const data = {array: arr, raw: res, text: text};
                    history[userId] = factory.createUserObject(data, command, params);
                    resolve(data);
                }
            });
        });
    },

    // Handles the 'previous' subcommand
    previous: function(userId) {
        if(!settings[userId]) settings[userId] = factory.createUserSettingsObject(false, true);
        if(history.hasOwnProperty(userId)) {
            const allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'mentions', 'replies', 'trending'];
            if(allowedCommandNames.includes(history[userId].last_command.name)) {
                const allowedSubcommandNames = ['open'];
                if(allowedSubcommandNames.includes(history[userId].last_subcommand.name)) {
                    return this.open(--history[userId].last_subcommand.param, userId);
                }
            }
        }
    },

    // Handles the 'replies' command
    replies: function(params, userId) {
        if(!settings[userId]) settings[userId] = factory.createUserSettingsObject(false, true);

        params.shift();

        params = formatter.params(params);
        return new Promise(function(resolve, reject) {
            if(params[1] === '') {
                params[1] = settings[userId].steem_account;
                if(!params[1]) {
                    return reject(new Error('You have to specify a username.'));
                }
            }
    
            steem.api.getRepliesByLastUpdate(params[1], '', params[0], function(err, res) {
                if(err) reject(err);
                else {
                    const arr = [];
                    const canParse = settings[userId].styling;
                    for(let i = 0; i < res.length; i++) {
                        arr.push((i + 1) + '. @' + res[i].author + (canParse ? markdown.parser.bold(' **replied to** ') : ' replied to ') + res[i].root_title);
                    }
                    const text = arr.join('\n');
                    const data = {array: arr, raw: res, text: text};
                    history[userId] = factory.createUserObject(data, 'replies', params);
                    resolve(data);
                }
            });
        });
    },

    // Handles the 'set' command
    set: function(setting, userId, value) {
        if(!settings[userId]) settings[userId] = factory.createUserSettingsObject(false, true);
        return new Promise(function(resolve, reject) {
            // Boolean setting
            if(commands.set.settings.booleans.includes(setting)) {
                saveSettings(setting, !settings[userId][setting], userId);
                resolve('The setting \'' + setting + '\' has been successfully set to \'' + settings[userId][setting] + '\'.')
            // String setting
            } else if(commands.set.settings.strings.hasOwnProperty(setting)) {
                // A value has been passed
                if(value) {
                    saveSettings(setting, value, userId);
                    resolve('The setting \'' + setting + '\' has been successfully set to \'' + value + '\'.');
                // A value has not been passed
                } else reject(new Error('The setting \'' + setting + '\' requires ' + commands.set.settings.strings[setting].required + ' to be specified.'));
            // The parameter is not a setting
            } else {
                reject(new Error('The parameter \'' + setting + '\' is not a setting. Type \'help set\' to get a list of available settings.'));
            }
        });
    },

    // Handles all the comments that request for posts related to a specific user since they all have the same request/response structure
    userRelatedPostsCommand: function(fn, params, userId) {
        if(!settings[userId]) settings[userId] = factory.createUserSettingsObject(false, true);

        const command = params.shift().replace(/\//, '');

        params = formatter.params(params);

        return new Promise(function(resolve, reject) {    
            if(params[1] === '') {
                params[1] = settings[userId].steem_account;
                if(!params[1]) {
                    return reject(new Error('You have to specify a username.'));
                }
            }

            const query = {
                limit: params[0]
            };

            const canParse = settings[userId].styling;
            let inBetween;
            if(commands.comments.keywords.includes(command)) {
                query.start_author = params[1];
                inBetween = canParse ? markdown.parser.bold(' **commented on** ') : ' commented on ';
            } else {
                query.tag = params[1];
                inBetween = canParse ? markdown.parser.bold(' **posted** ') : ' posted ';
            }

            fn(query, function(err, res) {
                if(err) reject(err);
                else {
                    const arr = [];
                    for(let i = 0; i < res.length; i++) {
                        arr.push((i + 1) + '. @' + res[i].author + inBetween + res[i].root_title);
                    }
                    const text = arr.join('\n');
                    const data = {array: arr, raw: res, text: text};
                    history[userId] = factory.createUserObject(data, command, params);
                    resolve(data);
                }
            });
        });
    }

}

// Saves the subcommand informations in the history object
function saveSubcommandInformations(name, param, userId) {
    history[userId].last_subcommand = {
        name: name,
        param: param
    };
}

// Saves new settings in ./data/settings.json and in the settings object
function saveSettings(setting, value, userId) {
    settings[userId][setting] = value;
    // fs.writeFile('./data/settings.json', JSON.stringify(settings), err => {
    //     if(err) console.log(err);
    // });
}

