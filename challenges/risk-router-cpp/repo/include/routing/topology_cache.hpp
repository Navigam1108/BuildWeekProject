#pragma once

#include <optional>
#include <string>
#include <vector>

#include "routing/node.hpp"
#include "routing/selection_cache.hpp"
#include "routing/snapshot_cache.hpp"

namespace routing {

class TopologyCache {
 public:
  void registered(const Node&) { selection_.changed(); snapshots_.changed(); }
  void removed(const std::string&) { selection_.changed(); snapshots_.changed(); }
  void health_changed(const std::string&, bool) { selection_.changed(); snapshots_.changed(); }

  std::optional<const Node*> choose(const std::vector<Node>& nodes, const std::string& tenant, const std::string& key) const {
    return selection_.choose(nodes, tenant, key);
  }

  std::optional<std::vector<Node>> healthy_in_rack(const std::vector<Node>& nodes, const std::string& rack) const {
    return snapshots_.healthy_in_rack(nodes, rack);
  }

  std::optional<std::vector<Node>> snapshot(const std::vector<Node>& nodes) const {
    return snapshots_.snapshot(nodes);
  }

 private:
  SelectionCache selection_;
  SnapshotCache snapshots_;
};

}  // namespace routing
