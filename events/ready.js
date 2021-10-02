const { REST } = require("@discordjs/rest");
const { token } = require("../config.json");
const { Routes } = require("discord-api-types/v9");
const fs = require("fs");
module.exports = {
    name: "ready",
    once: false,

    async execute(client) {
        await client.user.setPresence({ activities: [{ name: "Gotowy do działania!" }] });
        console.log("Bot ready.")
    }
}