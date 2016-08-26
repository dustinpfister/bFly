/*
bFly v 2014.03.21 (Beta)
Copyright 2013, 2014 Dustin Pfister
dustin.pfister@gmail.com
http://dustinpfister.weebly.com/

I Dustin Pfister declare this software under the terms of the GNU GPL v3
You should have received a copy of the licence terms, if not here is a link:

http://www.gnu.org/licenses/gpl-3.0.txt

Do not remove the above copyright notice! If you wish to make an
alternate work based on this project add your name next to mine and release
the work under the terms of the GNU GPL v3 or similar license. Do not sell
this, or clam that you have made this unless your name appears above In the
copyright declaration.

Thank you ~Dustin

change log from 2013.09.11 (js13kversion) is as follows:

changes in 2014.03.20
 * changed the backdrop gradient to make it look different from the version submitted to js13kgames.com
 * started using my Acetate library to help improve performance by using layering.
 * started with around 25 FPS on my net book when frame rate capping is off, and there are 8 flowers rendering,
this has been improved to as much as 42FPS.
 * However now I have problems with the sheets being used by different instances of the flower class when a flower dies.

changes in 2014.03.21
 * fixed the problem in 2014.03.20 where flowers would use a different canvas when a flower died
 * set frame rate target to 30FPS

 */

