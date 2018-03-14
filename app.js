const Twit = require('twit');
const steem = require('steem');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');

require('./utils/factory')();
require('./utils/markdownParser')();
const formatter = require('./utils/formatter');

// Authentifying
const twitter = new Twit({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

// Used to check that events are not triggered by the bot
const APP_ID = process.env.APP_ID;
// Twitter allows a max diect message length of 10000 characters per direct message
const MAX_LENGTH = 10000;
// Connection string for MongoDB
const CONNECTION_STRING = 'mongodb://steemit:steemit@mongo1.steemdata.com:27017/SteemData';

const commands = require('./objects/commands.json');

const users = {}

let settings = {}

// Creating a user stream
const stream = twitter.stream('user');

// Reacting to direct messages
stream.on('direct_message', event => {
    // The direct message listener is triggered for messages sent by both the user and the bot
    // We therefore need to verify that the message is from the user
    if(event.direct_message.sender.id_str != APP_ID) processDirectMessage(event.direct_message);
});

// Checks what the command is and calls the appropriate function
function processDirectMessage(dm) {

    const userId = dm.sender.id_str;
    const cmd = dm.text.toLowerCase().replace(/ +/g, ' ').split(' ');

    if(!settings[userId]) settings[userId] = createUserSettingsObject(false, true);
    
    switch(true) {
        // Account
        case commands.account.keywords.includes(cmd[0]):
            handleAccount(userId, cmd[1])
            break;
        // Blog
        case commands.blog.keywords.includes(cmd[0]):
            handleUserRelatedPostsCommand(steem.api.getDiscussionsByBlog, userId, cmd);
            break;
        // Close
        case commands.close.keywords.includes(cmd[0]):
            handleClose(userId);
            break;
        // Comments
        case commands.comments.keywords.includes(cmd[0]):
            handleUserRelatedPostsCommand(steem.api.getDiscussionsByComments, userId, cmd);
            break;
        // Created
        case commands.created.keywords.includes(cmd[0]):
            handlePostsCommand(steem.api.getDiscussionsByCreated, userId, cmd);
            break;
        // Feed
        case commands.feed.keywords.includes(cmd[0]):
            handleUserRelatedPostsCommand(steem.api.getDiscussionsByFeed, userId, cmd);
            break;
        // // Followers
        // case commands.followers.keywords.includes(cmd[0]):
        //     handleFollowers(userId, cmd[1]);
        //     break;
        // // Followees
        // case commands.followees.keywords.includes(cmd[0]):
        //     handleFollowees(userId, cmd[1]);
        //     break;
        // Help
        case commands.help.keywords.includes(cmd[0]):
            handleHelp(userId, cmd[1]);
            break;
        // Hot
        case commands.hot.keywords.includes(cmd[0]):
            handlePostsCommand(steem.api.getDiscussionsByHot, userId, cmd);
            break;
        // Mentions
        case commands.mentions.keywords.includes(cmd[0]):
            handleMentions(userId, cmd);
            break;
        // Next
        case commands.next.keywords.includes(cmd[0]):
            handleNext(userId);
            break;
        // Open
        case commands.open.keywords.includes(cmd[0]):
            handleOpen(userId, cmd[1]);
            break;
        // Previous
        case commands.previous.keywords.includes(cmd[0]):
            handlePrevious(userId);
            break;
        // Replies
        case commands.replies.keywords.includes(cmd[0]):
            handleReplies(userId, cmd);
            break;
        // Set
        case commands.set.keywords.includes(cmd[0]):
            handleSet(userId, cmd[1], cmd[2]);
            break;
        // Trending
        case commands.trending.keywords.includes(cmd[0]):
            handlePostsCommand(steem.api.getDiscussionsByTrending, userId, cmd);
            break;
        // Error || 'Open' shortcut
        default:
            // Check if the command is a number, if it is then it's an 'open' shortcut
            // Else it's a wrong command
            isNaN(cmd[0]) ? handleError(userId, cmd[0]) : handleOpen(userId, cmd[0]);
    }

}

// Handles all the commands that request for posts (except user related ones) since they all have the same request/response structure
function handlePostsCommand(fn, userId, params) {

    const command = params.shift();

    params = setParams(params);

    let query = {
        tag: params[1],
        limit: params[0]
    }

    fn(query, function(err, res) {
        if(err) console.log(err);
        let text = '';
        for(let i = 0; i < res.length; i++) {
            text += (i + 1) + '. ' + res[i].author + parseTo(' posted ', 'bold', settings[userId].styling) + res[i].title + '\n';
        }
        sendDirectMessage(userId, text);
        users[userId] = createUserObject(res, text, command, params);
    });

}

// Handles all the comments that request for posts related to a specific user since they all have the same request/response structure
function handleUserRelatedPostsCommand(fn, userId, params) {

    const command = params.shift();

    params = setParams(params);

    if(params[1] === '') {
        params[1] = settings[userId].steem_account;
        if(!params[1]) {
            sendDirectMessage(userId, 'Error: You have to specify a username.');
            return;
        }
    }

    const query = {
        limit: params[0]
    };

    let inBetween;
    if(commands.comments.keywords.includes(command)) {
        query.start_author = params[1];
        inBetween = parseTo(' commented on ', 'bold', settings[userId].styling);
    } else {
        query.tag = params[1];
        inBetween = parseTo(' posted ', 'bold', settings[userId].styling);
    }

    fn(query, function(err, res) {
        if(err) console.log(err);
        let text = '';
        for(let i = 0; i < res.length; i++) {
            text += (i + 1) + '. @' + res[i].author + inBetween + res[i].root_title + '\n';
        }
        sendDirectMessage(userId, text);
        users[userId] = createUserObject(res, text, command, params);
    });

}

// Handles the 'followers' command
// function handleFollowers(userId, param, startAccount) {

//     if(!param) {
//         param = settings[userId].steem_account;
//         if(!param) {
//             sendDirectMessage(userId, 'Error: You have to specify a username.');
//             return;
//         }
//     }

//     steem.api.getFollowers(param, startAccount, 'blog', 1000, (err, res) => {
//         if(err) console.log(err);
//         else {
//             console.log(res.length);
//             if(res.length == 1000) {
//                 // handleFollowers(userId, param, startAccount);
//             }
//         }
//     });

// }

handleAccount(1, 'ragepeanut');

// Handles the 'account' command
function handleAccount(userId, param) {

    if(!param) {
        if(settings[userId].steem_account) param = settings[userId].steem_account;
        else {
            sendDirectMessage(userId, 'Error: You have to specify a username.');
            return;
        }
    }

    steem.api.getAccounts([param], function(err, res) {
        if(err) console.log(err);
        else {
            const account = res[0];
            account.profile = JSON.parse(account.json_metadata).profile;
            const canParse = false; // settings[userId].styling;
            steem.api.getDynamicGlobalProperties(function(error, global) {
                if(error) console.log(error);
                else {
                    steem.api.getAccountVotes(param, function(votesErr, votes) {
                        if(votesErr) votes = [];
                        steem.api.getAccountHistory(param, -1, 300, async function(historyErr, history) {
                            if(historyErr) history = [];
                            let text = parseTo('Account', 'bold', canParse)
                                     + (account.profile.name ? '\nName: ' + account.profile.name + ' (' + param + ')' : param)
                                     + '\nReputation: ' + formatter.reputation(account.reputation)
                                     + (account.profile.about ? '\nAbout: ' + account.profile.about : '')
                                     + '\nAge: '
                                     + (account.profile.location ? '\nLocation: ' + account.profile.location : '')
                                     + (account.profile.website || account.profile.github || account.profile.twitter ? '\n\n' + parseTo('Links', 'bold', canParse) : '')
                                     + (account.profile.website ? '\nWebsite: ' + account.profile.website : '')
                                     + (account.profile.github ? '\nGitHub: https://github.com/' + account.profile.github : '')
                                     + (account.profile.twitter ? '\nTwitter: https://twitter.com/' + account.profile.twitter : '')
                                     + '\n\n' + parseTo('Donations', 'bold', canParse)
                                     + (account.profile.bitcoin ? '\nBitcoin: ' + account.profile.bitcoin : '')
                                     + (account.profile.ethereum ? '\nEthereum: ' + account.profile.ethereum : '')
                                     + '\nSteem: ' + param
                                     + '\n\n' + parseTo('Voting', 'bold', canParse)
                                     + '\nVoting Weight: '
                                     + '\nVoting Power: ' + account.voting_power / 100  + '%'
                                     + '\nBandwith Remaining: '
                                     + '\nVote Count: ' + votes.length + ' votes'
                                     + '\nVote Count (24 hours): ' + votes.filter(vote => Date.now() - new Date(vote.time) <= 24 * 60 * 60 * 1000).length + ' votes'
                                     + '\n\n' + parseTo('Posting', 'bold', canParse)
                                     + '\nPost Count: ' + account.post_count  + ' posts'
                                     + '\nPost Count (24 hours): ' + history.filter(trx => Date.now() - new Date(trx[1].timestamp) <= 24 * 60 * 60 * 1000 && trx[1].op[0] === 'comment' && trx[1].op[1].author === param && !/@@ -\d+,?\d+ \+\d+,?\d+ @@/.test(trx[1].op[1].body)).length + ' posts'
                                     + '\n\n' + parseTo('Wallet', 'bold', canParse)
                                     + '\nAccount Value: ' + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(await steem.formatter.estimateAccountValue(account))
                                     + '\nBalance: ' + account.balance  + ' / ' + account.sbd_balance
                                     + '\nSteem Power: ' + steem.formatter.vestToSteem(account.vesting_shares, global.total_vesting_shares, global.total_vesting_fund_steem).toFixed(2) + ' STEEM'
                                     + '\nSavings: ' + account.savings_balance + ' / ' + account.savings_sbd_balance
                                     + '\n\n' + parseTo('Witnesses', 'bold', canParse)
                                     + '\nWitness Vote Count: ' + account.witnesses_voted_for
                                     + '\nWitness Votes: ' + account.witness_votes.join(', ');       
                            console.log(text);
                        });
                    }); 
                }

            })
        }
    })

}

// Handles the 'mentions' command
function handleMentions(userId, params) {

    params.shift();

    params = setParams(params, ['comments', 'coms', 'c', 'posts', 'p', 'both', 'b']);

    if(params[1] === '') {
        params[1] = settings[userId].steem_account;
        if(!params[1]) {
            sendDirectMessage(userId, 'Error: You have to specify a username.');
            return;
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
                        if(err) {
                            sendDirectMessage(userId, 'Error: There was an error querying the SteemData database.');
                            return;
                        } else {
                            docs = docs.concat(queried);
                            if(++index < types.length) getDocsArray(types, index, docs);
                            else {
                                client.close();

                                if(docs.length == 0) {
                                    sendDirectMessage(userId, 'No mention. Either the specified user never got mentioned or the user \'' + params[1] + '\' doesn\'t exist.');
                                    return;
                                } else docs = docs.sort((a, b) => b.created - a.created).slice(0, docs.length > params[0] ? params[0] : docs.length);

                                let text = '';
                                for(let i = 0; i < docs.length; i++) {
                                    text += (i + 1) + '. @' + docs[i].author + parseTo(' mentioned this user in a ', 'bold', settings[userId].styling) + (docs[i].parent_author === '' ? parseTo('post ', 'bold', settings[userId].styling) + '(' + docs[i].title  + ')'
                                                                                                                                           : parseTo('comment on ', 'bold', settings[userId].styling) + docs[i].root_title) + '\n';
                                }
                                sendDirectMessage(userId, text);
                                users[userId] = createUserObject(docs, text, 'mentions', params);
                            }
                        }
                    });
            }
        } else sendDirectMessage(userId, 'Error: There was an error connecting to the SteemData database.');

    });

}

