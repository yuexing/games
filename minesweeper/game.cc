#include "controller_impl.h"
#include "console_view.h"
#include "game.h"

Game::Game(std::unique_ptr<View>&& view): m_view(std::move(view)) {
}

void Game::start() {
	m_view->show_welcome();
	int nboard = m_view->get_nboard();
	if(nboard == -1) {
		return; // user quit
	}
	int nmines = m_view->get_nmines();
	if(nmines == -1) {
		return;
	}

	m_controller = std::make_shared<ControllerImpl>(nboard, nmines);
	m_view->game_loop(m_controller);
}

void Game::stop() {
	// TODO
}