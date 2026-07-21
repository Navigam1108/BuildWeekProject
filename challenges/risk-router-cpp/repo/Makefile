CXX ?= g++
CXXFLAGS := -std=c++20 -O2 -Wall -Wextra -pedantic -Iinclude

test:
	$(CXX) $(CXXFLAGS) src/router.cpp tests/router_test.cpp -o /tmp/router_test
	/tmp/router_test

bench:
	$(CXX) $(CXXFLAGS) src/router.cpp benchmarks/bench.cpp -o /tmp/router_bench
	/tmp/router_bench
