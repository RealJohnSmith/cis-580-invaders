/**
 * Note: All the sprites used in this game have been created by me O:))
 *          If you like them, feel free to use them in your game ;))
 *
 * @external https://www.pixilart.com/shanemat
 */

// --------------------------------------------- Enums ----------------------------------------------- //

/**
 * @enum Directions
 *
 * Enumeration describing vectors of possible directions
 */
const Directions = {
    LEFT:   {x:-1, y: 0},
    RIGHT:  {x: 1, y: 0},
    UP:     {x: 0, y:-1},
    DOWN:   {x: 0, y: 1}
}

/**
 * @enum EnemyTypes
 *
 * Enumeration describing types of enemies
 */
const EnemyTypes = {
    AT_AT:      {fireProb: 0.2,  spawnProb: 0.2,    score: 200, src: 'img/at-at.png'},
    FIGHTER:    {fireProb: 0.1,  spawnProb: 0.4,    score: 150, src: 'img/fighter.png'},
    ASTEROID:   {fireProb: 0.0,  spawnProb: 0.3,    score: 100, src: 'img/asteroid.png'},
    NONE:       {fireProb: 0.0,  spawnProb: 0.1,    score:   0, src: null}
}

/**
 * @enum MoveementSpeeds
 *
 * Enumeration containing values of movement speeds of game objects
 */
const MovementSpeeds = {
    PLAYER: 0.2,
    ENEMY: 0.1,
    SHOT: 0.8
}

// -------------------------------------------- Classes ---------------------------------------------- //

/**
 * @class SpaceShip
 *
 * Represents player-controlled spaceship
 */
class SpaceShip {

    /**
     * Contructor for SpaceShip class
     *
     * @param {number} left Initial position on horizontal axis
     * @param {number} top Initial position on vertical axis
     */
    constructor(left, top) {
        this.left = left
        this.top = top

        this.imgSize = SPRITE_SIZE
        this.imgSrc = "img/x-wing.png"
    }
}

/**
 * @class Enemy
 *
 * Represents any enemy object
 */
class Enemy {

    /**
     * Contructor for Enemy class
     *
     * @param {number} left Initial position on horizontal axis
     * @param {number} top Initial position on vertical axis
     * @param {ENEMY_TYPES} type The type of enemy
     */
    constructor(left, top, type) {
        this.left = left
        this.top = top
        this.type = type

        this.imgSize = SPRITE_SIZE
        this.imgSrc = type.src
    }
}

/**
 * @class Shot
 *
 * Represents shot fired across the battlefield
 */
class Shot {

    /**
     * Contructor for Bullet class
     *
     * @param {number} left Initial position on horizontal axis
     * @param {number} top Initial position on vertical axis
     * @param {Directions} direction Direction of flight
     */
    constructor(left, top, direction) {
        this.left = left
        this.top = top
        this.direction = direction
    }

    /**
     * @function move
     *
     * Moves this shot by amount specified by speed
     *
     * @param {number} speed Number of pixels to move
     */
    move(speed) {
        this.top += this.direction.y * speed
    }

    /**
     * @function render
     *
     * Renders this shot onto specified context
     *
     * @param {context} ctx Context to be used while drawing
     */
    render(ctx) {
        var radius = SHOT_LENGTH/2

        ctx.beginPath()
        ctx.moveTo(this.left, this.top - radius)
        ctx.lineTo(this.left, this.top + radius)
        ctx.stroke()
    }
}

/**
 * @function move
 *
 * Moves specified object in given direction by amount specified by speed
 *
 * @param {GameObject} object Object which should be moved
 * @param {DIRECTIONS} direction Direction to move in
 * @param {number} speed Number of pixels to move
 */
function move(object, direction, speed) {
    var proposedX = object.left + speed * direction.x
    var proposedY = object.top + speed * direction.y

    var radius = object.imgSize/2

    object.left = bound(CANVAS_LEFT_BOUNDARY + radius, proposedX, CANVAS_RIGHT_BOUNDARY - radius)
    object.top = bound(CANVAS_TOP_BOUNDARY - radius, proposedY, CANVAS_BOTTOM_BOUNDARY - radius)
}

/**
 * @function renderObject
 *
 * Renders specified object onto given canvas context
 *
 * @param {GameObject} object Object which should get rendered
 * @param {context} ctx Context to be used while drawing
 */
function renderObject(object, ctx) {
    var left = object.left
    var top = object.top

    var size = object.imgSize

    var image = new Image(size, size)
    image.src = object.imgSrc
    image.onload = function() {
        ctx.drawImage(image, left - size/2, top - size/2, size, size)
    }

    ctx.drawImage(image, left - size/2, top - size/2, size, size)
}

