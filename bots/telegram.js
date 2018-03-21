const Telegraf = require('telegraf');

module.exports = function() {
    const telegram = new Telegraf(process.env.TELEGRAM_TOKEN);

    telegram.command('trending', ctx => {
        console.log(ctx.message);
        ctx.reply('tg');
    });

    telegram.startPolling();
}