// Handles the 'replies' command
function handleReplies(userId, params) {

    params.shift();

    params = setParams(params);

    if(params[1] === '') {
        params[1] = settings[userId].steem_account;
        if(!params[1]) {
            sendDirectMessage(userId, 'Error: You have to specify a username.');
            return;
        }
    }

    steem.api.getRepliesByLastUpdate(params[1], '', params[0], function(err, res) {
        if(err) console.log(err);
        let text = '';
        for(let i = 0; i < res.length; i++) {
            text += (i + 1) + '. @' + res[i].author + parseTo(' replied to ', 'bold', settings[userId].styling) + res[i].root_title + '\n';
        }
        sendDirectMessage(userId, text);
        users[userId] = createUserObject(res, text, 'replies', params);
    });

}

// Handles the 'close' subcommand
function handleClose(userId) {
    if(users.hasOwnProperty(userId)) {
        const allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'replies', 'trending'];
        if(allowedCommandNames.includes(users[userId].last_command.name)) {
            const allowedSubcommandNames = ['open'];
            if(allowedSubcommandNames.includes(users[userId].last_subcommand.name)) {
                sendDirectMessage(userId, users[userId].last_query_result.text);
                users[userId].last_subcommand = {name: '', param: ''};
            }
        }
    }
}

// Handles an error generated when no command is matched
function handleError(userId, command) {
    sendDirectMessage(
        userId,
        'The command \'' + command + '\' doesn\'t exist.\nPlease, write \'help\' to get a list of existing commands.'
    );
}

