#pragma once

#include <optional>
#include <string>
#include <vector>

#include "routing/node.hpp"

namespace routing {

class SnapshotCache {
 public:
  void changed() {}

  std::optional<std::vector<Node>> healthy_in_rack(const std::vector<Node>&, const std::string&) const {
    return std::nullopt;
  }

  std::optional<std::vector<Node>> snapshot(const std::vector<Node>&) const {
    return std::nullopt;
  }
};

}  // namespace routing
