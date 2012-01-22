var util = require('util');
var TtBot = require('ttapi');
var repl = require('repl');
var fs = require('fs');

// A turntable.fm bot implemented with ttapi. 
//
// Required properties:
// {
//     "bot": {
//         "auth": "Auth header to join Turntable",
//         "userID": "User ID of bot",
//         "roomID": "Room to join on connect"
//     }
// }
//
// Property values can be found with: http://alaingilbert.github.com/Turntable-API/bookmarklet.html 
//
function RoboDJ(properties) {
    
    this.auth   = properties.bot.auth;
    this.userID = properties.bot.userID;
    this.roomID = properties.bot.roomID;
    this.bot = null;
    this.filter = "indie";
    this.lastSongIdPlayed = "";
    this.botName = "";
    this.masterId = properties.bot.masterId;
    this.masterOnlyCommands = properties.bot.masterOnlyCommands;
    this.djAgainOnBoot = properties.bot.djAgainOnBoot;

    var self = this;
    
    // Connect to Turntable and configure Bot 
    this.connect = function() {
        this.bot = new TtBot(this.auth, this.userID, this.roomID);
        
        // On a new song, 75% chance of bopping to it after 10 seconds.
        // If bot is playing the song, load up more songs to bot's playlist.
        this.bot.on('newsong', function(data) {
            util.log("A new song is playing: " + util.inspect(data));
            if (Math.random() > 0.25) {
                setTimeout(function() {
                    self.bot.bop();
                }, 10000);
            }
            if (self.bot.currentDjId === self.userID) {
                self.lastSongIdPlayed = self.bot.currentSongId;
                self.findAndAddSong();
            }
        });
        
        // On first joining a room, wait 3 seconds before trying to DJ
        // and wait 2 seconds and try to find out bot's own name.
        this.bot.on('registered', function(data) {
            util.log("Joined room");
            var f = self.tryToDj;
            setTimeout(f, 3000);
            setTimeout(self.findDjName, 2000);
        });
        
        // When bot is done playing his own song, prune playlist
        this.bot.on('endsong', function(data) {
            if (self.bot.currentDjId === self.userID) {
                self.prunePlaylist();
            }
        });
        
        // If djAgainOnBoot is true, try to become a DJ again after 10 seconds.
        if (this.djAgainOnBoot) {
            this.bot.on('booted_user', function(data) {
                setTimeout(self.tryToDj, 10000);
            });
        }
        
        // Responds to chat room messages
        this.bot.on('speak', function(data) {
            
            // Change music filter
            var m = data.text.match(/^\/play (.*)/);
            if (m && self.authorizedCommand("play", data.userid)) {
                if (m[1] !== "") {
                    self.filter = m[1];
                    self.bot.speak("I will try to play " + self.filter);
                    self.findAndAddSong();
                }
            }
            
            // Stop DJing
            if (data.text.match(/^\/down/) && self.authorizedCommand("down", data.userid)) {
                self.bot.remDj();
            }
            
            // Try to get up and DJ!
            if (data.text.match(/^\/up/) && self.authorizedCommand("up", data.userid)) {
                self.tryToDj();
            }
            
            // Respond to bot's own name
            var pattern = new RegExp(self.botName, "i");
            if (pattern.test(data.text)) {
                self.bot.speak("Type '/play <string>' to change my taste in music");
            }
        });
        
    };

    // Return true if the bot should accept cmd from userId
    this.authorizedCommand = function(cmd, userId) {
        if (! this.masterId || this.masterId === "") {
            return true;
        }
        if (userId === this.masterId) {
            return true;
        } else {
            if (! this.masterOnlyCommands || this.masterOnlyCommands.indexOf(cmd) === -1) {
                return true;
            }
        }
        
        return false;
    };

    // Figure out the bot's own name
    this.findDjName = function() {
        self.bot.userInfo(function(resp) {
            var name = resp.name;
            if ( (/^@/).test(name) ) {
                name = name.substring(1);
            }
            self.botName = name;
            util.log("My name is " + self.botName);
        });
    };

    // Try to DJ. If all the DJ spots are full, wait one minute then 
    // check again. Upon becoming a DJ, add some new songs to playlist.
    this.tryToDj = function() {
        self.bot.roomInfo(function(resp) {
            if (! resp.room.metadata.dj_full) {
                util.log("Room has open DJ spots, adding DJ...");
                self.bot.addDj();
                self.findAndAddSong();
            } else {
                util.log("Room has no open DJ spots, waiting...");
                var f = self.tryToDj;
                setTimeout(f, 60000);
            }
        });
    };

    // Try to keep the playlist limited to no more than 20 songs. 
    this.prunePlaylist = function() {
        util.log("Attempting to prune playlist");
        self.bot.playlistAll(function(resp) {
            var playlistLength = resp.list.length;
            util.log("Playlist length is " + playlistLength);
            if (playlistLength > 20) {
                var excess = playlistLength - 20;
                for (var i = 1; i <= excess; i++) {
                    util.log("Removing song " + (playlistLength - i));
                    self.bot.playlistRemove(playlistLength - i);
                }
            }
        });
    };

    // Look for new songs to add to playlist. Get the Top 20 list of rooms and find
    // the room titles that match the bot's filter. Add the current song playing in 
    // these rooms.
    this.findAndAddSong = function() {
        util.log("Finding a new song to add");
        this.bot.listRooms(0, function(resp) {
            var added = 0;
            resp.rooms.forEach(function(room) {
                var pattern = new RegExp(self.filter, "i");
                if (pattern.test(room[0].name)) {
                    var songId = room[0].metadata.current_song._id;
                    if (songId !== self.lastSongIdPlayed) {
                        self.bot.playlistAdd(songId);
                        util.log("Added song: " + songId + " from room " + room[0].name);
                        added++;
                    } else {
                        util.log("Not adding last song played with id " + songId);
                    }
                }
            });
            
            // Let everybody know the filter may not be any good.
            if (added === 0) {
                self.bot.speak("I'm having trouble finding new songs.");
            }
            
            util.log("Added " + added + " songs to playlist.");
        });
    };

    // Dump out the playlist and its length to the console.
    this.logPlaylist = function() {
        util.log("Current Playlist");
        this.bot.playlistAll(function(resp) {
            resp.list.forEach(function(song) {
                util.log(util.inspect(song.metadata));
            });
            util.log("Playlist Length is " + resp.list.length);
        });
    };

}

// Use properties file from current directory.
try {
    var properties = JSON.parse(fs.readFileSync("dj.properties"));
} catch (err) {
    util.log("Missing or corrupt dj.properties file in base directory?");
    throw err;
}

// Configure
var dj = new RoboDJ(properties);

// If webrepl is defined in the properties, configure and start it.
if (properties.webrepl) {
    var wr = require('webrepl');
    wr.start(properties.webrepl.port, properties.webrepl).context.dj = dj;
}

// Join and get started DJing!
dj.connect();
