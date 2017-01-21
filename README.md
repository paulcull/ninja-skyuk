ninja-skyuk
=========================

[![Greenkeeper badge](https://badges.greenkeeper.io/paulcull/ninja-skyuk.svg)](https://greenkeeper.io/)

Author: Paul Cullender
Version: 0.0.2
Status: beta
License: BSD


###Overview
Ninja Blocks Module for a sky tv box. 
This version shows the names and what the status of the skybox as well as basic control.


###Features
1. Detects the sky box on the network
2. Shows the status of sky box
3. Shows the channel that is showing or the programme name that is playing if recorded
4. Allows Pausing, Resuming, Fast Forward (x12) and Rewind (x12)
5. Channel up and down


###New Dashboard Widget
https://gist.github.com/paulcull/e41250e68a6146d32052

###Wiki Entry
[TBD]


###Forum Post
http://forums.ninjablocks.com/index.php?p=/discussion/2733/uk-sky-hd-box-driver


###Installation

Install this Driver with:

ninja_install -g git@github.com:paulcull/ninja-skyuk.git (Requires ninja toolbelt)

####Manual Installation

1. cd into your drivers directory (/opt/ninja/drivers on your Ninja Block)
2. git clone git://github.com/paulcull/ninja-skyuk.git
3. cd ninja-skyuk && npm install

###History

v0.0.2
======

Changed the sky interaction to use the excellent sky-plus-hd instead
Added interactive support with the driver
Got the channel pictures working
TODO: see if I can get the programme name on the channel


v0.0.1
======

Outline and shell

Give it a go, tell me if works for you and I'll get onto writing the part to actuate the players.


Community
=========

###Borrowing from...

This borrows alot from the ninjablock XMBC module found here: https://github.com/elliots/ninja-xbmc
The skyplus communication is using the good work from here https://github.com/dalhundal/sky-plus-hd


###Contributions to...

Very happy to accept patches/forks/complete rewrites. 