// -------------------------------------------- Constants ---------------------------------------------- //

/** Canvas dimensions */
const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 800

const CANVAS_PADDING = 50

const CANVAS_LEFT_BOUNDARY = CANVAS_PADDING
const CANVAS_RIGHT_BOUNDARY = CANVAS_WIDTH - CANVAS_PADDING
const CANVAS_TOP_BOUNDARY = CANVAS_PADDING
const CANVAS_BOTTOM_BOUNDARY = CANVAS_HEIGHT - CANVAS_PADDING

/** Size of sprite images */
const SPRITE_SIZE = 64

/** Collision radius of sprites */
const SPRITE_COLLISION_RADIUS = 24

/** Length of shots */
const SHOT_LENGTH = 4

/** Padding in between enemy sprites */
const ENEMY_PADDING = 2

/** Number of enemies in row */
const ENEMY_ROW_SIZE = 8

/** Number of rows in initial state */
const ENEMY_COLUMN_SIZE = 5

/** Helper constants for enemy placement */
const ENEMY_GAP = 2 * ENEMY_PADDING
const ROW_SPAN = ENEMY_ROW_SIZE * (SPRITE_SIZE + ENEMY_GAP) - ENEMY_GAP

/** Number of frames which it takes for enemies to shoot */
const ENEMY_SHOT_COOLDOWN = 30

/** Maximal and initial number of player's lives */
const MAX_PLAYER_LIVES = 4

// ----------------------------------------- Global Variables ------------------------------------------- //

/** Input from previous cycle */
var prevInput = {
    space: false,
    left: false,
    right: false
}

/** Input from current cycle */
var currInput = {
    space: false,
    left: false,
    right: false
}

/** Initial time of game cycle */
var initialTime = null

/** Cooldown limiting enemies from firing */
var shootingCooldown = ENEMY_SHOT_COOLDOWN

/** Indicator whether the game is finished */
var shouldFinish = false

/** Reference to the nearest enemy to the player */
var nearestEnemy = null

/** Previous direction of enemy movement */
var enemyMovementPreviousDirection = Directions.LEFT

/** Current direction which enemies move in */
var enemyMovementDirection = Directions.RIGHT

/** Current value of enemy movement timer */
var enemyMovementTimer = (CANVAS_WIDTH - 2 * CANVAS_PADDING)/2 - ROW_SPAN/2

/** Limit for enemy movement */
var enemyMovementLimit = CANVAS_WIDTH - 2 * CANVAS_PADDING - ROW_SPAN

/** Player-controlled spaceship */
var spaceShip = new SpaceShip(CANVAS_WIDTH/2 - SPRITE_SIZE/2, CANVAS_BOTTOM_BOUNDARY - SPRITE_SIZE/2)

/** Enemy objects */
var enemies = []

/** Shots on the battlefield */
var shots = []

/** The foreground canvas used for rendering */
var fgCanvas = createCanvas()
var fgcCtx = fgCanvas.getContext('2d')

/** The background canvas used for pre-computation */
var bgCanvas = createCanvas()
var bgcCtx = bgCanvas.getContext('2d')

bgcCtx.strokeStyle = 'blue'
bgcCtx.font = 'bold 24px Palatino'

/** Current score of player */
var playerScore = 0

/** Current value of player lives */
var playerLives = MAX_PLAYER_LIVES

// --------------------------------------------- Helpers --------------------------------------------- //

/**
 * @function createCanvas
 *
 * Creates canvas with predetermined dimensions
 *
 * @returns Created canvas
 */
function createCanvas() {
    var canvas = document.createElement('canvas')

    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    return canvas
}

/**
 * @function getNextEnemyType
 *
 * Generates type of next enemy to be generated
 *
 * @returns Type of next enemy to be generated
 */
function getNextEnemyType() {

    var random = Math.random()
    var currentCap = 0.0

    for( var key in EnemyTypes ) {
        var type = EnemyTypes[key]
        currentCap += type.spawnProb

        if( random <= currentCap ) {
            return type
        }
    }

    return EnemyTypes.NONE
}

/**
 * @function createEnemy
 *
 * Creates enemy on given coordinates
 *
 * @param {number} left Position on vertical axis
 * @param {number} top Position on horizontal axis
 *
 * @returns Either instance of newly created enemy or NULL for case when no enemy should be generated
 */
function createEnemy(left, top) {
    var type = getNextEnemyType()
    if( type == EnemyTypes.NONE ) {
        return
    }

    return new Enemy(left, top, type)
}

