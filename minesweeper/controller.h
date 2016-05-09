#ifndef CONTROLLER_H
#define CONTROLLER_H 

#include <vector>

struct CellMeta {
    enum class CoverType {
        UnCovered, Covered, Flagged/*not implemented*/
    };
    enum class Type {
        None, Mine
    };

    Type type {Type::None};
    CoverType cover {CoverType::Covered};
    int nMinesNearby {0};
};

// controls underlying state of the game
class Controller {
public:
    enum ClickRes {
    	Lose, Win, None
    };
    // click on \p x and \p y.
    virtual ClickRes click(int x, int y) = 0; 

    // a snapshot of the current board
    virtual std::vector<std::vector<CellMeta>> getBoard() = 0;

    // how many coverred non-mines to go?
    virtual int leftNonMines() = 0;
};

// util
void debug_board(const std::vector<std::vector<CellMeta>> &board) ;
#endif /* CONTROLLER_H */
