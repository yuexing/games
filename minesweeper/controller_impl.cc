#include <cstdlib>              // rand
#include <ctime>                // time
#include <cassert>              // assert
#include <queue>                // queue

#include "controller_impl.h"
#include "util.h"

void debug_board(const std::vector<std::vector<CellMeta>> &board) {
    for(const auto& row: board) {
        for(const auto& cell: row) {
            LOG("(" << (cell.cover == CellMeta::CoverType::Covered?'X':'.')
                << ", " << (cell.type == CellMeta::Type::Mine?'M':'.')
                << ", " << cell.nMinesNearby << ") ");
        }
        LOG(std::endl);
    }
}

static void deploy_mine(std::vector<std::vector<CellMeta>>& board, int x, int y) {
    auto &cell = board[x][y];
    assert(cell.type == CellMeta::Type::None);
    
    cell.type = CellMeta::Type::Mine;
    visit_neighbors(board.size(), x, y, [&board](int x, int y){
        board[x][y].nMinesNearby++;
    });
}

// randomly select n numbers from [0, limit)
// alg: 
// - suppose already selete i numbers out of [0, limit) and put them in all[0:i-1]
// - then select from the left numbers which are in all[i:limit-1] and put it in i
static std::vector<int> random_select(int limit, int n, int eliminate) {
    std::vector<int> all(limit);
    for(int i = 0; i < limit; ++i) {
        all[i] = i;
    }

    // ignore the eliminate
    all[eliminate] = limit-1;
    all[limit-1] = eliminate;

    // the n < limit
    std::srand(std::time(0));
    for(int i = 0; i < n; ++i) {
        int pos = i + std::rand() % (limit - 1 - i);

        int temp = all[pos];
        all[pos] = all[i];
        all[i] = temp;
    }

    all.resize(n);
    return all;
}

static void deploy_mines(std::vector<std::vector<CellMeta>>& board, int nmines, int eliminate) { 
   auto selected_poses = random_select(board.size() * board.size(), nmines, eliminate);
   for(auto pos: selected_poses) {
        auto pos_xy = convert2xy(board.size(), pos);
        deploy_mine(board, pos_xy.first, pos_xy.second);
   } 
}

static int uncover_neighbors(std::vector<std::vector<CellMeta>>& board, int x, int y) {
    int nuncovered = 1;

    std::queue<std::pair<int, int>> q;
    board[x][y].cover = CellMeta::CoverType::UnCovered;
    q.push(std::make_pair(x, y));

    while(!q.empty()) {
        auto p = q.front(); q.pop();

        visit_neighbors(board.size(), p.first, p.second, [&board, &q, &nuncovered](int x, int y){
            if(board[x][y].cover == CellMeta::CoverType::Covered &&
                board[x][y].type == CellMeta::Type::None) {
                board[x][y].cover = CellMeta::CoverType::UnCovered;
                nuncovered++;

                if(!board[x][y].nMinesNearby) { // only bfs blank
                    q.push(std::make_pair(x, y));
                }
            }
        });
    }
    return nuncovered;
}

ControllerImpl::ControllerImpl(int nboard, int nmines) 
: m_board(nboard, std::vector<CellMeta>(nboard)),
  m_nmines(nmines) {
    assert(nmines < m_board.size() * m_board.size());
}

Controller::ClickRes ControllerImpl::click(int x, int y) {
    assert(isvalid(m_board.size(), x, y));

    if(m_is_first_click) {
        m_is_first_click = false;
        deploy_mines(m_board, m_nmines, x * m_board.size() + y);
    }

    auto &cell = m_board[x][y];
    if(cell.type == CellMeta::Type::Mine) {
        LOG("ControllerImpl::" << __FUNCTION__ << "(" << x << "," << y << "): LOSE!" << std::endl);
        cell.cover = CellMeta::CoverType::UnCovered;
        return ClickRes::Lose;
    } else {
        if(m_board[x][y].cover == CellMeta::CoverType::Covered) { 
            auto nuncovered = uncover_neighbors(m_board, x, y);
            m_nuncovered += nuncovered;
            LOG("ControllerImpl::" << __FUNCTION__ << "(" << x << "," << y << "), nuncovered: " 
                << nuncovered << ", m_nuncovered: " << m_nuncovered << std::endl);
            debug_board(m_board);
        }
        return m_nuncovered + m_nmines == m_board.size() * m_board.size()? ClickRes::Win: ClickRes::None;
    }
}

int ControllerImpl::leftNonMines() {
    return m_board.size() * m_board.size() - m_nmines - m_nuncovered; 
}

std::vector<std::vector<CellMeta>> ControllerImpl::getBoard() {
    return m_board;
}