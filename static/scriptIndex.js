const goalReached = new Event('goalReached');
const gameCleared = new Event('gameCleared');

let canvas;
let ctx;
let maze;
let startIndices;
let goalIndices;
let difficulty;
let n;
let m;
let cellSize;
let backgroundColor = 'black';
let wallColor = 'yellow';
let player = {};
let keysEnabled = false;
let mazesCleared;
let playerImage = new Image();
let finishImage = new Image();
let goalImage = new Image();

playerImage.src = 'static/images/CS50_duck.png';
finishImage.src = 'static/images/CS50_duck_sunglasses.png';
goalImage.src = 'static/images/red_x.png';


function ajaxInitialize(event)
{
    // Since this function is called by a submit event, the following will prevent the page from reloading
    event.preventDefault();

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            document.querySelector('#storyDiv').hidden = true;
            document.querySelector('#canvasResults').hidden = true;
            document.querySelector('#canvasInput').hidden = true;
            initializeScene();
        }
    };

    mazesCleared = 0;
    difficulty = document.querySelector('#difficulty').value;
    var formData = new FormData();
    formData.append('phase', 'start');
    formData.append('difficulty', difficulty);
    xhttp.open('POST', '/', true);
    xhttp.send(formData);
}

function initializeScene()
{
    drawMaze();
    initializePlayer();
}

function drawMaze()
{
    // Clear the canvas from any drawings
    clearCanvas();

    // Color the background of the canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Generate a matrix that represents a maze, along with the row and column indices of the start and goal cell
    [maze, startIndices, goalIndices] = generateMaze();

    // Calculate the size of one element to make sure that all elements in the maze matrix fit on the canvas
    cellSize = canvas.width / maze.length;

    // Draw the goal cell on the canvas
    drawGoal();

    // For every element in the maze matrix, draw walls on the canvas for the corresponding directions the element does not have a passage in
    ctx.fillStyle = wallColor;

    for (let i = 0; i < maze.length; i++)
    {
        for (let j = 0; j < maze[i].length; j++)
        {
            drawWalls(i, j, maze[i][j]);
        }
    }
}

function clearCanvas()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function generateMaze()
{
    // Set the dimensions of the maze based on the chosen difficulty
    if (difficulty == 'easy')
    {
        n = 5;
        m = 5;
    }
    else if (difficulty == 'medium')
    {
        n = 10;
        m = 10;
    }
    else if (difficulty == 'hard')
    {
        n = 20;
        m = 20;
    }
    else
    {
        throw 'Invalid difficulty';
    }

    // Initialize an empty array that corresponds to a flattened representation of a maze
    // That is, instead of each row starting below the previous row, all would-be rows form one large row
    // This is done, because A 1D respresentation makes the next steps in the process easier
    let maze1D = new Array(n * m);

    for (i = 0; i < maze1D.length; i++)
    {
        // Make all elements in the array an object containing information on whether there is a passage in each of the cardinal directions
        // Initially there will be no passages in the maze, that is, there will be walls in between each and every cell
        maze1D[i] = {north: false, east: false, south: false, west: false};
    }

    // Carve out the passages in the maze using a randomized depth-first search algorithm
    randomizedDepthFirstSearch(maze1D);

    // Initialize a set of perimeter cells, used for selecting the start and goal cells
    let perimeterCells = new Set();

    // Add to the set the cells on the western and eastern edges of the maze
    for (i = 0; i < n; i++)
    {
        let westernEdgeCell = i;
        let easternEdgeCell = n * m - n + i;
        perimeterCells.add(westernEdgeCell);
        perimeterCells.add(easternEdgeCell);
    }

    // Add to the set the cells on the northern and southern edges of the maze
    for (j = 0; j < m; j++)
    {
        let northernEdgeCell = j * n;
        let southernEdgeCell = j * n + n - 1;
        perimeterCells.add(northernEdgeCell);
        perimeterCells.add(southernEdgeCell);
    }

    // Convert the set to an array for random indexing of the elements
    perimeterCells = Array.from(perimeterCells);

    // Randomly select a cell to start at
    let startCell = perimeterCells[Math.floor(Math.random() * perimeterCells.length)];

    // Convert the 1D index of the start cell to 2D indices as well
    let startIndices = {row: startCell % n, col: Math.floor(startCell / n)};

    // Initialize the goal cell and its 2D indices
    let goalCell;
    let goalIndices;

    // Randomly select a goal cell, but ensure it is not in the same row or column of the start cell
    do
    {
        goalCell = perimeterCells[Math.floor(Math.random() * perimeterCells.length)];
        goalIndices = {row: goalCell % n, col: Math.floor(goalCell / n)};
    }
    while (goalIndices.row == startIndices.row || goalIndices.col == startIndices.col);

    // Remove the maze perimeter wall of the start cell
    if (startIndices.row == 0)
    {
        maze1D[startCell].north = true;
    }
    else if (startIndices.row == n - 1)
    {
        maze1D[startCell].south = true;
    }
    else if (startIndices.col == 0)
    {
        maze1D[startCell].west = true;
    }
    else if (startIndices.col == m - 1)
    {
        maze1D[startCell].east = true;
    }

    // Do the same for the goal cell
    if (goalIndices.row == 0)
    {
        maze1D[goalCell].north = true;
    }
    else if (goalIndices.row == n - 1)
    {
        maze1D[goalCell].south = true;
    }
    else if (goalIndices.col == 0)
    {
        maze1D[goalCell].west = true;
    }
    else if (goalIndices.col == m - 1)
    {
        maze1D[goalCell].east = true;
    }

    // For transforming the 1D representation of the maze to a 2D representation, a new empty array is initialized
    let maze2D = new Array(n);

    // Initialize an empty array at each index of the array created in the previous step, effectively creating a 2d representation of the maze
    for (i = 0; i < n; i++)
    {
        maze2D[i] = new Array(m);

        // Copy the elements from the 1D representation array to the corresponding indices of the 2D representation array
        for (j = 0; j < m; j++)
        {
            maze2D[i][j] = maze1D[i + j * n];
        }
    }

    return [maze2D, startIndices, goalIndices];
}

