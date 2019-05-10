class mainScene extends Phaser.Scene {
    constructor() {
        super({ key: "mainScene" });
    }

    /*
        Used to load images/sounds and give them references
     */
    preload() {
        this.load.image('player', 'assets/player.png'); //load player.png as 'player'
        this.load.image('pipe', 'assets/pipe.png'); //load pipe.png as 'pipe'

    }

    /*
        Used to set up socket connection, socket functions, keyboard actions, physics groups, and any variables
     */
    create() {

        //establish socket connection with server
        this.socket = io("http://localhost:8081");

        //initialize a group to later be used to store every player EXCEPT the one currently playing
        this.otherPlayers = this.add.group();

        this.pipes = this.add.group();
        this.pipes.setDepth(100);

        this.waitingText = this.add.text(225, 150, "WAITING FOR PLAYERS...", { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle", stroke: '#000000', strokeThickness: 6 });
        this.waitingText.alpha = 0.0;
        this.waitingText.setDepth(2);

        this.countDownText = this.add.text(225, 150, "", { font: "bold 32px Arial", fill: "#ff0000", boundsAlignH: "center", boundsAlignV: "middle", stroke: '#000000', strokeThickness: 6 });
        this.countDownText.alpha = 0.0;
        this.countDownText.setDepth(3);

        this.gameEndText = this.add.text(225, 150, "", { font: "bold 18px Arial", fill: "#f6f413", boundsAlignH: "center", boundsAlignV: "middle", stroke: '#000000', strokeThickness: 4 });
        this.gameEndText.alpha = 0.0;
        this.gameEndText.setDepth(3);

        this.highScoreText = this.add.text(750, 10, "", { font: "15px Arial", fill: "#ffffff", stroke: '#000000', strokeThickness: 2 });
        this.highScoreText.setDepth(4);

        this.highScoreAlertText = this.add.text(10, 10, "", { font: "32px Arial", fill: "#ffffff", stroke: '#000000', strokeThickness: 6 });
        this.highScoreAlertText.alpha = 0.0;
        this.highScoreAlertText.setDepth(5);


        initializeSocketOnEvents(this);

        this.spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.input.on('pointerdown', pointer => {
            if (this.player) {
                if (this.player.isActive) {
                    this.player.setVelocity(0, -420);
                }
            }
        });
    }

    update(dt) {
        if (this.player) {
            if (this.player.isActive) {
                if (Phaser.Input.Keyboard.JustDown(this.spacebar)) {
                    this.player.setVelocity(0, -420);
                }
                //sent to app.js
                this.socket.emit("updateY", Math.round(this.player.body.y + this.HALFHEIGHT));//add 20 bc its offset from center
            }
        }

    }
    //only triggered when a new player joins, make sure all properties of player match those in receivePlayers
    addOtherPlayer(playerInfo) {
        const randomColor = Math.floor(Math.random() * 16777215);
        const otherPlayer = this.add.image(100, playerInfo.y, 'player').setTint(randomColor);
        if (playerInfo.isActive) {
            otherPlayer.alpha = 0.3;
            console.log('activejoined')
        } else {
            console.log('inactivejoined');
            otherPlayer.alpha = 0.0;
        }
        otherPlayer.playerInfo = playerInfo;
        //add player to the group defined above
        this.otherPlayers.add(otherPlayer);
        if (this.player) {
            this.player.setDepth(1)
        }

    }

    addOnePipe(x, y) {
        // Create a pipe at the position x and y
        let pipe = this.physics.add.sprite(x, y, 'pipe');
        pipe.body.setAllowGravity(false);
        // Add the pipe to our previously created group
        this.pipes.add(pipe);


        // Add velocity to the pipe to make it move left
        pipe.body.velocity.x = -200;

        // Automatically kill the pipe when it's no longer visible
        pipe.checkWorldBounds = true;
        pipe.outOfBoundsKill = true;
    }

    createPipes(holePosition) {
        //create pipe row
        for (var i = 0; i < 5; i++) {
            if (i !== holePosition)
                this.addOnePipe(960, i * 120 + 60);

        }
    }

}
