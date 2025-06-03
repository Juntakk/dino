import { PRELOAD_CONFIG } from "..";
import { Player } from "../entities/Player";
import { SpriteWithDynamicBody } from "../types";
import GameScene from "./GameScene";

class PlayScene extends GameScene {
  player: Player;
  ground: Phaser.GameObjects.TileSprite;
  startTrigger: SpriteWithDynamicBody;

  spawnInterval: number = 1850;
  spawnTime: number = 0;

  obstacles: Phaser.Physics.Arcade.Group;
  clouds: Phaser.GameObjects.Group;

  gameSpeed: number = 10;
  gameSpeedModifier: number = 1;

  gameOverText: Phaser.GameObjects.Image;
  restartText: Phaser.GameObjects.Image;
  gameOverContainer: Phaser.GameObjects.Container;

  scoreText: Phaser.GameObjects.Text;
  highScoreText: Phaser.GameObjects.Text;
  score: number = 0;
  scoreInterval: number = 100;
  scoreDeltaTime: number = 0;

  progressSound: Phaser.Sound.HTML5AudioSound;

  constructor() {
    super("PlayScene");
  }

  create() {
    this.createEnvironment();
    this.createPlayer();
    this.createObstacles();
    this.createGameOverContainer();
    this.createAnimations();
    this.createScore();

    this.handleGameStart();
    this.handleObstacleCollision();
    this.handleRestartGame();

    this.progressSound = this.sound.add("progress", {
      volume: 0.33,
    }) as Phaser.Sound.HTML5AudioSound;
  }

  update(time: number, delta: number): void {
    this.handleGameLoop(time, delta);
  }

  handleGameLoop(time: number, delta: number) {
    if (!this.isGameRunning) {
      return;
    }

    this.spawnTime += delta;
    this.scoreDeltaTime += delta;

    if (this.scoreDeltaTime >= this.scoreInterval) {
      this.score++;

      if (this.score % 100 === 0) {
        this.gameSpeedModifier += 0.075;

        this.progressSound.play();

        this.tweens.add({
          targets: this.scoreText,
          duration: 100,
          repeat: 5,
          alpha: 0,
          yoyo: true,
        });
      }

      this.scoreDeltaTime = 0;
    }

    if (this.spawnTime > this.spawnInterval) {
      this.spawnTime = 0;
      this.spawnObstacle();
    }

    Phaser.Actions.IncX(
      this.obstacles.getChildren(),
      -this.gameSpeed * this.gameSpeedModifier
    );
    Phaser.Actions.IncX(this.clouds.getChildren(), -0.5);

    const score = Array.from(String(this.score), Number);

    for (let i = 0; i < 5 - String(this.score).length; i++) {
      score.unshift(0);
    }

    this.scoreText.setText(score.join(""));

    this.obstacles.getChildren().forEach((obstacle: SpriteWithDynamicBody) => {
      if (obstacle.getBounds().right < 0) {
        this.obstacles.remove(obstacle);
      }
    });

    this.clouds.getChildren().forEach((cloud: SpriteWithDynamicBody) => {
      if (cloud.getBounds().right < 0) {
        cloud.x = this.gameWidth + 30;
      }
    });

    this.ground.tilePositionX += this.gameSpeed * this.gameSpeedModifier;
  }

  createObstacles() {
    this.obstacles = this.physics.add.group();
  }

  createPlayer() {
    this.player = new Player(this, 0, this.gameHeight);
  }

  createEnvironment() {
    this.ground = this.add
      .tileSprite(0, this.gameHeight, 88, 26, "ground")
      .setOrigin(0, 1);

    this.clouds = this.add.group();

    this.clouds = this.clouds.addMultiple([
      this.add.image(this.gameWidth / 2, 170, "cloud"),
      this.add.image(this.gameWidth - 80, 80, "cloud"),
      this.add.image(this.gameWidth / 1.3, 100, "cloud"),
    ]);

    this.clouds.setAlpha(0);
  }

  createScore() {
    this.scoreText = this.add
      .text(this.gameWidth, 0, "00000", {
        fontSize: 30,
        fontFamily: "Arial",
        color: "#535353",
      })
      .setOrigin(1, 0)
      .setAlpha(0);

    this.highScoreText = this.add
      .text(this.scoreText.getBounds().left - 20, 0, "00000", {
        fontSize: 30,
        fontFamily: "Arial",
        color: "#535353",
      })
      .setOrigin(1, 0)
      .setAlpha(0);
  }

