#include <ctime>                // time
#include <iostream>
#include <cstdlib>              // rand
#include <queue>				// queue
#include <set>					// set

#include "controller_impl.h"
#include "util.h"

static const int NUM_TRIES = 100000;
static const int NBOARD = 10;
static const int NMINES = 10;

// mark and record the number for a point
static void flagAndRecordNewNumPoint(const std::vector<std::vector<CellMeta>>& old_board,
	std::vector<std::vector<CellMeta>>& board,
	std::set<int>& flagged,
	std::vector<std::pair<int, int>>& res,
	int x, 
	int y) {
	board[x][y].cover = CellMeta::CoverType::Flagged; // mark
	flagged.insert(x * NBOARD + y);

	if(old_board[x][y].cover == CellMeta::CoverType::Covered && 
	board[x][y].nMinesNearby) { // numbered
		res.push_back(std::make_pair(x, y));
	}
}

// from the (x,y) flag all the UnCovered neighbors
// return the numbered UnCovered neighbors
static std::vector<std::pair<int, int>> flagAndGetNewNumPoints(const std::vector<std::vector<CellMeta>>& old_board,
	std::vector<std::vector<CellMeta>>& board,
	std::set<int>& flagged,
	int x, 
	int y)
{
	std::queue<std::pair<int, int>> q;
	q.push(std::make_pair(x, y));

	std::vector<std::pair<int, int>> res;

	flagAndRecordNewNumPoint(old_board, board, flagged, res, x, y);

	while(!q.empty()) {
		auto p = q.front(); q.pop();

		visit_neighbors(NBOARD, p.first, p.second, [&board, &old_board, &flagged, &res, &q](int x1, int y1){
			if(board[x1][y1].cover == CellMeta::CoverType::UnCovered) {
				flagAndRecordNewNumPoint(old_board, board, flagged, res, x1, y1);
				q.push(std::make_pair(x1, y1));
			}
		});
	}

	return res;
}

////////  strategies to choose next cell to explore /////////

// 2% success rate
static std::pair<int, int> strategy_first_unflagged(const std::set<int>& all, 
	const std::set<int>& flagged)
{
	std::vector<int> unflagged;
	std::set_difference(all.begin(), all.end(), flagged.begin(), flagged.end(), std::back_inserter(unflagged));
	return convert2xy(NBOARD, unflagged[0]);
}

// 10% success rate
static std::pair<int, int> strategy_randomly_unflagged(const std::set<int>& all, 
	const std::set<int>& flagged)
{
	std::vector<int> unflagged;
	std::set_difference(all.begin(), all.end(), flagged.begin(), flagged.end(), std::back_inserter(unflagged));
	int rand_pos = std::rand() % unflagged.size();
	return convert2xy(NBOARD, unflagged[rand_pos]);
}

// roughly return the second one in a unflagged group, *unstable* success rate, can reach 25%
static std::pair<int, int> strategy_grouped_unflagged(const std::set<int>& all, 
	const std::set<int>& flagged)
{
	std::vector<int> unflagged;
	std::set_difference(all.begin(), all.end(), flagged.begin(), flagged.end(), std::back_inserter(unflagged));

	for(auto i: unflagged) {
		auto p (convert2xy(NBOARD, i));
		bool has_neighbor_unflagged = false;
		std::pair<int, int> ret {-1, -1};
		visit_neighbors(NBOARD, p.first, p.second, [&flagged, &has_neighbor_unflagged, &ret](int x, int y) {
			if(!has_neighbor_unflagged &&
				flagged.find(x * NBOARD + y) == flagged.end()) {
				has_neighbor_unflagged = true;
				ret = std::make_pair(x, y);
			}
		});
		if(has_neighbor_unflagged) {
			return ret;
		}
	}

	int rand_pos = std::rand() % unflagged.size();
	return convert2xy(NBOARD, unflagged[rand_pos]);
}

