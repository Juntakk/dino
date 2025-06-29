import Phaser from "phaser";
import PreloadScene from "./scenes/PreloadScene";
import PlayScene from "./scenes/PlayScene";

export const PRELOAD_CONFIG = {
  cactusesCount: 6,
  birdCount: 3,
};

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1000,
  height: 500,
  pixelArt: true,
  transparent: true,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [PreloadScene, PlayScene],
};

new Phaser.Game(config);

function preload() {
  this.load.image("sky", "assets/cactuses_1.png");
}

function create() {
  this.add.image(400, 300, "sky");
}
