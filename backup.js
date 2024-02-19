const Parser = require("tree-sitter");
const Swift = require("tree-sitter-swift");
const parser = new Parser();
parser.setLanguage(Swift);

const mySourceCode = `

import Foundation

func greet() {
    print("Nigga wassap!!")
}


`; 

const tree = parser.parse(mySourceCode);

const rootNode = tree.rootNode;
console.log("Root node kind: ", rootNode.kind);
console.log("Root node start position: ", rootNode.startPosition);
console.log("Root node end position: ", rootNode.endPosition);


tree.edit({
    startIndex: 0,
    oldEndIndex: 3,
    newEndIndex: 5,
    startPosition: { row: 0, column: 0 },
    oldEndPosition: { row: 0, column: 3 },
    newEndPosition: { row: 0, column: 5 },
  });
  const newTree = ;parser.parse(newSourceCode, tree)