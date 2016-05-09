# games #

Plan to write some classical games just for a practice of the fancy algorithms I learned or heard before.

## Checker ##

This is an implementation of American checkers played on an 8x8 checker board.

NB: 1) Usually the player with light pieces moves first, my implementation supports
choice of who moves first; 2) Capturing is mandatory in most official rules, to add
freedom, my implementation can choose whether 'force-jump'; 3) multiple jump and backward
capture is supported; 4) Do not support flying kings... too messy.

For more information, please refer to [Draughts] (http://en.wikipedia.org/wiki/Draughts).

As to AI, I implementated the [minimax search] (http://en.wikipedia.org/wiki/Minimax) with
[Alpha–beta pruning] (http://en.wikipedia.org/wiki/Alpha-beta_pruning). 

## Minesweeper ##

### Minesweeper:

For rules see: https://en.wikipedia.org/wiki/Microsoft_Minesweeper

The simple Minesweeper is written in cpp and doesn't suppor the 'Flag' functionality.

- I have tried to make the console UI better, however, didn't find a good-enough cross-platform approach. [TODO]

- It's designed as Game, Controller, View. A game is created given a view, so that it can start game by asking the user for nboard and nmines. Once prepared, create a controller and hand over the controller to the view to play.

- The Mines are deployed upon first click to make the game more exciting

### Solver:

- how cell is manipulated?

	- a cell is flagged if it's visited or 100% sure it's a Mine
	- a cell is to visit if 100% sure it's not a Mine

- how to select next node to explore?

	- choose the first un-flagged cell
		- this can fail easily because a un-flagged cell has high probability to be a Mine near visited cells

	- randomly choose from un-flagged cell
		- this works well when we have a lot un-flagged cells; otherwise, high probability to hit a Mine

	- choose an un-flagged cell which falls into a group of un-flagged cells
		- grouped un-flagged cells will decrease the possibility of hitting a Mine at the final stage

- how to manipulate cells?

	- once a cell is clicked, it's neighbors are uncovered util the numbered cells (whose neighbors have Mine). The numbered cells can tell us:

		- if the number of covered neighbors equals the number, then all of them are Mine;
		
		- For the covered neighbors, if the number of flagged cells equals the number, then unflagged cells are to visit;

		- if a cell has all the neighbors uncovered: if they're all numbered, then the cell is a Mine; Otherwise, the cell is safe to visit; [Not sure why, this hypothesis doesn't make things well]

### TODO:

- better console
- combined strategies

### How to play

to build everything:
<pre>
	$ make all
	$ ./solver (play with the solver)
	$ ./main   (play with the game)
</pre>

to run unittest:

<pre>
	$ make test
</pre>

## Mandelbrot ##

Plan to implement [Mandelbrot set] (http://en.wikipedia.org/wiki/Mandelbrot_set). 