// almost brute-force approach
bool solve(std::shared_ptr<Controller>& controller) 
{
	// do not visit flagged
	// - visited or has a mine
	std::set<int> flagged, all;
	for(int i = 0; i < NBOARD; ++i) {
		for(int j = 0; j < NBOARD; ++j) {
			all.insert(i * NBOARD + j);
		}
	}
	// encourage to visit
	std::queue<std::pair<int, int>> tovisit;

	while(true) {
		std::pair<int, int> p{-1, -1};
		if(tovisit.empty()) {
			//p = strategy_randomly_unflagged(all, flagged);
			if(controller->leftNonMines() > 10) {
				p = strategy_randomly_unflagged(all, flagged);
			} else {
				p = strategy_grouped_unflagged(all, flagged);
			}
		} else {
			p = tovisit.front(); tovisit.pop();
		}

		auto old_board = controller->getBoard();
		auto res = controller->click(p.first, p.second);
		if( res == Controller::ClickRes::Lose) {
			return false;
		} else if (res == Controller::ClickRes::Win) {
			return true;
		}

		auto board = controller->getBoard();
		debug_board(board);
		auto new_num_points = flagAndGetNewNumPoints(old_board, board, flagged, p.first, p.second);

		LOG(__FUNCTION__ << " new num points: " << printable_container(new_num_points) << std::endl);

		// if nCoveredNeighers == nMinesNearby
		// then every neighbor has a mine
		for(const auto& np: new_num_points) {
			std::vector<std::pair<int, int>> coveredNeighers;
			visit_neighbors(NBOARD, np.first, np.second, [&board, &coveredNeighers](int x, int y){
				if(board[x][y].cover == CellMeta::CoverType::Covered) {
					coveredNeighers.push_back(std::make_pair(x, y));
				}
			});
			if(coveredNeighers.size() == board[np.first][np.second].nMinesNearby) {
				for(const auto& n: coveredNeighers) {
					LOG(__FUNCTION__ << " flag: " << n << std::endl);
					flagged.insert(n.first * NBOARD + n.second);
				}
			}
		}
	

		for(const auto& np: new_num_points) {
			std::vector<std::pair<int, int>> unflaggedCoveredNeighors;
			int nFlaggedCoveredNeighors = 0;
			visit_neighbors(NBOARD, np.first, np.second, [&board, &flagged, &unflaggedCoveredNeighors, &nFlaggedCoveredNeighors](int x, int y){
				if(board[x][y].cover ==  CellMeta::CoverType::Covered) {
					if(flagged.find(x * NBOARD + y) == flagged.end()) {
						unflaggedCoveredNeighors.push_back(std::make_pair(x, y));
					} else {
						nFlaggedCoveredNeighors++;
					}
				}
				
			});
			// if cell.nMinesNearby == nFlaggedCoveredNeighors, unflaggedCoveredNeighors are not Mine
			if(nFlaggedCoveredNeighors == board[np.first][np.second].nMinesNearby) {
				for(const auto& n: unflaggedCoveredNeighors) {
					LOG(__FUNCTION__ << " tovisit: " << n << std::endl);
					tovisit.push(std::make_pair(n.first, n.second));
				}
			}
		} 

		/* if a cell's neighbors all uncovered; if they're all numbers, then a Mine; Otherwise, tovisit
		for(const auto& np: new_num_points) {
			visit_neighbors(NBOARD, np.first, np.second, [&board, &flagged, &tovisit](int x, int y) {
				if(flagged.find(NBOARD * x + y) == flagged.end()) {
					int nUncoveredNeighbors = 0, nNumberedNeighers = 0;
					visit_neighbors(NBOARD, x, y, [&board, &nUncoveredNeighbors, &nNumberedNeighers, &tovisit](int x1, int y1) {
						if(board[x1][y1].cover == CellMeta::CoverType::UnCovered) {
							if(board[x1][y1].nMinesNearby) {
								++nNumberedNeighers;
							}
							++nUncoveredNeighbors;
						} 
					});
					if(nUncoveredNeighbors == 7) {
						if(nNumberedNeighers == 7) {
							flagged.insert(NBOARD * x + y);
						} else {
							tovisit.push(std::make_pair(x, y));
						}
					}
				}
			});
		}*/
	}
	
}

int main() {
	//std::shared_ptr<Controller> controller(new ControllerImpl(NBOARD, NMINES));
	//std::cout << solve(controller) << std::endl;

	std::srand(std::time(0));

	int count = 0;
	std::time_t start = std::time(nullptr);
	for(int i = 0; i < NUM_TRIES; ++i) {
		std::shared_ptr<Controller> controller(new ControllerImpl(NBOARD, NMINES));
		count += solve(controller);
	}
	std::time_t end = std::time(nullptr);

	std::cout << "time usage(second): " << (end - start) << std::endl;
	std::cout << "success rate: " << (count / (double)NUM_TRIES) << std::endl;  
}