function randomizedDepthFirstSearch(maze1D)
{
    // Initialize a set that will contain the visited cells and a stack that will represent the path from the initial cell to the current cell
    let visited = new Set();
    let stack = [];

    // Pick a random cell to start at
    let currentCell = Math.floor(Math.random() * (n * m));

    // Add that cell to the set of visited cells and push it to the stack
    visited.add(currentCell);
    stack.push(currentCell);

    // Repeat the following process while there are cells on the stack
    while (stack.length > 0)
    {
        // Initialize an array that will contain the cells adjacent to the current cell
        let adjacentCells = [];

        // If the current cell is not on the northern edge of the maze, there exists another cell to the north
        if (currentCell % n != 0)
        {
            northCell = currentCell - 1;
            adjacentCells.push(northCell);
        }

        // If the current cell is not on the western edge of the maze, there exists another cell to the west
        if (currentCell > n - 1)
        {
            westCell = currentCell - n;
            adjacentCells.push(westCell);
        }

        // If the current cell is not on the southern edge of the maze, there exists another cell to the south
        if ((currentCell + 1) % n != 0)
        {
            southCell = currentCell + 1;
            adjacentCells.push(southCell);
        }

        // If the current cell is not on the eastern edge of the maze, there exists another cell to the east
        if (currentCell < n * m - n)
        {
            eastCell = currentCell + n;
            adjacentCells.push(eastCell);
        }

        // Initialize an array that contains the possible next cells to visit (if any)
        let possibleNextCells = [];

        // The possible next cells are the adjacent cell that have not been visited yet
        for (cell of adjacentCells)
        {
            if (!(visited.has(cell)))
            {
                possibleNextCells.push(cell);
            }
        }

        // Randomly select a cell from the possible next cells
        let nextCell = possibleNextCells[Math.floor(Math.random() * possibleNextCells.length)];

        // If there is a next cell to visit, remove the walls between the current cell and the next cell
        if (nextCell != undefined)
        {
            if (nextCell - currentCell == -1)
            {
                maze1D[currentCell].north = true;
                maze1D[nextCell].south = true;
            }

            else if (nextCell - currentCell == -n)
            {
                maze1D[currentCell].west = true;
                maze1D[nextCell].east = true;
            }

            if (nextCell - currentCell == 1)
            {
                maze1D[currentCell].south = true;
                maze1D[nextCell].north = true;
            }

            else if (nextCell - currentCell == n)
            {
                maze1D[currentCell].east = true;
                maze1D[nextCell].west = true;
            }

            // The next cell of this iteration becomes the current cell of the next iteration
            currentCell = nextCell;

            // Add that cell to the set of visited cells and push it to the stack
            stack.push(currentCell);
            visited.add(currentCell);
        }

        // If there is no next cell to visit, go back to the previous cell
        else
        {
            // The previous cell of this iteration becomes the current cell of the next iteration
            currentCell = stack.pop();
        }
    }
}

