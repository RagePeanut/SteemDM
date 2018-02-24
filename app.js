var Twit = require('twit');
var steem = require('steem');

// Authentifying
var twitter = new Twit({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

// Used to check that events are not triggered by the bot
var APP_ID = process.env.APP_ID;

var commands = {
    blog: {
        desc_end: '\nThese parameters can be used together. No specific order is required.',
        desc_start: 'This command prints the last 10 posts you\'ve made.',
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
        params: [],
        quick_desc: 'closes an opened post.'
    },
    comments: {
        desc_end: '\nThese parameters can be used together. No specific order is required.',
        desc_start: 'NOT AVAILABLE YET. This command prints the last 10 comments you\'ve made.',
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
        quick_desc: 'prints the last comments you\'ve made (not available yet).'
    },
    created: {
        desc_end: '\nThese parameters can be used together. No specific order is required.',
        desc_start: 'This command prints the last 10 posts created.',
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
        params: [],
        quick_desc: 'opens the post following a currently opened post.'
    },
    open: {
        desc_end: '\nThis subcommand works with results obtained from the following commands: blog, comments, created, feed, hot, replies, trending.',
        desc_start: 'This subcommand prints any chosen post from a list of posts. If no index is specified, the first post will be printed.',
        params: [
            {
                name: 'index',
                text: 'lets you decide which post to open by specifying its index from a previously generated list of posts.'
            }
        ],
        quick_desc: 'opens a post from a previously generated list of posts.'
    },
    replies: {
        desc_end: '\nThese parameters can be used together. No specific order is required.',
        desc_start: 'NOT AVAILABLE YET. This command prints the 10 latest replies to your posts and comments.',
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
        quick_desc: 'prints the last replies to your posts and comments (not available yet).'
    },
    trending: {
        desc_end: '\nThese parameters can be used together. No specific order is required.',
        desc_start: 'This command prints the 10 most trending posts.',
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
    
    switch(cmd[0]) {
        case 'blog':
            handlePostsCommand(steem.api.getDiscussionsByBlog, userId, cmd);
            break;
        case 'close':
            handleClose(userId);
            break;
        case 'created':
            handlePostsCommand(steem.api.getDiscussionsByCreated, userId, cmd);
            break;
        case 'feed':
            handlePostsCommand(steem.api.getDiscussionsByFeed, userId, cmd);
            break;
        case 'help':
            handleHelp(userId, cmd[1]);
            break;
        case 'hot':
            handlePostsCommand(steem.api.getDiscussionsByHot, userId, cmd);
            break;
        case 'next':
            handleNext(userId);
            break;
        case 'open':
            handleOpen(userId, cmd[1]);
            break;
        case 'trending':
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
            sendError(userId, command);
            return;
        }
        response = commands[command].desc_start.concat(lineBreak);
        if(commands[command].params.length > 0) {
            response = response.concat('\nParameters:');
            commands[command].params.forEach(param => {
                response = response.concat('\n- ', param.name, ': ', param.text);
            });
        } else response = response.concat('\nThere is no parameters available.')
        response = response.concat(lineBreak, commands[command].desc_end);
    } else {
        response = 'Here is a list of existing commands:'
        var keys = Object.keys(commands);
        for(var i = 0; i < keys.length; i++){
            response = response.concat('\n- ', keys[i], ' : ', commands[keys[i]].quick_desc);
            if(commands[keys[i]].important_param) response = response.concat('\n- ', keys[i], ' ', commands[keys[i]].important_param.name, ' : ', commands[keys[i]].important_param.text);
        }
    }
    sendDirectMessage(userId,response);

}

// Handles the 'next' subcommand
function handleNext(userId) {
    if(users.hasOwnProperty(userId)) {
        var allowedCommandNames = ['blog', 'created', 'feed', 'hot', 'trending'];
        if(allowedCommandNames.includes(users[userId].last_command.name)) {
            var allowedSubcommandNames = ['open'];
            if(allowedSubcommandNames.includes(users[userId].last_subcommand.name)) {
                handleOpen(userId, ++users[userId].last_subcommand.param);
            }
        }
    }
}
// Handles the 'open' subcommand
function handleOpen(userId, index) {
    index = index ? index - 1 : 0;
    if(users.hasOwnProperty(userId)) {
        // Checking if the last command supports the 'open' subcommand
        var allowedCommandNames = ['blog', 'created', 'feed', 'hot', 'trending'];
        if(allowedCommandNames.includes(users[userId].last_command.name)) {
            if(index >= 0 && index < users[userId].last_query_result.array.length) {
                var post = users[userId].last_query_result.array[index];
                var text = post.title + '\n--------------------\n' + post.body;
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
    if(params.length === 0) {
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
function sendDirectMessage(userId, text) {
    // Twitter allows a max length of 10000 characters per direct message
    // Splitting the string into multiple messages if it's too long
    if(text.length > 10000) {
        twitter.post('direct_messages/events/new', createDirectMessageObject(userId,text.substr(0, 10000)), function() {
            sendDirectMessage(userId, text.substr(10000, text.length - 10000));
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