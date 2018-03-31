const Twit = require('twit');
const steem = require('steem');

const handler = require('../utils/handler');
const factory = require('../utils/factory');
const formatter = require('../utils/formatter');

const commands = require('../objects/commands.json');

const twitter = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// Used to check that events are not triggered by the bot
const APP_ID = process.env.TWITTER_APP_ID;
// Twitter allows a max direct message length of 10000 characters per direct message
const MAX_LENGTH = 10000;
// Creating a user stream
const stream = twitter.stream('user');

module.exports = function() {
    // Reacting to direct messages
    stream.on('direct_message', event => {
        // The direct message listener is triggered for messages sent by both the user and the bot
        // We therefore need to verify that the message is from the user
        if(event.direct_message.sender.id_str != APP_ID) processDirectMessage(event.direct_message);
    });
}

// Checks what the command is and calls the appropriate function
function processDirectMessage(dm) {

    const userId = dm.sender.id_str;
    const cmd = dm.text.toLowerCase().split(/ +/);
    
    switch(true) {
        // Account
        case commands.account.keywords.includes(cmd[0]):
            handler.account(cmd[1], userId, 'twitter')
                   .then(details => sendDirectMessage(details, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Blog
        case commands.blog.keywords.includes(cmd[0]):
            cmd[0] = 'blog';
            handler.userRelatedPostsCommand(steem.api.getDiscussionsByBlog, cmd, userId, 'twitter')
                   .then(listData => sendDirectMessage(listData.text, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Close
        case commands.close.keywords.includes(cmd[0]):
            handler.close(userId)
                   .then(lastResult => sendDirectMessage(lastResult.text, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Comments
        case commands.comments.keywords.includes(cmd[0]):
            cmd[0] = 'comments';
            handler.userRelatedPostsCommand(steem.api.getDiscussionsByComments, cmd, userId, 'twitter')
                   .then(listData => sendDirectMessage(listData.text, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Created
        case commands.created.keywords.includes(cmd[0]):
            cmd[0] = 'created';
            handler.postsCommand(steem.api.getDiscussionsByCreated, cmd, userId, 'twitter')
                   .then(listData => sendDirectMessage(listData.text, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Feed
        case commands.feed.keywords.includes(cmd[0]):
            cmd[0] = 'feed';
            handler.userRelatedPostsCommand(steem.api.getDiscussionsByFeed, cmd, userId, 'twitter')
                   .then(listData => sendDirectMessage(listData.text, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Help
        case commands.help.keywords.includes(cmd[0]):
            handler.help(cmd[1], userId, 'twitter')
                   .then(listData => sendDirectMessage(typeof listData === 'object' ? listData.text : listData, userId))
                   .catch(err => sendDirectMessage(err.message, userId));  
            break;
        // Hot
        case commands.hot.keywords.includes(cmd[0]):
            cmd[0] = 'hot';
            handler.postsCommand(steem.api.getDiscussionsByHot, cmd, userId, 'twitter')
                   .then(listData => sendDirectMessage(listData.text, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Mentions
        case commands.mentions.keywords.includes(cmd[0]):
            handler.mentions(cmd, userId, 'twitter')
                   .then(listData => sendDirectMessage(listData.text, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Next
        case commands.next.keywords.includes(cmd[0]):
            handler.next(userId, 'twitter')
                   .then(post => sendDirectMessage(post.content, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Open
        case commands.open.keywords.includes(cmd[0]):
            handler.open(cmd[1], userId, 'twitter')
                   .then(post => sendDirectMessage(post.content, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Previous
        case commands.previous.keywords.includes(cmd[0]):
            handler.previous(userId, 'twitter')
                   .then(post => sendDirectMessage(post.content, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Replies
        case commands.replies.keywords.includes(cmd[0]):
            handler.replies(cmd, userId, 'twitter')
                   .then(listData => sendDirectMessage(listData.text, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Set
        case commands.set.keywords.includes(cmd[0]):
            handler.set(cmd[1], userId, cmd[2])
                   .then(success => sendDirectMessage(success, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Trending
        case commands.trending.keywords.includes(cmd[0]):
            cmd[0] = 'trending';
            handler.postsCommand(steem.api.getDiscussionsByTrending, cmd, userId, 'twitter')
                   .then(listData => sendDirectMessage(listData.text, userId))
                   .catch(err => sendDirectMessage(err.message, userId));
            break;
        // Error || 'Open' shortcut
        default:
            // Check if the command is a number, if it is then it's an 'open' shortcut
            // Else it's a wrong command
            if(isNaN(cmd[0])) sendDirectMessage('The command \'' + cmd[0] + '\' doesn\'t exist.\nPlease, write \'help\' to get a list of existing commands.');
            else handler.open(cmd[0], userId, 'twitter')
                        .then(post => sendDirectMessage(post.content, userId))
                        .catch(err => sendDirectMessage(err.message, userId));
    }

}

// Sends a direct message to the user
// function sendDirectMessage(text, userId) {
//     // Splitting the string into multiple messages if it's too long
//     if(text.length > MAX_LENGTH) {
//         twitter.post('direct_messages/events/new', factory.createDirectMessageObject(userId, text.substr(0, MAX_LENGTH)), () => {
//             sendDirectMessage(text.substr(MAX_LENGTH, text.length - MAX_LENGTH), userId);
//         });
//     } else {
//         twitter.post('direct_messages/events/new', factory.createDirectMessageObject(userId, text));
//     }
// }
function sendDirectMessage(text, userId) {
    formatter.split(text, MAX_LENGTH)
             .forEach(part => twitter.post('direct_messages/events/new', factory.createDirectMessageObject(userId, part)));
}