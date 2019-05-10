function initializeSocketOnEvents(scene) {
    //First, request the players already in the server's state's player object (including the current player)
    //triggers receivePlayers for this player
    scene.socket.emit("getInitialPlayers");

    scene.socket.emit('getHighScoreObject');

    let processPlayers = players => {
        Object.values(players).forEach(playerInfo => { //begin loop
            scene.addOtherPlayer(playerInfo);
        });
    };

    //When we receive the response from the server, fire a callback function with the received players object
    //For info on players object see MMO/js/gameState.js
    //triggered by getInitialPlayers
    scene.socket.on("receivePlayers", players => { //begin callback
        processPlayers(players);
    });

    scene.socket.on('receiveHighScoreObject', highScoreObject => {
        if (scene.highScoreText.text !== "") {
            scene.highScoreAlertText.setText(highScoreObject.name + " set a new high score of " + highScoreObject.score + "!!!!");
            scene.highScoreAlertText.alpha = 1.0;
            setTimeout(() => scene.highScoreAlertText.alpha = 0.0, 2500);
        }

        scene.highScoreText.setText("-----High Score-----\n" + highScoreObject.name + ": " + highScoreObject.score);

    });

    scene.socket.on('playerJoined', player => {
        //Just add that new player just like how the initial players were added
        scene.addOtherPlayer(player)
    });

    scene.socket.on("playerLeft", playerWhoLeft => {
        (scene.otherPlayers.getChildren().forEach(player => {
            //Since player is destroyed they will no longer appear as an image
            if (player.playerInfo.id === playerWhoLeft.id) player.destroy()
        }));
    });

    //So now the current player and all the players who are already in the server are created
    scene.socket.on('playerMoved', playerWhoMoved => {
        //Loop through the otherPlayers group, player is a playerInfo obj
        scene.otherPlayers.getChildren().forEach(player => {
            //If the playerWhoMoved's id matched the id of one of the otherPlayer's children
            if (playerWhoMoved.id === player.playerInfo.id) {
                console.log(playerWhoMoved.y);
                //Set that players info to the updated info
                player.playerInfo = playerWhoMoved;
                //Set that players position to correspond with the new y value - moving the player on the client side
                player.setPosition(100, playerWhoMoved.y);
            }
        });
    });

    scene.socket.on('playerChangedActive', playerWhoChangedIsActive => {
        scene.otherPlayers.getChildren().forEach(player => {
            //If the playerWhoChangedIsActive's id matched the id of one of the otherPlayer's children
            if (playerWhoChangedIsActive.id === player.playerInfo.id) {
                if (playerWhoChangedIsActive.isActive) {
                    player.playerInfo = playerWhoChangedIsActive;
                    player.alpha = 0.3;
                    console.log('player visible');
                } else {
                    //Set that players info to the updated info
                    player.playerInfo = playerWhoChangedIsActive;
                    player.alpha = 0.0;
                }
            }
        });
    });

    scene.socket.on('createPipes', hole => {
        scene.createPipes(hole);
    });

    scene.socket.on('showWaitingForPlayers', () => {
        scene.waitingText.alpha = 1.0;
        scene.gameEndText.alpha = 0.0;
    });

    scene.socket.on('countDownTime', countDownTime => {
        scene.waitingText.alpha = 0.0;
        scene.gameEndText.alpha = 0.0;
        scene.countDownText.alpha = 1.0;
        scene.countDownText.setText("GAME START IN " + countDownTime);

    });

    scene.socket.on('receiveSelf', player => {
        // if the current player is active

        //Add a new physics object with the image of player.png, set it to scene.player (a variable)
        scene.player = scene.physics.add.image(100, player.y, "player");
        scene.player.alpha = 0.0;
        //Get half the height of player.png to be used later
        scene.HALFHEIGHT = scene.player.body.halfHeight;
        scene.player.enableCollisions = false;

        //Enable collisions with the edges of the world
        scene.player.body.collideWorldBounds = true;

        let death = function () {
            if (scene.player.isActive && scene.player.enableCollisions) {
                scene.player.enableCollisions = false;
                scene.player.isActive = false;
                scene.player.alpha = 0.0;
                scene.socket.emit('updateIsActive', false);
            }
        };

        scene.player.isActive = false;

        // Turn on wall collision checking for your sprite
        scene.player.setCollideWorldBounds(true);



        scene.player.body.onWorldBounds = true;

        scene.physics.add.overlap(scene.player, scene.pipes, death);

        scene.player.body.world.on('worldbounds', death);
    });

    scene.socket.on('startGame', () => {

        if (scene.player) {
            scene.player.setPosition(100, 300);
            scene.player.isActive = true;
            scene.player.enableCollisions = true;
            scene.socket.emit('updateIsActive', true);
            scene.player.alpha = 1.0;
        }

        scene.countDownText.alpha = 0.0;

    });

    scene.socket.on('endGame', endInfo => {
        if (endInfo.winner === undefined) {
            scene.gameEndText.setText("THERE WAS A TIE, OOPS...");
        }
        else if (endInfo.winner.id === scene.socket.id) {
            scene.gameEndText.setText("YOU HAVE WON WITH A SCORE OF " + endInfo.time + "!!!\n\n\n " + " ".repeat(21) + "CONGRATS!");
        } else {
            scene.gameEndText.setText(endInfo.winner.name + " HAS WON WITH A SCORE OF " + endInfo.time + "!!!");
        }
        if (scene.player) {
            scene.socket.emit('updateIsActive', false);
            scene.player.alpha = 0.0;
        }
        scene.gameEndText.alpha = 1.0;
    });

    scene.socket.on('cancelGame', () => {
        scene.countDownText.alpha = 0.0;
        scene.gameEndText.alpha = 0.0;
    });

}
