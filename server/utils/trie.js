class TrieNode {
  constructor() {
    this.children = {};
    this.words = new Set();
    this.end = false;
  }
}

class TitleTrie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(title) {
    if (!title) return;
    let current = this.root;
    const normalized = title.toLowerCase().trim();

    for (const ch of normalized) {
      if (!current.children[ch]) {
        current.children[ch] = new TrieNode();
      }
      current = current.children[ch];
      current.words.add(title);
    }

    current.end = true;
  }

  searchPrefix(prefix, limit = 20) {
    if (!prefix) return [];
    let current = this.root;
    const normalized = prefix.toLowerCase().trim();

    for (const ch of normalized) {
      if (!current.children[ch]) return [];
      current = current.children[ch];
    }

    return Array.from(current.words).slice(0, limit);
  }
}

module.exports = TitleTrie;
