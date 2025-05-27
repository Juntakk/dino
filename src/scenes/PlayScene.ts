import { PRELOAD_CONFIG } from "..";
import { Player } from "../entities/Player";
import { SpriteWithDynamicBody } from "../types";
import GameScene from "./GameScene";

class PlayScene extends GameScene {
  player: Player;
  ground: Phaser.GameObjects.TileSprite;
  startTrigger: SpriteWithDynamicBody;
  spawnInterval: number = 1500;
  spawnTime: number = 0;
  obstacles: Phaser.Physics.Arcade.Group;
  gameSpeed: number = 5;
  gameOverText: Phaser.GameObjects.Image;
  restartText: Phaser.GameObjects.Image;
  gameOverContainer: Phaser.GameObjects.Container;

  constructor() {
    super("PlayScene");
  }

  create() {
    this.obstacles = this.physics.add.group();

    this.createEnvironment();
    this.createPlayer();
    this.handleGameOver();
    this.handleStartGame();
    this.handleObstacleCollision();
  }

  update(time: number, delta: number): void {
    this.handleGameLoop(time, delta);
  }

  handleGameLoop(time: number, delta: number) {
    if (!this.isGameRunning) {
      return;
    }

    this.spawnTime += delta;

    if (this.spawnTime > this.spawnInterval) {
      this.spawnTime = 0;
      this.spawnObstacle();
    }
    this.obstacles.getChildren().forEach((obstacle: SpriteWithDynamicBody) => {
      if (obstacle.getBounds().right < 0) {
        this.obstacles.remove(obstacle);
      }
    });

    Phaser.Actions.IncX(this.obstacles.getChildren(), -this.gameSpeed);

    this.ground.tilePositionX += this.gameSpeed;
  }

  createPlayer() {
    this.player = new Player(this, 0, this.gameHeight);
  }

  createEnvironment() {
    this.ground = this.add
      .tileSprite(0, this.gameHeight, 88, 26, "ground")
      .setOrigin(0, 1);
  }

  spawnObstacle() {
    const obstacleNum =
      Math.floor(Math.random() * PRELOAD_CONFIG.cactusesCount) + 1;
    const distance = Phaser.Math.Between(800, 1000);

    this.obstacles
      .create(distance, this.gameHeight, `obstacle-${obstacleNum}`)
      .setOrigin(0, 1)
      .setImmovable(true);
  }

  handleObstacleCollision() {
    this.physics.add.collider(this.player, this.obstacles, () => {
      this.physics.pause();
      this.isGameRunning = false;

      this.player.die();

      this.spawnTime = 0;
      this.gameSpeed = 5;

      this.gameOverContainer.setAlpha(1);
    });
  }

  handleStartGame() {
    this.startTrigger = this.physics.add
      .sprite(0, 10, null)
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
            this.isGameRunning = true;
          }
        },
      });
    });
  }

  handleGameOver() {
    this.gameOverText = this.add.image(0, 0, "game-over");
    this.restartText = this.add.image(0, 80, "restart").setInteractive();
    this.gameOverContainer = this.add
      .container(this.gameWidth / 2, this.gameHeight / 2 - 50)
      .add([this.gameOverText, this.restartText])
      .setAlpha(0);

    this.restartText.on("pointerdown", () => {
      this.scene.start("PlayScene");
    });
  }
}

export default PlayScene;
