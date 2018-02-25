# SteemTwitterBot
An Open-Source Twitter bot that lets you interact with the Steem blockchain through direct messages.

## Try it !
You can find a deployment of this bot at the following address: https://twitter.com/SteemBot_

## Deploy
**Required:** [Git](https://git-scm.com/), [NPM](https://www.npmjs.com/), [Node.js](https://nodejs.org/), a [Twitter](https://twitter.com/) account that will be used by the bot. If you wish to deploy your own version of this bot, follow these steps carefully.
1. **Cloning**
```
git clone https://github.com/RagePeanut/SteemTwitterBot.git
```
2. **Setting up an app for your account**

Create an account for your bot. Once it's created, log into it then visit [this page](https://apps.twitter.com/) and click on **Create New App**. Follow the steps until your bot is set up. Go on your bot's app page (not its public Twitter page, the one from your apps panel) and click on **Permissions** then select **Read, Write and Access direct messages** under the **Access** title and click on the **Update Settings** button. Now click on **Keys and Access Tokens**, scroll down to the **Token Actions** subtitle and click on the **Generate My Access Token and Token Secret**.

3. **Set your own keys**

You will come accross some **process.env.SOMETHING** fields in the **app.js** file. If you plan on deploying this bot **ONLY** locally, you can replace them by your app's keys and ID. You can find all the required keys and your app ID (**Owner ID**) on the **Keys and Access Tokens** page. However, if you plan on deploying it online you **MUST** protect those keys. The app uses environment variables to achieve that but you are free to use any other way as long as it's secure.

4. **Building the bot**
```
cd SteemTwitterBot/
npm install
```
5. **Starting the bot**
```
npm start
```

## Special thanks to
**Steemit** for [steem.js](https://github.com/steemit/steem-js)

**ttezel** for [Twit](https://github.com/ttezel/twit)

## Social networks
**Steemit:** https://steemit.com/@ragepeanut

**Busy:** https://busy.org/@ragepeanut

**Twitter:** https://twitter.com/RagePeanut_

**Steam:** http://steamcommunity.com/id/ragepeanut/

### Follow me on [Steemit](https://steemit.com/@ragepeanut) or [Busy](https://busy.org/@ragepeanut) to be informed on my new releases and projects.
