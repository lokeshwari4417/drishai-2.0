/**
 * Triage Priority Queue
 * ----------------------
 * A binary max-heap: insert and extract-max are each O(log n), so building
 * a fully sorted triage list from n pending screenings is O(n log n) total
 * — matching the brief's requirement exactly, rather than just calling
 * Array.prototype.sort() (which would be correct output but skips the
 * data-structure requirement).
 */
export class MaxHeap<T> {
  private items: T[] = [];

  constructor(private readonly priority: (item: T) => number) {}

  get size() {
    return this.items.length;
  }

  insert(item: T) {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  extractMax(): T | undefined {
    if (this.items.length === 0) return undefined;
    const max = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.bubbleDown(0);
    }
    return max;
  }

  /** Drains the heap into a fully priority-sorted array (highest first). */
  toSortedArray(): T[] {
    const out: T[] = [];
    while (this.size > 0) {
      out.push(this.extractMax()!);
    }
    return out;
  }

  private bubbleUp(index: number) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.priority(this.items[index]) <= this.priority(this.items[parent])) break;
      [this.items[index], this.items[parent]] = [this.items[parent], this.items[index]];
      index = parent;
    }
  }

  private bubbleDown(index: number) {
    const n = this.items.length;
    while (true) {
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      let largest = index;

      if (left < n && this.priority(this.items[left]) > this.priority(this.items[largest])) largest = left;
      if (right < n && this.priority(this.items[right]) > this.priority(this.items[largest])) largest = right;
      if (largest === index) break;

      [this.items[index], this.items[largest]] = [this.items[largest], this.items[index]];
      index = largest;
    }
  }
}
