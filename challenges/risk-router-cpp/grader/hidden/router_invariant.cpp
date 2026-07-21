#include "routing/router.hpp"
#include <cassert>
int main() { routing::ShardRouter router; router.register_node({"a", "r", 1, true}); router.set_health("a", false); assert(router.choose("t", "k") == nullptr); }