// Handles the 'help' command
function handleHelp(userId, command) {

    let response = '';
    const lineBreak = '\n--------------------';
    if(command){
        if(!commands[command]) {
            handleError(userId, command);
            return;
        }
        response = commands[command].desc_start.concat(lineBreak, '\nUse this command through one of these keywords:\n', commands[command].keywords.map(keyword => parseTo(keyword, 'bold', settings[userId].styling)).join(', '), lineBreak);
        if(commands[command].params.length > 0) {
            response = response.concat('\nParameters:');
            commands[command].params.forEach(param => {
                response = response.concat('\n- ', parseTo(param.name, 'bold', settings[userId].styling), ' : ', param.text);
            });
        } else response = response.concat('\nThere is no parameters available.')
        response = response.concat(commands[command].desc_end === '' ? '' : lineBreak, commands[command].desc_end);
    } else {
        response = 'Here is a list of existing commands:'
        const keys = Object.keys(commands);
        for(let i = 0; i < keys.length; i++){
            response = response.concat('\n- ', parseTo(keys[i], 'bold', settings[userId].styling), ' : ', commands[keys[i]].quick_desc);
            if(commands[keys[i]].important_param) response = response.concat('\n- ', parseTo(keys[i], 'bold', settings[userId].styling), ' ', parseTo(commands[keys[i]].important_param.name, 'bold', settings[userId].styling), ' : ', commands[keys[i]].important_param.text);
        }
        response = response.concat(lineBreak, '\nIf you can\'t see the commands names, type \'set styling false\'.');
    }
    sendDirectMessage(userId,response);

}

