#pragma once

#include <optional>
#include <string>
#include <vector>

#include "routing/node.hpp"

namespace routing {

class SelectionCache {
 public:
  void changed() {}

  std::optional<const Node*> choose(const std::vector<Node>&, const std::string&, const std::string&) const {
    return std::nullopt;
  }
};

}  // namespace routing
