# 404: Exit Not Found!
#### Video Demo: [https://youtu.be/wRh4ngUVLK4](https://youtu.be/wRh4ngUVLK4)
#### Description:
This is my implementation of the final project for the CS50 course.
It is a web-based application, named *404: Exit Not Found!*, that combines Python, HTML, CSS, Javascript and SQL.
The web application consists of two web pages.
The first page is the home page, which allows the user to play a game centered around the CS50 Duck.
In the game, The Duck is trapped in a maze and the player, who gets to control The Duck, has to escape the maze by providing keyboard input.
If the player finishes the game fast enough, he/she can submit his/her name to be displayed on the leaderboard.
The second page shows the leaderboard, for which the entries are queried from a SQLite database.

#### Structure
This web application is made using the Flask framework.
As such, the files and folders are organized in a particular way.
In any Flask project, there typically exists:

- a file *application.py*, which is the Python server-side source code;
- a file *requirements.txt*, which lists the other libraries used in the application;
- a folder *static*, which contains the static files, like CSS stylesheets and Javascript scripts;
- a folder *templates*, which contains the HTML rendering templates.

The following paragraphs will go into more detail on the invidual files used in the project.

##### application.py
The file *application.py* contains the Python server-side source code.
It controls the web application and therefore represents the "controller" in the model-view-controller (MVC) design pattern.
The first line following the lines that import the required libraries allows the Python file to be turned into a web application.
Hereafter, the app is configured with regard to auto-reloading and sessions.
The web app contains two routes: "/" and "/records".
The "/" route contains the home page of the web app and accepts two methods: GET and POST.
When this route is requested via GET, the app simply renders the *index.html* file.
Additionally, *application.py* responds to three different scenarios via POST:
the first is when an XMLHttpRequest (XHR) is received that signals the start of the game (this is received from the file *scriptIndex.js*);
the second is when an XHR is received that signals the end of the game (also from *scriptIndex.js*);
the third is when the player submits his/her name after submitting the corresponding form on the web page.
The "/records" route contains the leaderboard page and accepts only GET requests.
After such a request is made, a connection is established with the SQLite database *records.db* using the sqlite3 interface.
Hereafter, the records are queried from the corresponding tables and these records are passed as variables into the rendering template *records.html*.

##### templates/index.html
The HTML rendering templates represent the "view" in the MVC design pattern.
This file in particular renders the page for the "/" route.
The header of this page contains a navigation bar to navigate to the leaderboard page.
The main part of this page consists of two columns.
The left column contains a canvas, which by default displays the story of the game and puts everything in context.
After selecting the difficulty by submitting the form below the canvas, the game is started and rendered on the canvas.
If the player finished the game fast enough, he/she will also be prompted with a form on canvas that he/she can submit his/her name into.
The right column simply contains text instructions on how to play the game.

##### templates/records.html
This file renders the page for the "/records" route.
The header of this page contains a navigation bar to navigate to the home page.
The main part of this page contains a tab bar, allowing users to select the difficulty they want to view the leaderboard for.
Below the tab bar is the actual leaderboard, consisting of a table for which the rows are dynamically created by the variables passed into by the file *application.py*.

##### static/scriptIndex.js
This file contains the Javascript for *index.html*.
After the html document has been completely loaded, the HTML canvas is selected and a drawing object is created for drawing on the canvas.
An event listener of type submit is then added to the element with the id *start* to call the function *ajaxInitialize*.
Another event listener of type keydown is added to control the player character by calling the *movePlayer* function.
Finally, event listeners for two custom events are added, calling the *initializeScene* and *finishGame* functions respectively.
More details on the individual functions:

- **ajaxInitialize:**
    This function is called by the triggering a submit on the start element.
    It resets the counter of number of mazes clear to zero, determines the selected difficulty the player has chosen and initializes the scene.
    Finally, it sends an XHR, signaling that this is the start of the game and informing the server what difficulty the user is playing on.
- **initializeScene:**
    This function calls two other functions: *drawMaze* and *initializePlayer*.
    Since these two functions are usually called together, but do different things, creating the *initializeScene* function helps.
- **drawMaze:**
    This function calls the function *generateMaze* and draws the goal and walls of the maze with the *drawGoal* and *drawWalls* functions respectively.
