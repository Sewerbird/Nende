//Global Singletons
var stage;
var ui_fsm;

function launch(options){

	var display = options.display,
		size = options.size,
		renderer = PIXI.autoDetectRenderer(size.width, size.height,{antialias:true, interactive:true})
		stage = new PIXI.Stage(0xDDDDDD);

	//Implement Finite State Machine for UI
		//FSM
		ui_fsm = StateMachine.create({
		  initial: 'NONE',
		  events: [
		    { name: 'launch',  from: 'NONE',  to: 'INITIALIZING' },
		    { name: 'initialized', from: 'INITIALIZING', to: 'LANDING' },
		    { name: 'startNewGame', from:'LANDING', to: 'CONFIGURING' },
		    { name: 'play', from:'CONFIGURING', to: 'PLAYING' },
		    { name: 'cancelPlay', from: 'CONFIGURING', to: 'LANDING' },
		    { name: 'pause', from: 'PLAYING', to: 'PAUSED' },
		    { name: 'unpause', from: 'PAUSED', to: 'PLAYING' },
		    { name: 'showMenu', from: 'PLAYING', to: 'MENU' },
		    { name: 'quitGame', from: 'MENU', to: 'QUITTING' },
		    { name: 'confirmQuit', from: 'QUITTING', to: 'LANDING' },
		    { name: 'cancelQuit', from: 'QUITTING', to: 'MENU' },
		    { name: 'saveGame', from: 'MENU', to: 'SAVING' },
		    { name: 'quitSave', from: 'SAVING', to: 'MENU' },
		    { name: 'loadGame', from: 'MENU', to: 'LOADING' },
		    { name: 'quitLoad', from: 'LOADING', to: 'MENU' },
		    { name: 'switchGame', from: 'LOADING', to: 'SWITCHING'},
		    { name: 'confirmSwitch', from: 'SWITCHING', to: 'CONFIGURING'},
		    { name: 'cancelSwitch', from: 'SWITCHING', to: 'LOADING'},
		    { name: 'editOptions', from: 'MENU', to: 'OPTIONS'},
		    { name: 'quitOptions', from: 'OPTIONS', to: 'MENU'},
		    { name: 'exit', from: 'LANDING', to: 'NONE'}
		]});
		//Screens & Their Transitions
		var screens = 
			{
				initializing: new InitializingScreen(),
				landing 	: new LandingScreen(),
				configuring	: new ConfigurationScreen(),
				playing		: new PlayingScreen(),
				paused		: new PausedScreen(),
				menu		: new MenuScreen(),
				quitting	: new QuittingScreen(),
				switching	: new SwitchingScreen(),
				saving		: new SavingScreen(),
				loading		: new LoadingScreen(),
				options		: new OptionsScreen()
			}
		//Screens can share elements amongst states
		var viewElements = 
			{
				pregameBubbleBox : new BubbleBox()
			}

		//Wire up default show/hide callbacks for all the screens
		_.each(_.keys(screens),function(screenKey){
			ui_fsm["onenter"+screenKey.toUpperCase()] = screens[screenKey].show.bind(screens[screenKey]);
			ui_fsm["onleave"+screenKey.toUpperCase()] = screens[screenKey].hide.bind(screens[screenKey]);
		});
		ui_fsm["onenterLANDING"] = function(){
			stage.addChild(viewElements.pregameBubbleBox.doc);
			viewElements.pregameBubbleBox.show();
			viewElements.pregameBubbleBox.enshroud(screens.landing,true);
			screens.landing.show();
		}
		ui_fsm["onleaveLANDING"] = function(){
			screens.landing.hide();
			viewElements.pregameBubbleBox.release();
		}
		ui_fsm["onenterCONFIGURING"] = function(){
			viewElements.pregameBubbleBox.enshroud(screens.configuring,true);
			screens.configuring.show();
		}
		ui_fsm["onleaveCONFIGURING"] = function(){
			screens.configuring.hide();
			viewElements.pregameBubbleBox.release();
		}
		ui_fsm["onenterPLAYING"] = function(){
			viewElements.pregameBubbleBox.hide();
			stage.removeChild(viewElements.pregameBubbleBox.doc);
		}

	//Start Rendering Loop
	document.getElementById(display).appendChild(renderer.view);
	function animate() {
	    requestAnimationFrame(animate);
	    renderer.render(stage);
	}
	animate()

	//debug: Simulate transition states
	ui_fsm.launch();
	setTimeout(ui_fsm.initialized.bind(ui_fsm),500);
}

