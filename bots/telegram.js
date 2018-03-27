const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');
const steem = require('steem');

const handler = require('../utils/handler');
const formatter = require('../utils/formatter');

// Telegram allows a max direct message length of 4096 characters per direct message
const MAX_LENGTH = 4096;

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

module.exports = function() {

    bot.action(/[0-9]+/, ctx => {
        const index = parseInt(ctx.match.input);
        handler.open(index, ctx.from.id, 'telegram')
               .then(post => {
                   const parts = formatter.split(post, MAX_LENGTH);

                   for(let i = 0; i < parts.length - 1; i++) {
                       ctx.replyWithMarkdown(parts[i])
                          .catch(err => ctx.reply(err.message));
                   }

                   const keyboard = Markup.inlineKeyboard([
                       Markup.callbackButton('Previous', index - 1),
                       Markup.callbackButton('Next', index + 1)
                   ]).extra();
                   
                   ctx.replyWithMarkdown(parts[parts.length - 1], keyboard)
                      .catch(err => ctx.reply(err.message));
               })
               .catch(err => {ctx.reply(err.message)});
    });

    bot.command('mentions', ctx => {
        ctx.replyWithMarkdown('*fdfd* _dsfsfs_')
    });

    bot.command(['created', 'hot', 'trending'], ctx => {
        const cmd = ctx.message.text.toLowerCase().split(/ +/);
        handler.postsCommand(steem.api['getDiscussionsBy' + formatter.capitalize(cmd[0].slice(1))], cmd, ctx.from.id)
               .then(posts => {
                   const keys = [];
                   for(let i = 0; i < posts.array.length; i++) {
                       keys.push([Markup.callbackButton(posts.array[i], i + 1)]);
                   }
                   const keyboard = Markup.inlineKeyboard(keys).extra();
                   ctx.reply('Here are the posts you requested', keyboard)
                      .catch(err => console.log(err));
               })
               .catch(err => ctx.reply(err.message));
    });

    bot.startPolling();
}