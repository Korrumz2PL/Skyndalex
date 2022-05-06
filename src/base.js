const { Client, Modal } = require('discord.js');
const r = require('rethinkdb');
const strings = require('./utils/strings.json');
class Base extends Client {
    constructor(clientOptions) {
        super(clientOptions);

        this.version = 'v1.0 BETA';
        this.site = 'https://skyndalex.xyz';
        this.strings = strings;
    }
    createModal (customId, title, components) {
        const modal = new Modal({
            customId: customId,
            title: title
        })
    }
}
module.exports = Base;
