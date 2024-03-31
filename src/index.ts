import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';

const parser = new Parser();
parser.setLanguage(JavaScript);

const sourceCode = 'let x = 1; console.log(x);';
const tree = parser.parse(sourceCode);
console.log(tree.rootNode.toString());