function drawGoal()
{
    let x = goalIndices.col * cellSize;
    let y = goalIndices.row * cellSize;

    ctx.drawImage(goalImage, x + cellSize / 4, y + cellSize / 4, cellSize / 2, cellSize / 2);
}

function drawWalls(i, j, object)
{
    let x = j * cellSize;
    let y = i * cellSize;

    if (!object.north)
    {
        let wallHeight = cellSize / 20;
        let wallWidth = cellSize;

        ctx.fillRect(x, y, wallWidth, wallHeight);
    }

    if (!object.west)
    {
        let wallWidth = cellSize / 20;
        let wallHeight = cellSize;

        ctx.fillRect(x, y, wallWidth, wallHeight);
    }

    if (!object.south)
    {
        let wallHeight = cellSize / 20;
        let wallWidth = cellSize;

        ctx.fillRect(x, y + cellSize - wallHeight, wallWidth, wallHeight);
    }

    if (!object.east)
    {
        let wallWidth = cellSize / 20;
        let wallHeight = cellSize;

        ctx.fillRect(x + cellSize - wallWidth, y, wallWidth, wallHeight);
    }
}

function initializePlayer()
{
    player.row = startIndices.row;
    player.col = startIndices.col;
    drawPlayer(player.row, player.col);
    keysEnabled = true;
}

function movePlayer(event)
{
    if (keysEnabled)
    {
        if (event.code == 'ArrowUp')
        {
            if (maze[player.row][player.col].north && player.row > 0)
            {
                clearPlayer(player.row, player.col);
                player.row--;
                drawPlayer(player.row, player.col);
            }
        }
        else if (event.code == 'ArrowDown')
        {
            if (maze[player.row][player.col].south && player.row < n - 1)
            {
                clearPlayer(player.row, player.col);
                player.row++;
                drawPlayer(player.row, player.col);
            }
        }
        else if (event.code == 'ArrowLeft')
        {
            if (maze[player.row][player.col].west && player.col > 0)
            {
                clearPlayer(player.row, player.col);
                player.col--;
                drawPlayer(player.row, player.col);
            }
        }
        else if (event.code == 'ArrowRight')
        {
            if (maze[player.row][player.col].east && player.col < m - 1)
            {
                clearPlayer(player.row, player.col);
                player.col++;
                drawPlayer(player.row, player.col);
            }
        }

        // If the player is at the goal cell
        if (player.row == goalIndices.row && player.col == goalIndices.col)
        {
            if (mazesCleared < 2)
            {
                mazesCleared++;
                document.dispatchEvent(goalReached);
            }
            else
            {
                document.dispatchEvent(gameCleared);
                keysEnabled = false;
            }
        }
    }
}

function drawPlayer(i, j)
{
    let x = j * cellSize;
    let y = i * cellSize;

    ctx.drawImage(playerImage, x + cellSize / 4, y + cellSize / 4, cellSize / 2, cellSize / 2);
}

function clearPlayer(i, j)
{
    let x = j * cellSize;
    let y = i * cellSize;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(x + cellSize / 8, y + cellSize / 8, 3 * cellSize / 4, 3 * cellSize / 4);
}

function finishGame()
{
    clearCanvas();
    ajaxEnd();
}

function ajaxEnd(event)
{
    var xhttp = new XMLHttpRequest();
    var formData = new FormData();
    formData.append('phase', 'end');
    xhttp.open('POST', '/', true);
    xhttp.send(formData);

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            let responseData = JSON.parse(xhttp.responseText);

            // Convert the elapsed time from seconds to minutes and seconds
            let minutes = Math.floor(responseData.elapsedTime / 60);
            let seconds = responseData.elapsedTime % 60;

            // Show the user's results
            document.querySelector('#canvasResults').hidden = false;
            document.querySelector('#timeMessage').innerHTML = 'Your time: ' + minutes + '\' ' + seconds.toFixed(3) + '\"';
            ctx.drawImage(finishImage, canvas.width / 4, canvas.height / 4, canvas.width / 2, canvas.height / 2);

            // Pop up an input field for the user's name
            if (responseData.setRecord)
            {
                document.querySelector('#canvasInput').hidden = false;
            }
        }
    };
}


document.addEventListener('DOMContentLoaded', function(){

    // Find the canvas and create a drawing object
    canvas = document.getElementById('myCanvas');
    ctx = canvas.getContext('2d');

    document.querySelector('#start').addEventListener('submit', ajaxInitialize);
    document.addEventListener('keydown', movePlayer);

    document.addEventListener('goalReached', initializeScene);
    document.addEventListener('gameCleared', finishGame);
});
