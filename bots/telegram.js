const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');
const steem = require('steem');

const handler = require('../utils/handler');
const formatter = require('../utils/formatter');

const awaitingReplyList = {};

// Telegram allows a max direct message length of 4096 characters per direct message
const MAX_LENGTH = 4096;

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

module.exports = function() {

    bot.action(/[0-9]+/, ctx => {
        handler.open(parseInt(ctx.match.input), ctx.from.id, 'telegram')
               .then(post => {
                   const content = formatter.backslash(post.content);
                   const parts = formatter.split(content, MAX_LENGTH);
                   sendPart(parts, ctx, post.index, post.maxIndex);
               })
               .catch(err => ctx.reply(err.message));
    });

    bot.action(/set_([a-z_]+)/, ctx => {
        const setting = ctx.match[1];
        switch(setting) {
            case 'steem_account':
                awaitingReplyList[ctx.from.id] = setting;
                ctx.reply('You chose the \'' + setting + '\' setting. Please, type a username to assign to this Telegram account.', Markup.forceReply().extra());
                break;
            default:
                handler.set(setting, ctx.from.id)
                       .then(success => ctx.reply(success))
                       .catch(err => ctx.reply(err.message));
                break;
        }
    });

    bot.action('close', ctx => {
        handler.close(ctx.from.id)
               .then(lastResult => {
                    const keys = [];
                    for(let i = 0; i < lastResult.array.length; i++) {
                        keys.push([Markup.callbackButton(lastResult.array[i], i + 1)]);
                    }
                    const keyboard = Markup.inlineKeyboard(keys).extra();
                    ctx.replyWithMarkdown('Here is what you requested', keyboard)
                       .catch(err => console.log(err));
               })
               .catch(err => ctx.reply(err.message));
    });

    bot.action(['next', 'previous'], ctx => {
        handler[ctx.match](ctx.from.id, 'telegram')
               .then(post => {
                   const parts = formatter.split(post.content, MAX_LENGTH);
                   sendPart(parts, ctx, post.index, post.maxIndex);
               })
               .catch(err => ctx.reply(err.message));
    });

    bot.command('account', ctx => {
        const cmd = ctx.message.text.toLowerCase().split(/ +/);
        handler.account(cmd[1], ctx.from.id, 'telegram')
               .then(account => {
                   ctx.replyWithMarkdown(account)
                      .catch(err => ctx.reply(err.message));
               })
               .catch(err => ctx.reply(err.message));
    });

    bot.command(['blog', 'comments', 'created', 'feed', 'hot', 'trending'], ctx => {
        const cmd = ctx.message.text.toLowerCase().match(/(?!\/).+/)[0].split(/ +/);
        const fn = ['blog', 'comments', 'feed'].includes(cmd[0]) ? 'userRelatedPostsCommand' : 'postsCommand';
        handler[fn](steem.api['getDiscussionsBy' + formatter.capitalize(cmd[0])], cmd, ctx.from.id, 'telegram')
                .then(posts => {
                    const keys = [];
                    for(let i = 0; i < posts.array.length; i++) {
                        keys.push([Markup.callbackButton(posts.array[i], i + 1)]);
                    }
                    const keyboard = Markup.inlineKeyboard(keys).extra();
                    ctx.replyWithMarkdown('Here is what you requested', keyboard)
                        .catch(err => console.log(err));
                })
                .catch(err => ctx.reply(err.message));
    });

    bot.command('close', ctx => {
        handler.close(ctx.from.id)
               .then(lastResult => {
                    const keys = [];
                    for(let i = 0; i < lastResult.array.length; i++) {
                        keys.push([Markup.callbackButton(lastResult.array[i], i + 1)]);
                    }
                    const keyboard = Markup.inlineKeyboard(keys).extra();
                    ctx.replyWithMarkdown('Here is what you requested', keyboard)
                       .catch(err => console.log(err));
               })
               .catch(err => ctx.reply(err.message));
    });

    bot.command('help', ctx => {
        const cmd = ctx.message.text.toLowerCase().match(/(?!\/).+/)[0].split(/ +/);
        handler.help(cmd[1], ctx.from.id, 'telegram')
               .then(help => ctx.replyWithMarkdown(typeof help === 'string' ? help : help.text))
               .catch(err => ctx.reply(err.message));
    });

    bot.command('mentions', ctx => {
        const cmd = ctx.message.text.toLowerCase().match(/(?!\/).+/)[0].split(/ +/);
        handler.mentions(cmd, ctx.from.id, 'telegram')
               .then(mentions => {
                   const keys = [];
                   for(let i = 0; i < mentions.array.length; i++) {
                       keys.push([Markup.callbackButton(mentions.array[i], i + 1)]);
                   }
                   const keyboard = Markup.inlineKeyboard(keys).extra();
                   ctx.replyWithMarkdown('Here is what you requested', keyboard)
                      .catch(err => console.log(err));
               })
               .catch(err => ctx.reply(err.message));
    });

    bot.command(['next', 'previous'], ctx => {
        const cmd = ctx.message.text.toLowerCase().match(/(?!\/).+/)[0].split(/ +/);
        handler[cmd[0]](ctx.from.id, 'telegram')
               .then(post => {
                   const parts = formatter.split(post.content, MAX_LENGTH);
                   sendPart(parts, ctx, post.index, post.maxIndex);
               })
               .catch(err => ctx.reply(err.message));
    });

    bot.command('open', ctx => {
        const cmd = ctx.message.text.toLowerCase().match(/(?!\/).+/)[0].split(/ +/);
        handler.open(parseInt(cmd[1]), ctx.from.id, 'telegram')
               .then(post => {
                   const parts = formatter.split(post.content, MAX_LENGTH);
                   sendPart(parts, ctx, post.index, post.maxIndex);
               })
               .catch(err => ctx.reply(err.message));
    });

    bot.command('replies', ctx => {
        const cmd = ctx.message.text.toLowerCase().match(/(?!\/).+/)[0].split(/ +/);
        handler.replies(cmd, ctx.from.id, 'telegram')
               .then(replies => {
                   const keys = [];
                   for(let i = 0; i < replies.array.length; i++) {
                       keys.push([Markup.callbackButton(replies.array[i], i + 1)]);
                   }
                   const keyboard = Markup.inlineKeyboard(keys).extra();
                   ctx.replyWithMarkdown('Here is what you requested', keyboard)
                      .catch(err => console.log(err));
               })
               .catch(err => ctx.reply(err.message));
    });

    bot.command('set', ctx => {
        const cmd = ctx.message.text.toLowerCase().match(/(?!\/).+/)[0].split(/ +/);
        if(cmd.length === 1) {
            const settings = [
                Markup.callbackButton('Steem Account', 'set_steem_account'),
                Markup.callbackButton('Styling', 'set_styling')
            ];
            const keyboard = Markup.inlineKeyboard(settings).extra();
            ctx.reply('What do you want to set ?', keyboard);
        } else handler.set(cmd[1], ctx.from.id, cmd[2])
                      .then(success => ctx.reply(success))
                      .catch(err => ctx.reply(err.message));
    });

    bot.hears(/[\w.-]+/, ctx => {
        const input = ctx.match[0].split(/ +/)[0];
        if(awaitingReplyList[ctx.from.id]) {
            handler.set(awaitingReplyList[ctx.from.id], ctx.from.id, input)
                   .then(success => ctx.reply(success))
                   .catch(err => ctx.reply(err.message));
            delete awaitingReplyList[ctx.from.id];
        } else ctx.reply('Don\'t forget to add a slash before your command or else I won\'t understand you !')
                  .catch(err => console.log(err));
    });

    bot.startPolling();

}

function sendPart(parts, ctx, index, maxIndex) {
    if(parts.length > 1) {
        ctx.replyWithMarkdown(parts[0])
           .then(() => {
               parts.shift();
               sendPart(parts, ctx, index, maxIndex);
           })
           .catch(err => {ctx.reply(err.message); console.log(err)});
    } else {
        const inlineKeyboard = [Markup.callbackButton('Close', 'close')];
        if(index > 1) inlineKeyboard.unshift(Markup.callbackButton('Previous', 'previous'));
        if(index < maxIndex) inlineKeyboard.push(Markup.callbackButton('Next', 'next'));
        const keyboard = Markup.inlineKeyboard(inlineKeyboard).extra();

        ctx.replyWithMarkdown(parts[0], keyboard)
           .catch(err => {ctx.reply(err.message); console.log(err)});
    }
}