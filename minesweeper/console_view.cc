#include <iostream>
#include <sstream>
#include <iomanip>       // setw
#include <cassert>

#include "console_view.h"
#include "controller.h"
#include "util.h"

static void clear_screen()
{
	// TODO:
}

static void split(const std::string& str, std::vector<std::string>& v) {
    std::istringstream iss(str);
    std::copy(std::istream_iterator<std::string>(iss),
        std::istream_iterator<std::string>(),
        std::back_inserter(v));
}

// read n ints from the stream
static int readint() {
	std::string temp;
	std::getline(std::cin, temp);
	if(!std::cin.good()) {
		return -1;
	}
	return std::stoi(temp);
}

static int decimal_len(int n) {
	int len = 0;
	do {
		n /= 10;
		len++;
	} while(n);
	return len;
}


void ConsoleView::show_welcome() {
	std::cout << "======== MINE SWEEP ==========" << std::endl;
} 

int ConsoleView::get_nboard() {
	std::cout << "To Start With:" << std::endl;
	while(!m_nboard) {
		std::cout << "Please Enter The Size Of The Board: ";
		m_nboard = readint();
		if(!std::cin.good()) {
			return -1;
		}

		if(m_nboard < 0) {
			m_nboard = 0;
		}
	}
	
	return m_nboard;
}

int ConsoleView::get_nmines() {
	int m_nmines = 0;
	while(!m_nmines) {
		std::cout << "Please Enter The Number Of The Mine: ";
		m_nmines = readint();
		if(!std::cin.good()) {
			return -1;
		}

		if(m_nmines < 0 || m_nmines >= m_nboard * m_nboard) {
			m_nmines = 0;
		}
	}
	return m_nmines;
}

static void render(const std::vector<std::vector<CellMeta>>& board, int cell_width) {
	std::cout << std::setw(5) << "r\\c";
	for(int i = 0; i < board.size(); ++i) {
		std::cout << std::setw(cell_width) << i;
	}
	std::cout << std::endl;
	for(int i = 0; i < board.size(); ++i) {
		std::cout << std::setw(5) << i;
		for(const auto& cell: board[i]) {
			switch(cell.cover) {
				case CellMeta::CoverType::Covered:
					std::cout << std::setw(cell_width) << "X";
					break;
				case CellMeta::CoverType::UnCovered:
					if(cell.type == CellMeta::Type::Mine) {
						std::cout << std::setw(cell_width) << "M";
					} else if(cell.nMinesNearby) {
						std::cout << std::setw(cell_width) << cell.nMinesNearby;
					} else {
						std::cout << std::setw(cell_width) << ".";
					}
					break;
				default:
					assert(false);
			}
		}
		std::cout << std::endl;
	}
}

void ConsoleView::game_loop(std::shared_ptr<Controller>& controller) {
	auto width = std::max(3, decimal_len(m_nmines));
	while (true) {
		auto board = controller->getBoard();
		render(board, width);

		auto p(std::make_pair(m_nboard, m_nboard));
		while(!isvalid(m_nboard, p.first, p.second)) {
			std::cout << "Please Enter The Row For The Cell To Sweep: ";
			p.first = readint();
			if(!std::cin.good()) {
				return ;
			}
			std::cout << "Please Enter The Col For The Cell To Sweep: ";
			p.second = readint();
			if(!std::cin.good()) {
				return ;
			}
		}

		auto res = controller->click(p.first, p.second);
		board = controller->getBoard();
		if(res == Controller::ClickRes::Lose) {
			render(board, width);
			std::cout << "Lose!" << std::endl;
			break;
		} else if (res == Controller::ClickRes::Win) {
			render(board, width);
			std::cout << "Win!" << std::endl;
			break;
		}
	}
	
}