"""
Custom Min-Heap Priority Queue implemented from scratch.
No external graph or heap libraries used.
"""

from typing import Any, List, Tuple, Optional, Dict


class MinHeap:
    """
    A binary min-heap priority queue storing items with associated numerical priorities.
    Supports O(log N) push and pop, O(1) peek, and state inspection for visualization.
    """

    def __init__(self):
        # Array of tuples: (priority, counter, item)
        # Counter is used as a tie-breaker to preserve insertion order for equal priorities
        self._heap: List[Tuple[float, int, Any]] = []
        self._counter: int = 0
        # Map item to its current best priority for quick membership check
        self._entry_finder: Dict[Any, float] = {}

    def push(self, item: Any, priority: float) -> None:
        """Push an item with a given priority into the min-heap."""
        self._counter += 1
        entry = (priority, self._counter, item)
        self._heap.append(entry)
        self._entry_finder[item] = priority
        self._sift_up(len(self._heap) - 1)

    def pop(self) -> Tuple[Any, float]:
        """
        Remove and return the item with the minimum priority as (item, priority).
        Raises IndexError if the heap is empty.
        """
        if not self._heap:
            raise IndexError("pop from an empty priority queue")
        
        # Swap root with the last element
        self._swap(0, len(self._heap) - 1)
        priority, _, item = self._heap.pop()
        
        if item in self._entry_finder and self._entry_finder[item] == priority:
            del self._entry_finder[item]

        if self._heap:
            self._sift_down(0)

        return item, priority

    def peek(self) -> Optional[Tuple[Any, float]]:
        """Return the item with minimum priority without removing it, or None if empty."""
        if not self._heap:
            return None
        priority, _, item = self._heap[0]
        return item, priority

    def is_empty(self) -> bool:
        """Check if the priority queue is empty."""
        return len(self._heap) == 0

    def __len__(self) -> int:
        return len(self._heap)

    def contains(self, item: Any) -> bool:
        """Check if an item is currently tracked in the heap."""
        return item in self._entry_finder

    def get_priority(self, item: Any) -> Optional[float]:
        """Return the current priority of the item if present."""
        return self._entry_finder.get(item)

    def to_list(self) -> List[Dict[str, Any]]:
        """
        Return a snapshot of all elements currently in the priority queue,
        sorted by priority. Useful for UI inspector and step visualization.
        """
        sorted_copy = sorted(self._heap, key=lambda x: (x[0], x[1]))
        return [{"item": str(entry[2]), "priority": round(entry[0], 3)} for entry in sorted_copy]

    def _sift_up(self, index: int) -> None:
        """Move the item at index up to its proper position to restore min-heap property."""
        while index > 0:
            parent = (index - 1) // 2
            if self._heap[index][0] < self._heap[parent][0]:
                self._swap(index, parent)
                index = parent
            elif self._heap[index][0] == self._heap[parent][0] and self._heap[index][1] < self._heap[parent][1]:
                self._swap(index, parent)
                index = parent
            else:
                break

    def _sift_down(self, index: int) -> None:
        """Move the item at index down to restore min-heap property."""
        n = len(self._heap)
        while True:
            left = 2 * index + 1
            right = 2 * index + 2
            smallest = index

            if left < n and (
                self._heap[left][0] < self._heap[smallest][0] or
                (self._heap[left][0] == self._heap[smallest][0] and self._heap[left][1] < self._heap[smallest][1])
            ):
                smallest = left

            if right < n and (
                self._heap[right][0] < self._heap[smallest][0] or
                (self._heap[right][0] == self._heap[smallest][0] and self._heap[right][1] < self._heap[smallest][1])
            ):
                smallest = right

            if smallest != index:
                self._swap(index, smallest)
                index = smallest
            else:
                break

    def _swap(self, i: int, j: int) -> None:
        self._heap[i], self._heap[j] = self._heap[j], self._heap[i]

