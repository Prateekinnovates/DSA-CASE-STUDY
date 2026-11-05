/**
 * Custom Binary Min-Heap Priority Queue implemented from scratch in TypeScript.
 * No external graph or heap libraries used.
 */

interface HeapEntry<T> {
  item: T;
  priority: number;
  counter: number;
}

export class MinHeap<T = string> {
  private heap: HeapEntry<T>[] = [];
  private counter: number = 0;
  private entryFinder: Map<T, number> = new Map();

  push(item: T, priority: number): void {
    this.counter += 1;
    const entry: HeapEntry<T> = { item, priority, counter: this.counter };
    this.heap.push(entry);
    this.entryFinder.set(item, priority);
    this.siftUp(this.heap.length - 1);
  }

  pop(): [T, number] {
    if (this.heap.length === 0) {
      throw new Error("pop from an empty priority queue");
    }

    this.swap(0, this.heap.length - 1);
    const top = this.heap.pop()!;

    if (this.entryFinder.get(top.item) === top.priority) {
      this.entryFinder.delete(top.item);
    }

    if (this.heap.length > 0) {
      this.siftDown(0);
    }

    return [top.item, top.priority];
  }

  peek(): [T, number] | null {
    if (this.heap.length === 0) return null;
    return [this.heap[0].item, this.heap[0].priority];
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  get length(): number {
    return this.heap.length;
  }

  contains(item: T): boolean {
    return this.entryFinder.has(item);
  }

  getPriority(item: T): number | undefined {
    return this.entryFinder.get(item);
  }

  toList(): Array<{ item: string; priority: number }> {
    const copy = [...this.heap];
    copy.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.counter - b.counter;
    });
    return copy.map((entry) => ({
      item: String(entry.item),
      priority: Number(entry.priority.toFixed(3)),
    }));
  }

  private siftUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (
        this.heap[index].priority < this.heap[parent].priority ||
        (this.heap[index].priority === this.heap[parent].priority &&
          this.heap[index].counter < this.heap[parent].counter)
      ) {
        this.swap(index, parent);
        index = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(index: number): void {
    const n = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (
        left < n &&
        (this.heap[left].priority < this.heap[smallest].priority ||
          (this.heap[left].priority === this.heap[smallest].priority &&
            this.heap[left].counter < this.heap[smallest].counter))
      ) {
        smallest = left;
      }

      if (
        right < n &&
        (this.heap[right].priority < this.heap[smallest].priority ||
          (this.heap[right].priority === this.heap[smallest].priority &&
            this.heap[right].counter < this.heap[smallest].counter))
      ) {
        smallest = right;
      }

      if (smallest !== index) {
        this.swap(index, smallest);
        index = smallest;
      } else {
        break;
      }
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}