/**
 * @function initiateEnemies
 *
 * Initiates the starting array of enemies
 */
function initiateEnemies() {

    var spawned = null
    var top = CANVAS_TOP_BOUNDARY
    for( var row = 0; row < ENEMY_COLUMN_SIZE; row++ ) {

        var left = CANVAS_WIDTH/2 - ROW_SPAN/2 + SPRITE_SIZE/2

        for( var column = 0; column < ENEMY_ROW_SIZE; column++ ) {

            var enemy = createEnemy(left, top)
            if( !enemy ) {
                continue
            }

            spawned = enemy
            enemies.push(enemy)

            left += SPRITE_SIZE + ENEMY_GAP
        }

        top += SPRITE_SIZE + ENEMY_GAP
    }

    nearestEnemy = spawned
}

/**
 * @function spawnNewEnemies
 *
 * Spawns new line of enemies from left upper side
 */
function spawnNewEnemies() {

    var top = CANVAS_TOP_BOUNDARY
    var left = CANVAS_LEFT_BOUNDARY + SPRITE_SIZE / 2

    for( var column = 0; column < ENEMY_ROW_SIZE; column++ ) {

        var enemy = createEnemy(left, top)
        if( !enemy ) {
            continue
        }

        enemies.push(enemy)

        left += SPRITE_SIZE + ENEMY_GAP
    }
}

/**
 * @function locateNearestEnemy
 *
 * Attempts to locate nearest enemy. Note that nearest enemy might potentially be
 * still NULL when there are no enemies on the canvas
 */
function locateNearestEnemy() {

    var minTop = 0
    enemies.forEach(function(enemy) {
        if( enemy.top > minTop ) {
            nearestEnemy = enemy
            minTop = enemy.top
        }
    })
}

/**
 * @function updateEnemyDirection
 *
 * Updates the direction enemy is about to move
 *
 * @param {number} moved Number of pixels the enemy is about to move
 */
function updateEnemyDirection(moved) {

    if( enemyMovementDirection == Directions.LEFT || enemyMovementDirection == Directions.RIGHT ) {
        if( enemyMovementTimer >= enemyMovementLimit ) {
            enemyMovementLimit = (SPRITE_SIZE + ENEMY_GAP)/2
            enemyMovementTimer = 0

            enemyMovementPreviousDirection = enemyMovementDirection
            enemyMovementDirection = Directions.DOWN
        }
    }

    if( enemyMovementDirection == Directions.DOWN ) {
        if( !nearestEnemy ) {
            locateNearestEnemy()
        }

        if( nearestEnemy ) {
            checkGameEnd()
        }

        if( enemyMovementTimer >= enemyMovementLimit ) {
            enemyMovementLimit = CANVAS_WIDTH - 2 * CANVAS_PADDING - ROW_SPAN
            enemyMovementTimer = 0

            if( enemyMovementPreviousDirection == Directions.LEFT ) {
                enemyMovementDirection = Directions.RIGHT
                spawnNewEnemies()
            } else if ( enemyMovementPreviousDirection == Directions.RIGHT ) {
                enemyMovementDirection = Directions.LEFT
            }
        }
    }

    enemyMovementTimer += moved
}

/**
 * @function moveEnemies
 *
 * Moves all enemies
 *
 * @param {number} elapsedTime Time elapsed after last cycle
 */
function moveEnemies(elapsedTime) {

    var movementSpeed = MovementSpeeds.ENEMY * elapsedTime
    updateEnemyDirection(movementSpeed)

    enemies.forEach(function(enemy) {
        move(enemy, enemyMovementDirection, movementSpeed)
    })
}

/**
 * @function moveShots
 *
 * Moves all shots
 *
 * @param {number} elapsedTime Time elapsed after last cycle
 */
function moveShots(elapsedTime) {
    var movementSpeed = MovementSpeeds.SHOT * elapsedTime
    shots.forEach(function(shot) {
        shot.move(movementSpeed)
    })
}

// ---------------------------------------------- Utils ---------------------------------------------- //

/**
 * @function clone
 *
 * Creates a deep copy of given object
 *
 * @param {any} object Object which deep copy should be created
 */
function clone(object) {
    return JSON.parse(JSON.stringify(object))
}

/**
 * @function bound
 *
 * Bounds given value between given bounds
 *
 * @param {number} min Minimal bound
 * @param {number} value Value to be bound
 * @param {number} max Maximal bound
 */
function bound(min, value, max) {
    if( value < min ) {
        return min
    }

    if( value > max ) {
        return max
    }

    return value
}