function BubbleBox(init)
{
	var me = this;
	this.doc = new PIXI.DisplayObjectContainer();
	this.bubbles = _.times(300,function(){
		var bubble = new PIXI.Graphics()
			.beginFill(0xFFFFFF)
			.lineStyle(2, 0x999999, 0.2)
			.drawCircle(0,0, Math.random() * 30);
		bubble.yrate = 1.0 * Math.random();
		bubble.xrate = 0.5 * Math.random();
		bubble.phaseoffset = Math.random() * 2 * Math.PI;
		bubble.alpha = 0.9
		bubble.position = {
			x : Math.random() * 800,
			y : Math.random() * 600
		}
		me.doc.addChild(bubble);
		return bubble;
	});
}
BubbleBox.prototype.show = function()
{
	//Animate the bubbles
	_.each(this.bubbles,function(bubble){
		bubble.animref = setInterval(function(){
			var upprogress = bubble.position.y / 600;
			bubble.position.y -= bubble.yrate
			bubble.position.x += Math.sin(upprogress * Math.PI + bubble.phaseoffset) * bubble.xrate;
			bubble.scale.x = Math.sin(upprogress * 0.5 * Math.PI) * 1.2;
			bubble.scale.y = Math.sin(upprogress * 0.5 * Math.PI) * 1.2;
			if(bubble.position.y < -30)
				bubble.position = { x: Math.random() * 800,  y: 630 }
		},10);
	});
	stage.setBackgroundColor(0xFFEEEE);
}
BubbleBox.prototype.enshroud = function(screen, isAmidst)
{
	this.enshroudedScreen = screen;
	this.doc.addChild(this.enshroudedScreen.doc);
	if(isAmidst)
	{
		this.doc.swapChildren(this.enshroudedScreen.doc,this.bubbles[this.bubbles.length/2]);
	}
}
BubbleBox.prototype.release = function()
{
	this.doc.removeChild(this.enshroudedScreen.doc);
	this.enshroudedScreen = undefined;
}
BubbleBox.prototype.hide = function()
{
	stage.setBackgroundColor(0x002222);
	//Stop animating the bubbles
	_.each(this.bubbles,function(bubble){
		clearInterval(bubble.animref);
	})
}

function InitializingScreen(init)
{
	var me = this;

	//GRAPHICS
	this.doc = new PIXI.DisplayObjectContainer();
	this.rotator = new PIXI.Graphics()
		.beginFill(0x335555)
		.lineStyle(4, 0x116666)
		.drawCircle(0,0,130)
		.beginFill(0x119999)
		//.drawCircle(0,0,15)
		.lineStyle(13, 0x119999)
		.lineStyle(2, 0x55FFFF)
		/*
		.moveTo(0,0)
		.lineTo(130,0)
		.moveTo(0,0)
		.lineTo(135,0)
		*/
	for(var i = 0, angle = Math.PI/6; i < 11; i++, angle+=(Math.PI/6)){
		this.rotator.drawCircle(100 * Math.cos(angle), 100 * Math.sin(angle),i);
	}
	this.rotator.position = { x: 400, y:300 }
	this.rotator.rotation = -Math.PI/2
	this.doc.addChild(this.rotator);
}
InitializingScreen.prototype.show = function(evt, from, to, payload){
	console.log("SHOWING",ui_fsm.current,"STATE. (",payload,")")
	var me = this;

	this.rotator.animref = setInterval(function(){
		me.rotator.rotation += 0.05
	},10)
	stage.setBackgroundColor(0x111111);
	stage.addChild(this.doc);
}
InitializingScreen.prototype.hide = function(evt, from, to, payload){
	console.log("HIDING",ui_fsm.current,"STATE. (",payload,")")
	stage.removeChild(this.doc);
	clearInterval(this.rotator.animref);
}

function LandingScreen(init)
{
	var me = this;

	//GRAPHICS
	this.doc = new PIXI.DisplayObjectContainer();

	this.titletext = _.extend(new PIXI.Text("N E N Ð E",{font:'bold 90px Arial',fill:'#224444'}),{
		position : { x: 400, y: 300 },
		anchor : { x: 0.5, y: 0.5 },
		defposy : 320
	});
	this.titletext.interactive = true;
	this.titletext.mouseup = this.titletext.tap = this.startNewGame.bind(this);
	this.subtitle = _.extend(new PIXI.Text("by Edward Miller",{font:'10px Arial', fill:'#AAAAAA'}),{
		position: { x: 795, y: 605 },
		anchor : { x: 1.0, y: 1.0 }
	})
	this.doc.addChild(this.subtitle);
	this.doc.addChild(this.titletext);
}
LandingScreen.prototype.startNewGame = function()
{
	console.log("foo");
	ui_fsm.startNewGame({isNew:true});
}
LandingScreen.prototype.show = function(evt, from, to, payload){
	console.log("SHOWING",ui_fsm.current,"STATE. (",payload,")")
	var me = this;

	this.titletext.animref = setInterval(function(){
		me.titletext.position.y = me.titletext.defposy + Math.sin(Date.now()/200) * 2 + Math.sin(Date.now()/1000) * 10
	},10)
}
LandingScreen.prototype.hide = function(evt, from, to, payload){
	console.log("HIDING",ui_fsm.current,"STATE. (",payload,")")
	//Pause the bubbles
	clearInterval(this.titletext.animref)
}

