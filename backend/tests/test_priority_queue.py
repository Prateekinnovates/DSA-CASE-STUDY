"""
Unit tests for custom MinHeap priority queue implemented from scratch.
"""

import pytest
from app.algorithms.priority_queue import MinHeap


def test_min_heap_basic_push_and_pop():
    pq = MinHeap()
    assert pq.is_empty()
    assert len(pq) == 0

    pq.push("A", 10.5)
    pq.push("B", 3.2)
    pq.push("C", 15.0)
    pq.push("D", 1.0)

    assert not pq.is_empty()
    assert len(pq) == 4
    assert pq.peek() == ("D", 1.0)

    item, prio = pq.pop()
    assert item == "D"
    assert prio == 1.0

    item, prio = pq.pop()
    assert item == "B"
    assert prio == 3.2

    item, prio = pq.pop()
    assert item == "A"
    assert prio == 10.5

    item, prio = pq.pop()
    assert item == "C"
    assert prio == 15.0

    assert pq.is_empty()
    with pytest.raises(IndexError):
        pq.pop()


def test_min_heap_tie_breaking():
    pq = MinHeap()
    pq.push("First", 5.0)
    pq.push("Second", 5.0)
    pq.push("Third", 5.0)

    # Order should match insertion sequence when priorities are tied
    item1, _ = pq.pop()
    item2, _ = pq.pop()
    item3, _ = pq.pop()

    assert item1 == "First"
    assert item2 == "Second"
    assert item3 == "Third"


def test_min_heap_to_list():
    pq = MinHeap()
    pq.push("Node1", 8.0)
    pq.push("Node2", 2.0)
    pq.push("Node3", 5.0)

    lst = pq.to_list()
    assert len(lst) == 3
    assert lst[0]["item"] == "Node2"
    assert lst[0]["priority"] == 2.0
    assert lst[1]["item"] == "Node3"
    assert lst[1]["priority"] == 5.0
    assert lst[2]["item"] == "Node1"
    assert lst[2]["priority"] == 8.0