/* begin the app*/
(function (global) { // beginning of bFly 13k game object

    /* all variables that should be shared across functions place here*/
    var conDom, // stores a reference to the canvas DOM objct
    con, // stores a reference to the canvas context
    sheet = new Image(), // the games one sprite sheet.
    ace, // the Acetate Class Instance
    activeFlowerSheets = [],
    currentState = 'start', // current state in the games state machine
    fly, // the fly object stores data of the players fly such as x,y, deltaX, deltaY, ect.
    flowers, // the flowers array, stores and array of objects made by the flower constructor

    /* graphics and performance! */
    maxFlowers = 8, // maximum flowers allowed, should be kept low to conserve overhead.
    flowerSmoothness = 4, // range is form 2 (jagged flowers but less overhead) upwards, higher numbers give smoother flowers, but costs CPU overhead.
    pettleRange = [3, 7], // the pettle range is the range of pettles that a flower will have, lower range will give better performance

    killList, // list of flowers to be removed from the flowers array.
    luck, // the fly (players) current luck that has a potential range from 0 to 100.
    lastRoll, // stores a date object that represents the last time a roll for a new flower has occurred, if roll is <= luck then a new flower will bloom.
    rollDelay, // rollDelay is the amount of time that should pass between rolls, it should be set to a fixed value such as 1000, or perhaps change dynamicly based on luck
    lastLuckChange, // like lastRoll stores a Date object that is the last time the fly's luck has change
    FPS = 0, // Frames Per Second (FPS counter)
    FC = 0, // Frame Count (FPS counter)
    lastFrameCount = new Date(), // last frame count (FPS counter)
    gameOver, // game over boolean
    //gameTimeStart,
    keys = [], // used to store key state boolean values
    pointer = [0, 0], // mouse/touch pointer
    pressed = false, // used with mouse/touch events
    pressDelay = new Date(); // to ensure that a a few seconds go by between state changes

    for (var k = 0, str = ''; k != 256; k++) { // set all key states to false
        keys[k] = !1;
    };

    var newGame = function () { // new game function sets up a new game
        if (fly == undefined) {
            fly = {}
        }; // set up the fly (player) object
        fly.x = 225, // set x, and y pos to the center of the screen
        fly.y = 225,
        fly.dx = 0, // start delta x, and y out at 0
        fly.dy = 0,
        fly.score = 0, // set score to 0
        //fly.level: 1,  // level properties not yet in use, may be removed
        fly.nectar = 250, // starting nectar
        fly.maxNectar = 1500, // the maximum nectar that the fly can hold.
        fly.luck = [75, 100], // the flys luck range, in a new game the fly starts out with good luck, then it should slowly get harder
        fly.ani = { // fly.ani object has to do with fly animation
            cell : 0, // current cell
            rate : 300, // cell rate
            last : new Date() // last cell flip
        };
        if (!fly.highScore)
            fly.highScore = 0; // if there is no highScore set it to 0
        flowers = [],
        killList = []; // set flowers array, and flowers killList to and empty array
        // maxFlowers = 10;
        //t = null;
        luck = 100, // always start out the game with great luck
        lastLuckChange = new Date(); // and make note of the last time the luck has been set
        lastRoll = new Date(); // a flower roll has not yet been made, but make a note of the time so the first roll happens when flower roll delay has been reached
        rollDelay = 1000; // witch we shale set at a fixed rate of 1000 for now.
        score = 0;
        //gameTimeStart=new Date();
        gameOver = !1; // set the game over boolean to false

        // set all activeFlowerSheets to false
        for (var f = 0; f != maxFlowers; f++) {
            activeFlowerSheets[f] = false;
        }
    };
    newGame(); // set up a new Game, just to init the fly object


    var out = function (mess) {
        tb.g('out').innerHTML = mess;
    };

    /*
    disp render display function
    this function will be used to display information to the player

     */

    var Flower = function (id) { // the flower constructer function
        //this.id = id;
        var i = 0;
        while (i < maxFlowers) {
            if (!activeFlowerSheets[i]) {
                activeFlowerSheets[i] = !0;
                this.sheetIndex = i;
                break;
            }
            i++;
        }
        this.x = tb.rndInt(380) + 60; // the x position of the flower
        this.y = tb.rndInt(280) + 110; // the y position of the flower
        this.nectar = tb.rndInt(50 + luck, luck * 4.4 + 60); // the amount of nectar that the flower has
        this.flowerSize = this.nectar * 0.05; // the flower size is based on the amount of nectar

        this.grown = !1; // grown boolean set to false, this is used in the game state
        this.render = !0; // used in the new rendering
        this.growState = 0; // growState is also used in drawStem to determine the state of the growth animation
        this.stemColor = 'rgb(0,' + Math.round(tb.rnd(127) + 127) + ',0)'; // stem color (cosmetic)

        // set stemXrate witch is aslo used in drawStem
        if (this.x <= 250) { // if the flowes x position is to the left
            this.stemXRate = tb.rnd(this.x) / 25 / 25;
        } else {
            this.stemXRate = tb.rnd(480 - this.x) / 25 / 25;
        }

        this.pettleHue = Math.round(tb.rnd(360)); // set the pettleHue, any random Hue is fine like stemColor this is only cosmetic
        this.pettleLightness = luck; // pettle lightness is based on luck, better luck will mean brighter colors.
        this.offset = tb.rnd(3.14); // the offset is used to offset the rotation of the flower so they do not all look the same
        this.pettleCount = Math.round(tb.rnd(pettleRange[0], pettleRange[1])); // pettleCount is also just to help keep the flowers from being boring.
    };

    // backDop or cls function is deprecated thanks to Acetate canvas layering!
    /*
    var backDrop = function () {
    var bg = con.createLinearGradient(0, 500, 0, 0);
    bg.addColorStop(0, '#00ff80');
    bg.addColorStop(0.75, '#0000ff');
    con.fillStyle = bg;
    con.fillRect(0, 0, 500, 500);
    };
     */

    /* the games state machine */
    var state = {
        firstTime : true,
        start : function () {
            if (state.firstTime) {
                // YO! here is an improvement added in version 2014.03.20!
                // set up the Acetate Class Instance! woot! woot!
                ace = new Acetate({
                        container : 'app',
                        sheetCount : 4,
                        width : 500,
                        height : 500,
                        scaledWidth : 500,
                        scaledHeight : 500,
                        labelList : ['backDrop', 'app', 'dispBack', 'disp']
                    });
                ace.clear('dispBack');
                ace.clear('disp');

                // add sheets to place flowers on
                for (var f = 0; f != maxFlowers; f++) {
                    ace.addSheet(); // add a new sheet that will end up at the top z level
                    ace.zMove(ace.sheetCount - 1, 1); // change it's z-level to 1
                    ace.renameSheet(1, 'flower' + f); // name the sheet flowerX
                    activeFlowerSheets[f] = false;
                }

                // YO! here is an improvement added in version 2014.03.20!
                // because the backdrop never changes across all game states it only needs to be rendered once!
                // set up the backDrop layer only once
                var context = ace.getContext('backDrop');
                var bg = context.createLinearGradient(0, 500, 0, 0);
                bg.addColorStop(0, '#00ee80'); //green
                bg.addColorStop(0.25, '#ffff00'); //yellow
                bg.addColorStop(0.8, '#ff0000'); //red
                context.fillStyle = bg;
                context.fillRect(0, 0, 500, 500);

                // set up the DispBack layer only once as well

                //conDom = tb.g('game'), // stores a reference to the canvas DOM object
                conDom = ace.get('app').dom; // use Acetate instead, but we should break things up better
                con = conDom.getContext('2d'), // stores a reference to the canvas context object
                con.textBaseline = 'top'; // set the context text baseline to top
                sheet.src = 'img/fly_32_1.png';
                sheet.onload = function () { // when the sheet loads
                    attachEvents(); // attach event handlers to the canvas
                    pressDelay = new Date();
                    currentState = 'menu'; // and change the current state to 'menu'.
                };
                if (tb.getIt() != undefined) {
                    fly.highScore = tb.getIt();
                }
                state.firstTime = false;
                //centerApp();
            };
        },
        maxMenuFlowers : 10,
        menuFlowers : [],
        menuFlowerRadian : 0,
        menuMessage : tb.breakToLines('Use the W,A,D keys, or touch screen, to move Mr BtterFly. Try your best to keep your nectar bar from fully depleting, by gathering Nectar from flowers. As time goes by your luck will change. ', 12, 400),
        menu : function () {
            // if menuFlowers have not reached the maximum
            if (state.menuFlowers.length < state.maxMenuFlowers) {
                var i = state.menuFlowers.length;
                state.menuFlowers[i] = {};
                var mf = state.menuFlowers[i];
                mf.size = tb.rnd(75) + 25;
                mf.x = Math.round(tb.rnd(mf.size / 2, 500 - (mf.size / 2)));
                mf.y = Math.round(tb.rnd(mf.size / 2, 500 - (mf.size / 2)));
                mf.pettleColor = 'hsl(' + Math.round(tb.rnd(360)) + ',100%,' + Math.round(tb.rnd(50, 100)) + '%)';
                mf.offset = tb.rnd(3.14);
                mf.pettleCount = Math.round(tb.rnd(pettleRange[0], pettleRange[1]))
            };

            //if(keys[32] && state.menuFlowers.length==state.maxMenuFlowers){
            if (state.menuFlowers.length == state.maxMenuFlowers && (pressed || keys[32]) && new Date() - pressDelay >= 2000) {
                if (tb.boundingBox(pointer[0], pointer[1], 1, 1, 100, 200, 300, 50) || keys[32]) {
                    state.menuFlowers = [];
                    newGame();
                    pressDelay = new Date();
                    dispBack(); // render dispBack once
                    currentState = 'game';
                };
            };
        },

        /* the game state function that updates the game model */
        game : function () {
            var st = new Date();
            //cls();

            if (keys[87]/*|| pointer[1] < fly.y*/
            ) { // if W key is pressed fly up
                if (fly.dy > -5)
                    fly.dy -= 0.25;
                fly.nectar -= 0.5;
                if (new Date() - fly.ani.last >= fly.ani.rate * 0.25) {
                    fly.ani.cell++;
                    fly.ani.last = new Date();
                    if (fly.ani.cell == 2)
                        fly.ani.cell = 0;
                };
            } else { // if W is not pressed then gravity begins to win.
                if (fly.dy < 5)
                    fly.dy += 0.25;
            };

            if (keys[65] || keys[68]/*|| pointer[0]!=fly.x*/
            ) { // if A or D key is pressed
                fly.nectar -= 0.5;
                if (keys[65]/*|| pointer[0] < fly.x*/
                ) { // if A start going left
                    if (fly.dx > -5)
                        fly.dx -= 0.25;
                };
                if (keys[68]/*|| pointer[0] > fly.x */
                ) { // if D start going right
                    if (fly.dx < 5)
                        fly.dx += 0.25;
                };
            } else { // else you loose your horizontal momentum
                if (fly.dx > 0)
                    fly.dx -= 0.25;
                if (fly.dx < 0)
                    fly.dx += 0.25;
            };

            fly.x += fly.dx; // apply deltaX and deltaY to current x and y values
            fly.y += fly.dy;

            if (fly.x < 0)
                fly.x = 0; // check x and y boundaries
            if (fly.x > 450)
                fly.x = 450;
            if (fly.y > 450)
                fly.y = 450;
            if (fly.y < 0)
                fly.y = 0;

            // if flowers array has not reached max flowers, and it's time for a chance for a new flower to grow...
            if (new Date() - lastRoll >= rollDelay) {
                lastRoll = new Date(); // set last roll time to now
                if (flowers.length < maxFlowers) {

                    var roll = tb.rnd(100); // do a roll
                    if (roll <= luck) { // if roll is in players favor...
                        var i = flowers.length;
                        flowers[i] = new Flower(i); // generate a new flower
                    };
                };
            };

            // loop thru flowers array
            for (var f = 0; f != flowers.length; f++) {
                var i = flowers[f];
                if (i.grown) { // if the flower is fully grown


                    if (tb.boundingBox(fly.x, fly.y + 30, 20, 20, i.x, i.y, i.flowerSize * 2, i.flowerSize * 2)) { // if the fly collides with the flower
                        i.render = true;
                        if (i.nectar >= 20) {
                            fly.nectar += 20 * 0.1;
                            i.nectar -= 20;
                            fly.score += 20;
                        } else {
                            fly.nectar += i.nectar;
                            fly.score += Math.floor(i.nectar);
                            i.nectar = 0;
                        };
                        if (fly.nectar > fly.maxNectar)
                            fly.nectar = fly.maxNectar; // the fly can only have so much nectar
                    } else {
                        i.nectar -= 0.25;
                        if (i.nectar < 25) {
                            i.render = true;
                            if (i.y < 480) {
                                i.y++;
                            };
                        }
                    };
                    if (i.nectar < 0)
                        i.nectar = 0;
                } else { // else if the flower is not grown
                    if (i.growState < 50) {
                        i.growState++;
                    } else {
                        i.grown = !0;
                    };
                };

                // flower size based on nectar?
                //i.flowerSize = i.nectar * 0.05;

                // draw the flower in its current state
                //drawStem(i.growState, f);

                if (i.nectar <= 0) {
                    killList[killList.length] = f;
                };
            }; // end loop threw flowers array;


            if (killList.length > 0) {
                for (var kill = killList.length - 1; kill != -1; kill--) {
                    activeFlowerSheets[flowers[killList[kill]].sheetIndex] = !1;
                    ace.clear('flower' + flowers[killList[kill]].sheetIndex);
                    flowers.splice(killList[kill], 1);
                };
                killList = [];
                lastRoll = new Date(); // set last roll time to now
            };
            //con.drawImage(sheet, fly.ani.cell * 16, 0, 16, 15, fly.x, fly.y, 50, 50);


            if (new Date() - lastLuckChange >= 30000) { // if it is time for luck to change

                luck = Math.round(tb.rnd(fly.luck[1] - fly.luck[0])) + fly.luck[0];
                if (fly.luck[0] > 10) {
                    fly.luck[0] -= 5;
                    fly.luck[1] -= 5;
                }
                //rollDelay=2500-luck*20;
                lastLuckChange = new Date();
            };
            if (new Date() - fly.ani.last >= fly.ani.rate) {
                fly.ani.cell++;
                fly.ani.last = new Date();
                if (fly.ani.cell == 2)
                    fly.ani.cell = 0;
            };

            if (fly.y == 450 || fly.nectar <= 0) { // check if the player lost.
                // if the player lost...
                fly.nectar = 0;
                //clearInterval(t);
                pressDelay = new Date();
                currentState = 'lostGame';
            };
            //disp();

            // frame counter, game seems to stay at 12FPS on my Asus Intel Atom N570 EEE-PC


            var str = '';
            for (var i = 0, len = flowers.length; i < len; i++) {
                str += i + ':' + flowers[i].render + ' ,';
            }

            out(str);

            out(FPS + 'FPS')

            FC++;
            if (new Date() - lastFrameCount >= 1000) {
                FPS = FC;
                FC = 0;
                lastFrameCount = new Date();
            };

            var et = new Date();
            out('frame tick:' + Number(et - st) + 'ms, FPS:' + FPS);

        }, // end game


        /*State when game is over*/
        lostGame : function () {

            if (keys[32] || pressed && new Date() - pressDelay >= 2000) {
                if (fly.score > fly.highScore) {
                    fly.highScore = fly.score;
                    tb.parkIt(fly.highScore);
                };
                newGame();
                pressDelay = new Date();
                ace.clear('dispBack'); // clear the dispBacking
                ace.clear('disp'); // clear the disp
                currentState = 'menu';
            };

        }
    }

    var dispBack = function (dispX, dispY) {
        if (!dispX || !dispY) {
            dispX = 250,
            dispY = 60; // position of display
        };
        ace.clear('dispBack');
        var c = ace.get('dispBack').context;

        c.fillStyle = 'rgba(128,128,128,0.5)'; // set background color
        c.strokeStyle = 'rgba(0,0,0,1)'; // set bar outline color
        c.lineWidth = 2; // thicker then normal outline width
        //c.fillRect(0,0,500,500);

        // draw nectar bar and luck bar background
        c.beginPath();
        c.arc(dispX, dispY, 50, Math.PI, Math.PI * 2);
        c.arc(dispX, dispY, 30, Math.PI * 2, Math.PI, true);
        c.closePath();
        c.stroke();
        c.fill(); // stroke and fill nectar bar background

        // draw luck bar background
        c.beginPath();
        c.arc(dispX, dispY, 25, Math.PI, Math.PI * 2);
        c.arc(dispX, dispY, 10, Math.PI * 2, Math.PI, true);
        c.closePath();
        c.stroke();
        c.fill(); // stroke and fill luck bar background

        // draw luck change bar background
        c.beginPath();
        c.arc(dispX, dispY + 5, 25, Math.PI * 2, Math.PI);
        c.arc(dispX, dispY + 5, 10, Math.PI, Math.PI * 2, true);
        c.closePath();
        c.stroke();
        c.fill(); // stroke and fill luck change bar background
    }

    var disp = function (dispX, dispY, demo) {
        if (!demo)
            var demo = false;
        if (!dispX || !dispY) {
            var dispX = 250,
            dispY = 60; // position of display
        };
        /*
        dispX sets the position of the nectar, and luck indicator bars
        dispX and dispY are the position of the concentric circles orgin
        so then 50,50 would place it in the upper left corner
        250,50 would be in the upper upper center.
         */
        if (demo) {
            dispBack(150, 350)
            var necBar = 1.25,
            luckBar = 1.75,
            changeTime = 0.30;
        } else {
            var necBar = tb.per(fly.nectar, fly.maxNectar) / 100 + 1, // determin the nectar bar length
            luckBar = luck / 100 + 1, // find luck bar length
            now = new Date(),
            changeTime = tb.per(now - lastLuckChange, 30000) / 100;
        };

        //var c = con; // reference to context
        ace.clear('disp');
        var c = ace.getContext('disp');

        // draw nectar bar
        c.fillStyle = 'rgba(255,0,128,0.75)'; // the nectar bar color
        c.beginPath();
        c.arc(dispX, dispY, 50, Math.PI, Math.PI * necBar);
        c.arc(dispX, dispY, 30, Math.PI * necBar, Math.PI, true);
        c.closePath();
        c.stroke();
        c.fill();

        // draw luck bar
        c.fillStyle = 'rgba(0,192,0,0.75)'; // luck bar color, why not green?

        c.beginPath();
        c.arc(dispX, dispY, 25, Math.PI, Math.PI * luckBar);
        c.arc(dispX, dispY, 10, Math.PI * luckBar, Math.PI, true);
        c.closePath();
        c.stroke();
        c.fill();

        // draw luck change bar


        c.fillStyle = 'rgba(0,255,128,0.75)'; // luck change change color
        c.beginPath();
        c.arc(dispX, dispY + 5, 25, Math.PI, Math.PI - Math.PI * changeTime, true);
        c.arc(dispX, dispY + 5, 10, Math.PI - Math.PI * changeTime, Math.PI, false);
        c.closePath();
        c.stroke();
        c.fill(); // stroke and fill luck change bar

        // draw score
        if (!demo) {
            c.strokeStyle = '#000000';
            c.fillStyle = '#ffffff';
            c.font = '15px courier';
            c.textAlign = 'center';
            var text = tb.formatNumber(fly.score);
            c.strokeText('score: ' + text, 100, 20);
            c.fillText('score: ' + text, 100, 20);
        }
    };

    /*
    The drawStem function is used to animate, and draw the flowers.
     */
    var drawStem = function (drawToInstance, flowerIndex) {
        var fl = flowers[flowerIndex];

        if (fl.render) {
            //ace.clear('flower'+flowerIndex);
            //var con = ace.getContext('flower'+flowerIndex);
            ace.clear('flower' + fl.sheetIndex);
            var con = ace.getContext('flower' + fl.sheetIndex);

            con.strokeStyle = fl.stemColor;
            //con.save();
            con.lineWidth = 5;
            if (fl.nectar < 25) {
                con.globalAlpha = tb.per(fl.nectar, 25) / 100;

            } else {
                con.globalAlpha = 1;
            };

            con.beginPath();
            con.moveTo(fl.x + fl.flowerSize, 500);
            for (var i = 0; i != drawToInstance + 1; i++) {
                var yStep = ((500 - fl.y - fl.flowerSize) / 50);
                if (i <= 24) {
                    var d = i;
                } else {
                    var d = (50 - i);
                }

                if (fl.x <= 250) {
                    var x = fl.x + fl.flowerSize - (d * fl.stemXRate * i);
                } else {
                    var x = fl.x + fl.flowerSize + (d * fl.stemXRate * i);
                };
                var y = 500 - i * yStep;

                con.lineTo(x, y);

            };
            con.stroke();

            var ic = 'rgb(' + Math.round(fl.nectar) + ',' + Math.round(fl.nectar) + ',0)';
            //var pc = tb.hue(fl.pettleHue,(tb.per(fl.nectar,500)*2.55)*1.27);
            //var pc = 'hsl('+fl.pettleHue+','+Math.round(tb.per(fl.nectar,500)+'%,50%)';
            var pc = '#ffffff';
            var pc = 'hsl(' + (fl.pettleHue * 30) + ',' + Math.round(tb.per(fl.nectar, 500)) + '%,' + fl.pettleLightness + '%)';
            if (drawToInstance === 50) {
                drawFlower(fl.x + fl.flowerSize, fl.y + fl.flowerSize, fl.flowerSize * 3, fl.pettleCount, ic, pc, fl.offset, flowerSmoothness, con);

                fl.render = false;
                //throw new Error();
            } else {
                drawFlower(x, y, (fl.flowerSize * 3) * (drawToInstance / 50), fl.pettleCount, ic, pc, fl.offset, flowerSmoothness, con);
            }
            //con.restore();

        }
    };

    /*
    The draw Flower function,
    this function just draws a flower, it does not animate the growth of the stem and flower in its entirety, for that look at drawStem
     */
    var drawFlower = function (x, y, radius, pettles, innerFlowerColor, pettleColor, offset, smoothness, context) {
        if (context === undefined)
            context = con;
        if (offset == undefined)
            offset = tb.rnd(0, 3.14);
        context.beginPath();
        context.lineWidth = 2;
        context.moveTo(x, y);
        //pettles = 3;

        var minPoints = pettles * 2; // minPoints is the minimum amount of points that will be needed to draw the flower
        /*
        smoothness is the number of points that will be used for each half of a pettle,
        the higher the smoothness the more points there will be therefore you will have smoother pettles
        however it will cost more CPU overhead.

        drawing a 8 pettle flower will end up beging a minamum of 16 points, witch would just basicly give you 8 lines
        ratter then pettles. however a smoothness of 2 would give you  (8*2)*2 = 32 points witch would be 4 points
        per pettle. A smoothness of 8 would give you (8*2)*8 = 128 points 16 points per pettle, witch would give you smoother
        pettles at an exspence of overhead.

        although it can be set as low as 1, it should be as low as 2 if performance is of concern.

        maybe smoothness should be an augument that could be set in an options menu
         */
        if (!smoothness)
            var smoothness = 4;

        var points = minPoints * smoothness; //  number of points per flower
        var angleRate = Math.PI * 2 / points; // the number or radians to move per point
        var perPettle = points / pettles; // the number of points for each pettle (an 4 pettle flower with a smoothness of 2 would be (16/4=4))
        var innerRadius = radius / 3;
        radius = radius * 2 / perPettle; // ajust the radius? I may have to rethink this.
        var radUp = true; // a boolean meaning if the radical value in the polar graph should go up or down


        /*
        draw the flower
        start off by setting the current polarAngle to the given offset, this will help make each flower look different
         */
        for (var polarAngle = offset, radical = 0; polarAngle < Math.PI * 2 + offset; polarAngle += angleRate) {
            context.lineTo(x + Math.sin(polarAngle) * radical * radius, y + Math.cos(polarAngle) * radical * radius);
            radUp ? radical += 1 : radical -= 1;
            if (radical >= perPettle / 2) {
                radUp = !radUp;
            };
            if (radical <= 0) {
                radUp = !radUp;
            };
        };
        context.closePath();
        context.strokeStyle = '#000000';
        context.stroke();
        context.fillStyle = pettleColor; //tb.hue(Math.round(tb.rnd(11)),tb.rnd(32,127.5));
        context.fill();

        context.strokeStyle = '#000000';
        context.beginPath();

        context.arc(x, y, innerRadius, 0, 6.28);
        context.closePath();
        context.stroke();
        context.fillStyle = innerFlowerColor;
        context.fill();
    };

    /* for each game state there is a cosponsoring render function*/
    var render = {
        start : function () {
            //backDrop();
            ace.clear('app');
            con.fillText('I am loading...', 10, 10);
        },
        menu : function () {
            //backDrop();
            ace.clear('app');
            for (var i = 0; i != state.menuFlowers.length; i++) { // loop thru state.menuFlowers and draw all flowers
                state.menuFlowers[i];
                var mf = state.menuFlowers[i];
                drawFlower(mf.x, mf.y, mf.size, mf.pettleCount, '#ffff00', mf.pettleColor, mf.offset, flowerSmoothness);
                //drawFlower(250,250,mf.size,mf.pettleCount,'#ffff00',mf.pettleColor, mf.offset,8);
            };
            con.fillStyle = 'rgba(0,0,0,0.75)';
            if (i != state.maxMenuFlowers) { // if the max flowers have not yet been reached
                var menuSize = Math.round(tb.per(i, state.maxMenuFlowers) * 4);
                var menuHalf = Math.round(menuSize / 2);
                con.fillRect(250 - menuHalf, 250 - menuHalf, menuSize, menuSize);
            } else { // else render the menu
                con.strokeStyle = '#ffffff';
                con.fillRect(50, 50, 400, 400); // draw menu background
                con.lineWidth = 4;
                con.strokeRect(50, 50, 400, 400);

                con.fillStyle = '#ff0000'; // draw play new game button
                con.fillRect(100, 200, 300, 50);
                con.strokeRect(100, 200, 300, 50);

                con.fillStyle = '#ffffff'; // draw game Title
                con.font = '80px arial';
                con.textAlign = 'center';
                con.fillText('bFly', 250, 70);

                con.font = '40px arial'; // draw new game button lable
                con.fillText('new game', 250, 200);

                con.font = '15px arial'; // draw how to play
                con.fillText('How to Play:', 250, 260);
                disp(150, 350, true);

                con.strokeStyle = '#ffffff';
                con.font = '12px courier';

                con.beginPath(); // point to nectar
                con.moveTo(115, 330);
                con.lineTo(100, 300);
                con.closePath()
                con.stroke();

                con.beginPath(); // point to luck
                con.moveTo(150, 335);
                con.lineTo(150, 290);
                con.closePath()
                con.stroke();

                con.beginPath(); // point time to luck change
                con.moveTo(135, 365);
                con.lineTo(160, 400);
                con.closePath()
                con.stroke();

                con.fillStyle = '#ffffff';

                // print point to lables
                con.fillText('Nectar', 100, 288);
                con.fillText('Luck', 150, 278);
                con.fillText('Time to luck change', 160, 400);

                // print how to play message
                tb.printStringArrayToContext(state.menuMessage, con, 12, 325, 300);

                // print high score if it is greater then 0

                // render current high score
                con.fillText('High Score: ' + tb.formatNumber(fly.highScore), 250, 170);

                // if a mouse cursor hovers the new game button animate a flower
                if (tb.boundingBox(pointer[0], pointer[1], 1, 1, 100, 200, 300, 50)) {
                    drawFlower(100, 200, 40, 7, '#ffff00', '#ffffff', state.menuFlowerRadian, 2);
                    state.menuFlowerRadian += 0.05;
                    if (state.menuFlowerRadian >= Math.PI * 2)
                        state.menuFlowerRadian -= Math.PI * 2;
                }
            }

        },
        game : function () {
            //backDrop(); // clear screen
            ace.clear('app');
            for (var f = 0; f != flowers.length; f++) {
                var i = flowers[f];
                drawStem(i.growState, f); // draw all flowers in the flowers array
            };
            con.drawImage(sheet, fly.ani.cell * 16, 0, 16, 15, fly.x, fly.y, 50, 50); // be sure to draw Mr bFly
            disp(); //  draw the display
        },
        lostGame : function () {
            if (!gameOver) {

                // clear all the flower sheets
                for (var f = 0; f != maxFlowers; f++) {
                    ace.clear('flower' + f);
                }

                con.fillStyle = 'rgba(0,0,0,0.8)';
                con.strokeStyle = '#ffffff';
                con.lineWidth = 4;
                con.fillRect(125, 125, 250, 250);
                con.strokeRect(125, 125, 250, 250);

                con.fillStyle = '#ffffff';
                con.font = '40px arial';
                var mess = 'game over'

                    con.textAlign = 'center';
                con.fillText(mess, 250, 125);

                var mess = tb.breakToLines('Oh no it looks as though mr butterFly could not keep up with its futial strugle\, how sad.', 7, 250);
                var y = tb.printStringArrayToContext(mess, con, 15, 250, 180);
                //var now=new Date();

                con.fillText('your score: ' + tb.formatNumber(fly.score), 250, y);
                con.fillText('click or press to continue', 250, y + 40);
                gameOver = !0;
            };
        }
    };

    /*
    main is called when app first starts.
    the first currentState is load, the apps single external source file is loaded
     */
    var main = function () {
        var lt = new Date();
        var thread = function () {
            if (new Date() - lt >= 1000 / 30) {
                state[currentState]();
                render[currentState]();
                lt = new Date();
            };
            requestAnimFrame(thread); // requestAnimFrame does seem to work better then var t=setTimeout(thread,1000/frameRate)requestAnimFrame(thread);  // requestAnimFrame does seem to work better then var t=setTimeout(thread,1000/frameRate)
            //var t = setTimeout(main, 1000 / 12);
        };
        thread();
        //state[currentState]();


    };

    // center the canvas
    var centerApp = function () {
        conDom.style.top = '25px';
        conDom.style.left = Math.round(window.innerWidth / 2 - 250) + 'px';
    };

    /* set event listeners */
    global.addEventListener('load', function (e) { // add onload event handler to global (window) this is where it all begins after the anonymous function is called
        /* CROSS YOUR FINGERS! -- here is where it all begins */
        if (tb.checkCanvas()) { // check for the canvas context
            main(); // launch main thread if the browser supports canvas
        } else {
            document.write('your browser does not seem to support canvas, sorry.') //else inform the user of the bad news.
        };
    });
    global.addEventListener('resize', function (e) {
        if (conDom != undefined) {
            //centerApp(); // center the app on resize
        };
    });
    global.addEventListener('keydown', function (e) { // if you find a key has been pressed down
        if (e.keyCode == 32)
            e.preventDefault(); // don't scroll if the space bar is pressed
        keys[e.keyCode] = !0; // set it's boolean true
    });
    global.addEventListener('keyup', function (e) { // if a key is released
        keys[e.keyCode] = !1; // set its boolean false
    });

    var ontouch = function (e) {

        var box = e.target.getBoundingClientRect();

        e.preventDefault();
        keys[32] = !1,
        keys[87] = !1,
        keys[65] = !1,
        keys[68] = !1;

        //if (currentState != 'game') {
        //    keys[32] = !0;
        //};

        var touch = e.touches[0];

        // should be good if not fullscreen
        //pointer[0] = touch.clientX - conDom.offsetLeft;
        //pointer[1] = touch.clientY - conDom.offsetTop;

        pointer[0] = touch.clientX - box.left;
        pointer[1] = touch.clientY - box.top;

        // should be good if scaled 100%.
        //pointer[0] = Math.round(tb.per(touch.clientX,window.innerWidth))*5,
        //pointer[1] = Math.round(tb.per(touch.clientY,window.innerHeight))*5;

        if (pointer[1] < fly.y) {
            keys[87] = !0;
        };
        if (pointer[0] > fly.x) {
            keys[68] = !0;
        };
        if (pointer[0] < fly.x) {
            keys[65] = !0;
        };

        console.log(pointer[0] + ',' + pointer[1]);

    };

    var attachEvents = function () {
        // ALLERT!  events are attached to the top canvas!
        // 2014.03.20 change made a conDom local var overriding the global one, there is more then one canvas now
        var conDom = ace.get('disp').dom;
        conDom.addEventListener('mousemove', function (e) {

            //works fine if you do not scale, and position without any nested elements other then body
            //pointer[0] = e.clientX - conDom.offsetLeft;
            //pointer[1] = e.clientY - conDom.offsetTop;

            // first change in months there is allot more to do if you are up for it
            var rect = conDom.getBoundingClientRect();
            pointer[0] = Math.round(e.clientX - rect.left);
            pointer[1] = Math.round(e.clientY - rect.top);

            // if you are going to scale full screen you might want to do something like this
            //pointer[0]=Math.floor(tb.per(e.clientX,window.innerWidth)*5);
            //pointer[1]=Math.floor(tb.per(e.clientY,window.innerHeight)*5);
        });
        conDom.addEventListener('mousedown', function (e) {
            pressed = !0;
        });
        conDom.addEventListener('mouseup', function (e) {
            pressed = !1;
        });

        // add basic support for touch devices, this may need allot of work.
        conDom.addEventListener('touchstart', function (e) {
            pressed = !0;
            ontouch(e);
        });
        conDom.addEventListener('touchend', function (e) {
            e.preventDefault();
            pressed = !1;

            pointer[0] = -1;
            pointer[1] = -1;

            keys[32] = !1,
            keys[87] = !1,
            keys[65] = !1,
            keys[68] = !1;
        });
        conDom.addEventListener('touchmove', function (e) {
            ontouch(e);
        });
    }; // end attach events

})(window);
