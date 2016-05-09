RM=rm -rf
MKDIR=mkdir
GTEST_DIR=gtest
OBJS_DIR=objs
TEST_SRCS=tests/test_main.cc tests/test_controller.cc
CXX=g++
CXX_CFLAGS=-std=c++11 -g
SRCS=game.cc controller_impl.cc console_view.cc
OBJS=$(subst .cc,.o,${SRCS})
OBJS=$(addprefix ${OBJS_DIR}/, $(subst .cc,.o,${SRCS}))

all: main solver

solver: ${OBJS} solver.cc 
	${CXX} ${CXX_CFLAGS} -o solver solver.cc ${OBJS}
	
main: ${OBJS} main.cc 
	${CXX} ${CXX_CFLAGS} -o main main.cc ${OBJS}

${OBJS_DIR}/game.o: objs game.cc game.h
	${CXX} ${CXX_CFLAGS} -c game.cc -o ${OBJS_DIR}/game.o

${OBJS_DIR}/controller_impl.o: objs controller_impl.cc controller.h controller_impl.h util.h
	${CXX} ${CXX_CFLAGS} -c controller_impl.cc -o ${OBJS_DIR}/controller_impl.o

${OBJS_DIR}/console_view.o: objs console_view.cc view.h console_view.h util.h
	${CXX} ${CXX_CFLAGS} -c console_view.cc -o ${OBJS_DIR}/console_view.o

test: libgtest.a ${OBJS}
	${CXX} ${CXX_CFLAGS} -isystem ${GTEST_DIR}/include -pthread ${TEST_SRCS} ${OBJS_DIR}/libgtest.a\
		${OBJS} -o test_main && ./test_main

libgtest.a: objs
	${CXX} ${CXX_CFLAGS} -isystem ${GTEST_DIR}/include -I${GTEST_DIR} -pthread -c ${GTEST_DIR}/src/gtest-all.cc\
		-o ${OBJS_DIR}/gtest-all.o
	ar -rv ${OBJS_DIR}/libgtest.a ${OBJS_DIR}/gtest-all.o

objs:
	${MKDIR} objs

clean:
	$(RM) *.o objs/ main test_main solver *.dSYM
