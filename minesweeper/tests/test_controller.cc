#include <gtest/gtest.h>
#include "../controller_impl.h"
#include "../util.h"

// return the mines' positions
static std::vector<std::pair<int, int>> getMines(const std::vector<std::vector<CellMeta>>& board) {
	std::vector<std::pair<int, int>> mines;

	for(int i = 0; i < board.size(); ++i) {
		for(int j = 0; j < board[i].size(); ++j) {
			const auto& cell = board[i][j];
			if(cell.type == CellMeta::Type::Mine) {
				mines.push_back(std::make_pair(i, j));
			}
		}
	}

	return mines;
}

// verify the board
static void verifyBoard(const std::vector<std::vector<CellMeta>>& b, int nboard, int nmines) {
	std::vector<std::vector<CellMeta>> board{b};
	std::vector<std::pair<int, int>> mines;

	ASSERT_EQ(board.size(), nboard);
	for(int i = 0; i < board.size(); ++i) {
		const auto& row = board[i];
		ASSERT_EQ(row.size(), nboard);
		for(int j = 0; j < row.size(); ++j) {
			const auto& cell = row[j];
			if(cell.type == CellMeta::Type::Mine) {
				nmines--;
				visit_neighbors(board.size(), i, j, [&board](int x, int y){
					board[x][y].nMinesNearby--;
				});
			}
		}
	}

	for(const auto& row: board) {
		for(const auto& cell: row) {
			ASSERT_EQ(cell.nMinesNearby, 0);
		}
	}

	ASSERT_EQ(nmines, 0);
}

TEST(ControllerImplTestCase, testInit) {
	{
		auto contoller = std::make_shared<ControllerImpl>(2, 1);
		contoller->click(0, 0);
		auto board = contoller->getBoard();
		verifyBoard(board, 2, 1);
	}
	
	{
		auto contoller = std::make_shared<ControllerImpl>(5, 10);
		contoller->click(0, 0);
		auto board = contoller->getBoard();
		verifyBoard(board, 5, 10);
	}
}

TEST(ControllerImplTestCase, testClick) {
	{
		auto contoller = std::make_shared<ControllerImpl>(2, 1);
		auto board = contoller->getBoard();
		ASSERT_EQ(contoller->click(0, 0), Controller::ClickRes::Win);
	}
	{
		auto contoller = std::make_shared<ControllerImpl>(3, 2);
		bool has_win = contoller->click(0, 0) == Controller::ClickRes::Win;
		auto board = contoller->getBoard();
		auto mines = getMines(board);
		for(const auto& mine: mines) {
			visit_neighbors(3, mine.first, mine.second, [&contoller, &board, &has_win](int x, int y){
				if(!has_win) {
					has_win = (contoller->click(x, y) == Controller::ClickRes::Win);
				}
			});
		}
		ASSERT_TRUE(has_win);	
	}
}