// Handles the 'set' command
function handleSet(userId, setting, value) {
    // Boolean setting
    if(commands.set.settings.booleans.includes(setting)) {
        saveSettings(userId, setting, !settings[userId][setting]);
        sendDirectMessage(userId, 'The setting \'' + setting + '\' has been successfully set to \'' + settings[userId][setting] + '\'.')
    // String setting
    } else if(commands.set.settings.strings.hasOwnProperty(setting)) {
        // A value has been passed
        if(value) {
            saveSettings(userId, setting, value);
            sendDirectMessage(userId, 'The setting \'' + setting + '\' has been successfully set to \'' + value + '\'.');
        // A value has not been passed
        } else sendDirectMessage(userId, 'The setting \'' + setting + '\' requires ' + commands.set.settings.strings[setting].required + ' to be specified.');
    // The parameter is not a setting
    } else {
        sendDirectMessage(userId, 'The parameter \'' + setting + '\' is not a setting. Type \'help set\' to get a list of available settings.');
    }
}

// Handles the 'next' subcommand
function handleNext(userId) {
    if(users.hasOwnProperty(userId)) {
        const allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'mentions', 'replies', 'trending'];
        if(allowedCommandNames.includes(users[userId].last_command.name)) {
            const allowedSubcommandNames = ['open'];
            if(allowedSubcommandNames.includes(users[userId].last_subcommand.name)) {
                handleOpen(userId, ++users[userId].last_subcommand.param);
            }
        }
    }
}

