#include "game.h"
#include "console_view.h"

int main() {
	std::unique_ptr<Game> game(new Game(std::unique_ptr<ConsoleView>(new ConsoleView)));
	game->start();
	
	return 0;
}