/**
 * @function hasCollided
 *
 * Determines whether shot has collided with an object
 *
 * @param {Shot} shot Shot to be checked for collision
 * @param {GameObject} object Object to be checked for collision
 */
function hasCollided(shot, object) {
    var distance = Math.pow( object.left - shot.left, 2 ) + Math.pow( object.top - shot.top, 2 )
    return distance < Math.pow( SPRITE_COLLISION_RADIUS, 2 )
}

// --------------------------------------------- Handlers ---------------------------------------------- //

/**
 * @function handleKeyDown
 *
 * Handles events associated with key being pressed
 *
 * @param {KeyEvent} event The event to be handled
 */
function handleKeyDown(event) {
    switch(event.key) {
        case ' ':
            currInput.space = true
            break

        case 'a':
        case 'ArrowLeft':
            currInput.left = true
            break

        case 'd':
        case 'ArrowRight':
            currInput.right = true
            break

        case 's':
            if( shouldFinish ) {
                restartGame()
            }
            break
    }
}

/**
 * @function handleKeyUp
 *
 * Handles events associated with key being released
 *
 * @param {KeyEvent} event The event to be handled
 */
function handleKeyUp(event) {
    switch(event.key) {
        case ' ':
            currInput.space = false
            break

        case 'a':
        case 'ArrowLeft':
            currInput.left = false
            break

        case 'd':
        case 'ArrowRight':
            currInput.right = false
            break
    }
}

/**
 * @function handleInput
 *
 * Handles the change in user input
 *
 * @param {number} speed Number of pixels spaceship should move
 */
function handleInput(speed) {
    if( !prevInput.space && currInput.space ) {
        shots.push(new Shot(spaceShip.left - SPRITE_SIZE/2 + ENEMY_PADDING, spaceShip.top - SPRITE_SIZE/2, Directions.UP))
        shots.push(new Shot(spaceShip.left + SPRITE_SIZE/2 - ENEMY_PADDING, spaceShip.top - SPRITE_SIZE/2, Directions.UP))
    }

    if( currInput.left ) {
        move(spaceShip, Directions.LEFT, speed)
    }

    if( currInput.right ) {
        move(spaceShip, Directions.RIGHT, speed)
    }
}

/**
 * @function handleEnemyFire
 *
 * Handles the enemy fire (meaning when and how often they do shoot)
 */
function handleEnemyFire() {
    if( shootingCooldown != 0 ) {
        shootingCooldown -= 1
        return
    }

    enemies.forEach(function(enemy) {
        if( Math.random() < enemy.type.fireProb ) {
            shots.push(new Shot(enemy.left, enemy.top - SPRITE_SIZE/2, Directions.DOWN))
        }
    })

    shootingCooldown = ENEMY_SHOT_COOLDOWN
}

/**
 * @function handleShotCollisions
 *
 * Handles shot collisions
 */
function handleShotCollisions() {
    shots.forEach(function(shot, shotIndex) {
        if( shot.direction == Directions.UP ) {
            for( const [enemyIndex, enemy] of enemies.entries() ) {
                if( hasCollided(shot, enemy) ) {
                    shots.splice(shotIndex, 1)
                    enemies.splice(enemyIndex, 1)

                    if( enemy == nearestEnemy ) {
                        nearestEnemy = null
                    }

                    playerScore += enemy.type.score
                    break
                }
            }

            if( shot.top < CANVAS_TOP_BOUNDARY ) {
                shots.splice(shotIndex, 1)
            }

        } else if( shot.direction == Directions.DOWN) {
            if( hasCollided(shot, spaceShip) ) {
                shots.splice(shotIndex, 1)
                playerLives -= 1

                if( playerLives < 0 ) {
                    shouldFinish = true
                }

            } else if( shot.top > CANVAS_BOTTOM_BOUNDARY ) {
                shots.splice(shotIndex, 1)
            }
        }
    })
}

// -------------------------------------------- Displays ----------------------------------------------- //

/**
 * @function displayScore
 *
 * Displays current score of player
 *
 * @param {Context} ctx Context to be drawn upon
 */
function displayScore(ctx) {
    ctx.textAlign = 'left'
    ctx.fillText('SCORE: ' + playerScore, ENEMY_GAP, CANVAS_HEIGHT - ENEMY_GAP)
}

/**
 * @function displayLives
 *
 * Displays remaining lives of player
 *
 * @param {Context} ctx Context to be drawn upon
 */
