var util = require('util');
var TtBot = require('ttapi');
var repl = require('repl');
var fs = require('fs');

function RoboDJ(properties) {
    
    this.auth   = properties.bot.auth;
    this.userID = properties.bot.userID;
    this.roomID = properties.bot.roomID;
    this.bot = null;
    this.filter = "indie";
    this.lastSongIdPlayed = "";
    this.botName = "";

    var self = this;
    
    this.connect = function() {
        this.bot = new TtBot(this.auth, this.userID, this.roomID);
        
        this.bot.on('newsong', function(data) {
            util.log("A new song is playing: " + data);
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
        
        this.bot.on('registered', function(data) {
            util.log("Joined room");
            var f = self.tryToDj;
            setTimeout(f, 3000);
            setTimeout(self.findDjName, 2000);
        });
        
        this.bot.on('endsong', function(data) {
            if (self.bot.currentDjId === self.userID) {
                self.prunePlaylist();
            }
        });
        
        this.bot.on('speak', function(data) {
            var m = data.text.match(/^\/play (.*)/);
            if (m) {
                if (m[1] !== "") {
                    self.filter = m[1];
                    self.bot.speak("I will try to play " + self.filter);
                    self.findAndAddSong();
                }
            }
            
            if (data.text.match(/^\/down/)) {
                self.bot.remDj();
            }
            
            if (data.text.match(/^\/up/)) {
                self.tryToDj();
            }
            
            var pattern = new RegExp(self.botName, "i");
            if (pattern.test(data.text)) {
                self.bot.speak("Type '/play <string>' to change my taste in music");
            }
        });
        
    };

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
            
            if (added === 0) {
                self.bot.speak("I'm having trouble finding new songs.");
            }
            
            util.log("Added " + added + " songs to playlist.");
        });
    };

    this.logPlaylist = function() {
        util.log("Current Playlist");
        this.bot.playlistAll(function(resp) {
            resp.list.forEach(function(song) {
                util.log(song.metadata);
            });
            util.log("Playlist Length is " + resp.list.length);
        });
    };

}

try {
    var properties = JSON.parse(fs.readFileSync("dj.properties"));
} catch (err) {
    util.log("Missing or corrupt dj.properties file in base directory?");
    throw err;
}

var dj = new RoboDJ(properties);

if (properties.webrepl) {
    var wr = require('webrepl');
    wr.start(properties.webrepl.port, properties.webrepl).context.dj = dj;
}

dj.connect();
