var Twit = require('twit');
var steem = require('steem');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');

require('./utils/factory')();
require('./utils/markdownParser')();

// Authentifying
var twitter = new Twit({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

// Used to check that events are not triggered by the bot
var APP_ID = process.env.APP_ID;
// Twitter allows a max diect message length of 10000 characters per direct message
var MAX_LENGTH = 10000;
// Connection string for MongoDB
var CONNECTION_STRING = 'mongodb://steemit:steemit@mongo1.steemdata.com:27017/SteemData';

var commands = {
    blog: {
        desc_end: '\nThese parameters can be used together. No specific order is required.',
        desc_start: 'This command prints the last 10 posts you\'ve made.',
        keywords: [
            'blog',
            'b'
        ],
        params: [
            {
                name: 'quantity',
                text: 'lets you decide the quantity of posts being printed.'
            },
            {
                name: 'user',
                text: 'lets you decide which user the blog should be from.'
            }
        ],
        quick_desc: 'prints the last posts you\'ve made.'
    },
    close: {
        desc_end: '',
        desc_start: 'This subcommand closes an opened post and reprints the list of posts previously printed.',
        keywords: [
            'close',
            'back',
            'x'
        ],
        params: [],
        quick_desc: 'closes an opened post.'
    },
    comments: {
        desc_end: '\nThese parameters can be used together. No specific order is required.',
        desc_start: 'This command prints the last 10 comments you\'ve made.',
        keywords: [
            'comments',
            'coms',
            'co'
        ],
        params: [
            {
                name: 'quantity',
                text: 'lets you decide the quantity of comments being printed.'
            },
            {
                name: 'user',
                text: 'lets you decide which user the comments should be from.'
            }
        ],
        quick_desc: 'prints the last comments you\'ve made.'
    },
    created: {
        desc_end: '\nThese parameters can be used together. No specific order is required.',
        desc_start: 'This command prints the last 10 posts created.',
        keywords: [
            'created',
            'new',
            'last',
            'latest',
            'c'
        ],
        params: [
            {
                name: 'quantity',
                text: 'lets you decide the quantity of posts being printed.'
            },
            {
                name: 'tag',
                text: 'lets you choose a specific tag the posts must have.'
            }
        ],
        quick_desc: 'prints the last created posts.'
    },
    feed: {
        desc_end: '\nThese parameters can be used together. No specific order is required.',
        desc_start: 'This command prints the 10 latest posts from your feed.',
        keywords: [
            'feed',
            'f'
        ],
        params: [
            {
                name: 'quantity',
                text: 'lets you decide the quantity of posts being printed.'
            },
            {
                name: 'user',
                text: 'lets you decide which user the feed should be from.'
            }
        ],
        quick_desc: 'prints the last posts from your feed.'
    },
    help: {
        desc_end: '',
        desc_start: 'This command prints a list of all the existing commands.',
        keywords: [
            'help'
        ],
        important_param: {
            name: 'command',
            text: 'prints a more in depth explanation for a given command.'
        },
        params: [
            {
                name: 'command',
                text: 'prints a more in depth explanation for a given command.'
            }
        ],
        quick_desc: 'prints a list of existing commands.'
    },
    hot: {
        desc_end: '\nThese parameters can be used together. No specific order is required.',
        desc_start: 'This command prints the 10 hotted posts.',
        keywords: [
            'hot',
            'h'
        ],
        params: [
            {
                name: 'quantity',
                text: 'lets you decide the quantity of posts being printed.'
            },
            {
                name: 'tag',
                text: 'lets you choose a specific tag the posts must have.'
            }
        ],
        quick_desc: 'prints the hottest posts.'
    },
    next: {
        desc_end: '',
        desc_start: 'This subcommand prints the post that comes after the currently opened post in a list of posts previously printed.',
        keywords: [
            'next',
            'nxt',
            'n'
        ],
        params: [],
        quick_desc: 'opens the post following a currently opened post.'
    },
    open: {
        desc_end: '\nThis subcommand works with results obtained from the following commands: blog, comments, created, feed, hot, replies, trending.',
        desc_start: 'This subcommand prints any chosen post from a list of posts. If no index is specified, the first post will be printed. Writing \'open\' is not required, just writing the index is enough.',
        keywords: [
            'open',
            'o'
        ],
        params: [
            {
                name: 'index',
                text: 'lets you decide which post to open by specifying its index from a previously generated list of posts.'
            }
        ],
        quick_desc: 'opens a post from a previously generated list of posts.'
    },
    previous: {
        desc_end: '',
        desc_start: 'This subcommand prints the post that comes before the currently opened post in a list of posts previously printed.',
        keywords: [
            'previous',
            'prev',
            'p'
        ],
        params: [],
        quick_desc: 'opens the post preceding a currently opened post.'
    },
    replies: {
        desc_end: '\nThese parameters can be used together. No specific order is required.',
        desc_start: 'This command prints the 10 latest replies to your posts and comments.',
        keywords: [
            'replies',
            'r'
        ],
        params: [
            {
                name: 'quantity',
                text: 'lets you decide the quantity of replies being printed.'
            },
            {
                name: 'user',
                text: 'lets you decide to which user the replies should be.'
            }
        ],
        quick_desc: 'prints the last replies to your posts and comments.'
    },
    set: {
        desc_end: '\nThese parameters must be used separetely and, contrary to all other commands, their name must be written. Don\'t forget to write a value after those parameters !',
        desc_start: 'This command lets you change your settings.',
        keywords: [
            'set',
            'settings',
            's'
        ],
        params: [
            {
                name: 'steem_account',
                text: 'sets a default Steem account so you don\'t have to type it when looking at your blog, feed, comments and replies. This parameter must be followed by a Steem username.'
            },
            {
                name: 'styling',
                text: 'switches the text styling (bold and italic) on or off. This parameter can be followed by \'true\' (for \'on\') or \'false\' (for \'off\'). If no value is given, it will simply switch its state.'
            }
        ],
        quick_desc: 'lets the user change his settings.'
    },
    trending: {
        desc_end: '\nThese parameters can be used together. No specific order is required.',
        desc_start: 'This command prints the 10 most trending posts.',
        keywords: [
            'trending',
            't'
        ],
        params: [
            {
                name: 'quantity',
                text: 'lets you decide the quantity of posts being printed.'
            },
            {
                name: 'tag',
                text: 'lets you choose a specific tag the posts must have.'
            }
        ],
        quick_desc: 'prints the most trending posts.'
    }
}

var users = {}

var settings = {}

// Creating a user stream
var stream = twitter.stream('user');

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

    var userId = dm.sender.id;
    var cmd = dm.text.toLowerCase().replace(/ +/g, ' ').split(' ');

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

    var command = params.shift();

    params = setParams(params);

    var query = {
        tag: params[1],
        limit: params[0]
    };

    fn(query, function(err, res) {
        if(err) console.log(err);
        var text = '';
        for(var i = 0; i < res.length; i++) {
            text += (i + 1) + '. ' + res[i].author + ' : ' + res[i].title + '\n';
        }
        sendDirectMessage(userId, text);
        users[userId] = createUserObject(res, text, command, params);
    });

}

// Handles all the comments that request for posts related to a specific user since they all have the same request/response structure
function handleUserRelatedPostsCommand(fn, userId, params) {

    var command = params.shift();

    params = setParams(params);

    if(params[1] === '') {
        params[1] = settings[userId].steem_account;
        if(!params[1]) {
            sendDirectMessage(userId, 'Error: You have to specify a username.');
            return;
        }
    }

    var query = {
        tag: params[1],
        limit: params[0]
    };

    fn(query, function(err, res) {
        if(err) console.log(err);
        var text = '';
        for(var i = 0; i < res.length; i++) {
            text += (i + 1) + '. ' + res[i].author + ' : ' + res[i].title + '\n';
        }
        sendDirectMessage(userId, text);
        users[userId] = createUserObject(res, text, command, params);
    });

}

// Handles the 'comments' command
function handleComments(userId, param1, param2) {

    var params = setParams([param1, param2]);

    if(params[1] === '') {
        params[1] = settings[userId].steem_account;
        if(!params[1]) {
            sendDirectMessage(userId, 'Error: You have to specify a username.');
            return;
        }
    }

    MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if(!err) {
            var db = client.db('SteemData');
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
                        var text = '';
                        for(var i = 0; i < docs.length; i++) {
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

    var params = setParams([param1, param2]);

    if(params[1] === '') {
        params[1] = settings[userId].steem_account;
        if(!params[1]) {
            sendDirectMessage(userId, 'Error: You have to specify a username.');
            return;
        }
    }

    MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if(!err) {
            var db = client.db('SteemData');
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
                        var text = '';
                        for(var i = 0; i < docs.length; i++) {
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
        var allowedCommandNames = ['blog', 'created', 'feed', 'hot', 'trending'];
        if(allowedCommandNames.includes(users[userId].last_command.name)) {
            var allowedSubcommandNames = ['open'];
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

    var response = '';
    var lineBreak = '\n--------------------';
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
        var keys = Object.keys(commands);
        for(var i = 0; i < keys.length; i++){
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

// Handles the 'next' subcommand
function handleNext(userId) {
    if(users.hasOwnProperty(userId)) {
        var allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'replies', 'trending'];
        if(allowedCommandNames.includes(users[userId].last_command.name)) {
            var allowedSubcommandNames = ['open'];
            if(allowedSubcommandNames.includes(users[userId].last_subcommand.name)) {
                handleOpen(userId, ++users[userId].last_subcommand.param);
            }
        }
    }
}

// Handles the 'previous' subcommand
function handlePrevious(userId) {
    if(users.hasOwnProperty(userId)) {
        var allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'replies', 'trending'];
        if(allowedCommandNames.includes(users[userId].last_command.name)) {
            var allowedSubcommandNames = ['open'];
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
        var allowedCommandNames = ['blog', 'comments', 'created', 'feed', 'hot', 'replies', 'trending'];
        if(allowedCommandNames.includes(users[userId].last_command.name)) {
            if(index >= 0 && index < users[userId].last_query_result.array.length) {
                var post = users[userId].last_query_result.array[index];
                if(['comments', 'replies'].includes(users[userId].last_command.name)) {
                    var payoutLine = post.last_payout.getTime() === 0 ? 'Pending Payout: ' + post.pending_payout_value.amount + '$'
                                                                      : 'Author Payout: ' + post.total_payout_value.amount + '$';
                    var postTitle = 'RE: ' + post.root_title;
                } else {
                    var payoutLine = post.last_payout === '1970-01-01T00:00:00' ? 'Pending Payout: ' + post.pending_payout_value.replace(/ SBD/, '$')
                                                                                : 'Author Payout: ' + post.total_payout_value.replace(/ SBD/, '$'); 
                    var postTitle = post.title;
                }
                var text = postTitle
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