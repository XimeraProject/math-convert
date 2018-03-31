import { ParseError } from './error';
import lexer from './lexer';
import flatten from './flatten';

/*
 * recursive descent parser for math expressions
 *
 * Copyright 2014-2017 by
 *  Jim Fowler <kisonecat@gmail.com>
 *  Duane Nykamp <nykamp@umn.edu>
 *
 * This file is part of a math-expressions library
 *
 * math-expressions is free software: you can redistribute
 * it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either
 * version 3 of the License, or at your option any later version.
 *
 * math-expressions is distributed in the hope that it
 * will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 */

/* Grammar:

   statement_list =
   statement_list ',' statement |
   statement

   statement =
   statement 'OR' statement2 |
   statement2

   statement2 =
   statement2 'AND' relation |
   relation

   relation =
   'NOT' relation |
   relation '=' expression |
   relation 'NE' expression |
   relation '<' expression |
   relation '>' expression |
   relation 'LE' expression |
   relation 'GE' expression |
   relation 'IN' expression |
   relation 'NOTIN' expression |
   relation 'NI' expression |
   relation 'NOTNI' expression |
   relation 'SUBSET' expression |
   relation 'NOTSUBSET' expression |
   relation 'SUPERSET' expression |
   relation 'NOTSUPERSET' expression |
   expression

   expression =
   expression '+' term |
   expression '-' term |
   expression 'UNION' term |
   expression 'INTERSECT' term |
   '+' term |
   term

   term =
   term '*' factor |
   term nonMinusFactor |
   term '/' factor |
   factor

   baseFactor =
   '(' statement_list ')' |
   '[' statement_list ']' |
   '{' statement_list '}' |
   'LBRACE' statement_list 'RBRACE' |
   '(' statement ',' statement ']' |
   '[' statement ',' statement ')' |
   \frac{statement}{statement} |
   number |
   variable |
   modified_function '(' statement_list ')' |
   modified_applied_function '(' statement_list ')' |
   modified_function '{' statement_list '}' |
   modified_applied_function '{' statement_list '}' |
   modified_function |
   modified_applied_function factor |
   sqrt '[' statement ']' '{' statement '}' |
   baseFactor '_' baseFactor |
   *** modified_applied_function factor
   allowed only if allowSimplifiedFunctionApplication==true

   modified_function =
   function |
   function '_' baseFactor |
   function '_' baseFactor '^' factor |
   function '^' factor
   function "'"
   function '_' baseFactor "'"
   function '_' baseFactor "'" '^' factor
   function "'" '^' factor
   *** where the "'" after the functions can be repeated

   modified_applied_function =
   applied_function |
   applied_function '_' baseFactor |
   applied_function '_' baseFactor '^' factor |
   applied_function '^' factor
   applied_function "'"
   applied_function '_' baseFactor "'"
   applied_function '_' baseFactor "'" '^' factor
   applied_function "'" '^' factor
   *** where the "'" after the applied_functions can be repeated

   nonMinusFactor =
   baseFactor |
   baseFactor '^' factor |
   baseFactor '!' and/or "'" |
   baseFactor '!' and/or "'"  '^' factor|
   *** where '!' and/or "'"  indicates arbitrary sequence of "!" and/or "'"

   factor =
   '-' factor |
   nonMinusFactor |
   '|' statement '|'

*/


const whitespace_rule = '(\\s|\\\\,|\\\\!|\\\\ |\\\\>|\\\\;|\\\\:|\\\\quad\\b|\\\\qquad\\b)+';

