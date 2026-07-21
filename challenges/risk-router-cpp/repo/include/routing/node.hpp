#pragma once

#include <string>

namespace routing {

struct Node {
  std::string id;
  std::string rack;
  int weight;
  bool healthy;
};

}  // namespace routing
