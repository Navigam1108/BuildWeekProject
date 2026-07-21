#include "routing/router.hpp"

#include <algorithm>
#include <functional>

namespace routing {

void ShardRouter::register_node(Node node) {
  nodes_[node.id] = std::move(node);
  topology_dirty_ = true;
}

bool ShardRouter::remove_node(const std::string& id) {
  const auto it = nodes_.find(id);
  if (it == nodes_.end()) return false;
  nodes_.erase(it);
  topology_dirty_ = true;
  return true;
}

void ShardRouter::set_health(const std::string& id, bool healthy) {
  if (const auto it = nodes_.find(id); it != nodes_.end()) {
    it->second.healthy = healthy;
    topology_dirty_ = true;
  }
}

void ShardRouter::rebuild_route_table() const {
  if (!topology_dirty_) return;
  route_table_.clear();
  healthy_racks_.clear();
  for (const auto& [_, node] : nodes_) {
    if (node.healthy) {
      healthy_racks_[node.rack].push_back(&node);
      for (int copy = 0; copy < node.weight; ++copy) route_table_.push_back(&node);
    }
  }
  snapshot_.clear();
  snapshot_.reserve(nodes_.size());
  for (const auto& [_, node] : nodes_) snapshot_.push_back(node);
  std::sort(snapshot_.begin(), snapshot_.end(), [](const Node& a, const Node& b) { return a.id < b.id; });
  topology_dirty_ = false;
}

const Node* ShardRouter::choose(const std::string& tenant, const std::string& key) const {
  rebuild_route_table();
  if (route_table_.empty()) return nullptr;
  return route_table_[std::hash<std::string>{}(tenant + ":" + key) % route_table_.size()];
}

std::vector<Node> ShardRouter::healthy_in_rack(const std::string& rack) const {
  std::vector<Node> result;
  rebuild_route_table();
  if (const auto it = healthy_racks_.find(rack); it != healthy_racks_.end()) {
    result.reserve(it->second.size());
    for (const auto* node : it->second) result.push_back(*node);
  }
  return result;
}

std::vector<Node> ShardRouter::snapshot() const { rebuild_route_table(); return snapshot_; }

}  // namespace routing
