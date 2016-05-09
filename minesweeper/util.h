#ifndef UTIL_H
#define UTIL_H

#include <vector>
#include <functional>
#include <iostream>

inline std::pair<int, int> convert2xy(int nboard, int pos) {
    return std::make_pair(pos/nboard, pos%nboard);
}

inline bool isvalid(int nboard, int x, int y) {
    return (x > -1 && y > -1 && x < nboard && y < nboard);
}

inline void visit(int nboard, 
    int x, 
    int y, 
    const std::function<void(int, int)>& visitor) {
    if(isvalid(nboard, x, y)) {
        visitor(x, y);
    }
}

inline void visit_neighbors(int nboard, 
    int x, 
    int y, 
    const std::function<void(int, int)>& visitor) {
    visit(nboard, x-1, y-1, visitor);
    visit(nboard, x-1, y,   visitor);
    visit(nboard, x-1, y+1, visitor);
    visit(nboard, x,   y-1, visitor);
    visit(nboard, x,   y+1, visitor);
    visit(nboard, x+1, y-1, visitor);
    visit(nboard, x+1, y,   visitor);
    visit(nboard, x+1, y+1, visitor);
}

namespace std{
    template<typename K, typename V>
static std::ostream& operator<<(std::ostream& os, const pair<K,V>& e) {
    os << "(" << e.first << "," << e.second << ")";
    return os;
}
}

template<typename C>
struct printable_container_t
{
    const C& m_c;
    std::string m_seperator;

    printable_container_t(const C& c, const std::string& seperator)
    : m_c(c), m_seperator(seperator)
    {}

    virtual void print(std::ostream &os) const {
      if(m_c.empty()) {
        return;
      }
      std::ostream_iterator<typename C::value_type> outit(os, m_seperator.c_str());
      auto prev(std::prev(std::end(m_c)));
      std::copy(std::begin(m_c),
                prev,
                outit);
      os << *prev;
    }
};

template<typename C>
inline std::ostream& operator<<(std::ostream &os, const printable_container_t<C> &pc)
{
    pc.print(os);
    return os;
}

template<typename C>
inline printable_container_t<C> printable_container(const C& c, const std::string& seperator = ",")
{
    return printable_container_t<C>(c, seperator);
}

//#define _DEBUG
#ifdef _DEBUG
#define LOG(msg) std::cout << msg
#else
#define LOG(msg)
#endif

#endif /* UTIL_H */