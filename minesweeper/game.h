#ifndef GAME_H
#define GAME_H 

#include <memory>

class Controller;
class View;

class Game {
public:
	Game(std::unique_ptr<View>&& view);

	void start();

	void stop();

private:
	std::unique_ptr<View> m_view;
	std::shared_ptr<Controller> m_controller;
};

#endif /* GAME_H */