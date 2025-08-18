export default class BreakBrick extends Phaser.Scene {
  constructor() {
    super("BreakBrick");
  }

  init() {
    // controles de teclado
    this.teclas = this.input.keyboard.createCursorKeys();
    this.teclasPersonalizadas = this.input.keyboard.addKeys({
      "D": Phaser.Input.Keyboard.KeyCodes.D,
      "A": Phaser.Input.Keyboard.KeyCodes.A
    });

    // Variable para el GameJuice del resolte de la bola en la pala
    this.velocidadHorizontalBolaPegada = 0;

    // velocidades
    this.VelocidadPala = 900;
    this.VelocidadBola = 900;

    // estado inicial de la bola
    this.bolaPegada = true;

    // desactivar debug
    this.physics.world.drawDebug = false;

    // para el spawn del obstaculo
    this.DistanciaObstaculoParedesX = 200; // Valor inicial, ajusta según lo que necesites

    this.sounds = {};
  }

  preload() {
    // Carga de sonidos
    this.load.audio("BolaRebota", "./public/assets/BolaRebota.wav");
    this.load.audio("ColisionObstaculo", "./public/assets/ColisionObstaculo.wav");
  }

  create() {
    // Inicializar los objetos de sonido
    this.sounds.BolaRebota = this.sound.add("BolaRebota");
    this.sounds.ColisionObstaculo = this.sound.add("ColisionObstaculo");

    // textos
    this.textoTutorial = this.add.text(this.cameras.main.centerX, 1030, "Controles: A y D o flechas. Espacio para iniciar",
      {
        fontSize: "50px",
        fill: "#fff",
        fontStyle: "bold",
        stroke: "#000",
        strokeThickness: 8,
      }
    ).setOrigin(0.5);

    // Crear objetos
    this.bola = this.add.circle(600, 500, 35, 0x000000).setStrokeStyle(5, 0xffffff);
    this.pala = this.add.rectangle(this.cameras.main.centerX, 950, 300, 50, 0x000000).setStrokeStyle(5, 0xffffff);
    this.obstaculo = this.add.rectangle(
      Phaser.Math.Between((0 + this.DistanciaObstaculoParedesX), (1720 - this.DistanciaObstaculoParedesX)),
      Phaser.Math.Between(100, 400),
      300,
      50,
      0xffffff
    );

    // Añadir físicas
    [this.bola, this.pala, this.obstaculo].forEach(obj => this.physics.add.existing(obj));

    // desabilitar solo el borde inferior del mundo
    this.physics.world.setBoundsCollision(true, true, true, false);

    // Propiedades de la bola
    this.bola.body
    .setBounce(1, 1)
    .setCollideWorldBounds(true);

    // rebote al colisionar con el mundo
    this.bola.body.onWorldBounds = true;
    this.physics.world.on('worldbounds', (body) => {
        this.sounds.BolaRebota.play();
    });

    // propiedad de la pala
    this.pala.body.setImmovable(true); // porque la bola me lo seguia moviendo al chocarla
    this.obstaculo.body.setImmovable(true);

    // Propiedades de la pala
    this.pala.body.setCollideWorldBounds(true);

    // Colisión bola-pala
    this.physics.add.collider(this.bola, this.pala, this.ReboteBola, null, this);

    // Colisión bola-obstáculo
    this.physics.add.collider(this.bola, this.obstaculo, this.GolpeObstaculo, null, this);

    // Tecla espacio
    this.teclaEspacio = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  }

  update() {
    this.ManejarMovimientoPala();

    if (this.bolaPegada) {
      this.ActualizarPosicionBola();
    }

    //Reiniciar si la bola se va fuera de la pantalla
    if (this.bola.y > this.cameras.main.height + 200) {
      this.bolaPegada = true; // La bola vuelve a estar pegada a la pala
      this.bola.body.setVelocity(0, 0); // Detener la bola
    }
  }

  ManejarMovimientoPala() {
    this.pala.body.setVelocity(0);
    if (this.teclas.left.isDown || this.teclasPersonalizadas.A.isDown) {
      this.pala.body.setVelocityX(-this.VelocidadPala);
    } 
    if (this.teclas.right.isDown || this.teclasPersonalizadas.D.isDown) {
      this.pala.body.setVelocityX(this.VelocidadPala);
    }
  }

  ActualizarPosicionBola() {
    // Lanza la bola al presionar espacio
    if (Phaser.Input.Keyboard.JustDown(this.teclaEspacio)) {
      this.bolaPegada = false;

      // Decide la dirección según el movimiento de la pala
      let direccionX;
      if (this.pala.body.velocity.x > 0) {
        direccionX = 1; // Derecha
      } else if (this.pala.body.velocity.x < 0) {
        direccionX = -1; // Izquierda
      } else {
        direccionX = Phaser.Math.FloatBetween(-1, 1).toFixed(1); // Aleatorio si está quieta
      }

      // Normaliza y aplica la velocidad
      const magnitudVector = Math.sqrt(direccionX * direccionX + 1);
      const velXNormalizada = (direccionX / magnitudVector) * this.VelocidadBola;
      const velYNormalizada = (-1 / magnitudVector) * this.VelocidadBola;
      this.bola.body.setVelocity(velXNormalizada, velYNormalizada);

      // Reproducir sonido de rebote
      this.sounds.BolaRebota.play();

      return; // Sslir de la funcion para que no se ejecute el codigo de resorte
    }

    // Colocar la bola arriba de la pala
    this.bola.y = this.pala.y - this.pala.height / 2 - this.bola.radius - 20;

    // atraccion y friccion de la bola pegada a la pala
    const AtraccionHaciaCentroPala = (this.pala.x - this.bola.x) * 0.05; // mas alto el valor, mas rapido se atrae
    const Friccion = this.velocidadHorizontalBolaPegada * 0.2; // mas bajo el valor, menos friccion

    this.velocidadHorizontalBolaPegada += AtraccionHaciaCentroPala - Friccion;
    this.bola.x += this.velocidadHorizontalBolaPegada;

    // Limitar la posición de la bola para que no se salga de los bordes de la pala
    this.bola.x = Phaser.Math.Clamp(this.bola.x, this.pala.x - this.pala.width / 2, this.pala.x + this.pala.width / 2);
  }

  ReboteBola(bola, pala) {
    const difBolaCentroPala = this.bola.x - this.pala.x; // difBolaCentroPala > 0, pegó a la derecha. difBolaCentroPala < 0, pegó a la izquierda.
    let direccionX = Phaser.Math.Clamp(difBolaCentroPala * 0.007, -1, 1); // Reducimos la difBolaCentroPala para que puedan ser valores entre -1 y 1
    const magnitudVector = Math.sqrt(direccionX * direccionX + 1); // Calculo magnitud vector: √ (X)² + (Y)² -> √ (direccionX)² + (-1)²
    const velXNormalizada = (direccionX / magnitudVector) * this.VelocidadBola; // Normalizamos el vector para que la velocidad sea constante, para Normalizar componentes: X / MagnitudVector, Y / MagnitudVector
    const velYNormalizada = (-1 / magnitudVector) * this.VelocidadBola; // -1 porque la bola se mueve hacia arriba, y tambien lo normalizamos
    this.bola.body.setVelocity(velXNormalizada, velYNormalizada);

    // Reproducir sonido de rebote
    this.sounds.BolaRebota.play();
    }

  GolpeObstaculo(bola, obstaculo) {
    // Reproducir sonido de colisión con obstáculo
    this.sounds.ColisionObstaculo.play();

    // moverlo a una nueva posición
    this.obstaculo.x = Phaser.Math.Between((0 + this.DistanciaObstaculoParedesX), (1720 - this.DistanciaObstaculoParedesX));
    this.obstaculo.y = Phaser.Math.Between(100, 400);
  }
}