const latex_rules = [
  ['[0-9]+(\\.[0-9]+)?(E[+\\-]?[0-9]+)?', 'NUMBER'],
  ['\\.[0-9]+(E[+\\-]?[0-9]+)?', 'NUMBER'],
  ['\\*', '*'],
  ['\\/', '/'],
  ['-', '-'],
  ['\\+', '+'],
  ['\\^', '^'],
  ['\\(', '('],
  ['\\\\left\\s*\\(', '('],
  ['\\\\bigl\\s*\\(', '('],
  ['\\\\Bigl\\s*\\(', '('],
  ['\\\\biggl\\s*\\(', '('],
  ['\\\\Biggl\\s*\\(', '('],
  ['\\)', ')'],
  ['\\\\right\\s*\\)', ')'],
  ['\\\\bigr\\s*\\)', ')'],
  ['\\\\Bigr\\s*\\)', ')'],
  ['\\\\biggr\\s*\\)', ')'],
  ['\\\\Biggr\\s*\\)', ')'],
  ['\\[', '['],
  ['\\\\left\\s*\\[', '['],
  ['\\\\bigl\\s*\\[', '['],
  ['\\\\Bigl\\s*\\[', '['],
  ['\\\\biggl\\s*\\[', '['],
  ['\\\\Biggl\\s*\\[', '['],
  ['\\]', ']'],
  ['\\\\right\\s*\\]', ']'],
  ['\\\\bigr\\s*\\]', ']'],
  ['\\\\Bigr\\s*\\]', ']'],
  ['\\\\biggr\\s*\\]', ']'],
  ['\\\\Biggr\\s*\\]', ']'],
  ['\\|', '|'],
  ['\\\\left\\s*\\|', '|'],
  ['\\\\bigl\\s*\\|', '|'],
  ['\\\\Bigl\\s*\\|', '|'],
  ['\\\\biggl\\s*\\|', '|'],
  ['\\\\Biggl\\s*\\|', '|'],
  ['\\\\right\\s*\\|', '|'],
  ['\\\\bigr\\s*\\|', '|'],
  ['\\\\Bigr\\s*\\|', '|'],
  ['\\\\biggr\\s*\\|', '|'],
  ['\\\\Biggr\\s*\\|', '|'],
  ['\\\\big\\s*\\|', '|'],
  ['\\\\Big\\s*\\|', '|'],
  ['\\\\bigg\\s*\\|', '|'],
  ['\\\\Bigg\\s*\\|', '|'],
  ['\\{', '{'],
  ['\\}', '}'],
  ['\\\\{', 'LBRACE'],
  ['\\\\left\\s*\\\\{', 'LBRACE'],
  ['\\\\bigl\\s*\\\\{', 'LBRACE'],
  ['\\\\Bigl\\s*\\\\{', 'LBRACE'],
  ['\\\\biggl\\s*\\\\{', 'LBRACE'],
  ['\\\\Biggl\\s*\\\\{', 'LBRACE'],
  ['\\\\}', 'RBRACE'],
  ['\\\\right\\s*\\\\}', 'RBRACE'],
  ['\\\\bigr\\s*\\\\}', 'RBRACE'],
  ['\\\\Bigr\\s*\\\\}', 'RBRACE'],
  ['\\\\biggr\\s*\\\\}', 'RBRACE'],
  ['\\\\Biggr\\s*\\\\}', 'RBRACE'],
  ['\\\\cdot\\b', '*'],
  ['\\\\times\\b', '*'],
  ['\\\\frac\\b', 'FRAC'],
  [',', ','],

  ['\\\\vartheta\\b', 'LATEXCOMMAND', '\\theta'],
  ['\\\\varepsilon\\b', 'LATEXCOMMAND', '\\epsilon'],
  ['\\\\varrho\\b', 'LATEXCOMMAND', '\\rho'],
  ['\\\\varphi\\b', 'LATEXCOMMAND', '\\phi'],

  ['\\\\infty\\b', 'INFINITY'],

  ['\\\\asin\\b', 'LATEXCOMMAND', '\\arcsin'],
  ['\\\\acos\\b', 'LATEXCOMMAND', '\\arccos'],
  ['\\\\atan\\b', 'LATEXCOMMAND', '\\arctan'],
  ['\\\\sqrt\\b', 'SQRT'],

  ['\\\\land\\b', 'AND'],
  ['\\\\wedge\\b', 'AND'],

  ['\\\\lor\\b', 'OR'],
  ['\\\\vee\\b', 'OR'],

  ['\\\\lnot\\b', 'NOT'],

  ['=', '='],
  ['\\\\neq\\b', 'NE'],
  ['\\\\ne\\b', 'NE'],
  ['\\\\not\\s*=', 'NE'],
  ['\\\\leq\\b', 'LE'],
  ['\\\\le\\b', 'LE'],
  ['\\\\geq\\b', 'GE'],
  ['\\\\ge\\b', 'GE'],
  ['<', '<'],
  ['\\\\lt\\b', '<'],
  ['>', '>'],
  ['\\\\gt\\b', '>'],

  ['\\\\in\\b', 'IN'],

  ['\\\\notin\\b', 'NOTIN'],
  ['\\\\not\\s*\\\\in\\b', 'NOTIN'],

  ['\\\\ni\\b', 'NI'],

  ['\\\\not\\s*\\\\ni\\b', 'NOTNI'],

  ['\\\\subset\\b', 'SUBSET'],

  ['\\\\not\\s*\\\\subset\\b', 'NOTSUBSET'],

  ['\\\\supset\\b', 'SUPERSET'],

  ['\\\\not\\s*\\\\supset\\b', 'NOTSUPERSET'],

  ['\\\\cup\\b', 'UNION'],

  ['\\\\cap\\b', 'INTERSECT'],

  ['!', '!'],
  ['\'', '\''],
  ['_', '_'],
  ['&', '&'],
  
  ['\\\\\\\\', 'LINEBREAK'],
  
  ['\\\\begin\\s*\{\\s*[a-zA-Z0-9]+\\s*\}', 'BEGINENVIRONMENT'],
  
  ['\\\\end\\s*\{\\s*[a-zA-Z0-9]+\\s*\}', 'ENDENVIRONMENT'],
  
  ['\\\\var\\s*\{\\s*[a-zA-Z0-9]+\\s*\}', 'VARMULTICHAR'],
  
  ['\\\\[a-zA-Z][a-zA-Z0-9]*', 'LATEXCOMMAND'],
  ['[a-zA-Z]', 'VAR']
];


