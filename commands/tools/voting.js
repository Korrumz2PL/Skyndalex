const Discord = require("discord.js")
const r = require("rethinkdb")
exports.run = async (client, message, args, level) => {
    if(!message.member.hasPermission('MANAGE_CHANNELS')) return client.sender(message, "401: Unauthorized", "Nie masz permisji! \`ADMINISTRATOR\`", client.footer, "RED", "", "")

    if (!args[0]) return message.channel.send("Nie podano treści głosowania.")

    const channel = await r.table("settings").get(message.guild.id)("voteChannel").run(client.con)
    if (!channel) return message.channel.send("Nie ustawiono kanału!")

    const embed = new Discord.MessageEmbed()
        .setAuthor(message.author.tag, message.author.displayAvatarURL({dynamic: true}))
        .setTitle("Opublikowano nowe głosowanie")
        .setDescription(args.join(" "))
        .setColor("GREEN")
    if (message.attachments.map(a=>a.url)[0]) embed.setImage(message.attachments.map(a=>a.url)[0])
    if (message.attachments.map(a=>a.url)[0]) embed.setFooter('W obrazku pokazane jest tylko jedno pierwsze zdjęcie!');
    client.channels.cache.get(channel).send(embed).then(m => {
        m.react("👍")
        m.react("👎")
    })
    message.channel.send("Opublikowano nowe głosowanie")
}
exports.help = {
    name: "voting",
    description: "Wysyła głosowanie",
    category: "tools",
}