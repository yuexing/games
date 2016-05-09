#ifndef VIEW_H
#define VIEW_H 

#include <memory>

class Controller;

class View {
public:
	virtual void show_welcome() = 0;
	// ask for the 'N' of 'NxN' board from the user
	// returns -1 if the user quit; otherwise, positive integer
	virtual int get_nboard() = 0;
	// ask for the number of mines from the user
	// returns -1 if the user quit; otherwise, positive valid integer
	virtual int get_nmines() = 0;
	// 1. show board and wait for click
	// 2. click
	//   - game over or go back to step 1
	// 3. quit
	virtual void game_loop(std::shared_ptr<Controller>& controller) = 0;
};
#endif /* VIEW_H */
