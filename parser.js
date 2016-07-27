var fs = require('fs');
var parse = require('csv-parse');

// I'm not using prototype methods because I feel like this is easier to read.
// If you're a JavaScript ninja, you'll recognize that this implementation
// would be less efficient if I was creating a bunch of Parser objects.
function Parser() {
  'use strict';
  this.data = [];

  this.readCSV = function(path, callback) {
    var self = this;
    var input = fs.createReadStream(path);
    // NOTE: I'm assuming the CSV file is properly formatted and uses the comma delimiter throughout the file.
    var parser = parse({ delimiter: ',', relax_column_count: true, trim: true });

    // This loops through the CSV file and pushes each row into the data array.
    input.pipe(parser).on('data', function(row) {
      self.data.push(row);
    }).on('end', function() {
      callback();
    });
  };

  /*
   * There are basically three cases to handle when processing a cell.
   * 1. If there is only a number, move on. I skip this step because it's unnecessary.
   * 2. If there is an equals sign:
   *      a. If there is just one item after the equals sign, calculate the output
   *         and replace the cell with the appropriate value.
   *      b. If there are three items after the equals sign (two values and an operand),
   *         grab all appropriate values, complete the RPN calculation, and replace the cell with the result.
   */
  this.processData = function() {
    // Looping through each cell.
    for(var i = 0; i < this.data.length; i++) {
      for(var j = 0; j < this.data[i].length; j++) {
        var cell = this.data[i][j];
        // If the first character of the cell is an equals sign, go into case #2.
        // NOTE: I'm assuming the cell has at least one character because no malformed input is allowed.
        if(cell[0] === '=') {
          var cellValues = cell.split(" ");
          if(cellValues.length === 1) {
            // Case #2a
            this.data[i][j] = this.getValue(cellValues[0].substring(1)); // Stripping off the leading equals sign.
          } else if(cellValues.length === 3) {
            // Case #2b
            var opA = this.getValue(cellValues[0].substring(1));
            var obB = this.getValue(cellValues[1]);
            var operator = this.getValue(cellValues[2]);
            this.data[i][j] = this.calculateRPN(opA, obB, operator).toString();
          }
        }
      }
    }
  };

  /**
   * This function retrieves the proper value of an item in a cell, given the item.
   * If the item starts with a letter, we go lookup the cell value at the row/col pair,
   * otherwise we just return the passed cell.
   */
  this.getValue = function(val) {
    // Assuming uppercase letters per the document.
    if(val[0] >= 'A' && val[0] <= 'Z') {
      var row = Number(val.substring(1)) - 1; // Subtract one due to array indices starting at 0.
      var col = Number(val[0].charCodeAt(0) - 'A'.charCodeAt(0)); // Get numeric value for A..Z
      return this.data[row][col];
    } else {
      // Return what's already there. This works for numbers and operators.
      return val;
    }
  };

  // This function calculates the arithmetic value of two values and an operator.
  this.calculateRPN = function(a, b, operator) {
    a = Number(a);
    b = Number(b);
    if(operator === '+') {
      // Edge cases:
      //   1. Overflow - one assumption I'm making is that integer and floating point numbers have
      //      the same max value, which isn't the case in reality.
      //   2. Floating-point precision issues (e.g. 0.2 * 0.1 !== 0.02 in JavaScript). I'm not planning to address this.
      //      If I needed to, I'd create/use a module to handle it separately - see: http://stackoverflow.com/a/3439981/1048200.
      return a + b > Number.MAX_SAFE_INTEGER? 'Error: Overflow' : a + b;
    } else if(operator === '-') {
      // Edge case: Underflow shouldn't be a problem given input constraints, but underflow
      return a - b < Number.MIN_SAFE_INTEGER ? 'Error: Underflow' : a - b;
    } else if(operator === '*') {
      // Edge cases:
      //   1. Overflow
      //   2. Floating-point precision issues
      return a * b > Number.MAX_SAFE_INTEGER ? 'Error: Overflow' : a * b;
    } else {
      // operator == '/'
      // Edge cases:
      //   1. Divide by zero
      //   2. Overflow
      //   3. Floating-point precision issues
      if(b > 0) {
        // NOTE: In the example document, I saw =11 2 / is 5.5 and not 5, so I did NOT account for integer
        // versus floating point division.
        return a / b > Number.MAX_SAFE_INTEGER ? 'Error: Overflow' : a / b;
      } else {
        return 'Error: Divide by Zero';
      }
    }
  };

  // Log the output in CSV format.
  this.logOutput = function() {
    for(var i = 0; i < this.data.length; i++) {
      this.data[i] = this.data[i].join(",");
    }
    this.data = this.data.join("\n");
    console.log(this.data);
  };
}

module.exports = new Parser();
