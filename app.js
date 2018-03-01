var Twit = require('twit');
var steem = require('steem');
var MongoClient = require('mongodb').MongoClient;

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
    
    switch(true) {
        case commands.blog.keywords.includes(cmd[0]):
            handlePostsCommand(steem.api.getDiscussionsByBlog, userId, cmd);
            break;
        case commands.close.keywords.includes(cmd[0]):
            handleClose(userId);
            break;
        case commands.comments.keywords.includes(cmd[0]):
            handleComments(userId, cmd[1], cmd[2]);
            break;
        case commands.created.keywords.includes(cmd[0]):
            handlePostsCommand(steem.api.getDiscussionsByCreated, userId, cmd);
            break;
        case commands.feed.keywords.includes(cmd[0]):
            handlePostsCommand(steem.api.getDiscussionsByFeed, userId, cmd);
            break;
        case commands.help.keywords.includes(cmd[0]):
            handleHelp(userId, cmd[1]);
            break;
        case commands.hot.keywords.includes(cmd[0]):
            handlePostsCommand(steem.api.getDiscussionsByHot, userId, cmd);
            break;
        case commands.next.keywords.includes(cmd[0]):
            handleNext(userId);
            break;
        case commands.open.keywords.includes(cmd[0]):
            handleOpen(userId, cmd[1]);
            break;
        case commands.previous.keywords.includes(cmd[0]):
            handlePrevious(userId);
            break;
        case commands.replies.keywords.includes(cmd[0]):
            handleReplies(userId, cmd[1], cmd[2])
            break;
        case commands.trending.keywords.includes(cmd[0]):
            handlePostsCommand(steem.api.getDiscussionsByTrending, userId, cmd);
            break;
        default:
            // Check if the command is a number, if it is then it's an 'open' shortcut
            // Else it's a wrong command
            isNaN(cmd[0]) ? handleError(userId, cmd[0]) : handleOpen(userId, cmd[0]);
    }

}

// Handles all the commands that request for posts since they all have the same request/response structure
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

// Handles the 'comments' command
function handleComments(userId, param1, param2) {

    var params = setParams([param1, param2]);

    if(params[1] === '') {
        sendDirectMessage(userId, 'Error: You have to specify a username.');
        return;
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
                            text += (i + 1) + '. @' + docs[i].author + parseTo(' replied to ', 'bold') + docs[i].root_title + '\n';
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
        sendDirectMessage(userId, 'Error: You have to specify a username.'); 
        return;
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
                            text += (i + 1) + '. @' + docs[i].author + parseTo(' replied to ', 'bold') + docs[i].root_title + '\n';
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
    if(command){
        var lineBreak = '\n--------------------';
        if(!commands[command]) {
            handleError(userId, command);
            return;
        }
        response = commands[command].desc_start.concat(lineBreak, '\nUse this command through one of these keywords:\n', commands[command].keywords.map(keyword => parseTo(keyword, 'bold')).join(', '), lineBreak);
        if(commands[command].params.length > 0) {
            response = response.concat('\nParameters:');
            commands[command].params.forEach(param => {
                response = response.concat('\n- ', parseTo(param.name, 'bold'), ' : ', param.text);
            });
        } else response = response.concat('\nThere is no parameters available.')
        respone = response.concat(commands[command].desc_end === '' ? '' : lineBreak, commands[command].desc_end);
    } else {
        response = 'Here is a list of existing commands:'
        var keys = Object.keys(commands);
        for(var i = 0; i < keys.length; i++){
            response = response.concat('\n- ', parseTo(keys[i], 'bold'), ' : ', commands[keys[i]].quick_desc);
            if(commands[keys[i]].important_param) response = response.concat('\n- ', parseTo(keys[i], 'bold'), ' ', parseTo(commands[keys[i]].important_param.name, 'bold'), ' : ', commands[keys[i]].important_param.text);
        }
    }
    sendDirectMessage(userId,response);

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
                           + '\n' + parse(post.body)
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

// Return a correct params array
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

// Creates a Direct Message Object
function createDirectMessageObject(userId, text) {
    return {
        event: {
            type: 'message_create',
            message_create: {
                target: {
                    recipient_id: userId
                },
                message_data: {
                    text: text
                }
            }
        }
    }
}

// Creates an User Object
function createUserObject(result_array, result_text, cmd_name, cmd_params) {
    return {
        last_query_result: {
            array: result_array,
            text: result_text
        },
        last_command: {
            name: cmd_name,
            params: cmd_params
        },
        last_subcommand: {
            name: '',
            param: ''
        }
    }
}

console.log('App is running');