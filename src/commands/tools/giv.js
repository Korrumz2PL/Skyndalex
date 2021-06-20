const ms = require("ms")
const Discord = require("discord.js")
const r = require("rethinkdb")
exports.run = async (client, message, args) => {
    /*
    https://stackoverflow.com/questions/62086666/discord-js-bot-giveaway-command-embedsent-reactions-get-is-not-a-function
     */

    const messageArray = message.content.split(" ");
    if (!message.member.hasPermission(["ADMINISTRATOR"])) return message.channel.send("Nie masz permisji do rozpoczęcia konkursu!")
    let item = "";
    let time;

   // let founder = args[2]

    let winnerCount;
    for (let i = 1; i < args.length; i++) {
        item += (args[i] + " ");
    }
    time = await r.table("giveaways").update({time: args[0]}).run(client.con)

    if (!time) return message.channel.send("Nie podano czasu!")
    if (!item) return message.channel.send("Nie podano nagrody!")

    const timeFromDB = await r.table("giveaways").get(message.guild.id)("time").run(client.con)

    const embed = new Discord.MessageEmbed();
    embed.setColor(0x3333ff);
    embed.setTitle("Nowy giveaway!");
    embed.setDescription(`Do wygrania: **${item}**`);
    embed.addField(`Czas trwania:`, ms(ms(timeFromDB), {
        long: true
    }), true);
    embed.addField("Organizator", message.author.tag)
    embed.addField("Czas zapisany w bazie", timeFromDB)
    embed.setFooter("Zareaguj reakcję aby dołączyć");
    const embedSent = await message.channel.send(embed);
    embedSent.react("🎉");

    setTimeout(async () => {
        try{
            const peopleReactedBot = await embedSent.reactions.cache.get("🎉").users.fetch();
            var peopleReacted = peopleReactedBot.array().filter(u => u.id !== client.user.id);
        } catch(e) {
            return message.channel.send(`Wystąpił jakiś błąd (\`${item}\`) : `+"`"+e+"`")
        }
        let winner;

        if (peopleReacted.length <= 0) {
            return message.channel.send(`Zbyt mało osób wzięło udział w giveawayu o ${item}`)
        } else {
            const index = Math.floor(Math.random() * peopleReacted.length);
            winner = peopleReacted[index];
        }
        if (!winner) {
            message.channel.send(`Błąd z **${item}**`);
        } else {
            message.channel.send(`<@${winner.id}>`).then(m => {
                m.delete({timeout: 1000})
            })
            client.sender(message, "Wygrano giveaway!", `🎉 **${winner.toString()}** wygrał **${item}**! Gratulacje!`, "", "0x3333ff", "", "")
        }
    }, ms(timeFromDB));

    
    const logChannel = await r.table("settings").get(message.guild.id)("giveawayLogs").run(client.con)
    if (logChannel) return message.channel.send("Nie ustawiono logów giveawayi, więc nie jestem w stanie przekierować je na kanał z logami!").then(m => {
        m.delete({timeout: 1000})
    })

    const embedLog = new Discord.MessageEmbed()
    .setTitle("Logi: Utworzono giveaway!")
    .addField("Autor", message.author.tag)
    .addField("Co jest do wygrania", item)
    client.channels.cache.get(logChannel).send(embedLog)
    
}
exports.help = {
    name: "giv",
    description: "Tworzy giveaway",
    category: "tools",
}