var parser = require('./parser');

if(process.argv.length > 2 && process.argv[2] != null) {
  parser.readCSV(process.argv[2], function() {
    parser.processData();
    parser.logOutput();
  });
}
