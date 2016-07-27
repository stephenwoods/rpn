var assert = require('chai').assert;
var parser = require('../parser.js');

parser.data = [
               [ '1', '2', '3.0', '0.3' ],
               [ '4', '5', '6', '=10' ],
               [ '7', '8', '9', '10', '=B2' ],
               [ '=0.3 4 +', '1', '2', '=6 0 /' ],
               [ '=1 2 -', '=2 1 -', '=B1 2 +' ],
               [ '=A1', '=B1', '=C2' ],
               [ '=9 3.5 *', '=10 5 *', '=11 2 /', '=12 4 /' ],
               [ '=5 1 +', '=6 2 +', '=7 3 -', '=8 2 -' ]
             ];

describe('Parser', function() {
  describe('getValue', function() {
    it('should return the proper cell when doing a column/row lookup', function() {
      assert.equal('1', parser.getValue('A1'));
      assert.equal('6', parser.getValue('C2'));
    });
    it('should return the existing value when passed an integer', function() {
      assert.equal('1', parser.getValue('1'));
      assert.equal('1234', parser.getValue('1234'));
    });
  });

  describe('calculateRPN', function() {
    describe('addition', function() {
      it('should add single digit numbers together', function() {
        assert.equal('9', parser.calculateRPN('1','8','+'));
      });
      it('should add multiple digit numbers together', function() {
        assert.equal('1234', parser.calculateRPN('34', '1200', '+'));
      });
      it('should add floating point numbers together', function() {
        assert.equal('1234.567', parser.calculateRPN('34.56', '1200.007', '+'));
      });
      it('should add floating point and whole numbers together', function() {
        assert.equal('1234.567', parser.calculateRPN('34', '1200.567', '+'));
      });
      it('should output an error message on overflow', function() {
        assert.equal('Error: Overflow', parser.calculateRPN('1', Number.MAX_SAFE_INTEGER.toString(), '+'));
      });
    });
    describe('subtraction', function() {
      it('should subtract single digit numbers', function() {
        assert.equal('-7', parser.calculateRPN('1','8','-'));
      });
      it('should subtract multiple digit numbers', function() {
        assert.equal('1166', parser.calculateRPN('1200', '34', '-'));
      });
      it('should subtract floating point numbers', function() {
        assert.equal('-1165.53', parser.calculateRPN('34.57', '1200.1', '-'));
      });
      it('should subtract floating point and whole numbers', function() {
        assert.equal('1166.567', parser.calculateRPN('1200.567', '34', '-'));
      });
      it('should output an error message on underflow', function() {
        assert.equal('Error: Underflow', parser.calculateRPN('-1', Number.MAX_SAFE_INTEGER.toString(), '-'));
      });
    });
    describe('multiplication', function() {
      it('should multiply single digit numbers', function() {
        assert.equal('9', parser.calculateRPN('3','3','*'));
      });
      it('should multiply multiple digit numbers', function() {
        assert.equal('121', parser.calculateRPN('11', '11', '*'));
      });
      it('should multiply floating point numbers', function() {
        assert.equal('1.56', parser.calculateRPN('1.2', '1.3', '*'));
      });
      it('should multiply floating point and whole numbers', function() {
        assert.equal('172.5', parser.calculateRPN('11.5', '15', '*'));
      });
      it('should output an error message on overflow', function() {
        assert.equal('Error: Overflow', parser.calculateRPN('2', Number.MAX_SAFE_INTEGER.toString(), '*'));
      });
    });
    describe('division', function() {
      it('should divide single digit numbers', function() {
        assert.equal('3', parser.calculateRPN('9','3','/'));
      });
      it('should divide multiple digit numbers', function() {
        assert.equal('12', parser.calculateRPN('132', '11', '/'));
      });
      it('should divide floating point numbers', function() {
        assert.equal('1.125', parser.calculateRPN('1.8', '1.6', '/'));
      });
      it('should divide floating point and whole numbers', function() {
        assert.equal('.2956521739130435', parser.calculateRPN('13.6', '46', '/'));
      });
      it('should divide an error message on overflow', function() {
        assert.equal('Error: Overflow', parser.calculateRPN(Number.MAX_SAFE_INTEGER.toString(), '0.5', '/'));
      });
    });
  });
});
