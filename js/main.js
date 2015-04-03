// Initialize Phaser, and create a 320x505px game
var game = new Phaser.Game(320, 505, Phaser.AUTO, 'gameDiv');

// Create necessary sence

// Game's start state
var boot = {	
	preload: function(){
		// Scale manager
		if(!game.device.desktop){
			this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
			this.scale.forcePortrait = true;
			this.scale.refresh();
		}
		game.stage.backgroundColor = '#71c5cf' ;
		game.load.image('loading','assets/preloader.gif'); // Load loading image
	},

	create: function(){
		game.state.start('preload'); // Call preload scene after loading is completed
	}
};

// This is where we load the game's assets 
var preload = {
	preload: function(){
        var preloadSprite = game.add.sprite(50,game.height/2,'loading'); // create a sprite to display loading progress
        game.load.setPreloadSprite(preloadSprite);  // The effect of dynamic progress bar by setPreloadSprite        
        
        // Preload Resource
        game.load.image('background','assets/background.png'); // Background image
        game.load.image('ground','assets/ground.png'); // Ground image
        game.load.image('title','assets/title.png'); // Title image 
        game.load.spritesheet('bird','assets/bird.png',34,24,3); // Bird image
        game.load.image('btn','assets/start-button.png');  // Button image
        game.load.spritesheet('pipe','assets/pipes.png',54,320,2); // Pipes image        
        game.load.audio('fly_sound', 'assets/flap.wav');// Sound of fly
        game.load.audio('score_sound', 'assets/score.wav');// Sound of win
        game.load.audio('hit_pipe_sound', 'assets/pipe-hit.wav'); // Sound of hit the pipe
        game.load.audio('hit_ground_sound', 'assets/ouch.wav'); // Sound of hit the ground
        game.load.image('ready_text','assets/get-ready.png'); // Get ready image
        game.load.image('play_tip','assets/instructions.png'); // Play info image
        game.load.image('game_over','assets/gameover.png'); // Gameover image
        game.load.image('score_board','assets/scoreboard.png'); // Score board image
    },

    create: function(){
        game.state.start('menu'); // Enter the menu scene after load these resource
    }
};

// The game menu state
var menu = {
	create: function(){
		game.add.tileSprite(0,0,game.width,game.height,'background').autoScroll(-10,0); // background image
		game.add.tileSprite(0,game.height-112,game.width,112,'ground').autoScroll(-100,0); // ground image
		var titleGroup = game.add.group(); // Create a group to save title
		titleGroup.create(0,0,'title'); // Title
		var bird = titleGroup.create(190, 10, 'bird'); // Add bird to the group
		bird.animations.add('fly'); // Add animations
		bird.animations.play('fly',12,true); // Play the animations
		titleGroup.x = 35;
		titleGroup.y = 100;
		game.add.tween(titleGroup).to({ y:120 },1000,null,true,0,Number.MAX_VALUE,true); // Title animation
		var btn = game.add.button(game.width/2,game.height/2,'btn',function(){// Start button
			game.state.start('play');
		});
		btn.anchor.setTo(0.5,0.5);
	}
};

