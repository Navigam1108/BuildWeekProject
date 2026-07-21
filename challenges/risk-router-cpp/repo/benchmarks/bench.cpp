#include "routing/router.hpp"

#include <chrono>
#include <iostream>

int main() {
  routing::ShardRouter router;
  for (int index = 0; index < 8'000; ++index) router.register_node({"node-" + std::to_string(index), "rack-" + std::to_string(index % 8), index % 5 + 1, true});
  const auto measure = [](const auto& work) {
    const auto start = std::chrono::steady_clock::now();
    work();
    return std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - start).count();
  };
  const auto node_lookup = measure([&] { for (int index = 0; index < 2'000; ++index) router.set_health("node-" + std::to_string(index), index % 2 == 0); });
  const auto rack_health = measure([&] { for (int index = 0; index < 2'000; ++index) router.healthy_in_rack("rack-" + std::to_string(index % 8)); });
  const auto weighted_route = measure([&] { for (int index = 0; index < 2'000; ++index) router.choose("tenant-" + std::to_string(index % 100), "order-" + std::to_string(index)); });
  const auto topology_snapshot = measure([&] { for (int index = 0; index < 1'000; ++index) router.snapshot(); });
  const auto invalidation = measure([&] { for (int index = 0; index < 800; ++index) { router.register_node({"burst-" + std::to_string(index), "rack-0", 1, true}); router.remove_node("burst-" + std::to_string(index)); } });
  const auto total = node_lookup + rack_health + weighted_route + topology_snapshot + invalidation;
  std::cout << "node_lookup_ms=" << node_lookup << "\n";
  std::cout << "rack_health_ms=" << rack_health << "\n";
  std::cout << "weighted_route_ms=" << weighted_route << "\n";
  std::cout << "topology_snapshot_ms=" << topology_snapshot << "\n";
  std::cout << "invalidation_ms=" << invalidation << "\n";
  std::cout << "candidate_ms=" << total << "\n";
}