- **generateMaze:**
    This function actually generates the maze to be used, for which the dimensions are determined by the selected difficulty.
    The maze is an array for which the elements are objects with four properties, these being the variables *north*, *east*, *south* and *west*, all of boolean type.
    A value of true indicates that there exists a path in the corresponding direction, whereas false indicates there does not (i.e. there is a wall in that direction).
    Initially, the four properties of all elements in the maze array are set to false.
    Hereafter, the passages are created with the function *randomizedDepthFirstSearch*.
    After having obtained a fully functional maze, one cell is randomly chosen on the perimeter of the maze to function as the start cell.
    The goal cell is also ramdomly chosen on the perimeter of the maze, but two constraints ensuring the row and column of both the start and goal cells are not identical are added to prevent too easy solutions.
- **randomizedDepthFirstSearch:**
    This function implements the randomized depth first search algorithm, a commonly known maze generation algorithm.
    This algorithm was chosen, because it is easy to implement, but at the same time results in mazes with long corridors (due to it being a depth first search algorithm), which makes them challenging.
    The algorithm works by keeping track of the cells that have been visited and maintaining a stack of cells representing the path from the initial cell to the current cell.
    The initial cell is picked randomly, becomes the current cell, is added to the visited cells and is pushed onto the stack.
    While the stack is not empty, the algorithm loops over the following:
    the cells adjacent to the current cell are determined;
    one of the adjacent cells that has not been visited yet is chosen as the next cell;
    the walls are removed between the current cell and the next cell, effectively forming a new passage in the maze;
    the next cell becomes the new current cell, is pushed onto the stack and is added to the visited cells;
    in the case that all adjacent cells were already visited, the algorithm pops a cell from the stack (i.e. goes to the previous cell), and repeats the whole process.
- **initializePlayer:**
    This function sets the player's location to that of the start cell, calls the *drawPlayer* function, and enables keyboard input.
- **drawGoal:**
    This function draws the goal cell on canvas.
- **drawWalls:**
    This function draws the walls on canvas.
- **drawPlayer:**
    This function draws the player image on canvas.
- **clearPlayer:**
    Since drawings remain on the canvas, the image of the player at the previous cell has to be removed to prevent a canvas full of player images.
- **clearCanvas:**
    This function clears the whole canvas.
- **movePlayer:**
    This function changes the player location depending on the user input.
    The player is only actually moved if there is a free passage in the corresponding direction.
    A custom event *goalReached* is dispatched when the player has reached the goal for the first or second time.
    A custom event *gameCleared* is dispatched when the player has reached the goal for the third time.
- **finishGame:**
    This function is called when the *gameCleared* event is triggered, and calls the *clearCanvas* and *ajaxEnd* functions.
- **ajaxEnd:**
    This function sends an XHR to signal the end of the game to the server.
    The server responds back by returning the time it took the player to complete the game and whether the player has set a record.
    If the player has set a record, he/she will be prompted for his/her username, which will be send back to the server upon submitting.

##### static/scriptRecords.js
This file contains the Javascript for *records.html*.
After the html document has been completely loaded, event listeners of type click are added to all elements with the class *difficultyButton*.
Next, de URL is parsed in search for a possible difficulty parameter.
Depending on the value of the difficulty parameter (easy, medium or hard), a click event is dispatched on the corresponding difficult button.
If the difficulty parameter is missing or invalid, a click event is dispatched on the medium difficulty button by default.
More details on the individual functions:

- **selectTab:**
    This function adds the class *active* to the difficulty button that was clicked on, which will change the element's style properties.
    Additionally, the *showTab* function is called, passing into the function the corresponding difficulty.
- **showTab:**
    This function shows the content of the element with the class *difficultyTab* that corresponds the difficulty that was passed into the function.
    The content corresponding to the other difficulties is hidden.

##### static/styles.css
This file contains the CSS stylesheet used for the HTML files.

##### static/images
This folder contains the images used in this project.
I am not the original creator of the CS50 Duck artwork used in this project, and all credit for creating the artwork goes to its original creator.

##### records.db
This file contains the SQLite database, for which the records data is stored in three tables.
Each of the tables --- *easy*, *medium* and *hard* --- has four columns:

- *id*, which shows the unique identifier of the entry;
- *name*, which shows the player name submitted by the player;
- *time*, which shows the time it took the player to finish the game;
- *timestamp*, which shows the date and time the player finished the game.

The database represents the "model" in the MVC design pattern.

##### requirements.txt
This file contains the Python libraries needed for running the application.