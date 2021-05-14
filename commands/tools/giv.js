const ms = require("ms")
const Discord = require("discord.js")
exports.run = async (client, message, args) => {
    /*
    jakby ktoś szukał kodu
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
    time = args[0];

    if (!time) return client.error(message, "Nie podano czasu! \`(giv [czas] [nagroda])\`")
    if (!item) return client.error(message, "Nie podano nagrody!")

    const embed = new Discord.MessageEmbed();
    embed.setColor(0x3333ff);
    embed.setTitle("Nowy giveaway!");
    embed.setDescription(`Do wygrania: **${item}**`);
    embed.addField(`Czas trwania:`, ms(ms(time), {
        long: true
    }), true);
    embed.addField("Organizator", message.author.tag)
 //  embed.addField("Fundator", founder||"Brak")
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
    }, ms(time));
}
exports.help = {
    name: "giv",
    description: "Tworzy giveaway",
    category: "tools",
}