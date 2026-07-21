#include "routing/router.hpp"

#include <cassert>
#include <iostream>

int main() {
  routing::ShardRouter router;
  router.register_node({"blr-a", "blr", 2, true});
  router.register_node({"blr-b", "blr", 1, false});
  assert(router.choose("tenant", "key") != nullptr);
  assert(router.healthy_in_rack("blr").size() == 1);
  router.set_health("blr-a", false);
  assert(router.choose("tenant", "key") == nullptr);
  assert(router.remove_node("blr-b"));
  std::cout << "ok\n";
}