// defaults for parsers if not overridden by context

// if true, allowed applied functions to omit parentheses around argument
// if false, omitting parentheses will lead to a Parse Error
const allowSimplifiedFunctionApplicationDefault = true;


// allowed multicharacter latex symbols
// in addition to the below applied function symbols
const allowedLatexSymbolsDefault = ['pi', 'theta', 'theta', 'Theta', 'alpha', 'nu', 'beta', 'xi', 'Xi', 'gamma', 'Gamma', 'delta', 'Delta', 'pi', 'Pi', 'epsilon', 'epsilon', 'rho', 'rho', 'zeta', 'sigma', 'Sigma', 'eta', 'tau', 'upsilon', 'Upsilon', 'iota', 'phi', 'phi', 'Phi', 'kappa', 'chi', 'lambda', 'Lambda', 'psi', 'Psi', 'omega', 'Omega'];

// Applied functions must be given an argument so that
// they are applied to the argument
const appliedFunctionSymbolsDefault = [ "abs", "exp", "log", "ln", "log10", "sign", "sqrt", "erf", "acos", "acosh", "acot", "acoth", "acsc", "acsch", "asec", "asech", "asin", "asinh", "atan", "atanh", "cos", "cosh", "cot", "coth", "csc", "csch", "sec", "sech", "sin", "sinh", "tan", "tanh", 'arcsin', 'arccos', 'arctan', 'arccsc', 'arcsec', 'arccot', 'cosec', 'arg'];

// Functions could have an argument, in which case they are applied
// or, if they don't have an argument in parentheses, then they are treated
// like a variable, except that trailing ^ and ' have higher precedence
const functionSymbolsDefault = ['f', 'g'];


class latexToAst {
  constructor({
    allowSimplifiedFunctionApplication=allowSimplifiedFunctionApplicationDefault,
    allowedLatexSymbols=allowedLatexSymbolsDefault,
    appliedFunctionSymbols=appliedFunctionSymbolsDefault,
    functionSymbols=functionSymbolsDefault
  } = {}){
    this.allowSimplifiedFunctionApplication = allowSimplifiedFunctionApplication;
    this.allowedLatexSymbols = allowedLatexSymbols;
    this.appliedFunctionSymbols = appliedFunctionSymbols;
    this.functionSymbols = functionSymbols;

    this.lexer = new lexer(latex_rules, whitespace_rule);

  }

