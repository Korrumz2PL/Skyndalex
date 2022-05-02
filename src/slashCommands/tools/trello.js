const { SlashCommandBuilder, ContextMenuCommandBuilder} = require('@discordjs/builders');
const Trello = require("trello");
const axios = require("axios");
const {MessageEmbed, Modal, MessageActionRow, MessageButton} = require("discord.js");
const {response} = require("express");
module.exports = { // TODO: remove sub commands and rewrite to choices.
    data: new SlashCommandBuilder()
        .setName("trello")
        .setDescription("Trello manager")
        .addSubcommand(subcommand =>
            subcommand
                .setName("auth")
                .setDescription("Trello account authentication")
                .addStringOption(option => option.setName("key").setDescription("Account key").setRequired(true))
                .addStringOption(option => option.setName("token").setDescription("Application token").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("getlistid")
                .setDescription("Get your trello list ID")
                .addStringOption(option => option.setName("boardid").setDescription("Board ID from url (example: trello.com/b/NrfT9JgV)").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("getcardids")
                .setDescription("Get card IDs from list ID")
                .addStringOption(option => option.setName("listid").setDescription("List ID").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("options")
                .setDescription("Trello settings")
                .addStringOption(option => option.setName("add").setDescription("Add options")
                    .addChoices(
                        { name: 'addCard', value: 'add_card_choice' },
                        { name: 'addAttachmentToCard', value: 'add_attach_to_card' },
                        { name: 'addBoard', value: 'add_board' },
                        { name: 'addCardWithExtraParams', value: 'add_card_with_extra_params' },
                        { name: 'addChecklistToCard', value: 'add_checklist_to_card' },
                        { name: 'addCommentToCard', value: 'add_comment_to_card' },
                        { name: 'addCustomField', value: 'add_custom_field' },
                        { name: 'addDueDateToCard', value: 'add_due_date_to_card' },
                        { name: 'addExistingChecklistToCard', value: 'add_existing_checklist_to_card' },
                        { name: 'addItemToChecklist', value: 'add_item_to_checklist' },
                        { name: 'addLabelOnBoard', value: 'add_label_on_board' },
                        { name: 'addLabelToCard', value: 'add_label_to_card' },
                        { name: 'addListToBoard', value: 'add_list_to_board' },
                        { name: 'addMemberToBoard', value: 'add_member_to_board' },
                        { name: 'addMemberToCard', value: 'add_member_to_card' },
                        { name: 'addOptionToCustomField', value: 'add_option_to_custom_field' },
                        { name: 'addStickerToCard', value: 'add_sticker_to_card' },
                        { name: 'addWebhook', value: 'add_webhook' },
                        { name: 'copyBoard', value: 'copy_board' },
                        { name: 'setCustomFieldOnCard', value: 'set_custom_field_on_board' }
                    )),
        ),

    async execute(client, interaction) {
        const db = await r.table("trello").get(interaction.user.id).run(client.con);
        if (!db?.key) return interaction.reply("Not authorized!\nUse \`/trello auth\`")
        if (!db?.token) return interaction.reply("Not authorized!\nUse \`/trello auth\`")

        switch (interaction.options.getSubcommand()) {
            case "auth":
                await r.table("trello").insert({ uid: interaction.user.id, key: interaction.options.getString("key"), token: interaction.options.getString("token") }, { conflict: "update" }).run(client.con)

                await interaction.reply({ content: `Your key and token successfully added to database.\n\nToken: ${interaction.options.getString("token")}\nKey: ${interaction.options.getString("key")}`, ephemeral: true})
                break;
            case "options":
                const add = await interaction.options.getString("add");

                switch (add) {
                    case "add_card_choice":
                        const modal = new Modal({
                            customId: `cardAdd-${interaction.id}`,
                            title: "Create trello card",
                            components: [
                                { type: "ACTION_ROW", components: [
                                        { type: "TEXT_INPUT", style: "PARAGRAPH", customId: "cardAdd_name", label: "Card name", style: "SHORT", placeholder: "Your card name", minLength: 2, required: true }]},
                                { type: "ACTION_ROW", components: [
                                        { type: "TEXT_INPUT",  style: "PARAGRAPH", customId: "cardAdd_desc", label: "Card description", placeholder: "Your card description", minLength: 2, required: true }]},
                                { type: "ACTION_ROW", components: [
                                        { type: "TEXT_INPUT", style: "PARAGRAPH", customId: "cardAdd_listid", label: "list ID", placeholder: "Your list ID (from example: https://trello.com/b/NrfT9JgV/skyndalex-v10.json)", minLength: 2, required: true }]},
                            ]
                        })

                        const useModal = async (
                            sourceInteraction,
                            cardAddModal,
                            timeout = 2 * 60 * 1000,
                        ) => {
                            await sourceInteraction.showModal(cardAddModal);

                            return sourceInteraction
                                .awaitModalSubmit({
                                    time: timeout,
                                    filter: (filterInteraction) =>
                                        filterInteraction.customId === `cardAdd-${sourceInteraction.id}`,
                                })
                                .catch(() => null);
                        };

                        const modalSubmitInteraction = await useModal(interaction, modal)


                        let name = modalSubmitInteraction.fields.getTextInputValue("cardAdd_name")
                        let desc = modalSubmitInteraction.fields.getTextInputValue("cardAdd_desc")
                        let listid = modalSubmitInteraction.fields.getTextInputValue("cardAdd_listid")

                        let row = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("trello_add_card_confirm")
                                    .setStyle("SUCCESS")
                                    .setLabel("Confirm")
                            )
                        let messageConfirmEmbed = new MessageEmbed()
                            .setTitle("Are you sure?")
                            .setDescription("You provided these values:")
                            .addField(`Name`, `${name}`, true)
                            .addField(`Description`, `${desc}`, true)
                            .addField(`List ID`, `${listid}`, true)
                            .setColor("BLUE")
                        await modalSubmitInteraction.reply({
                            embeds: [messageConfirmEmbed],
                            components: [row]
                        })
                        break
                    case "add_attach_to_card":
                        const addAttachToCardModal = new Modal({
                            customId: `cardAttachAdd-${interaction.id}`,
                            title: "Add attachement to card",
                            components: [
                                { type: "ACTION_ROW", components: [
                                        { type: "TEXT_INPUT", style: "PARAGRAPH", customId: "cardAttachAdd_id", label: "Card ID", style: "SHORT", placeholder: "Your card ID", minLength: 2, required: true }]},
                                { type: "ACTION_ROW", components: [
                                        { type: "TEXT_INPUT",  style: "PARAGRAPH", customId: "cardAttachAdd_url", label: "Image URL", placeholder: "Your image URL", minLength: 2, required: true, style: "SHORT"}]},
                            ]
                        })

                        const addAttachToCard = async (
                            sourceInteraction,
                            cardAttachAddModal,
                            timeout = 2 * 60 * 1000,
                        ) => {
                            await sourceInteraction.showModal(cardAttachAddModal);

                            return sourceInteraction
                                .awaitModalSubmit({
                                    time: timeout,
                                    filter: (filterInteraction) =>
                                        filterInteraction.customId === `cardAttachAdd-${sourceInteraction.id}`,
                                })
                                .catch(() => null);
                        };

                        const modalSubmitInteraction2 = await addAttachToCard(interaction, addAttachToCardModal) // TODO: name it (modalSubmitInteraction2)

                        let cardID = modalSubmitInteraction2.fields.getTextInputValue("cardAttachAdd_id");
                        let imageURL = modalSubmitInteraction2.fields.getTextInputValue("cardAttachAdd_url");

                        let attachAddToCardRowConfirm = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("trello_add_attach_to_card_confirm")
                                    .setStyle("SUCCESS")
                                    .setLabel("Confirm")
                            )

                        let messageConfirmEmbed2 = new MessageEmbed() // TODO: name it (messageConfirmEmbed2)
                            .setTitle("Are you sure?")
                            .setDescription("You provided these values:")
                            .addField(`Card ID`, `${cardID}`)
                            .addField(`Img URL`, `${imageURL}`)
                            .setImage(imageURL)
                            .setColor("BLUE")
                        await modalSubmitInteraction2.reply({ embeds: [messageConfirmEmbed2], components: [attachAddToCardRowConfirm] })
                        break;
                }
                break;
            case "getlistid":
                let boardID = await interaction.options.getString("boardid");

                await axios.get(`https://trello.com/b/${boardID}.json`)
                    .then(async function (response) {
                        let listNames = [];

                        for (let i in response.data.lists) {
                            listNames.push(`${response.data.lists[i].name} : ${response.data.lists[i].id}`)
                        }

                        let embed = new MessageEmbed()
                            .setDescription(`\`\`\`ansi\n[0;37;45m${listNames.join(",\n")}\`\`\``)
                            .setColor("GREEN")
                        await interaction.reply({ embeds: [embed]})
                    });
                break;
            case "getcardids":
                let boardID2 = interaction.options.getString("listid");

                await axios.get(`https://trello.com/b/${boardID2}.json`)
                    .then(async function (response) {
                        let list = [];

                        for (let x in response.data.cards) {
                            list.push(`${response.data.cards[x].name} : ${response.data.cards[x].id}`)
                        }

                        let embed = new MessageEmbed()
                            .setAuthor({ name: `Found ${list.length} cards.`})
                            .setTitle("\`Card NAME : Card ID\`")
                            .setDescription(`\`\`\`ansi\n[0;34m${list.join(",\n")}\`\`\``)
                            .setColor("YELLOW")
                        await interaction.reply({ embeds: [embed] })
                    })
                break;
        }
    }
}