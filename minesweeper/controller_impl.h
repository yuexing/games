#ifndef CONTROLLER_IMPL_H
#define CONTROLLER_IMPL_H 

#include "controller.h"

class ControllerImpl: public Controller {
public:
    ControllerImpl(int nboard, int nmines);
    ClickRes click(int x, int y) override;
    std::vector<std::vector<CellMeta>> getBoard() override;
    int leftNonMines() override;
    
private:
    std::vector<std::vector<CellMeta>> m_board;
    int m_nmines {0};
    int m_nuncovered {0};
	bool m_is_first_click {true};
};

#endif /* CONTROLLER_IMPL_H */