  createAnimations() {
    this.anims.create({
      key: "enemy-bird-fly",
      frames: this.anims.generateFrameNumbers("enemy-bird"),
      frameRate: 6,
      repeat: -1,
    });
  }

  spawnObstacle() {
    const obstaclesCount =
      PRELOAD_CONFIG.cactusesCount + PRELOAD_CONFIG.birdCount;
    const obstacleNum = Math.floor(Math.random() * obstaclesCount) + 1;

    const distance = Phaser.Math.Between(150, 300);

    if (obstacleNum > PRELOAD_CONFIG.cactusesCount) {
      const enemyPossibleHeight = [20, 70];
      const enemyHeight =
        enemyPossibleHeight[
          Math.floor(Math.random() * enemyPossibleHeight.length)
        ];
      this.obstacles
        .create(
          this.gameWidth + distance,
          this.gameHeight - enemyHeight,
          "enemy-bird"
        )
        .play("enemy-bird-fly")
        .setOrigin(0, 1)
        .setImmovable(true);
    } else {
      this.obstacles
        .create(
          this.gameWidth + distance,
          this.gameHeight,
          `obstacle-${obstacleNum}`
        )
        .setOrigin(0, 1)
        .setImmovable(true);

      const sizes: Record<number, [number, number]> = {
        1: [30, 65],
        2: [60, 65],
        3: [95, 65],
        4: [45, 90],
        5: [95, 90],
        6: [140, 90],
      };

      const obstacles = this.obstacles.getChildren();

      for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i] as SpriteWithDynamicBody;
        const size = sizes[obstacleNum];

        obstacle.body.setSize(...size);
      }
    }
  }

  handleObstacleCollision() {
    this.physics.add.collider(this.player, this.obstacles, () => {
      this.physics.pause();
      this.isGameRunning = false;
      this.anims.pauseAll();

      this.player.die();

      this.spawnTime = 0;
      this.score = 0;
      this.scoreDeltaTime = 0;
      this.gameSpeedModifier = 1;

      this.gameOverContainer.setAlpha(1);

      const newHighScore = this.highScoreText.text.substring(
        this.highScoreText.text.length - 5
      );
      const newScore =
        Number(this.scoreText.text) > Number(newHighScore)
          ? this.scoreText.text
          : newHighScore;
      this.highScoreText.setText("HI " + newScore);
      this.highScoreText.setAlpha(1);
    });
  }

  handleRestartGame() {
    this.restartText.on("pointerdown", () => {
      this.obstacles.clear(true, true);

      this.physics.resume();
      this.player.setVelocityX(0);

      this.anims.resumeAll();
      this.gameOverContainer.setAlpha(0);
      this.highScoreText.setAlpha(0);

      this.isGameRunning = true;
    });
  }

  handleGameStart() {
    this.startTrigger = this.physics.add
      .sprite(0, 300, null)
      .setOrigin(0, 1)
      .setAlpha(0);

    this.physics.add.overlap(this.player, this.startTrigger, () => {
      if (this.startTrigger.y === 10) {
        this.startTrigger.body.reset(0, this.gameHeight);
        return;
      }

      this.startTrigger.body.reset(9999, 9999);

      const rollOutEvent = this.time.addEvent({
        delay: 1000 / 60,
        loop: true,
        callback: () => {
          this.player.playRunAnimation();
          this.player.setVelocityX(80);
          this.ground.width += 17 * 2;

          if (this.ground.width >= this.gameWidth) {
            rollOutEvent.remove();
            this.ground.width = this.gameWidth;
            this.player.setVelocityX(0);
            this.clouds.setAlpha(1);
            this.scoreText.setAlpha(1);
            this.isGameRunning = true;
          }
        },
      });
    });
  }

  createGameOverContainer() {
    this.gameOverText = this.add.image(0, 0, "game-over");
    this.restartText = this.add.image(0, 80, "restart").setInteractive();
    this.gameOverContainer = this.add
      .container(this.gameWidth / 2, this.gameHeight / 2 - 50)
      .add([this.gameOverText, this.restartText])
      .setAlpha(0);
  }
}

export default PlayScene;
