About
=================
A turntable.fm dj bot, written in node.js using the excellent https://github.com/alaingilbert/Turntable-API library.

RoboDj will try to DJ by adding songs to his playlist that are playing in other popular rooms. He can be told what kinds of rooms to use as a source for his selections. He also will bop his head to other people's songs, when he feels like the song is worth bopping to. He can be told to step down or to try to become a DJ. On startup, he tries to DJ.

The intention of this bot isn't to subvert turntable.fm by Awesome-ing up all my songs, or letting me play just the songs I want to hear, or anything like that. My intent for RoboDj is to add an interesting member to a small turntable room. I most frequently DJ and hang out in a small room with friends and coworkers. Eventually, having the same people in the same room tends to make the music stale. It even makes me tired of the music in my playlist. RoboDj is here to help spice up my daily turntable room. My objective is for RoboDj to be a DJ who plays interesting, new music. We'll see how that goes.

Requires
=================
node.js version >= 0.6.5  

Configure
=================
Download the dependencies by cd-ing into the robodj directory and running:

    npm install

* cp dj.properties.sample dj.properties
* Edit dj.properties to configure bot. You'll need to create an account for the bot to use.
  * Use http://alaingilbert.github.com/Turntable-API/bookmarklet.html to find auth and login information. 

Run
=================
To start up the bot normally:

    node robodj.js
    
I used my webrepl (https://github.com/mmattozzi/webrepl) library to provide an easy access point to the bot. Point your browser to http://localhost:5009/ to interact with the program variables.

Commands in Turntable
=================
In the turntable chat window, robodj responds to the following patterns:

* [name of bot] - Tells you something about himself
* /play [keyword] - Uses keyword as a source to find new music, this keyword should be something that is in the title of a Turntable room
* /up - Tells bot to become a DJ at the next chance available
* /down - Tells bot to step down from DJing

