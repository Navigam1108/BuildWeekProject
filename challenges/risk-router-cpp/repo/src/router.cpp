#include "routing/router.hpp"

#include <algorithm>
#include <functional>

namespace routing {

void ShardRouter::register_node(Node node) { nodes_.push_back(std::move(node)); }

bool ShardRouter::remove_node(const std::string& id) {
  const auto it = std::find_if(nodes_.begin(), nodes_.end(), [&](const Node& node) { return node.id == id; });
  if (it == nodes_.end()) return false;
  nodes_.erase(it);
  return true;
}

void ShardRouter::set_health(const std::string& id, bool healthy) {
  for (auto& node : nodes_) if (node.id == id) { node.healthy = healthy; return; }
}

const Node* ShardRouter::choose(const std::string& tenant, const std::string& key) const {
  std::vector<const Node*> choices;
  for (const auto& node : nodes_) if (node.healthy) for (int copy = 0; copy < node.weight; ++copy) choices.push_back(&node);
  if (choices.empty()) return nullptr;
  return choices[std::hash<std::string>{}(tenant + ":" + key) % choices.size()];
}

std::vector<Node> ShardRouter::healthy_in_rack(const std::string& rack) const {
  std::vector<Node> result;
  for (const auto& node : nodes_) if (node.rack == rack && node.healthy) result.push_back(node);
  return result;
}

std::vector<Node> ShardRouter::snapshot() const {
  auto result = nodes_;
  std::sort(result.begin(), result.end(), [](const Node& left, const Node& right) { return left.id < right.id; });
  return result;
}

}  // namespace routing
