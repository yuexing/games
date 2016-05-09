#ifndef CONSOLE_VIEW_H
#define CONSOLE_VIEW_H 

#include "view.h"

class ConsoleView: public View {
public:
	void show_welcome() override;
	int get_nboard() override;
	int get_nmines() override;
	void game_loop(std::shared_ptr<Controller>& controller) override;

private:
	int m_nboard {0};
	int m_nmines {0};
};
#endif /* CONSOLE_VIEW_H */
