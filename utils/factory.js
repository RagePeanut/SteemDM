module.exports =  {

    // Creates a Direct Message Object
    createDirectMessageObject: (userId, text) => {
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
    },

    // Creates an User Object
    createUserObject: (result, cmdName, cmdParams) => {
        return {
            last_query_result: result,
            last_command: {
                name: cmdName,
                params: cmdParams
            },
            last_subcommand: {
                name: '',
                param: ''
            }
        }
    },

    // Creates an User Settings Object
    createUserSettingsObject: (steemAccount, stylingAllowed) => {
        return {
            steem_account: steemAccount,
            styling: stylingAllowed
        }
    }

}