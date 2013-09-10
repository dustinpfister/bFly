/*
     'toolBox custom API for 13k game bFly 
*/
/*
     the requestAnimframe replacement for setTimeout
*/
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

var tb = { // all reusable functions tucked away in single global token tb. 
    /* 
	     tb.boundingBox -- bounding box collision detection 
	     give the x,y,width, and height of one display object,
		 and the x,y,width,and,height of another display object.
		 The function will then return true or false depending if 
		 the two objects overlap.
	 */
    boundingBox: function (x1, y1, w1, h1, x2, y2, w2, h2) {
        var o = !1; // default to false
        if ((x1 > x2 + w2) || (x1 + w1 < x2) || (y1 + h1 < y2) || (y1 > y2 + h2)) { // if the two objects do not overlap
            o = !1; //then they do not overlap
        } else {
            o = !0; // else they do
        };
        return o; // return the boolean answer
    },
    /*
	     tb.rnd --  random number function
		 
		 tb.rnd(100)  is the same as...
		 Math.random()*100 
		 
		 tb.rnd(50,100) is the same as...	 
		 Math.random()*50+50;
	*/
    rnd: function (low, high) {
        if (!high) {
            return Math.random() * low;
        } else {
            return Math.random() * (high - low) + low;
        };
    },

    /*
	     tb.rndInt -- random Integer function
		 
		 tb.rndInt(25,75)  is the same as
		 Math.round(Math.random()*50)+25;
		 
		 it just helps makes things a little neater and condense
	*/
    rndInt: function (low, high) {
        return Math.round(tb.rnd(low, high));
    },

    /*
	     tb.g -- simple get function, just wraps document.getElementById
		 
		 tb.g('theElement')  is the same as...
		 document.getElementById('theElement')
	*/
    g: function (id) {
        return document.getElementById(id);
    },


    /*
	     tb.per -- percent function
		 
		 tb.per(2,3) should return 66.666...
	*/
    per: function (low, high) {
        return low * 100 / high;
    },

    /*
	   tb.checkCanvas -- check canvas test
	   check for the html5 canvas 2d context and return false if it is not found
	*/
    checkCanvas: function () {
        try {
            var el = document.createElement('canvas'); // make a canvas element
            return !!el.getContext('2d') ? !0 : !1; // check for the context, and return true if it is there.
        } catch (e) {
            return !1; // if and error happens then return false
        };
    },

    /*
	     tb.formatNumber(number) -- formats a number like 12345 as 12,345;
	*/
    formatNumber: function (num) {
        var str = String(num);
        var out = '';
        var fract = '';
        if (str.indexOf('.') != -1) {
            fract = str.substr(str.indexOf('.'), str.length);
            str = str.substr(0, str.indexOf('.'));
        };
        if (str.length <= 3) {
            out = str;
        } else {
            for (var start = 0; start != 3; start++) {
                if (String(Number((str.length - start) / 3)).indexOf('.') != -1) {
                    continue;
                } else {
                    break;
                };
            };
            out = str.slice(0, start);
            for (var char = start; char < str.length; char += 3) {
                if (out.length == 0) {
                    out = str.slice(0, 3);
                    char += 3;
                };
                out += ',' + str.slice(char, char + 3);
            };
        };
        return out + fract;
    },

    /*
	     tb.breakToLines -- break a long string into an array of strings given a certian char width, and line width 
	*/
    breakToLines: function (string, charWidth, lineWidth) {
        var stringArray = [],
            sai = 0, // the string array and its index pointer sai
            currentWord = '', // a string that will hold the current word
            si = 0, // the current string index
            lw = 0; // the current line width

        while (si != string.length) {
            if ((currentWord.length + 1) * charWidth + lw > lineWidth) { // if adding the next char is going to have us go over our linewidth then we need to go to a new line
                sai++;
                lw = 0;
            };
            if (stringArray[sai] == undefined) {
                stringArray[sai] = '';
            }; // if the current array string is undefined then make it an empty string

            currentWord += string[si]; // add the next char to the current word.

            /* 
			     if the current char is a space or we have reach the end of the string 
				 then write the current word to the current line
			 */
            if (string.charCodeAt(si) == 32 || string.length == si + 1) {
                stringArray[sai] += currentWord;
                lw += currentWord.length * charWidth;
                currentWord = '';

            };
            /*
			     if the length of the world next time arround is going to be longer then the line width,
				 then we need to break the word down and split it accross lines.
			 */

            if ((currentWord.length + 1) * charWidth > lineWidth) { // check if the next char add to the word is going to go over the line width
                if (currentWord.length + 1 != string.length - 1) { // if the next char does not bring us to the end of the string
                    if (string.charCodeAt(si + 1) != 32) { // the it should be safe to check if it is a space
                        stringArray[sai] += currentWord + '-'; // if it is not, use the '-' charicter
                    } else {
                        stringArray[sai] += currentWord; // else just write what we have to the current line
                    }
                };
                currentWord = '';
                sai++;
                lw = 0;
            }

            si++; // go to next char in string
        };

        return stringArray;

    },


    /*
	     tb.printStringArrayToContext -- print an array of strings to a html 5 canvas context produced by tb.breakToLines
	*/
    printStringArrayToContext: function (theArray, context, charSize, x, y) {
        // context.textBaseline='top';
        context.font = charSize + 'px arial';
        context.fillStyle = '#ffffff';
        //context.textAlign='center';
        for (var l = 0; l != theArray.length; l++) {
            context.fillText(theArray[l], x, y + (l * charSize));
        };
        return y + (l + 1) * charSize; // return the y position where it is okay to place more text.
    },


    /*
	     tb.parkIt(parkWhat);
	     park some data on the client, such as a high score
	*/
    parkIt: function (parkWhat) {
        try {
            // localStorage is so easy to use, just defined a propertie of localStorage, and give it a value
            localStorage.park = JSON.stringify(parkWhat);
        } catch (e) {
            // if an error happens do nothing.
        };
    },

    /*
	     tb.getIt();
		 return anything that might have been parked on the client with tb.parkIt
	*/
    getIt: function () {
        try {
            if (localStorage.park) {
                return JSON.parse(localStorage.park);
            };
        } catch (e) {
            // if an error happens undefined will be returned
        };
    },
}; // end of 'toolBox custom API' for 13k game 'bFly'