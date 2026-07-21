export class MinPriorityQueue {
  constructor(compare) {
    this.compare = compare
    this.items = []
  }

  get size() {
    return this.items.length
  }

  peek() {
    return this.items[0]
  }

  push(value) {
    this.items.push(value)
    this.bubbleUp(this.items.length - 1)
  }

  pop() {
    if (!this.items.length) return undefined
    const first = this.items[0]
    const last = this.items.pop()
    if (this.items.length) {
      this.items[0] = last
      this.bubbleDown(0)
    }
    return first
  }

  values() {
    return [...this.items]
  }

  bubbleUp(index) {
    while (index) {
      const parent = Math.floor((index - 1) / 2)
      if (this.compare(this.items[parent], this.items[index]) <= 0) return
      ;[this.items[parent], this.items[index]] = [this.items[index], this.items[parent]]
      index = parent
    }
  }

  bubbleDown(index) {
    while (true) {
      const left = index * 2 + 1
      const right = left + 1
      let next = index
      if (left < this.items.length && this.compare(this.items[left], this.items[next]) < 0) next = left
      if (right < this.items.length && this.compare(this.items[right], this.items[next]) < 0) next = right
      if (next === index) return
      ;[this.items[index], this.items[next]] = [this.items[next], this.items[index]]
      index = next
    }
  }
}

export class MaxPriorityQueue extends MinPriorityQueue {}