function ConfigurationScreen(init)
{
	var me = this;

	//GRAPHICS
	this.doc = new PIXI.DisplayObjectContainer();

	this.titletext = _.extend(new PIXI.Text("Configuration Stuff",{font:'bold 90px Arial',fill:'#224444'}),{
		position : { x: 400, y: 300 },
		anchor : { x: 0.5, y: 0.5 },
		defposy : 320
	});
	this.titletext.interactive = true;
	this.titletext.mouseup = this.titletext.tap = this.beginGame.bind(this);
	this.doc.addChild(this.titletext);
}
ConfigurationScreen.prototype.beginGame = function(){
	ui_fsm.play();
}
ConfigurationScreen.prototype.show = function(evt, from, to, payload)
{
	console.log("SHOWING",ui_fsm.current,"STATE. (",payload,")")
}
ConfigurationScreen.prototype.hide = function(evt, from, to, payload)
{
	console.log("HIDING",ui_fsm.current,"STATE. (",payload,")")
}

function PlayingScreen(init)
{
	var me = this;

}
PlayingScreen.prototype.show = function(evt, from, to, payload)
{
	console.log("SHOWING",ui_fsm.current,"STATE. (",payload,")")
}
PlayingScreen.prototype.hide = function(evt, from, to, payload)
{
	console.log("HIDING",ui_fsm.current,"STATE. (",payload,")")
}

function PausedScreen(init)
{

}
PausedScreen.prototype.show = function(evt, from, to, payload)
{
	console.log("SHOWING",ui_fsm.current,"STATE. (",payload,")")
}
PausedScreen.prototype.hide = function(evt, from, to, payload)
{
	console.log("HIDING",ui_fsm.current,"STATE. (",payload,")")
}

function MenuScreen(init)
{

}
MenuScreen.prototype.show = function(evt, from, to, payload)
{
	console.log("SHOWING",ui_fsm.current,"STATE. (",payload,")")
}
MenuScreen.prototype.hide = function(evt, from, to, payload)
{
	console.log("HIDING",ui_fsm.current,"STATE. (",payload,")")
}

function QuittingScreen(init)
{

}
QuittingScreen.prototype.show = function(evt, from, to, payload)
{
	console.log("SHOWING",ui_fsm.current,"STATE. (",payload,")")
}
QuittingScreen.prototype.hide = function(evt, from, to, payload)
{
	console.log("HIDING",ui_fsm.current,"STATE. (",payload,")")
}

function SwitchingScreen(init)
{

}
SwitchingScreen.prototype.show = function(evt, from, to, payload)
{
	console.log("SHOWING",ui_fsm.current,"STATE. (",payload,")")
}
SwitchingScreen.prototype.hide = function(evt, from, to, payload)
{
	console.log("HIDING",ui_fsm.current,"STATE. (",payload,")")
}

function SavingScreen(init)
{

}
SavingScreen.prototype.show = function(evt, from, to, payload)
{
	console.log("SHOWING",ui_fsm.current,"STATE. (",payload,")")
}
SavingScreen.prototype.hide = function(evt, from, to, payload)
{
	console.log("HIDING",ui_fsm.current,"STATE. (",payload,")")
}

function LoadingScreen(init)
{

}
LoadingScreen.prototype.show = function(evt, from, to, payload)
{
	console.log("SHOWING",ui_fsm.current,"STATE. (",payload,")")
}
LoadingScreen.prototype.hide = function(evt, from, to, payload)
{
	console.log("HIDING",ui_fsm.current,"STATE. (",payload,")")
}

function OptionsScreen(init)
{

}
OptionsScreen.prototype.show = function(evt, from, to, payload)
{
	console.log("SHOWING",ui_fsm.current,"STATE. (",payload,")")
}
OptionsScreen.prototype.hide = function(evt, from, to, payload)
{
	console.log("HIDING",ui_fsm.current,"STATE. (",payload,")")
}