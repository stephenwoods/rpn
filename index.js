var fs = require('fs');
var parse = require('csv-parse');

var fileLoc = process.argv[2];
var input = fs.createReadStream(fileLoc);
// NOTE: I'm assuming the CSV file is properly formatted and uses the comma delimiter throughout the file.
var parser = parse({ delimiter: ',', relax_column_count: true, trim: true });
var data = []; // Array to hold the CSV data.

// This loops through the CSV file and pushes each row into the data array.
input.pipe(parser).on('data', function(row) {
  data.push(row);
}).on('end', function() {
  processData();
  logOutput();
});

/*
 * There are basically three cases to handle when processing a cell.
 * 1. If there is only a number, move on. I skip this step because it's unnecessary.
 * 2. If there is an equals sign:
 *      a. If there is just one item after the equals sign, calculate the output
 *         and replace the cell with the appropriate value.
 *      b. If there are three items after the equals sign (two values and an operand),
 *         grab all appropriate values, complete the RPN calculation, and replace the cell with the result.
 */
 function processData() {
  // Looping through each cell.
  for(var i = 0; i < data.length; i++) {
    for(var j = 0; j < data[i].length; j++) {
      var cell = data[i][j];
      // If the first character of the cell is an equals sign, go into case #2.
      // NOTE: I'm assuming the cell has at least one character because no malformed input is allowed.
      if(cell[0] == '=') {
        var cellValues = cell.split(" ");
        if(cellValues.length == 1) {
          // Case #2a
          data[i][j] = getValue(cellValues[0].substring(1)); // Stripping off the leading equals sign.
        } else if(cellValues.length == 3) {
          // Case #2b
          var opA = getValue(cellValues[0].substring(1));
          var obB = getValue(cellValues[1]);
          var operator = getValue(cellValues[2]);
          data[i][j] = calculateRPN(opA, obB, operator).toString();
        }
      }
    }
  }
}

/**
 * This function retrieves the proper value of an item in a cell, given the item.
 * If the item starts with a letter, we go lookup the cell value at the row/col pair,
 * otherwise we just return the passed cell.
 */
function getValue(val) {
  // Assuming uppercase letters per the document.
  if(val[0] >= 'A' && val[0] <= 'Z') {
    var row = Number(val.substring(1)) - 1; // Subtract one due to array indices starting at 0.
    var col = Number(val[0].charCodeAt(0) - 'A'.charCodeAt(0)); // Get numeric value for A..Z
    return data[row][col];
  } else {
    // Return what's already there. This works for numbers and operators.
    return val;
  }
}

function calculateRPN(a, b, operator) {
  a = Number(a);
  b = Number(b);
  if(operator == '+') {
    // Edge case: Overflow. One assumption I'm making is that integer and fp numbers have
    // the same max value, which isn't the case.
    return a + b > Number.MAX_SAFE_VALUE ? "Error: Overflow" : a + b;
  } else if(operator == '-') {
    // Edge case: Underflow shouldn't be a problem given input constraints, but underflow
    return a - b < Number.MIN_SAFE_VALUE ? "Error: Underflow" : a - b;
  } else if(operator == '*') {
    // Edge cases:
    //   1. Overflow
    //   2. Floating-point precision issues (e.g. 0.2 * 0.1 !== 0.02 in js). I'm not planning to address this.
    //      If I needed to address this, I'd add up the number of digits behind the decimal and use
    //      Number.toFixed() to give me my max number of digits allowed.
    return a * b > Number.MAX_SAFE_VALUE ? "Error: Overflow" : a * b;
  } else {
    // operator == '/'
    // Edge cases:
    //   1. Divide by zero
    //   2. Overflow
    //   3. Potentially precision issues, but I'm not planning to address them.
    if(b > 0) {
      // NOTE: In the example document, I saw =11 2 / is 5.5 and not 5, so I did not account for integer
      // versus floating point division.
      return a / b > Number.MAX_SAFE_VALUE ? "Error: Overflow" : a / b;
    } else {
      return "Error: Divide by Zero";
    }
  }
}

// Log the output in CSV format.
function logOutput() {
  for(var i = 0; i < data.length; i++) {
    data[i] = data[i].join(",");
  }
  data = data.join("\n");
  console.log(data);
}