  advance() {
    this.token = this.lexer.advance();
    if (this.token[0] == 'INVALID') {
      throw new ParseError("Invalid symbol '" + this.token[1] + "'",
			   this.lexer.location);
    }
  }

  convert(input){

    this.lexer.set_input(input);
    this.advance();

    var result=this.statement_list();

    if (this.token[0] != 'EOF') {
      throw new ParseError("Invalid location of '" + this.token[1] + "'",
			   this.lexer.location);
    }

    return flatten(result);

  }

  statement_list() {

    var list = [this.statement()];

    while(this.token[0] == ",") {
      this.advance();
      list.push(this.statement());
    }

    if(list.length > 1)
      list = ['list'].concat(list);
    else
      list = list[0];

    return list;
  }

  statement() {

    var lhs=this.statement2();

    while (this.token[0] == 'OR') {

      var operation = this.token[0].toLowerCase();

      this.advance();

      var rhs = this.statement2();

      lhs = [operation, lhs, rhs];
    }

    return lhs;
  }

  statement2() {
    // split AND into second statement to give higher precedence than OR

    var lhs=this.relation();

    while (this.token[0] == 'AND') {

      var operation = this.token[0].toLowerCase();

      this.advance();

      var rhs = this.relation();

      lhs = [operation, lhs, rhs];
    }

    return lhs;
  }


  relation() {

    if(this.token[0] == 'NOT' || this.token[0] == '!') {
      this.advance();
      return ['not', this.relation()];
    }

    var lhs = this.expression();

    while ((this.token[0] == '=') || (this.token[0] == 'NE')
	   || (this.token[0] == '<') || (this.token[0] == '>')
	   || (this.token[0] == 'LE') || (this.token[0] == 'GE')
	   || (this.token[0] == 'IN') || (this.token[0] == 'NOTIN')
	   || (this.token[0] == 'NI') || (this.token[0] == 'NOTNI')
	   || (this.token[0] == 'SUBSET') || (this.token[0] == 'NOTSUBSET')
	   || (this.token[0] == 'SUPERSET') || (this.token[0] == 'NOTSUPERSET')) {

      var operation = this.token[0].toLowerCase();

      var inequality_sequence=0;

      if((this.token[0] == '<') || (this.token[0] == 'LE')) {
	inequality_sequence = -1;
      }
      else if((this.token[0] == '>') || (this.token[0] == 'GE')) {
	inequality_sequence = 1;
      }

      this.advance();
      var rhs = this.expression();

      if(inequality_sequence == -1) {
	if((this.token[0] == '<') || this.token[0] == 'LE') {
	  // sequence of multiple < or <=
	  var strict = ['tuple'];
	  if(operation == '<')
	    strict.push(true)
	  else
	    strict.push(false)

	  var args = ['tuple', lhs, rhs];
	  while((this.token[0] == '<') || this.token[0] == 'LE') {
	    if(this.token[0] == '<')
	      strict.push(true)
	    else
	      strict.push(false)

	    this.advance();
	    args.push(this.expression());
	  }
	  lhs = ['lts', args, strict];
	}
	else {
	  lhs = [operation, lhs, rhs];
	}

      }
      else if(inequality_sequence == 1) {
	if((this.token[0] == '>') || this.token[0] == 'GE') {
	  // sequence of multiple > or >=
	  var strict = ['tuple'];
	  if(operation == '>')
	    strict.push(true)
	  else
	    strict.push(false)

	  var args = ['tuple', lhs, rhs];
	  while((this.token[0] == '>') || this.token[0] == 'GE') {
	    if(this.token[0] == '>')
	      strict.push(true)
	    else
	      strict.push(false)

	    this.advance();
	    args.push(this.expression());
	  }
	  lhs = ['gts', args, strict];
	}
	else {
	  lhs = [operation, lhs, rhs];
	}

      }
      else if(operation === '=') {
	lhs = ['=', lhs, rhs];

	// check for sequence of multiple =
	while(this.token[0] === '=') {
	  this.advance();
	  lhs.push(this.expression());
	}
      }
      else {

	lhs = [operation, lhs, rhs];
      }

    }

    return lhs;
  }


