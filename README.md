About
=================
A turntable.fm dj bot, written in node.js using the excellent https://github.com/alaingilbert/Turntable-API library.

RoboDj will try to DJ by adding songs to his playlist that are playing in other popular rooms. He can be told what kinds of rooms to use as a source for his selections. He also will bop his head to other people's songs, when he feels like the song is worth bopping to. He can be told to step down or to try to become a DJ. On startup, he tries to DJ.

Requires
=================
node.js version >= 0.6.5  

Configure
=================
Download the dependencies by cd-ing into the robodj directory and running:

    npm install

* Edit dj.properties to configure bot. 
  * Use http://alaingilbert.github.com/Turntable-API/bookmarklet.html to find auth and login information. 

Run
=================
To start up the bot normally:

    node robodj.js
    
I used my webrepl (https://github.com/mmattozzi/webrepl) library to provide an easy access point to the bot. Point your browser to http://localhost:5009/ to interact with the program variables.

Commands in Turntable
=================
In the turntable chat window, robodj responds to the following patterns:

* <name of bot> - Tells you something about himself
* /play <keyword> - Uses keyword as a source to find new music, this keyword should be something that is in the title of a Turntable room
* /up - Tells bot to become a DJ at the next chance available
* /down - Tells bot to step down from DJing

