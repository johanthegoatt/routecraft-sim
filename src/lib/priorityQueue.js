export function createPriorityQueue(compareFn) {
  const compare = compareFn || ((left, right) => left.priority - right.priority);
  const heap = [];

  function swap(i, j) {
    const temp = heap[i];
    heap[i] = heap[j];
    heap[j] = temp;
  }

  function bubbleUp(index) {
    let cursor = index;
    while (cursor > 0) {
      const parent = Math.floor((cursor - 1) / 2);
      if (compare(heap[cursor], heap[parent]) >= 0) break;
      swap(cursor, parent);
      cursor = parent;
    }
  }

  function bubbleDown(index) {
    let cursor = index;

    while (true) {
      const left = cursor * 2 + 1;
      const right = cursor * 2 + 2;
      let smallest = cursor;

      if (left < heap.length && compare(heap[left], heap[smallest]) < 0) {
        smallest = left;
      }

      if (right < heap.length && compare(heap[right], heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest === cursor) break;
      swap(cursor, smallest);
      cursor = smallest;
    }
  }

  return {
    push(item) {
      heap.push(item);
      bubbleUp(heap.length - 1);
    },
    pop() {
      if (heap.length === 0) return undefined;
      if (heap.length === 1) return heap.pop();

      const top = heap[0];
      heap[0] = heap.pop();
      bubbleDown(0);
      return top;
    },
    size() {
      return heap.length;
    }
  };
}
