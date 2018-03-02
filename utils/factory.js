module.exports = function() {

    // Creates a Direct Message Object
    this.createDirectMessageObject = (userId, text) => {
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
    this.createUserObject = (resultArray, resultText, cmdName, cmdParams) => {
        return {
            last_query_result: {
                array: resultArray,
                text: resultText
            },
            last_command: {
                name: cmdName,
                params: cmdParams
            },
            last_subcommand: {
                name: '',
                param: ''
            }
        }
    }

    // Creates an User Settings Object
    this.createUserSettingsObject = (steemAccount, stylingAllowed) => {
        return {
            steem_account: steemAccount,
            styling: stylingAllowed
        }
    }

}