  expression() {
    if(this.token[0] == '+')
      this.advance();

    var lhs = this.term();
    while ((this.token[0] == '+') || (this.token[0] == '-')
	   || (this.token[0] == 'UNION')
	   || (this.token[0] == 'INTERSECT')) {

      var operation = this.token[0].toLowerCase();
      var negative = false;

      if (this.token[0] == '-') {
	operation = '+';
	negative = true;
	this.advance();
      }
      else  {
	this.advance();
      }
      var rhs = this.term();
      if(negative) {
	rhs = ['-', rhs];
      }

      lhs = [operation, lhs, rhs];
    }

    return lhs;
  }


  term() {
    var lhs = this.factor();

    var keepGoing = false;

    do {
      keepGoing = false;

      if (this.token[0] == '*') {
	this.advance();
	lhs = ['*', lhs, this.factor()];
	keepGoing = true;
      } else if (this.token[0] == '/') {
	this.advance();
	lhs = ['/', lhs, this.factor()];
	keepGoing = true;
      } else {
	var rhs = this.nonMinusFactor();
	if (rhs !== false) {
	  lhs = ['*', lhs, rhs];
	  keepGoing = true;
	}
      }
    } while( keepGoing );

    return lhs;
  }


  factor() {
    if (this.token[0] == '-') {
      this.advance();
      return ['-', this.factor()];
    }

    if (this.token[0] == '|') {
      this.advance();

      var result = this.statement();
      result = ['apply', 'abs', result];

      if (this.token[0] != '|') {
	throw new ParseError('Expected |', this.lexer.location);
      }
      this.advance();
      return result;
    }

    var result = this.nonMinusFactor();

    if(result === false) {
      if (this.token[0] == "EOF") {
	throw new ParseError("Unexpected end of input", this.lexer.location);
      }
      else {
	throw new ParseError("Invalid location of '" + this.token[1] + "'",
			     this.lexer.location);
      }
    }
    else {
      return result;
    }

  }

  nonMinusFactor() {

    var result = this.baseFactor();

    // allow arbitrary sequence of factorials
    if (this.token[0] == '!' || this.token[0] == "'") {
      if(result === false)
	throw new ParseError("Invalid location of " + this.token[0],
			     this.lexer.location);
      while(this.token[0] == '!' || this.token[0] == "'") {
	if(this.token[0] == '!')
	  result = ['apply', 'factorial', result]
	else
	  result = ['prime', result];
	this.advance();
      }
    }

    if (this.token[0] == '^') {
      if(result === false) {
	throw new ParseError("Invalid location of ^", this.lexer.location);
      }
      this.advance();
      return ['^', result, this.factor()];
    }

    return result;
  }


