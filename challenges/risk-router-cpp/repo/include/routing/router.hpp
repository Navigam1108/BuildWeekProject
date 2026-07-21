#pragma once

#include <vector>

#include "routing/node.hpp"
#include "routing/topology_cache.hpp"

namespace routing {

class ShardRouter {
 public:
  void register_node(Node node);
  bool remove_node(const std::string& id);
  void set_health(const std::string& id, bool healthy);
  const Node* choose(const std::string& tenant, const std::string& key) const;
  std::vector<Node> healthy_in_rack(const std::string& rack) const;
  std::vector<Node> snapshot() const;

 private:
  std::vector<Node> nodes_;
  TopologyCache cache_;
};

}  // namespace routing