function displayLives(ctx) {
    var size = SPRITE_SIZE/2

    ctx.textAlign = 'right'
    ctx.fillText('LIVES: ',
        CANVAS_WIDTH - 4 * ENEMY_GAP - MAX_PLAYER_LIVES * (size + ENEMY_GAP), CANVAS_HEIGHT - ENEMY_GAP)

    var top = CANVAS_HEIGHT - size/2
    var left = CANVAS_WIDTH - ENEMY_GAP - size

    for( var i = playerLives; i > 0; i-- ) {
        var image = new Image(size, size)

        image.src = spaceShip.imgSrc
        image.onload = function() {
            ctx.drawImage(image, left - size/2, top - size/2, size, size)
        }

        ctx.drawImage(image, left - size/2, top - size/2, size, size)
        left -= size + ENEMY_GAP
    }
}

/**
 * @function showEndGameScreen
 *
 * Shows the final screen of the game
 *
 * @param {Context} ctx Context to be drawn upon
 */
function showEndGameScreen(ctx) {
    ctx.fillStyle = 'rgba(128, 128, 128, 0.5)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.font = 'bold 48px Palatino'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'white'
    ctx.fillText('GAME OVER', CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 48)

    ctx.font = 'italic 28px Palatino'
    ctx.fillText('Final score: ' + playerScore, CANVAS_WIDTH/2 + 100, CANVAS_HEIGHT/2)

    ctx.fillText('To play again press \'S\'', CANVAS_WIDTH/2, CANVAS_HEIGHT * 3/4)
}

// -------------------------------------------- Game Loop ---------------------------------------------- //

/**
 * @function restartGame
 *
 * Restarts the game
 */
function restartGame() {
    enemies = []
    shots = []

    playerScore = 0
    playerLives = MAX_PLAYER_LIVES

    shouldFinish = false

    initialTime = null
    shootingCooldown = ENEMY_SHOT_COOLDOWN

    nearestEnemy = null

    enemyMovementPreviousDirection = Directions.LEFT
    enemyMovementDirection = Directions.RIGHT
    enemyMovementTimer = (CANVAS_WIDTH - 2 * CANVAS_PADDING)/2 - ROW_SPAN/2
    enemyMovementLimit = CANVAS_WIDTH - 2 * CANVAS_PADDING - ROW_SPAN

    spaceShip.left = CANVAS_WIDTH/2 - SPRITE_SIZE/2
    spaceShip.top = CANVAS_BOTTOM_BOUNDARY - SPRITE_SIZE/2

    initiateEnemies()
    window.requestAnimationFrame(gameLoop)
}

/**
 * @function checkGameEnd
 *
 * Checks whether the game should finish or not
 */
function checkGameEnd() {
    if( nearestEnemy.top + SPRITE_SIZE > spaceShip.top ) {
        shouldFinish = true
    }
}

/**
 * @function update
 *
 * Updates current states of game world
 *
 * @param {number} elapsedTime Time elapsed after last cycle
 */
function update(elapsedTime) {
    moveEnemies(elapsedTime)
    moveShots(elapsedTime)

    handleInput(MovementSpeeds.PLAYER * elapsedTime)
    handleEnemyFire()
    handleShotCollisions()

    prevInput = clone(currInput)
}

/**
 * @function render
 *
 * Renders the game world contents
 *
 * @param {number} elapsedTime Time elapsed after last cycle
 */
function render(elapsedTime) {
    bgcCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    renderObject(spaceShip, bgcCtx)
    shots.forEach(function(shot) {
        shot.render(bgcCtx)
    })

    enemies.forEach(function(enemy) {
        renderObject(enemy, bgcCtx)
    })

    displayScore(bgcCtx)
    displayLives(bgcCtx)

    fgcCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    fgcCtx.drawImage(bgCanvas, 0, 0)
}

/**
 * @function gameLoop
 *
 * The main game loop (everything that is actually done is done here :) )
 *
 * @param {DomHighResTimestamp} timestamp Current system time of moment when this function was called
 */
function gameLoop(timestamp) {
    if( !initialTime ) {
        initialTime = timestamp
    }

    var elapsedTime = timestamp - initialTime
    initialTime = timestamp

    update(elapsedTime)
    render(elapsedTime)

    if( shouldFinish ) {
        showEndGameScreen(fgcCtx)
        return
    }

    window.requestAnimationFrame(gameLoop)
}

// ------------------------------------------- Executable ---------------------------------------------- //

document.body.appendChild(fgCanvas)
initiateEnemies()

window.addEventListener('keydown', handleKeyDown)
window.addEventListener('keyup', handleKeyUp)
window.requestAnimationFrame(gameLoop)
