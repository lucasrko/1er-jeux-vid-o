import * as Phaser from 'phaser';

export class Game extends Phaser.Scene
{
    private player: Phaser.Physics.Arcade.Sprite;
    private platforms: Phaser.Physics.Arcade.StaticGroup;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private score = 0;
    private gameOver = false;
    private scoreText: Phaser.GameObjects.Text;
    private bullets: Phaser.Physics.Arcade.Group;
    private dernierTir: number = 0;
    private enemies: Phaser.Physics.Arcade.Group;
    private enemyBullets: Phaser.Physics.Arcade.Group;
    private pvJoueur: number = 3;
    private pvText: Phaser.GameObjects.Text;
    
    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.setPath('assets');
        this.load.image('sky', 'sky.png');
        this.load.image('ground', 'platform.png');
        this.load.spritesheet('dude', 'soldier.png', { frameWidth: 73, frameHeight: 85 });
        this.load.image('bullet','balle.jpg');
        this.load.spritesheet('enemy', 'soldier-2.png', { frameWidth: 73, frameHeight: 85 });
        this.load.spritesheet('dude-dead','soldier-1-dead.png',{frameWidth:73,frameHeight:85});
    }

    create ()
    {
        this.add.image(400, 300, 'sky');

        this.platforms = this.physics.add.staticGroup();

        //  Here we create the ground.
        //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
        this.platforms.create(400, 568, 'ground').setScale(3).refreshBody();

        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');

        this.player = this.physics.add.sprite(300, 360, 'dude');
        this.player.setScale(1.2);
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.player.setBodySize(25, 48);
        this.player.setOffset(25, 12);

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 8, end: 15 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 6 }),
            frameRate: 8,
            repeat:-1
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 8, end: 15 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'space',
            frames: this.anims.generateFrameNumbers('dude',{start:24,end:27}),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'enemy_idle',
            frames: this.anims.generateFrameNumbers('enemy', { start: 24, end: 27 }),
            frameRate: 8,
            repeat:-1
        });
        this.anims.create({
            key: 'enemy_run',
            frames: this.anims.generateFrameNumbers('enemy', { start: 16, end: 23 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key:'soldier-dead',
            frames:this.anims.generateFrameNumbers('dude-dead',{start:32,end:36}),
            frameRate: 10,
            repeat: -1
        });
        

        this.cursors = this.input.keyboard!.createCursorKeys();

        this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', color: '#000' });

        this.pvText = this.add.text(16, 50, 'PV: 3', { fontSize: '32px', color: '#ff0000' });

        this.physics.add.collider(this.player, this.platforms);

        this.bullets = this.physics.add.group();
        this.physics.add.collider(this.bullets,this.platforms,function (bullet){bullet.destroy();

        });
        //pour les bots
        this.enemies = this.physics.add.group();
        this.physics.add.collider(this.enemies,this.platforms);
        this.physics.add.overlap(this.bullets,this.enemies,this.hitEnemy,undefined,this);
        this.enemyBullets = this.physics.add.group();
        this.physics.add.collider(this.enemyBullets, this.platforms, function(bullet){
            bullet.destroy();
        });
        this.physics.add.overlap(this.player,this.enemyBullets,this.prendreDegats,undefined,this)
        this.time.addEvent({
            delay: 3000,
            callback: this.faireApparaitreEnnemi,
            callbackScope: this,
            loop: true
        });
    }

    update (time:number)
    {
        if (this.gameOver)
        {
            if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
                this.score = 0;
                this.pvJoueur = 3;
                this.gameOver = false;
                
                this.scene.restart();

        }
        return;
    }
        if (this.cursors.left.isDown)
        {
            this.player.setVelocityX(-160);

            this.player.anims.play('right', true); 
            
            this.player.setFlipX(true); 
        }
        else if (this.cursors.right.isDown)
        {
            this.player.setVelocityX(160);

            this.player.anims.play('right', true);
            
            this.player.setFlipX(false); 
        }
        else
        {
            this.player.setVelocityX(0);
            this.player.anims.play('turn', true);
        }

        if (this.cursors.up.isDown && this.player.body!.touching.down)
        {
            this.player.setVelocityY(-330);
        }
        if (this.cursors.space.isDown) {
        this.player.anims.play('space', true);
        
    }
    if (this.cursors.space.isDown && time > this.dernierTir){
        this.tirer();
        this.dernierTir = time + 300;
    }
    this.enemies.getChildren().forEach((enfant) => {
            const ennemi = enfant as Phaser.Physics.Arcade.Sprite;
            if (ennemi.x > this.player.x) {
                ennemi.setFlipX(true); 
            } else {
                ennemi.setFlipX(false);
            }
            const dernierTirEnnemi = ennemi.getData('dernierTir') || 0;

            if (time > dernierTirEnnemi) {
                this.tirerEnnemi(ennemi);
                ennemi.setData('dernierTir', time + 2000); 
            }
        });
}


    tirer(){

        if (this.player.flipX){
            const bullet = this.bullets.create(this.player.x-43,this.player.y-30,'bullet');
            (bullet.body as Phaser.Physics.Arcade.Body).allowGravity = false;
            bullet.setScale(0.025);
            bullet.setVelocityX(-300);
        }
        else{
            const bullet = this.bullets.create(this.player.x+43,this.player.y-30,'bullet'); 
            (bullet.body as Phaser.Physics.Arcade.Body).allowGravity = false;
            bullet.setScale(0.025);
            bullet.setVelocityX(300);
            
        }
    }
    hitEnemy(bulletObject: Phaser.Types.Physics.Arcade.GameObjectWithBody| Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile, enemyObject: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody | Phaser.Tilemaps.Tile)
    {
        const bullet = bulletObject as Phaser.Physics.Arcade.Sprite;
        const enemy = enemyObject as Phaser.Physics.Arcade.Sprite;
        bullet.destroy();
        enemy.destroy();
        this.score += 100;
        this.scoreText.setText('score: ' + this.score);
    
    }
    faireApparaitreEnnemi() {
        const x = Phaser.Math.Between(100, 700);
        const ennemi = this.enemies.create(x, 100, 'enemy');
        ennemi.setTint(0xffaa99); 
        ennemi.setScale(1.2);
        ennemi.setBodySize(25, 48);
        ennemi.setOffset(25, 12);
        ennemi.setCollideWorldBounds(true);
        
        
        ennemi.setData('dernierTir', 0);
        ennemi.anims.play('enemy_idle', true);
        
    }

    
    tirerEnnemi(ennemi: Phaser.Physics.Arcade.Sprite) {
        if (ennemi.flipX) {
            const bullet = this.enemyBullets.create(ennemi.x - 43, ennemi.y - 30, 'bullet');
            bullet.setTint(0xff0000); // On colorie la balle en rouge !
            (bullet.body as Phaser.Physics.Arcade.Body).allowGravity = false;
            bullet.setScale(0.025);
            bullet.setVelocityX(-300);
        } else {
            const bullet = this.enemyBullets.create(ennemi.x + 43, ennemi.y - 30, 'bullet'); 
            bullet.setTint(0xff0000);
            (bullet.body as Phaser.Physics.Arcade.Body).allowGravity = false;
            bullet.setScale(0.025);
            bullet.setVelocityX(300);
        }
    }

    
    prendreDegats( objetBalle: any) {
        const balle = objetBalle as Phaser.Physics.Arcade.Sprite;
        balle.destroy(); // La balle disparaît

        this.pvJoueur -= 1; // On perd une vie
        this.pvText.setText('PV: ' + this.pvJoueur);

        
        this.player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            this.player.clearTint();
        });

       
        if (this.pvJoueur <= 0 && !this.gameOver) {
            
            this.gameOver = true; 
            
            this.physics.pause();
            this.player.clearTint(); 
            this.player.anims.play('soldier-dead');
            
            this.add.text(220, 250, 'GAME OVER', { fontSize: '64px', color: '#ff0000' });
            this.add.text(230, 330, 'Appuyez sur ESPACE pour rejouer', { fontSize: '20px', color: '#ffffff' });
        }
    }
}
