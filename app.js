const Twit = require('twit');
const steem = require('steem');
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');

require('./utils/factory')();
require('./utils/markdownParser')();

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

// Following any user following the account
stream.on('follow', event => {
    // The follow listener is triggered for the bot and the user
    // We therefore need to verify that the follow is from an user
    if(event.source.id != APP_ID) follow(event.source.id);
});

// Reacting to direct messages
stream.on('direct_message', event => {
    // The direct message listener is triggered for messages sent by both the user and the bot
    // We therefore need to verify that the message is from the user
    if(event.direct_message.sender.id != APP_ID) processDirectMessage(event.direct_message);
});

// Follows an user based on his id
function follow(userId) {
    twitter.post('friendships/create', {user_id: userId, follow: true}, error => {
        if(error) console.log(error);
    });
}

// Checks what the command is and calls the appropriate function
function processDirectMessage(dm) {

    const userId = dm.sender.id;
    const cmd = dm.text.toLowerCase().replace(/ +/g, ' ').split(' ');

    if(!settings[userId]) settings[userId] = createUserSettingsObject(false, true);
    
    switch(true) {
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
            handleComments(userId, cmd[1], cmd[2]);
            break;
        // Created
        case commands.created.keywords.includes(cmd[0]):
            handlePostsCommand(steem.api.getDiscussionsByCreated, userId, cmd);
            break;
        // Feed
        case commands.feed.keywords.includes(cmd[0]):
            handleUserRelatedPostsCommand(steem.api.getDiscussionsByFeed, userId, cmd);
            break;
        // Help
        case commands.help.keywords.includes(cmd[0]):
            handleHelp(userId, cmd[1]);
            break;
        // Hot
        case commands.hot.keywords.includes(cmd[0]):
            handlePostsCommand(steem.api.getDiscussionsByHot, userId, cmd);
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
            handleReplies(userId, cmd[1], cmd[2]);
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

    const query = {
        tag: params[1],
        limit: params[0]
    };

    fn(query, function(err, res) {
        if(err) console.log(err);
        let text = '';
        for(let i = 0; i < res.length; i++) {
            text += (i + 1) + '. ' + res[i].author + ' : ' + res[i].title + '\n';
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
        tag: params[1],
        limit: params[0]
    };

    fn(query, function(err, res) {
        if(err) console.log(err);
        let text = '';
        for(let i = 0; i < res.length; i++) {
            text += (i + 1) + '. ' + res[i].author + ' : ' + res[i].title + '\n';
        }
        sendDirectMessage(userId, text);
        users[userId] = createUserObject(res, text, command, params);
    });

}

// Handles the 'comments' command
function handleComments(userId, param1, param2) {

    const params = setParams([param1, param2]);

    if(params[1] === '') {
        params[1] = settings[userId].steem_account;
        if(!params[1]) {
            sendDirectMessage(userId, 'Error: You have to specify a username.');
            return;
        }
    }

    MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if(!err) {
            const db = client.db('SteemData');
            db.collection('Comments')
                .find({author: params[1]})
                .sort({created: -1})
                .limit(params[0])
                .toArray(function(err, docs) {
                    client.close();
                    if(!err) {
                        if(docs.length === 0) {
                            sendDirectMessage(userId, 'No comment. Either the specified user never commented or the user \'' + params[1] + '\' doesn\'t exist.');
                        }
                        let text = '';
                        for(let i = 0; i < docs.length; i++) {
                            text += (i + 1) + '. @' + docs[i].author + parseTo(' replied to ', 'bold', settings[userId].styling) + docs[i].root_title + '\n';
                        }
                        sendDirectMessage(userId, text);
                        users[userId] = createUserObject(docs, text, 'comments', params);
                    }
                });
        }
    });

}

// Handles the 'replies' command
function handleReplies(userId, param1, param2) {

    const params = setParams([param1, param2]);

    if(params[1] === '') {
        params[1] = settings[userId].steem_account;
        if(!params[1]) {
            sendDirectMessage(userId, 'Error: You have to specify a username.');
            return;
        }
    }

    MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if(!err) {
            const db = client.db('SteemData');
            db.collection('Comments')
                .find({parent_author: params[1]})
                .sort({created: -1})
                .limit(params[0])
                .toArray(function(err, docs) {
                    client.close();
                    if(!err) {
                        if(docs.length === 0) {
                            sendDirectMessage(userId, 'No reply. Either the specified user never got any reply or the user \'' + params[1] + '\' doesn\'t exist.');
                        }
                        let text = '';
                        for(let i = 0; i < docs.length; i++) {
                            text += (i + 1) + '. @' + docs[i].author + parseTo(' replied to ', 'bold', settings[userId].styling) + docs[i].root_title + '\n';
                        }
                        sendDirectMessage(userId, text);
                        users[userId] = createUserObject(docs, text, 'replies', params);
                    }
                });
         }
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
    // Checking if the setting received is a real setting
    if(settings[userId].hasOwnProperty(setting)) {
        // If no value has been typed
        if(!value) {
            if(setting === 'steem_account') sendDirectMessage(userId, 'The steem_account setting requires a username to be specified.');
            else {
                saveSettings(userId, setting, !settings[userId][setting]);
                sendDirectMessage(userId, 'The setting \'' + setting + '\' has been successfully set to \'' + settings[userId][setting] + '\'.');
            }
        } else {
            if(setting === 'steem_account') saveSettings(userId, setting, value);
            else {
                // Checking if the value is not a 'false' string and making it a boolean
                value = value !== 'false';
                saveSettings(userId, setting, value);
            }
            sendDirectMessage(userId, 'The setting \'' + setting + '\' has been successfully set to \'' + settings[userId][setting] + '\'.');
        }
    } else {
        sendDirectMessage(userId, 'The parameter \'' + setting + '\' is not a setting. Type \'help set\' to get a list of available settings.');
    }
}

// Handles the 'set' command
function handleSet(userId, setting, value) {
    // Checking if the setting received is a real setting
    if(settings[userId].hasOwnProperty(setting)) {
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
}

// Handles the 'next' subcommand
function handleNext(userId) {
    if(users.hasOwnProperty(userId)) {
        const allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'replies', 'trending'];
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
        const allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'replies', 'trending'];
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
        const allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'replies', 'trending'];
        if(allowedCommandNames.includes(users[userId].last_command.name)) {
            if(index >= 0 && index < users[userId].last_query_result.array.length) {
                const post = users[userId].last_query_result.array[index];
                let payoutline, postTitle;
                if(['comments', 'replies'].includes(users[userId].last_command.name)) {
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
function setParams(params) {
    // If no params have been specified, set those params to default
    if(!params || params.length === 0) {
        params = [10, ''];
    } else {
        // If only one param exists, check which param it is and set the other one to default
        if(!params[1]) {
            // If the param is the tag
            if(isNaN(params[0])) {
                params = [10, params[0]];
            // Else it must be the quantity
            } else {
                params = [parseInt(params[0]), ''];
            }
        // If all params exist, check if they are in the right order
        } else if(isNaN(params[0])) {
            params = [parseInt(params[1]), params[0]];
        // If everything is ok, parse the quantity string to an int
        } else {
            params[0] = parseInt(params[0]);
        }
    }
    return params;

}

// Sends a direct message to the user
async function sendDirectMessage(userId, text) {
    // Splitting the string into multiple messages if it's too long
    if(text.length > MAX_LENGTH) {
        twitter.post('direct_messages/events/new', createDirectMessageObject(userId,text.substr(0, MAX_LENGTH)), () => {
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