export default class BreakBrick extends Phaser.Scene {
  constructor() {
    super("BreakBrick");
  }

  init() {

  }

  preload() {

  }

  create() {



    const bola = this.add.circle(600, 500, 50, 0xFF0000);
    this.physics.add.existing(bola);
    bola.body.setVelocity(100, 200);
    bola.body.setBounce(1, 1);
    bola.body.setCollideWorldBounds(true);



    this.add.rectangle(50, 50, 50, 50, 0xFF0000);
    this.add.rectangle(150, 50, 50, 50, 0xFF0000);
  }

  update() {
    // update game objects
  }
}
