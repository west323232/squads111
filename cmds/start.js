const Discord = require('discord.js');
const Listing = require('./../modules/Listing');
const fs = require('fs');
const settings = require('./../settings.json');
const owner = settings.owner;

module.exports.run = async (bot, message, args) => {
    let snipeChannel = message.channel;
    const filter = m => !m.author.bot;
    let game = new Listing();

    
    let raw = fs.readFileSync('./roles.json');
    let allowedRoles = JSON.parse(raw);

    let validation = function(serverRoles, userRoles){
        let val = false;
        serverRoles.forEach((role) => {
            userRoles.forEach((usr) => {
                if (role == usr){
                    val = true;
                }
            });
        });
        return val;
    }
    

    let editLast3 = null;

    let startMessage = new Discord.RichEmbed()
        .setTitle("Fortnite Pro Scrims")
        .setDescription("Please write the last 3 digits of your Server ID")
        .setColor("#000099")
        .setFooter("Made by West (Jaysnxw_)");

    message.channel.send({embed: startMessage});

    let time = 30;
    let editTime = "";

    let timeEmbed = new Discord.RichEmbed()
        .setTitle("Next match in approx...")
        .setDescription(time + " minutes")
        .setColor("#000099");

    setTimeout(async () => {
        editTime = await message.channel.send({embed: timeEmbed}).catch( (err) => {
            console.log("Cant edit deleted message");
        });
    }, 10);

    let timeInterval = setInterval(() => {
        if (time === 1){
            time -= 1;
            timeEmbed.setDescription(time + " minutes");
            clearInterval(timeInterval);
        }else {
            time -= 1;
            timeEmbed.setDescription(time + " minutes");
        }

        editTime.edit({embed: timeEmbed}).catch((err) => {
            console.log("cant edit");
            clearInterval(timeInterval);
        });

    },60000);

    let last3 = new Discord.RichEmbed()
        .setTitle("Last 3 codes")
        .setColor("#000099");

    setTimeout(async () => {
        editLast3 = await message.channel.send({embed: last3});

        message.channel.overwritePermissions(message.guild.defaultRole, {
            SEND_MESSAGES: true
        }).catch((err) => {
            console.log(err);
        })
    }, 10);

    const collector = snipeChannel.createMessageCollector(filter, {time: 180000});

    collector.on('collect', m => {

        console.log(`Collected ${m.content} | ${m.author.username}`);
        
        if (validation(allowedRoles.roles,m.member.roles.array()) || m.member.id === owner){
            if (m.content === "!start" || m.content === "!stop"){
                collector.stop();
                console.log("Collector stoped");
                return;
            }
        }
        
        if (game.data.length === 0 && m.content.length === 3){
            game.addID(m.content.toUpperCase(), m.author.username);
        }else if (m.content.length === 3){
            if (game.userPresent(m.author.username)){
                game.deleteUserEntry(m.author.username);
                if (game.idPresent(m.content.toUpperCase())){
                    game.addUser(m.content.toUpperCase(), m.author.username);
                }else {
                    game.addID(m.content.toUpperCase(),m.author.username);
                }
            } else {
                if (game.idPresent(m.content.toUpperCase())){
                    game.addUser(m.content.toUpperCase(), m.author.username);
                }else {
                    game.addID(m.content.toUpperCase(), m.author.username);
                }
            }
        }

        game.sort();

        let str = "";
        last3 = new Discord.RichEmbed()
            .setTitle("Last 3 codes")
            .setColor("#000099");

        for (var i = 0; i < game.data.length; i++){
            str = "";
            for (var j = 0; j < game.data[i].users.length ; j++){
                str += game.data[i].users[j] + "\n";
            }
            last3.addField(`${game.data[i].id.toUpperCase()} - ${game.data[i].users.length} PLAYERS`, str, true);
        }
            editLast3.edit({embed: last3}).catch((err) => {
                console.log("Caught eddit error");
            });

        if (m.deletable){
            m.delete().catch((err) => {
                console.log("Cant delete");
                console.log(err);
            });
        }

    });

    collector.on('end', collected => {
        console.log(`Collected ${collected.size} items`);

        let endMsg = new Discord.RichEmbed()
            .setTitle("No more codes accepted at this point!")
            .setDescription("Good luck and have fun during your match!")
            .setColor("#ff0000");

        message.channel.send({embed: endMsg});

        message.channel.overwritePermissions(message.guild.defaultRole, {
            SEND_MESSAGES: false
        }).catch((err) => {
            console.log(err);
        })

    });
        

}



module.exports.help = {
    name: "startsquad"
}