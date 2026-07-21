#pragma once

#include <string>
#include <unordered_map>
#include <vector>

namespace routing {

struct Node { std::string id; std::string rack; int weight; bool healthy; };

class ShardRouter {
 public:
  void register_node(Node node);
  bool remove_node(const std::string& id);
  void set_health(const std::string& id, bool healthy);
  const Node* choose(const std::string& tenant, const std::string& key) const;
  std::vector<Node> healthy_in_rack(const std::string& rack) const;
  std::vector<Node> snapshot() const;

 private:
  void rebuild_route_table() const;
  std::unordered_map<std::string, Node> nodes_;
  mutable bool topology_dirty_ = true;
  mutable std::vector<Node> snapshot_;
  mutable std::vector<const Node*> route_table_;
  mutable std::unordered_map<std::string, std::vector<const Node*>> healthy_racks_;
};

}  // namespace routing