// The game's main state
var play = {
	create: function(){
		this.bg = game.add.tileSprite(0,0,game.width,game.height,'background');// Background image
		this.pipeGroup = game.add.group();
		this.pipeGroup.enableBody = true;
		this.ground = game.add.tileSprite(0,game.height-112,game.width,112,'ground'); // Ground image
		this.bird = game.add.sprite(50,150,'bird'); // Add bird to the game
		this.bird.animations.add('fly');
		this.bird.animations.play('fly',12,true);
		this.bird.anchor.setTo(0.5, 0.5);
		game.physics.enable(this.bird,Phaser.Physics.ARCADE); // Bird turned physical system
		this.bird.body.gravity.y = 0; // Add gravity to the bird to make it fall
		game.physics.enable(this.ground,Phaser.Physics.ARCADE);// Ground
		this.ground.body.immovable = true; // Stationary

		this.soundFly = game.add.sound('fly_sound');
		this.soundScore = game.add.sound('score_sound');
		this.soundHitPipe = game.add.sound('hit_pipe_sound');
		this.soundHitGround = game.add.sound('hit_ground_sound');
		this.scoreText = game.add.text(game.world.centerX-20, 30, "0", {font:"2em Arial", fill: "#fff"});

		this.readyText = game.add.image(game.width/2, 30, 'ready_text'); // Get ready fonts
		this.playTip = game.add.image(game.width/2,300,'play_tip'); // Tip tap
		this.readyText.anchor.setTo(0.5, 0);
		this.playTip.anchor.setTo(0.5, 0);

		this.hasStarted = false; // Whether the game has started
		game.time.events.loop(900, this.generatePipes, this); // Add a timer 
		game.time.events.stop(false);
		game.input.onDown.addOnce(this.statrGame, this);
	},

	update: function(){
		if(!this.hasStarted) return; // The game is not start
		game.physics.arcade.collide(this.bird,this.ground, this.hitGround, null, this); // Hit the ground
		game.physics.arcade.overlap(this.bird, this.pipeGroup, this.hitPipe, null, this); // Hit the pipes
		if(this.bird.angle < 90) this.bird.angle += 2.5; // Upside down when drop 
		this.pipeGroup.forEachExists(this.checkScore,this); // Score detect and update
	},

	statrGame: function(){
		this.gameSpeed = 200; //Game Speed
		this.gameIsOver = false;
		this.hasHitGround = false;
		this.hasStarted = true;
		this.score = 0;
		this.bg.autoScroll(-(this.gameSpeed/10),0);
		this.ground.autoScroll(-this.gameSpeed,0);
		this.bird.body.gravity.y = 1150; // Set gravity for the bird
		this.readyText.destroy();
		this.playTip.destroy();
		game.input.onDown.add(this.fly, this);
		game.time.events.start();
	},

	stopGame: function(){
		this.bg.stopScroll();
		this.ground.stopScroll();
		this.pipeGroup.forEachExists(function(pipe){
			pipe.body.velocity.x = 0;
		}, this);
		this.bird.animations.stop('fly', 0);
		game.input.onDown.remove(this.fly,this);
		game.time.events.stop(true);
	},

	fly: function(){
		this.bird.body.velocity.y = -350;
		game.add.tween(this.bird).to({angle:-30}, 100, null, true, 0, 0, false); // Head-on when rise
		this.soundFly.play();
	},

	hitPipe: function(){
		if(this.gameIsOver) return;
		this.soundHitPipe.play();
		this.gameOver();
	},

	hitGround: function(){
		if(this.hasHitGround) return; // Had hit the ground
		this.hasHitGround = true;
		this.soundHitGround.play();
		this.gameOver(true);
	},

	gameOver: function(show_text){
		this.gameIsOver = true;
		this.stopGame();
		if(show_text) this.showGameOverText();
	},

	showGameOverText: function(){
		this.scoreText.destroy();
		game.bestScore = game.bestScore || 0;
		if(this.score > game.bestScore) game.bestScore = this.score; // Best score
		this.gameOverGroup = game.add.group(); // Add a group
		var gameOverText = this.gameOverGroup.create(game.width/2,0,'game_over'); // Game over font image
		var scoreboard = this.gameOverGroup.create(game.width/2,70,'score_board'); // Score board		
		var currentScoreText = game.add.text(game.width/2 + 60, 105, this.score+'', {font:"2em Arial", fill: "#fff"}, this.gameOverGroup);		
		var bestScoreText = game.add.text(game.width/2 + 60, 153, game.bestScore+'', {font:"2em Arial", fill: "#fff"}, this.gameOverGroup); // Best score
		var replayBtn = game.add.button(game.width/2, 210, 'btn', function(){// Play again button
			game.state.start('play');
		}, this, null, null, null, null, this.gameOverGroup);
		gameOverText.anchor.setTo(0.5, 0);
		scoreboard.anchor.setTo(0.5, 0);
		replayBtn.anchor.setTo(0.5, 0);
		this.gameOverGroup.y = 30;
	},

	generatePipes: function(gap){ // Using pipes to make a path
		gap = gap || 100; // The path height
		var position = (505 - 320 - gap) + Math.floor((505 - 112 - 30 - gap - 505 + 320 + gap) * Math.random());
		var topPipeY = position-360;
		var bottomPipeY = position+gap;

		if(this.resetPipe(topPipeY,bottomPipeY)) return;

		var topPipe = game.add.sprite(game.width, topPipeY, 'pipe', 0, this.pipeGroup);
		var bottomPipe = game.add.sprite(game.width, bottomPipeY, 'pipe', 1, this.pipeGroup);
		this.pipeGroup.setAll('checkWorldBounds',true);
		this.pipeGroup.setAll('outOfBoundsKill',true);
		this.pipeGroup.setAll('body.velocity.x', -this.gameSpeed);
	},

	resetPipe: function(topPipeY,bottomPipeY){// Kill the pipe when it's no longer visible and reuse
		var i = 0;
		this.pipeGroup.forEachDead(function(pipe){
			if(pipe.y<=0){ // Top Pipe
				pipe.reset(game.width, topPipeY);
				pipe.hasScored = false; // Reset score
			}else{
				pipe.reset(game.width, bottomPipeY);
			}
			pipe.body.velocity.x = -this.gameSpeed;
			i++;
		}, this);
		return i == 2; // IF i==2 On behalf of a group of pipeline has been out of the border, the pipeline can be recovered this group
	},

	checkScore: function(pipe){// Responsible for detecting and updating Score
		if(!pipe.hasScored && pipe.y<=0 && pipe.x<=this.bird.x-17-54){
			pipe.hasScored = true;
			this.scoreText.text = ++this.score;
			this.soundScore.play();
			return true;
		}
		return false;
	}
};

// The defined scene added to the game
game.state.add('boot', boot);
game.state.add('preload', preload); 
game.state.add('menu', menu); 
game.state.add('play', play);

// Call boot to start the game
game.state.start('boot');