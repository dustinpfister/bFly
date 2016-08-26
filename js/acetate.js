/*

Acetate v 2013.11.24 (Alpha Development)
Copyright 2013 Dustin Pfister
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

 */

(function (global) {
    // define only the Acetate Constructor in the global name-space
    global.Acetate = function (aurgObj) {
        /*
        Acetate(aurgObj) --
        This is the Acetate project constructor function, use it to make a new Acetate Project. An Acetate Class is a collection of
        Sheet Class instances.

        aurgObj -- the following is aurgObj's properties

        container -- default value if omited is undefined, and as such a container will be generated, and appended to document.body,
        container's value can be an element object reference, a string repersenting an id attrabute value, or a div index number.
        All sheets generated will be appended to the container, and the containers position will be set to relative.

        width -- the actual native width of the sheets in pixels, the default is 640

        height -- the actual native height of the sheets in pixels, the default is 480

        scaledWidth -- the scaled width of the sheets in pixels, the default is 640

        scaledHeight -- the scaled height of the sheets in pixels, the default is 480

        sheetCount -- the number of starting 'Sheets' of acetate that should be in the project, default is 2

        labelList -- an array of starting label names for the Sheets, if omited they will be given a name of 'New Sheet '+x
         */
        // the aurgObj's potential properties, and their default values


        var checkCanvas = function () {
            try {
                var el = document.createElement('canvas');
                return !!el.getContext('2d') ? true : false;
            } catch (e) {
                return false;
            }
        },
        aurgs = ['container', 'width', 'height', 'scaledWidth', 'scaledHeight', 'sheetCount', 'labelList'],
        defaults = [undefined, 640, 480, 640, 480, 2, []],
        i,
        len,
        canvasDefaults;

        // test for the HTML 5 canvas 2d drawing context
        if (checkCanvas()) {
            // create a blank aurgObj if no arguments are given
            if (aurgObj === undefined) {
                aurgObj = {};
            }

            // set undefined properties to hard coded defaults
            for (i = 0, len = aurgs.length; i !== len; i++) {
                if (aurgObj[aurgs[i]] === undefined) {
                    // if argument is undefined set default
                    this[aurgs[i]] = defaults[i];
                } else {
                    // else set user define argument
                    this[aurgs[i]] = aurgObj[aurgs[i]];
                }
            }

            // set any undefined layer names to 'new layer x'
            len = this.labelList.length;
            if (len < this.sheetCount) {
                for (i = len; i !== this.sheetCount; i++) {
                    this.labelList[i] = 'new sheet ' + Number(i - len);
                }
            }

            // set up the container for the layers
            if (aurgObj.container === undefined) {
                this.container = document.createElement('div');
                document.body.appendChild(this.container);
            } else {
                switch (typeof this.container) {
                    // if case is object assume element object reference and do nothing

                    // if case is string assume id
                case 'string':
                    this.container = document.getElementById(this.container);
                    break;

                    // if case is number assume div element index
                case 'number':
                    this.container = document.getElementsByTagName('div')[this.container];
                    break;
                }
            }
            this.container.style.position = 'absolute'; // the container that holds the layers
            this.sheet = []; // the array of Sheet class instances
            this.tileSheet = [];
            this.images = []; // the array of images that go into one or more layers
            this.drawings = []; // an array of point collections

            // define the defaults that will be passed to the Sheet constructor when creating the layer
            canvasDefaults = {
                container : this.container,
                width : this.width,
                height : this.height,
                scaledWidth : this.scaledWidth,
                scaledHeight : this.scaledHeight
            };

            // set up the sheets with the Sheet Class
            for (i = 0; i != this.sheetCount; i++) {
                canvasDefaults.label = this.labelList[i];

                this.sheet[i] = new Sheet(canvasDefaults);
                this.sheet[i].dom.style.zIndex = i;
            }

            // set up tile sheets
            for (i = 0; i != this.sheetCount; i++) {
                canvasDefaults.label = this.labelList[i];
                canvasDefaults.append = false;
                this.tileSheet[i] = new Sheet(canvasDefaults);
                this.tileSheet[i].dom.style.zIndex = i;
            }

        } else {
            // if the browser does not support canvas

            document.write('<h1>Your Browser does not seem to support HTML 5 Canvas, which is needed for this app to work. Please update your software.<\/h1>')
            throw new Error('No Canvas Supprt');
        }
    };

	Acetate.Drawing=function(radius, angles){
	
	    
	};
	Acetate.Triangle=function(radius, angles){
	
	    
	};
	Acetate.Pollygon=function(radius, angles){
	
	    
	};
	Acetate.Star=function(radius, angles){
	
	    
	};
	
    Acetate.prototype = {

        showLabels : function () {
            /*
            Acetate.showLabels() --
            function just prints the layer labels to each layer
             */
            // loop threw all layers and print it's layer name
            for (var i = 0; i != this.sheetCount; i++) {
                var con = this.sheet[i].context;
                con.textBaseline = 'top';
                con.textAlign = 'center';
                con.font = '20pt courier';
                con.fillStyle = 'rgba(0,0,0,0.5)';
                con.fillText(this.sheet[i].label, this.sheet[i].dom.width / 2, this.sheet[i].dom.height / 2);
            }
        },
        get : function (aurg) {
            /*
            Acetate.get(aurg)  --
            get a layer by index Acetate.get(0) or label Acetate.get('background')

            aurg -- the index or label of the sheet class instance to get
             */
            var getByLabel = function (layers, lookingFor) {
                var i = 0,
                len = layers.length;
				//len = this.sheet.length
                while (i != len) {
                    if (lookingFor === layers[i].label) {
					    //console.log(layers[i].label)
                        return layers[i];
						
                    }
                    i++;
                }
            }
            switch (typeof aurg) {
            case 'number':
                return this.sheet[aurg];
                break;
            case 'string':
                return getByLabel(this.sheet, aurg);
                break;
            }
        },
        getContext : function (aurg) {
            /*
            Acetate.getContext(aurg)
            get a layers 2d drawing context, aurg is the layer label or index number

            aurg -- the index or label of the sheet drawing context that you want
             */
            return this.get(aurg).context;
        },
        clear : function (aurg1, aurg2) {
            /*
            Acetate.clear(aurg1, aurg2)
            clear all sheets, a specific sheet by index or label, a range of sheets by index, or an array of sheets by index and or label

            aurg1 -- a single sheet to clear by index of label, the beginning range of sheets to clear by index,
            or an array of sheet index values to clear.

            aurg2 -- the end of an index range if clearing by range

            Acetate.clear();                        // clear all sheets
            Acetate.clear(3);                      // clear a sheet with an index of 3
            Acetate.clear(4,7);                  // clear sheets 3 threw 7
            Acetate.clear([2,4,6,8])          // clear sheets 2,4,6,and 8
            Acetate.clear('background') // clear a sheets with the label of 'background'
             */
            var i = 0,
            len = this.sheet.length;
            if (aurg1 === undefined) {
                //i=0,len=this.sheet.length;
                while (i < len) {
                    this.get(i).cls();
                    i++;
                }
            } else {
                switch (typeof aurg1) {
                case 'string':
                    // cls by label
                    this.get(aurg1).cls();
                    break;
                case 'number':
                    if (aurg2 === undefined) {
                        // cls layer index
                        this.get(aurg1).cls();
                    } else {
                        // cls layer range
                        for (i = aurg1; i != aurg2; i++) {
                            this.get(i).cls();
                        };
                    }
                    break;
                case 'object':
                    // expect list
                    len = aurg1.length;
                    while (i < len) {
                        this.get(aurg1[i]).cls();
                        i++;
                    }
                    break;
                }

            }

        },
        addSheet : function () {
            /*
            Acetate.addSheet() --
            Add a new sheet to the top of stack of acetate sheets

             */
            // sheet will be added to the end of the sheet array
            var index = this.sheet.length,
            nsCount = 0,
            label;

            // find the new sheet count, and set the starting label Name
            for (var s = 0; s != index; s++) {
                if (this.sheet[s].label.substr(0, 9).toLowerCase() === 'new sheet') {
                    nsCount++;
                }
            };
            label = 'new sheet ' + nsCount;

            // add the new sheet, it's properties will be based on what is found in this
            //alert(this.label)
            this.sheet[index] = new Sheet({
                    container : this.container,
                    width : this.width,
                    height : this.height,
                    scaledWidth : this.scaledWidth,
                    scaledHeight : this.scaledHeight,
                    label : label
                });
		    this.sheetCount++;
        },
        deleteSheet : function (sheet) {
            /*
            Acetate.deleteSheet(sheet) --
            delete a sheet

            sheet -- the sheet index of label to delete
             */
            var s = this.get(sheet),
            SI = Number(s.dom.style.zIndex),
            i = 0,
            ti = 0,
            len = this.sheet.length;

            // remove the element
            this.container.removeChild(s.dom);

            // fix sheet array
            var temp = [];
            while (i < len) {
                if (i !== SI) {
                    temp[ti] = this.sheet[i];
                    temp[ti].dom.style.zIndex = ti;
                    ti++;
                }
                i++;
            }

            this.sheet = temp;
        },
        renameSheet : function (sheet, newName) {
            /*
            Acetate.renameSheet(sheet,newName)
            give the sheet a new label

            sheet -- the index or label of the sheet

            newName -- the new label of the sheet
             */

            // get the sheet class instance and set is label property
            this.get(sheet).label = newName;
        },
        clearSheet : function (labelOrIndex) {
            /*
            Acetate.clearSheet --
            clear a sheet by label or index, this is just a wrapper for the far more powerful Acetate.clear()

            labelOrIndex -- a sheet name or sheet index of a sheet to be cleared
             */
            this.clear(labelOrIndex);
        },
        mergeAll : function () {
            /*
            Acetate.mergeAll() --
            merge down all sheets into one sheet, then delete all the above sheets

             */
            var bottomContext,
            i,
            len,
            sheet;
            // if there are two or more sheets merge down sheets
            if (this.sheet.length >= 2) {
                bottomContext = this.getContext(0);
                // draw sheets to bottom sheet from the bottom up
                for (i = 1, len = this.sheet.length; i != len; i++) {
                    sheet = this.get(i);
                    bottomContext.drawImage(sheet.dom, 0, 0, sheet.dom.width, sheet.dom.height, 0, 0, sheet.dom.width, sheet.dom.height);
                };

                // kill all the sheets
                for (i = this.sheet.length - 1; i != 0; i--) {
                    sheet = this.get(i);
                    this.container.removeChild(sheet.dom);
                    this.sheet.pop();
                }
                this.sheetCount = 1; // here is now only one sheet
            }
        },
        tintAll : function (tint) {
            /*
            Acetate.tintAll(tint) --
            tint all of the sheets so you can see them

            tint -- should be a number between 0 and 1
             */
            if (tint === undefined) {
                var tint = 0.1;
            }
            var i = 0;
            for (var i = 0; i != this.sheet.length; i++) {
                var sheet = this.get(i);
                sheet.context.fillStyle = 'rgba(172,255,255,' + tint + ')';
                sheet.context.fillRect(0, 0, sheet.dom.width, sheet.dom.height);
            };

        },
        circleSheets : function () {
            var radius = 200;

            var i = 0,
            len = this.sheet.length;

            var rStep = Math.PI * 2 / len;
            var radian = 0;
            while (i < len) {
                var s = this.sheet[i].dom.style;
                s.left = Math.round(Math.sin(radian) * radius) + 'px';
                s.top = Math.round(Math.cos(radian) * radius) + 'px';
                radian += rStep; //Math.PI*2/10;
                i++;
            }
        },
        cascadeSheets : function (aurgObj) {
            /*
            Acetate.cascadeSheets(percent) --
            cascade all of the sheets

            aurgObj -- an object that can be used to set the following settings
            radian -- the angle that the cascade is to flow in radians
            steping -- the steping rate in pixels
             */

            var aurgs = ['radian', 'steping'],
            defaults = [1.25, 30],
            len,
            i;

            if (aurgObj === undefined) {
                aurgObj = {};
            }

            // set undefined properties to hard coded defaults
            for (i = 0, len = aurgs.length; i !== len; i++) {
                if (aurgObj[aurgs[i]] === undefined) {
                    // if argument is undefined set default
                    aurgObj[aurgs[i]] = defaults[i];
                }
            }
            len = this.sheet.length,
            i = len;
            while (i--) {
                sheet = this.get(i);
                sheet.dom.style.left = Number(Math.sin(aurgObj.radian) * i * aurgObj.steping) + 'px';
                sheet.dom.style.top = Number(Math.cos(aurgObj.radian) * i * aurgObj.steping) + 'px';
            };

            /*
            if (percent === undefined) {
            var percent = 0.75;
            }
            var len = this.sheet.length,
            i = len,
            xSteping = Math.round((this.scaledWidth / len) * percent),
            ySteping = Math.round((this.scaledHeight / len) * percent),
            sheet;
            while (i--) {
            sheet = this.get(i);
            sheet.dom.style.left = Number(i * xSteping) + 'px';
            sheet.dom.style.top = Number(i * ySteping) + 'px';
            };
             */
        },
        draw : function (sheet, points, options) {
            /*
            Acetate.draw(sheet,points,fill) --
            draw an array of points to a sheet

            sheet -- is the index or label of the sheet to draw to

            points -- is the array of points that will draw the shape

             */

			 // set the options object if not defined
			 if(options ===undefined) {options={};}
			 
			 //set defaults for unset properties
			 if(!('fill' in options)){options.fill='fillAndStroke';}
			 if(!('strokeStyle' in options)){options.strokeStyle='#000000';}
			 if(!('fillStyle' in options)){options.fillStyle='#ffffff';}
			 if(!('lineWidth' in options)){options.lineWidth=6;}
			 
            var s = this.getContext(sheet),
            i = points.length - 1,
            eTest = function (num) {
                var str = Number(num / 2) + '';
                if (str.indexOf('.') === -1) {
                    return true;
                } else {
                    return false;
                }
            };

			// if an even numer of points draw
            if (eTest(points.length)) {
                s.beginPath();
                s.moveTo(points[i - 1], points[i]);
                i -= 2;
                while (i > -1) {
                    s.lineTo(points[i - 1], points[i]);
                    i -= 2;
                }
				if(options.close){
                s.closePath();
				};

				s.fillStyle = options.fillStyle;    
                s.strokeStyle = options.strokeStyle;
				s.lineWidth=options.lineWidth;
				switch(options.fill){
				    case 'fillAndStroke':
					     s.stroke();
						 s.fill();
					break;
					case 'fill':
						 s.fill();
					break;
					case 'stroke':
					     s.stroke();
					break;
				}
            }
            //alert(evenTest(points.length))
        },
        makePollygon : function (radius, points) {
            /*
            Acetate.pollygon(x,y,radius, points) --
            make a drawing of a polygon which will be added to Acetate.drawings

            x  -- the x cornet of the center of the polygon

            y -- the y cordnet of the center of the pollygon

            radius -- the radius of the pollygon

            points -- the number of points, the more points the closer to a circle
             */
            var x = 0,
            y = 0;
            var index = this.drawings.length,
            theDrawing = [],
            radian = 0,
            radianStep = Math.PI * 2 / points;
            var di = 0;
            while (points--) {
                for (var cor = 0; cor != 2; cor++) {
                    switch (cor) {
                    case 0:
                        theDrawing[di] = x + Math.sin(radian) * radius;
                        break;
                    case 1:
                        theDrawing[di] = y + Math.cos(radian) * radius;
                        break;
                    }
                    di++;

                    /*
                    theDrawing[pos]=x: x + Math.sin(radian) * radius,
                    y: y + Math.cos(radian) * radius
                     */
                }
                radian += radianStep;
            }

            this.drawings[index] = theDrawing;
        },
        placeDrawing : function (drawingIndex, sheet, x, y) {
            /*
            Acetate.placeDrawing(drawingIndex,sheet) --

            place a drawing into a sheet

            drawingIndex -- the index of the drawing in Acetate.drawings

            sheet -- the index of label of the sheet to render the drawing to.
             */
            var points = [],
            drawing = this.drawings[drawingIndex],
            axis = 0;
            for (var i = 0, len = drawing.length; i !== len; i++) {

                switch (axis) {
                case 0:

                    points[i] = drawing[i] + x;
                    break;
                case 1:
                    points[i] = drawing[i] + y;
                    break;

                };
                axis++;
                if (axis === 2)
                    axis = 0;
            }
            //this.draw(sheet, this.drawings[drawingIndex], false)
            //alert(typeof x)
            this.draw(sheet, points, false);
        },
        randomSheets : function (range) {
            /*
            Acetate.randomSheets(range)
            randomly shuffle the position of the sheets around

            range -- the higher the range the higher the potential deviation from there normal position
             */
            if (range === undefined) {
                var range = 200;
            }
            for (var s = 0, len = this.sheet.length; s != len; s++) {
                this.sheet[s].setPos(Math.round(Math.random() * range * 2) - range, Math.round(Math.random() * range * 2) - range);
            }
        },
        zSwap : function (toMove, moveTo) {
            /*
            Acetate.zOrgerSwap(toMove, moveTo)
            swap two sheets z oder position

            toMove   -- a sheet index number

            moveTo -- the other sheet index number
             */
            var temp = [],
            len = this.sheet.length,
            i;
            for (i = 0; i != len; i++) {
                if (i !== toMove && i !== moveTo) {
                    temp[i] = this.sheet[i];
                } else {
                    if (i === toMove) {
                        temp[i] = this.sheet[moveTo];
                    }
                    if (i === moveTo) {
                        temp[i] = this.sheet[toMove];
                        //temp[i] = this.sheet[i];
                    }
                }
            }

            this.sheet = temp;

            for (i = 0; i != len; i++) {
                this.sheet[i].dom.style.zIndex = i;
            }
        },
        zMove : function (toMove, moveThere) {
            var temp = [],
            si = 0,
            ti = 0,
            len = this.sheet.length;

            // generate the temporary array
            while (si < len) {
                if (si === toMove) {

                    si++;
                } else {
                    if (ti === moveThere) {
                        temp[ti] = this.sheet[toMove];
                        ti++;
                    }

                    temp[ti] = this.sheet[si];
                    ti++;
                    si++;

                }

            }

            if (moveThere === len - 1) {
                temp[len - 1] = this.sheet[toMove];
            }
            // set the temp to the actual
            this.sheet = temp;
            //alert(temp[4].label)
            // update zIndex CSS
            for (si = 0; si != len; si++) {
                this.sheet[si].dom.style.zIndex = si;
            }
            //alert(temp[4].label);
        },
        centerContainer : function () {
            /*
            Acetate.centerContainer() --
            center the Acetate project container based on scaled width and height
             */
            this.container.style.position = 'fixed';
            this.container.style.left = Math.round(window.innerWidth / 2 - this.scaledWidth / 2) + 'px';
            this.container.style.top = Math.round(window.innerHeight / 2 - this.scaledHeight / 2) + 'px';
        },
        hide : function (sheet) {
            var s = this.get(sheet);
            s.dom.style.display = 'none';
        },
        show : function (sheet) {
            var s = this.get(sheet);
            s.dom.style.display = 'block';
        },

        // Methods to add

        zRandom:function () {},
        moveSheet:function () {},
        resizeSheet:function () {},
        scaleSheet:function () {},
        mergeDown:function () {
            /*
            Acetate.mergeDown(sheet)  --
            merge down a sheet to the sheet bellow it and combine the two sheets into one
             */
        },
        merge:function (sheets) {
            /*
            sheets -- an array of two or more sheet indexes or labels to merge down, first sheet given is the lowest z index.
             */
        }

    }; // end of Acetate Prototype

    /*
    var Drawing = function(project, points){
    var index = project.drawings.length;
    };
     */
    var Sheet = function (obj) {
        if (obj === undefined) {
            var obj = {};
        }
        //var aurgs = 'container,width,height,scaledWidth,scaledHeight'.split(','),
        //defaults = 'none,640,480,640,480'.split(','),
        var aurgs = ['container', 'width', 'height', 'scaledWidth', 'scaledHeight', 'label', 'append'],
        defaults = [undefined, '640', '480', '640', '480', 'new sheet', true],
        i,
        len;
        // set undefined properties to hard coded defaults
        for (i = 0, len = aurgs.length; i !== len; i++) {
            if (obj[aurgs[i]] === undefined) {
                this[aurgs[i]] = defaults[i];
            } else {
                this[aurgs[i]] = obj[aurgs[i]];
            }
        }

        /* if no container is provided make one */
        if (obj.container === undefined) {
            this.container = document.createElement('div');
            document.body.appendChild(this.container);
        } else {
            /* else use the one provided */
            //alert(typeof obj.width)
            if (typeof obj.container === 'object') {
                /* if an object assume a dom element reference */
                this.container = obj.container;
            }
            if (typeof obj.container === 'string') {
                /* if a string assume an id */
                this.container = document.getElementById(obj.container);
            }
            if (typeof obj.container === 'number') {
                /* if a number assume an index */
                this.container = document.getElementsByTagName('div')[obj.container];
            }
        }
        this.dom = document.createElement('canvas');
        this.dom.width = obj.width;
        this.dom.height = obj.height;

        // set the starting CSS values of the Sheet
        this.dom.style.width = obj.scaledWidth + 'px';
        this.dom.style.height = obj.scaledHeight + 'px';
        this.dom.style.position = 'absolute';
        this.dom.style.zIndex = this.container.childNodes.length;

        // iff append flag is ture append the canvas to the document
        if (this.append) {
            this.container.appendChild(this.dom);
        };
        this.context = this.dom.getContext('2d');

    };

    Sheet.prototype = {
        cls : function () {
            /*  Canvas.cls() Are you familiar with what CLS did in a language called quick basic?
            Me neither...

            This method does save you a wee bit of typing in Layers...

            project.layer[0].context.clearRect(0,0,this.dom.width,this.dom.height);

            is reduced to

            project.layer[0].cls();

            However maybe this should be a method of Layers?

            project.cls(0); // would then do the same

            project.cls(2,5) // cls a range of layers

            project.cls([3,5,9]) // of a list of layers

            and then
            project.cls(); // would clear all layers

            yeah, maybe that is better, or maybe I should do both? I don't know, this is hard.
             */
            this.context.clearRect(0, 0, this.dom.width, this.dom.height);
        },
        clsArea : function (x, y, w, h) {
            /*
            Canvas.clsArea(x,y,w,h) can be used to clear a square area of the canvas starting at x,y
            and has dimensions of w and h;

            problem: are methods like this silly? take a look...
            project.layer[0].context.clearRect(10,10,100,100);
            project.layer[0].clsArea(10,10,100,100);

            is that really all that much more of a deal?
            maybe I should ditch these?
             */
            this.context.clearRect(x, y, w, h);
        },
        fillTo : function (clearColor) {
            if (clearColor === undefined)
                var clearColor = '#000000';
            this.context.fillStyle = clearColor;
            this.context.fillRect(0, 0, this.dom.width, this.dom.height);
        },
        setNativeRes : function (x, y) {
            this.dom.width = x;
            this.dom.height = y;
        },
        setScaledRes : function (x, y) {
            this.dom.style.width = x + 'px';
            this.dom.style.height = y + 'px';
        },
        setPos : function (x, y) {
            this.dom.style.left = x + 'px';
            this.dom.style.top = y + 'px';
        }

    }; // end Sheet prototype
    
}
    (this));
