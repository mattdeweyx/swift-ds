const Parser = require('tree-sitter');
const Swift = require('tree-sitter-swift');

// example of a list of design system components
const designSystemComponents = [
  { name: 'Button', version: '1.0', scope: 'UI', dependencies: [], files: ['Button.swift'] },
  { name: 'Input', version: '1.2', scope: 'UI', dependencies: [], files: ['Input.swift'] },
];

// Create a new parser and set the language to Swift
const parser = new Parser();
parser.setLanguage(Swift);

// Parse CLI arguments, to be able to use it as a standalone cli tool
// for now just for testing, we'll import the script from the componly/cli directly
const args = process.argv.slice(2);
if (args.length !== 1 || args[0] === '--help' || args[0] === '-h') {
  console.error('Usage: node SwiftAnalyzer.js <file>');
  process.exit(1);
}
const filePath = args[0];

async function parseSwiftFile(filePath) {
  // Parse the Swift file using the parser and get a tree object
  const tree = parser.parse(filePath);

  // Format the AST data into a structured JSON format
  const formattedData = formatASTData(tree);

  // Print the formatted data
  console.log('Formatted AST data:', JSON.stringify(formattedData, null, 4));
}

// Function to format AST data into a structured JSON format
function formatASTData(tree) {
  const formattedData = [];
  const imports = {};
  // Traverse the tree recursively and extract the relevant information
  console.log(tree.rootNode);
  traverseAST(tree.rootNode, formattedData, imports);
  return formattedData;
}

// Function to traverse the AST and extract the relevant information
function traverseAST(node, formattedData, imports) {
  // Check the node type
  switch (node.type) {
    // If the node is an import declaration
    case "import_declaration":
      // Add the imported module to the imports object
      imports[node.text] = true;
      break;
    // If the node is a struct declaration
    case "struct_declaration":
      // Create an object to store the struct information
      let struct = {
        name: node.text, // The struct name
        inheritedTypes: node.namedChildren.filter(c => c.type === "type_identifier").map(c => c.text), // The inherited types
        properties: [], // The struct properties
        body: node.startPosition, // The struct body start position
        length: node.endPosition, // The struct body end position
        importedFrom: [], // Array to store import statements associated with this struct
        components: [] // Array to store component usages associated with this struct
      };
      // Loop through the children
      for (let child of node.namedChildren) {
        // If the child is a property and it has a type annotation
        if (child.type === "pattern_binding_declaration" && child.namedChildren.some(c => c.type === "type_annotation")) {
          // Get the property name and type
          let name = child.namedChildren.find(c => c.type === "identifier").text;
          let type = child.namedChildren.find(c => c.type === "type_annotation").text;
          // Push the property name and type to the properties array
          struct.properties.push({
            name: name,
            type: type
          });
          // Check if the property type is imported from a design system component
          for (const moduleName in imports) {
            if (type.includes(moduleName)) {
              struct.importedFrom.push(moduleName);
            }
          }
        }
        // If the child is a component usage
        if (child.type === "function_call_expression") {
          // Create an object to store the component information
          let component = {
            name: child.text, // The component name
            arguments: child.startPosition, // The component arguments start position
            length: child.endPosition, // The component arguments end position
            importedFrom: [] // Array to store import statements associated with this component
          };
          // Check if the component name is imported from a design system component
          for (const moduleName in imports) {
            if (component.name.includes(moduleName)) {
              component.importedFrom.push(moduleName);
            }
          }
          // Check if the component name matches any of the design system components
          for (const ds of designSystemComponents) {
            if (component.name === ds.name) {
              // Add the design system component information to the component object
              component.version = ds.version;
              component.scope = ds.scope;
              component.dependencies = ds.dependencies;
              component.files = ds.files;
            }
          }
          // Push the component object to the components array
          struct.components.push(component);
        }
      }
      // Push the struct object to the formatted data array
      formattedData.push(struct);
      break;
    // If the node is a function declaration
    case "function_declaration":
      let func = {
        name: node.text,
        body: node.startPosition,
        length: node.endPosition,
        components: []
      };
      for (let child of node.namedChildren) {
        if (child.type === "function_call_expression") {
          let component = {
            name: child.text,
            arguments: child.startPosition,
            length: child.endPosition,
            importedFrom: []
          };
          for (const moduleName in imports) {
            if (component.name.includes(moduleName)) {
              component.importedFrom.push(moduleName);
            }
          }
          for (const ds of designSystemComponents) {
            if (component.name === ds.name) {
              component.version = ds.version;
              component.scope = ds.scope;
              component.dependencies = ds.dependencies;
              component.files = ds.files;
            }
          }
          func.components.push(component);
        }
      }
      formattedData.push(func);
      break;
  }
  // Recursively traverse the children
  for (let child of node.children) {
    traverseAST(child, formattedData, imports);
  }
}

parseSwiftFile(filePath);