  baseFactor() {
    var result = false;

    if (this.token[0] == 'FRAC') {
      this.advance();

      if (this.token[0] != '{') {
	throw new ParseError("Expected {", this.lexer.location);
      }
      this.advance();

      var numerator = this.statement();

      if (this.token[0] != '}') {
	throw new ParseError("Expected }", this.lexer.location);
      }
      this.advance();

      if (this.token[0] != '{') {
	throw new ParseError("Expected {", this.lexer.location);
      }
      this.advance();

      var denominator = this.statement();

      if (this.token[0] != '}') {
	throw new ParseError("Expected }", this.lexer.location);
      }
      this.advance();

      return ['/', numerator, denominator];
    }

    if(this.token[0] == 'BEGINENVIRONMENT') {
      let environment = /\\begin\s*\{\s*([a-zA-Z0-9]+)\s*\}/.exec(this.token[1])[1];

      if(['matrix', 'pmatrix', 'bmatrix'].includes(environment)) {
	
	let n_rows = 0;
	let n_cols = 0;

	let all_rows = [];
	let row = [];
	let n_this_row = 0;
	let last_token = this.token[0];
	
	this.advance();

	
	while(this.token[0] !== 'ENDENVIRONMENT') {
	  if(this.token[0] == '&') {
	    if(last_token == '&' || last_token == 'LINEBREAK') {
	      // blank entry, let entry be zero
	      row.push(0);
	      n_this_row += 1;
	    }
	    last_token = this.token[0];
	    this.advance();
	  }
	  else if(this.token[0] == 'LINEBREAK') {
	    if(last_token == '&' || last_token == 'LINEBREAK') {
	      // blank entry, let entry be zero
	      row.push(0);
	      n_this_row += 1;
	    }
	    all_rows.push(row);
	    if(n_this_row > n_cols)
	      n_cols = n_this_row;

	    n_rows += 1;
	    n_this_row = 0;
	    row = [];
	    last_token = this.token[0];
	    this.advance();
	  }
	  else {
	    if(last_token == '&' || last_token == 'LINEBREAK' || 'BEGINENVIRONMENT') {
	      row.push(this.statement());
	      n_this_row += 1;
	      last_token = ' ';

	    }
	    else {
	      throw new ParseError("Invalid location of " + this.token[1], this.lexer.location);
	    }
	  }
	}

	// token is ENDENVIRONMENT
	let environment2 = /\\end\s*\{\s*([a-zA-Z0-9]+)\s*\}/.exec(this.token[1])[1];
	if(environment2 !== environment) {
	  throw new ParseError("Expected \\end{" + environment + "}", this.lexer.location);
	}

	// add last row
	if(last_token == '&') {
	  // blank entry, let entry be zero
	  row.push(0);
	  n_this_row += 1;
	}
	all_rows.push(row);
	if(n_this_row > n_cols)
	  n_cols = n_this_row;
	n_rows += 1;
	

	this.advance();
	
	// create matrix
	result = ["matrix", ["tuple", n_rows, n_cols]];
	let body = ["tuple"];
	for(let r of all_rows) {
	  let new_row = ["tuple"].concat(r);
	  for(let i=r.length; i<n_cols; i+=1)
	    new_row.push(0);

	  body.push(new_row);

	}
	result.push(body);
	
	return result;
      }
      else {
	throw new ParseError("Unrecognized environment " + environment, this.lexer.location);
      }
      
    }
    // else if(this.token[0] == 'ENDENVIRONMENT') {
    //   throw new ParseError("Invalid location of " + this.token[1], this.lexer.location);
    // }
    
    if (this.token[0] == 'NUMBER') {
      result = parseFloat( this.token[1] );
      this.advance();
    } else if (this.token[0] == 'INFINITY') {
      result = 'infinity';
      this.advance();
    } else if (this.token[0] == 'SQRT') {
      this.advance();

      var root = 2;
      if (this.token[0] == '[') {
	this.advance();
	var parameter = this.statement();
	if (this.token[0] != ']') {
	  throw new ParseError("Expected ]", this.lexer.location);
	}
	this.advance();

	root = parameter;
      }

      if (this.token[0] != '{') {
	throw new ParseError("Expected {", this.lexer.location);
      }

      this.advance();
      var parameter = this.statement();
      if (this.token[0] != '}') {
	throw new ParseError("Expected }", this.lexer.location);
      }
      this.advance();

      if (root == 2)
	result = ['apply', 'sqrt', parameter];
      else
	result = ['^', parameter, ['/', 1, root]];
    } else if (this.token[0] == 'VAR' || this.token[0] == 'LATEXCOMMAND'
	      || this.token[0] == 'VARMULTICHAR') {
      result = this.token[1];

      if(this.token[0] == 'LATEXCOMMAND') {
	result=result.slice(1); 
	if(!(this.appliedFunctionSymbols.includes(result)
	     || this.functionSymbols.includes(result)
	     || this.allowedLatexSymbols.includes(result)
	    )) {
	  throw new ParseError("Unrecognized latex command " + this.token[1],
			       this.lexer.location);
	}
      }
      else if(this.token[0] == 'VARMULTICHAR') {
	// strip out name of variable from \var command
	result = /\\var\s*\{\s*([a-zA-Z0-9]+)\s*\}/.exec(result)[1];
      }

      if (this.appliedFunctionSymbols.includes(result)
	  || this.functionSymbols.includes(result))  {
	var must_apply=false
	if(this.appliedFunctionSymbols.includes(result))
	  must_apply = true;

	result = result.toLowerCase();
	this.advance();

	if(this.token[0]=='_') {
	  this.advance();
	  var subresult =  this.baseFactor();

	  // since baseFactor could return false, must check
	  if(subresult === false) {
	    if (this.token[0] == "EOF") {
	      throw new ParseError("Unexpected end of input",
				   this.lexer.location);
	    }
	    else {
	      throw new ParseError("Invalid location of '" + this.token[1]
				   + "'", this.lexer.location) ;
	    }
	  }
	  result = ['_', result, subresult];
	}

	var n_primes=0;
	while(this.token[0] == "'") {
	  n_primes += 1;
	  result = ['prime', result];
	  this.advance();
	}

	if(this.token[0]=='^') {
	  this.advance();
	  result = ['^', result, this.factor()];
	}

	if (this.token[0] == '{' || this.token[0] == '(') {
	  var expected_right;
	  if(this.token[0] == '{')
	    expected_right = '}';
	  else
	    expected_right = ')';

	  this.advance();
	  var parameters = this.statement_list();

	  if (this.token[0] != expected_right) {
	    throw new ParseError('Expected ' + expected_right,
				 this.lexer.location);
	  }
	  this.advance();

	  if(parameters[0] == 'list') {
	    // rename from list to tuple
	    parameters[0] = 'tuple';
	  }

	  result = ['apply', result, parameters];

	}
	else {
	  // if was an applied function symbol,
	  // cannot omit argument
	  if(must_apply) {
	    if(!this.allowSimplifiedFunctionApplication)
	      throw new ParseError("Expected ( after function",
				   this.lexer.location);

	    // if allow simplied function application
	    // let the argument be the next factor
	    result = ['apply', result, this.factor()];
	  }
	}
      }
      else {
	this.advance();
      }
    } else if (this.token[0] == '(' || this.token[0] == '['
	       || this.token[0] == '{'
	       || this.token[0] == 'LBRACE') {
      var token_left = this.token[0];
      var expected_right, other_right;
      if(this.token[0] == '(') {
	expected_right = ')';
	other_right = ']';
      }
      else if(this.token[0] == '[') {
	expected_right = ']';
	other_right = ')';
      }
      else if(this.token[0] == '{') {
	expected_right = '}';
	other_right = null;
      }
      else {
	expected_right = 'RBRACE';
	other_right = null;
      }

      this.advance();
      result = this.statement_list();

      var n_elements = 1;
      if(result[0] == "list") {
	n_elements = result.length-1;
      }

      if (this.token[0] != expected_right) {
	if(n_elements != 2 || other_right === null) {
	  throw new ParseError('Expected ' + expected_right,
			       this.lexer.location);
	}
	else if (this.token[0] != other_right) {
	  throw new ParseError('Expected ) or ]', this.lexer.location);
	}

	// half-open interval
	result[0] = 'tuple';
	result = ['interval', result];
	var closed;
	if(token_left == '(')
	  closed = ['tuple', false, true];
	else
	  closed = ['tuple', true, false];
	result.push(closed);

      }
      else if (n_elements >= 2) {
	if(token_left == '(' || token_left == '{') {
	  result[0]  = 'tuple';
	}
	else if(token_left == '[') {
	  result[0] = 'array';
	}
	else {
	  result[0] = 'set';
	}
      }
      else if (token_left === 'LBRACE') {
	// singleton set
	result = ['set'].concat(result);
      }

      this.advance();
    }

    if (this.token[0] == '_') {
      if(result === false) {
	throw new ParseError("Invalid location of _", this.lexer.location);
      }
      this.advance();
      var subresult =  this.baseFactor();

      if(subresult === false) {
	if (this.token[0] == "EOF") {
	  throw new ParseError("Unexpected end of input", this.lexer.location);
	}
	else {
	  throw new ParseError("Invalid location of '" + this.token[1] + "'",
			       this.lexer.location);
	}
      }
      return ['_', result, subresult];
    }

    return result;
  }

}

export default latexToAst;
