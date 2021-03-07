const gateway = require("./lib/gateway.js");
const discord = require("./lib/discord.js");
const { prefix } = require("./config.json");
const r = require("rethinkdb");

gateway.registerModules(gateway, discord, [
    "handler",
    "help",
    "fun",
    "dev",
    "tools",
    "about",
    "mod"
])

gateway.event("ready", (client) => {
    r.connect({host: "localhost", port: 28015}, (err, con) => {
        if (err) console.log(err);
        client.con = con;
    })

    console.log("Successfully logged in!");

    setInterval(() => {
        const statuses = [
            "@Skyndalex",
            "Prefix: s/"
        ]

        const data = {
            op: 3,
            d: {
                since: null,
                activities: [{
                    name: statuses[Math.floor(Math.random() * statuses.length)],
                    type: 1
                }],
                status: "dnd",
                afk: false
            }
        }
        
        client.ws.send(JSON.stringify(data));
    }, 10000)
})

gateway.event("MESSAGE_CREATE", (client, msg) => {
    discord.getCurrentUser().then(bot => {
        const prefixMention = new RegExp(`^<@!?${bot.id}>( |)$`);

        if (msg.content.match(prefixMention)) {
            discord.createMessage(msg, {
                embed: {
                    title: "Oznaczyłeś mnie!",
                    description: "Komenda pomocy: s/help",
                    fields: [
                        {
                            name: "Prefix",
                            value: prefix,
                            inline: false
                        }
                    ],
                    color: 0x2ecc71
                }
            })
        }
    })
})

const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
    res.send('OK!')
})

app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})

app.listen();
gateway.run();
