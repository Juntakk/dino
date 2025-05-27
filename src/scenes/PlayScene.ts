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
  obstacleSpeed: number = 10;

  constructor() {
    super("PlayScene");
  }

  create() {
    this.createEnvironment();
    this.createPlayer();

    this.obstacles = this.physics.add.group();

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

  update(time: number, delta: number): void {
    if (!this.isGameRunning) {
      return;
    }

    this.spawnTime += delta;

    if (this.spawnTime > this.spawnInterval) {
      this.spawnTime = 0;
      this.spawnObstacle();
    }

    Phaser.Actions.IncX(this.obstacles.getChildren(), -this.obstacleSpeed);
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
    const distance = Phaser.Math.Between(600, 900);

    this.obstacles
      .create(distance, this.gameHeight, `obstacle-${obstacleNum}`)
      .setOrigin(0, 1);
  }
}

export default PlayScene;