// Handles the 'previous' subcommand
function handlePrevious(userId) {
    if(users.hasOwnProperty(userId)) {
        const allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'mentions', 'replies', 'trending'];
        if(allowedCommandNames.includes(users[userId].last_command.name)) {
            const allowedSubcommandNames = ['open'];
            if(allowedSubcommandNames.includes(users[userId].last_subcommand.name)) {
                handleOpen(userId, --users[userId].last_subcommand.param);
            }
        }
    }
}

// Handles the 'open' subcommand
function handleOpen(userId, index) {
    index = index ? index - 1 : 0;
    if(users.hasOwnProperty(userId)) {
        // Checking if the last command supports the 'open' subcommand
        const allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'mentions', 'replies', 'trending'];
        if(allowedCommandNames.includes(users[userId].last_command.name)) {
            if(index >= 0 && index < users[userId].last_query_result.array.length) {
                const post = users[userId].last_query_result.array[index];
                let payoutline, postTitle;
                if(['mentions', 'replies'].includes(users[userId].last_command.name)) {
                    payoutLine = post.last_payout.getTime() === 0 ? 'Pending Payout: ' + post.pending_payout_value.amount + '$'
                                                                  : 'Author Payout: ' + post.total_payout_value.amount + '$';
                    postTitle = 'RE: ' + post.root_title;
                } else {
                    payoutLine = post.last_payout === '1970-01-01T00:00:00' ? 'Pending Payout: ' + post.pending_payout_value.replace(/ SBD/, '$')
                                                                            : 'Author Payout: ' + post.total_payout_value.replace(/ SBD/, '$'); 
                    postTitle = post.title;
                }
                let text = postTitle
                           + '\n--------------------'
                           + '\n' + parse(post.body, settings[userId].styling)
                           + '\n--------------------'
                           + '\n' + payoutLine
                           + '\n' + post.net_votes + ' upvote' + (post.net_votes !== 1 ? 's' : '') + ', ' + post.children + ' comment' + (post.children !== 1 ? 's' : '');
                sendDirectMessage(userId, text);
                saveSubcommand(userId, 'open', ++index);
            }
        }
    }
}

// Saves the subcommand informations in the users object
function saveSubcommand(userId, name, param) {
    users[userId].last_subcommand = {
        name: name,
        param: param
    };
}

// Returns a correct params array
function setParams(params, allowedLastParamValues) {

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

}

// Sends a direct message to the user
async function sendDirectMessage(userId, text) {
    // Splitting the string into multiple messages if it's too long
    if(text.length > MAX_LENGTH) {
        twitter.post('direct_messages/events/new', createDirectMessageObject(userId, text.substr(0, MAX_LENGTH)), () => {
            sendDirectMessage(userId, text.substr(MAX_LENGTH, text.length - MAX_LENGTH));
        });
    } else {
        twitter.post('direct_messages/events/new', createDirectMessageObject(userId, text));
    }
}

// Gets the settings previously saved in ./data/settings.json and saves them in the settings object
function getSettings() {
    fs.readFile('./data/settings.json', 'utf-8', (err, data) => {
        if(err) {
            fs.writeFile('./data/settings.json', JSON.stringify(settings), err => {
                if(err) console.log(err);
            });
        } else {
            settings = JSON.parse(data);
        }
    });
}

// Saves new settings in ./data/settings.json and in the settings object
function saveSettings(userId, setting, value) {
    settings[userId][setting] = value;
    fs.writeFile('./data/settings.json', JSON.stringify(settings), err => {
        if(err) console.log(err);
    });
}

getSettings();

console.log('App is running');