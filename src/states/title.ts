import * as Assets from '../assets';

enum Tracks {
  Left,
  Middle,
  Right,
}
export default class Title extends Phaser.State {
  private backgroundTemplateSprite: Phaser.Sprite = null;
  private sfxAudiosprite: Phaser.AudioSprite = null;
  private mummySpritesheet: Phaser.Sprite = null;
  private mummyBody: Phaser.Physics.Arcade.Body = null;
  private cursors: Phaser.CursorKeys = null;
  private pickStartPosition: Phaser.Point = null;
  private mummyMiddlePosition: Phaser.Point = null;
  private trackWidth: number = 100;
  private groundSprite: Phaser.Sprite = null;
  private leftWallSprite: Phaser.Sprite = null;
  private rightWallSprite: Phaser.Sprite = null;
  private currentLevel = 0;
  
  
  // This is any[] not string[] due to a limitation in TypeScript at the moment;
  // despite string enums working just fine, they are not officially supported so we trick the compiler into letting us do it anyway.
  private sfxLaserSounds: any[] = null;
  
  public create (): void {
    this.pickStartPosition = new Phaser.Point(this.game.world.centerX, this.game.world.centerY - 175);
    this.mummyMiddlePosition = new Phaser.Point(this.game.world.centerX, this.game.world.centerY + 175);

    this.backgroundTemplateSprite = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, Assets.Images.ImagesBackgroundTemplate.getName());
    this.backgroundTemplateSprite.anchor.setTo(0.5);
    this.leftWallSprite = this.game.add.sprite(this.pickStartPosition.x - 2 * this.trackWidth, this.game.world.centerY, Assets.Images.ImagesGround.getName());
    this.leftWallSprite.anchor.setTo(0.5);
    this.leftWallSprite.angle = 90;
    this.rightWallSprite = this.game.add.sprite(this.pickStartPosition.x + 2 * this.trackWidth, this.game.world.centerY, Assets.Images.ImagesGround.getName());
    this.rightWallSprite.anchor.setTo(0.5);
    this.rightWallSprite.angle = 90;
    this.groundSprite = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY + 255, Assets.Images.ImagesGround.getName());
    this.groundSprite.anchor.setTo(0.5);
  
    this.mummySpritesheet = this.game.add.sprite(this.mummyMiddlePosition.x, this.mummyMiddlePosition.y, Assets.Spritesheets.SpritesheetsMetalslugMummy.getName());
    this.mummySpritesheet.animations.add('walk');
    this.mummySpritesheet.animations.play('walk', 30, true);
    this.mummySpritesheet.anchor.setTo(0.5);
    
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.physics.enable(this.mummySpritesheet);
    this.mummyBody = this.mummySpritesheet.body as Phaser.Physics.Arcade.Body;
    this.mummyBody.collideWorldBounds = true;
    console.log(this);
    
    this.cursors = this.game.input.keyboard.createCursorKeys();
    
    this.sfxAudiosprite = this.game.add.audioSprite(Assets.Audiosprites.AudiospritesSfx.getName());
    
    // This is an example of how you can lessen the verbosity
    let availableSFX = Assets.Audiosprites.AudiospritesSfx.Sprites;
    this.sfxLaserSounds = [
      availableSFX.Laser1,
      availableSFX.Laser2,
      availableSFX.Laser3,
      availableSFX.Laser4,
      availableSFX.Laser5,
      availableSFX.Laser6,
      availableSFX.Laser7,
      availableSFX.Laser8,
      availableSFX.Laser9
    ];
    
    // this.game.sound.play(Assets.Audio.AudioMusic.getName(), 0.2, true);
    
    this.backgroundTemplateSprite.inputEnabled = true;
    this.backgroundTemplateSprite.events.onInputDown.add(() => {
      this.sfxAudiosprite.play(Phaser.ArrayUtils.getRandomItem(this.sfxLaserSounds));
    });
    this.level = this.game.add.text(this.pickStartPosition.x + 2 * this.trackWidth, this.pickStartPosition.y + 50, 'Level 0', {
      font: '28px Arial',
      fill: '#000000'
    });
    this.score = this.game.add.text(this.pickStartPosition.x + 2 * this.trackWidth, this.pickStartPosition.y, '0', {
      font: '28px Arial',
      fill: '#000000'
    });
    this.game.camera.flash(0x000000, 1000);
    this.drawCorrect();
    this.createPickTimeout = setTimeout(() => {
      this.createPick();
    }, this.createPickEvery);
  }
  updateLevelTextSprite(){
    this.level.text = 'Level ' + this.currentLevel;
  }
  private createPickTimeout;
  private destinationTrack: Tracks = null;
  private currentTrack: Tracks = Tracks.Middle;
  private score: Phaser.Text = null;
  private level: Phaser.Text = null;
  
  private onTrackChangeTweenComplete () {
    this.currentTrack = this.destinationTrack;
    this.destinationTrack = null;
  }
  
  private createPickEvery: number = 1000;
  private correctOrder = [
    Assets.Images.ImagesHands.getName(),
    Assets.Images.ImagesMouth.getName(),
    Assets.Images.ImagesNose.getName(),
    Assets.Images.ImagesFace.getName(),
    Assets.Images.ImagesArm.getName(),
    Assets.Images.ImagesHead.getName(),
    Assets.Images.ImagesFoot.getName(),
  ];
  private correctNext = 0;
  
  getXFromTrack (track: Tracks) {
    switch (track) {
      case Tracks.Right: {
        return this.mummyMiddlePosition.x + this.trackWidth;
      }
      case Tracks.Middle: {
        return this.mummyMiddlePosition.x;
      }
      case Tracks.Left: {
        return this.mummyMiddlePosition.x - this.trackWidth;
      }
    }
  }
  
  checkOverlap (spriteA: Phaser.Sprite, spriteB: Phaser.Sprite) {
    let boundsA = spriteA.getBounds();
    let boundsB = spriteB.getBounds();
    return Phaser.Rectangle.intersects(
      new Phaser.Rectangle(boundsA.x, boundsA.y, boundsA.width, boundsA.height),
      new Phaser.Rectangle(boundsB.x, boundsB.y, boundsB.width, boundsB.height)
    );
  }
  
  increaseScore (amount: number) {
    let score = parseInt(this.score.text) + amount;
    if (score < 0) {
      score = 0;
    }
    this.score.text = score + '';
  }
  
  private nextRandomGroup: string[] = [];
  
  createPick () {
    if (this.nextRandomGroup.length === 0) {
      this.nextRandomGroup = Phaser.ArrayUtils.shuffle(this.correctOrder.slice(0)).concat([ this.correctOrder[ this.correctNext ] ]);
    }
    let pickName = this.nextRandomGroup.splice(0, 1)[ 0 ];
    let xPosition = this.getXFromTrack(Math.floor(Math.random() * 3) as Tracks);
    let pick = this.game.add.sprite(xPosition, this.pickStartPosition.y, pickName);
    pick.anchor.setTo(0.5);
    let tween = this.game.add.tween(pick);
    tween.to({y: this.mummyMiddlePosition.y - 5}, 2000, Phaser.Easing.Linear.None);
    tween.onComplete.addOnce(() => {
      if (this.checkOverlap(this.mummySpritesheet, pick)) {
        if (pickName === this.correctOrder[ this.correctNext ]) {
          this.sfxAudiosprite.play(Assets.Audiosprites.AudiospritesSfx.Sprites.Laser5 as any);
          this.correctNext += 1;
          if (this.correctNext === this.correctOrder.length) {
            this.increaseScore(50);
            if(this.increaseSpeed)
            {
              ++this.currentLevel;
              this.updateLevelTextSprite();
              this.createPickEvery -= 50;
              this.mummySpeed = Math.min(Math.floor(this.createPickEvery / 2), 250);
            }
            this.increaseSpeed = true;
          }
          this.correctNext = this.correctNext % this.correctOrder.length;
          this.nextRandomGroup = [];
          this.drawCorrect();
          this.increaseScore(5);
        } else {
          this.increaseSpeed = false;
          this.sfxAudiosprite.play(Assets.Audiosprites.AudiospritesSfx.Sprites.Laser1 as any);
          this.increaseScore(-10);
        }
      }
      pick.kill();
    });
    tween.start();
    this.createPickTimeout = setTimeout(() => {
      this.createPick();
    }, this.createPickEvery);
  }
  private increaseSpeed = true;
  private correctSprite: Phaser.Sprite;
  
  drawCorrect () {
    if (this.correctSprite) {
      this.correctSprite.kill();
    }
    let pick = this.game.add.sprite(this.pickStartPosition.x - 2 * this.trackWidth, this.pickStartPosition.y, this.correctOrder[ this.correctNext ]);
    pick.anchor.setTo(0.5);
  }
  
  private mummySpeed = 250;
  
  update () {
    this.game.world.bringToTop(this.mummySpritesheet);
    if (this.destinationTrack == null) {
      if (this.cursors.left.isDown || this.cursors.right.isDown) {
        if (this.cursors.left.isDown && this.currentTrack !== Tracks.Left) {
          this.destinationTrack = this.currentTrack === Tracks.Right ? Tracks.Middle : Tracks.Left;
        } else if (this.cursors.right.isDown && this.currentTrack !== Tracks.Right) {
          this.destinationTrack = this.currentTrack === Tracks.Left ? Tracks.Middle : Tracks.Right;
        }
        if (this.destinationTrack != null) {
          let properties = {x: this.getXFromTrack(this.destinationTrack)};
          let tween = this.game.add.tween(this.mummySpritesheet);
          tween.to(properties, this.mummySpeed, Phaser.Easing.Linear.None);
          tween.onComplete.addOnce(() => {
            this.onTrackChangeTweenComplete();
          });
          tween.start();
        }
      }
    }
  }
}
