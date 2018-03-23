import { ParseError } from './error';

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
    '!' relation |
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
    '(' statement ',' statement ']' |
    '[' statement ',' statement ')' |
    number |
    variable |
    modified_function '(' statement_list ')' |
    modified_applied_function '(' statement_list ')' |
    modified_function |
    modified_applied_function factor |
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








// var symbol = '';
// var EOFsymbol = 4

// function advance() {
//     symbol = lexer.lex();
//
//     if (symbol == 'INVALID') {
// 	if(yytext() == '_')
// 	    throw new ParseError("Invalid location of _", yyloc());
// 	else
// 	    throw new ParseError("Invalid symbol '" + yytext() + "'",
// 				 yyloc());
//     }
//
//     return symbol;
// }
//
// function yytext() {
//     return lexer.yytext;
// }
// function yyloc() {
//     return lexer.yylloc;
// }

//
// /****************************************************************/
// /* grammar */
//
// function statement_list(params) {
//
//     var list = [statement(params)];
//
//     while(symbol == ",") {
// 	advance();
// 	list.push(statement(params));
//     }
//
//     if(list.length > 1)
// 	list = ['list'].concat(list);
//     else
// 	list = list[0];
//
//     return list;
// }
//
// function statement(params) {
//
//     var lhs=statement2(params);
//
//     while (symbol == 'OR') {
//
// 	var operation = symbol.toLowerCase();
//
// 	advance();
//
// 	var rhs = statement2(params);
//
// 	lhs = [operation, lhs, rhs];
//     }
//
//     return lhs;
// }
//
// function statement2(params) {
//     // split AND into second statement to give higher precedence than OR
//
//     var lhs=relation(params);
//
//     while (symbol == 'AND') {
//
// 	var operation = symbol.toLowerCase();
//
// 	advance();
//
// 	var rhs = relation(params);
//
// 	lhs = [operation, lhs, rhs];
//     }
//
//     return lhs;
// }
//
//
// function relation(params) {
//
//     if(symbol == 'NOT' || symbol == '!') {
// 	advance();
// 	return ['not', relation(params)];
//     }
//
//     var lhs = expression(params);
//
//     while ((symbol == '=') || (symbol == 'NE')
// 	   || (symbol == '<') || (symbol == '>')
// 	   || (symbol == 'LE') || (symbol == 'GE')
// 	   || (symbol == 'IN') || (symbol == 'NOTIN')
// 	   || (symbol == 'NI') || (symbol == 'NOTNI')
// 	   || (symbol == 'SUBSET') || (symbol == 'NOTSUBSET')
// 	   || (symbol == 'SUPERSET') || (symbol == 'NOTSUPERSET')) {
//
// 	var operation = symbol.toLowerCase();
//
// 	var inequality_sequence=0;
//
// 	if((symbol == '<') || (symbol == 'LE')) {
// 	    inequality_sequence = -1;
// 	}
// 	else if((symbol == '>') || (symbol == 'GE')) {
// 	    inequality_sequence = 1;
// 	}
//
// 	advance();
// 	var rhs = expression(params);
//
// 	if(inequality_sequence == -1) {
// 	    if((symbol == '<') || symbol == 'LE') {
// 		// sequence of multiple < or <=
// 		var strict = ['tuple'];
// 		if(operation == '<')
// 		    strict.push(true)
// 		else
// 		    strict.push(false)
//
// 		var args = ['tuple', lhs, rhs];
// 		while((symbol == '<') || symbol == 'LE') {
// 		    if(symbol == '<')
// 			strict.push(true)
// 		    else
// 			strict.push(false)
//
// 		    advance();
// 		    args.push(expression(params));
// 		}
// 		lhs = ['lts', args, strict];
// 	    }
// 	    else {
// 		lhs = [operation, lhs, rhs];
// 	    }
//
// 	}
// 	else if(inequality_sequence == 1) {
// 	    if((symbol == '>') || symbol == 'GE') {
// 		// sequence of multiple > or >=
// 		var strict = ['tuple'];
// 		if(operation == '>')
// 		    strict.push(true)
// 		else
// 		    strict.push(false)
//
// 		var args = ['tuple', lhs, rhs];
// 		while((symbol == '>') || symbol == 'GE') {
// 		    if(symbol == '>')
// 			strict.push(true)
// 		    else
// 			strict.push(false)
//
// 		    advance();
// 		    args.push(expression(params));
// 		}
// 		lhs = ['gts', args, strict];
// 	    }
// 	    else {
// 		lhs = [operation, lhs, rhs];
// 	    }
//
// 	}
// 	else if(operation === '=') {
// 	    lhs = ['=', lhs, rhs];
//
// 	    // check for sequence of multiple =
// 	    while(symbol === '=') {
// 		advance();
// 		lhs.push(expression(params));
// 	    }
// 	}
// 	else {
//
// 	    lhs = [operation, lhs, rhs];
// 	}
//
//     }
//
//     return lhs;
// }
//
//
// function expression(params) {
//     if(symbol == '+')
// 	advance();
//
//     var lhs = term(params);
//     while ((symbol == '+') || (symbol == '-') || (symbol == 'UNION')
// 	   || (symbol == 'INTERSECT')) {
//
// 	var operation = symbol.toLowerCase();
// 	var negative = false;
//
// 	if (symbol == '-') {
// 	    operation = '+';
// 	    negative = true;
// 	    advance();
// 	}
// 	else  {
// 	    advance();
// 	}
// 	var rhs = term(params);
// 	if(negative) {
// 	    rhs = ['-', rhs];
// 	}
//
// 	lhs = [operation, lhs, rhs];
//     }
//
//     return lhs;
// }
//
//
// function term(params) {
//     var lhs = factor(params);
//
//     var keepGoing = false;
//
//     do {
// 	keepGoing = false;
//
// 	if (symbol == '*') {
// 	    advance();
// 	    lhs = ['*', lhs, factor(params)];
// 	    keepGoing = true;
// 	} else if (symbol == '/') {
// 	    advance();
// 	    lhs = ['/', lhs, factor(params)];
// 	    keepGoing = true;
// 	} else {
// 	    var rhs = nonMinusFactor(params);
// 	    if (rhs !== false) {
// 		lhs = ['*', lhs, rhs];
// 		keepGoing = true;
// 	    }
// 	}
//     } while( keepGoing );
//
//     return lhs;
// }
//
//
// function factor(params) {
//
//     if (symbol == '-') {
// 	advance();
// 	return ['-', factor(params)];
//     }
//
//     if (symbol == '|') {
// 	advance();
//
// 	var result = statement(params);
// 	result = ['apply', 'abs', result];
//
// 	if (symbol != '|') {
// 	    throw new ParseError('Expected |', yyloc());
// 	}
// 	advance();
// 	return result;
//     }
//
//     var result = nonMinusFactor(params);
//
//     if(result === false) {
// 	if (symbol == EOFsymbol) {
// 	    throw new ParseError("Unexpected end of input", yyloc());
// 	}
// 	else {
// 	    throw new ParseError("Invalid location of '" + yytext() + "'",
// 				 yyloc());
// 	}
//     }
//     else {
// 	return result;
//     }
//
// }
//
// function nonMinusFactor(params) {
//
//     var result = baseFactor(params);
//
//     // allow arbitrary sequence of factorials
//     if (symbol == '!' || symbol == "'") {
// 	if(result === false)
// 	    throw new ParseError("Invalid location of " + symbol, yyloc());
// 	while(symbol == '!' || symbol == "'") {
// 	    if(symbol == '!')
// 		result = ['apply', 'factorial', result]
// 	    else
// 		result = ['prime', result];
// 	    advance();
// 	}
//     }
//
//     if (symbol == '^') {
// 	if(result === false) {
// 	    throw new ParseError("Invalid location of ^", yyloc());
// 	}
// 	advance();
// 	return ['^', result, factor(params)];
//     }
//
//     return result;
// }
//
//
// function baseFactor(params) {
//     var result = false;
//
//     if (symbol == 'NUMBER') {
// 	result = parseFloat( yytext() );
// 	advance();
//     } else if (symbol == 'INFINITY') {
// 	result = 'infinity';
// 	advance();
//     } else if (symbol == 'VAR' || symbol == 'VARMULTICHAR') {
// 	result = yytext();
//
// 	if (params.appliedFunctionSymbols.includes(result)
// 	    || params.functionSymbols.includes(result))  {
// 	    var must_apply=false
// 	    if(params.appliedFunctionSymbols.includes(result))
// 		must_apply = true;
//
// 	    result = result.toLowerCase();
// 	    advance();
//
// 	    if(symbol=='_') {
// 		advance();
// 		var subresult =  baseFactor(params);
//
// 		// since baseFactor could return false, must check
// 		if(subresult === false) {
// 		    if (symbol == EOFsymbol) {
// 			throw new ParseError("Unexpected end of input",
// 					     yyloc());
// 		    }
// 		    else {
// 			throw new ParseError("Invalid location of '" + yytext()
// 					     + "'", yyloc()) ;
// 		    }
// 		}
// 		result = ['_', result, subresult];
// 	    }
//
// 	    var n_primes=0;
// 	    while(symbol == "'") {
// 		n_primes += 1;
// 		result = ['prime', result];
// 		advance();
// 	    }
//
// 	    if(symbol=='^') {
// 		advance();
// 		result = ['^', result, factor(params)];
// 	    }
//
// 	    if (symbol == '(') {
// 		advance();
// 		var parameters = statement_list(params);
//
// 		if (symbol != ')') {
// 		    throw new ParseError('Expected )', yyloc());
// 		}
// 		advance();
//
// 		if(parameters[0] == 'list') {
// 		    // rename from list to tuple
// 		    parameters[0] = 'tuple';
// 		}
//
// 		result = ['apply', result, parameters];
// 	    }
// 	    else {
// 		// if was an applied function symbol,
// 		// cannot omit argument
// 		if(must_apply) {
// 		    if(!params.allowSimplifiedFunctionApplication)
// 			throw new ParseError("Expected ( after function",
// 					     yyloc());
//
// 		    // if allow simplied function application
// 		    // let the argument be the next factor
// 		    result = ['apply', result, factor(params)];
// 		}
// 	    }
// 	}
// 	else {
// 	    // determine if should split text into single letter factors
// 	    var split = params.splitSymbols;
//
// 	    if(split) {
// 		if(symbol == 'VARMULTICHAR' ||
// 		   params.unsplitSymbols.includes(result)
// 		   || result.length == 1) {
// 		    split = false;
// 		}
// 		else if(result.match(/[\d]/g)) {
// 		    // don't split if has a number in it
// 		    split = false;
// 		}
// 	    }
//
// 	    if (split) {
// 		// so that each character gets processed separately
// 		// put all characters back on the input
// 		// but with spaces
// 		// then process again
//
// 		for(var i=result.length-1; i>=0; i--) {
// 		    lexer.unput(" ");
// 		    lexer.unput(result[i]);
// 		}
// 		advance();
//
// 		return baseFactor(params);
// 	    }
// 	    else {
// 		advance();
// 	    }
// 	}
//     } else if (symbol == '(' || symbol == '[' || symbol == '{') {
// 	var symbol_left = symbol;
// 	var expected_right, other_right;
// 	if(symbol == '(') {
// 	    expected_right = ')';
// 	    other_right = ']';
// 	}
// 	else if(symbol == '[') {
// 	    expected_right = ']';
// 	    other_right = ')';
// 	}
// 	else {
// 	    expected_right = '}';
// 	    other_right = null;
// 	}
//
// 	advance();
// 	result = statement_list(params);
//
// 	var n_elements = 1;
// 	if(result[0] == "list") {
// 	    n_elements = result.length-1;
// 	}
//
// 	if (symbol != expected_right) {
// 	    if(n_elements != 2 || other_right === null) {
// 		throw new ParseError('Expected ' + expected_right, yyloc());
// 	    }
// 	    else if (symbol != other_right) {
// 		throw new ParseError('Expected ) or ]', yyloc());
// 	    }
//
// 	    // half-open interval
// 	    result[0] = 'tuple';
// 	    result = ['interval', result];
// 	    var closed;
// 	    if(symbol_left == '(')
// 		closed = ['tuple', false, true];
// 	    else
// 		closed = ['tuple', true, false];
// 	    result.push(closed);
//
// 	}
// 	else if (n_elements >= 2) {
// 	    if(symbol_left == '(') {
// 		result[0]  = 'tuple';
// 	    }
// 	    else if(symbol_left == '[') {
// 		result[0] = 'array';
// 	    }
// 	    else {
// 		result[0] = 'set';
// 	    }
// 	}
// 	else if (symbol_left === '{') {
// 	    // singleton set
// 	    result = ['set'].concat(result);
// 	}
//
// 	advance();
//     }
//
//     if (symbol == '_') {
// 	if(result === false) {
// 	    throw new ParseError("Invalid location of _", yyloc());
// 	}
// 	advance();
// 	var subresult =  baseFactor(params);
//
// 	if(subresult === false) {
// 	    if (symbol == EOFsymbol) {
// 		throw new ParseError("Unexpected end of input", yyloc());
// 	    }
// 	    else {
// 		throw new ParseError("Invalid location of '" + yytext() + "'",
// 				     yyloc());
// 	    }
// 	}
// 	return ['_', result, subresult];
//     }
//
//     return result;
// }
//




// defaults for parsers if not overridden by context

// if true, allowed applied functions to omit parentheses around argument
// if false, omitting parentheses will lead to a Parse Error
const allowSimplifiedFunctionApplicationDefault = true;

// if true, split multicharacter symbols into a product of letters
const splitSymbolsDefault = true;

// symbols that won't be split into a product of letters if splitSymbols==true
const unsplitSymbolsDefault = ['pi', 'theta', 'theta', 'Theta', 'alpha', 'nu', 'beta', 'xi', 'Xi', 'gamma', 'Gamma', 'delta', 'Delta', 'pi', 'Pi', 'epsilon', 'epsilon', 'rho', 'rho', 'zeta', 'sigma', 'Sigma', 'eta', 'tau', 'upsilon', 'Upsilon', 'iota', 'phi', 'phi', 'Phi', 'kappa', 'chi', 'lambda', 'Lambda', 'psi', 'Psi', 'omega', 'Omega'];

// Applied functions must be given an argument so that
// they are applied to the argument
const appliedFunctionSymbolsDefault = [ "abs", "exp", "log", "ln", "log10", "sign", "sqrt", "erf", "acos", "acosh", "acot", "acoth", "acsc", "acsch", "asec", "asech", "asin", "asinh", "atan", "atanh", "cos", "cosh", "cot", "coth", "csc", "csch", "sec", "sech", "sin", "sinh", "tan", "tanh", 'arcsin', 'arccos', 'arctan', 'arccsc', 'arcsec', 'arccot', 'cosec', 'arg'];

// Functions could have an argument, in which case they are applied
// or, if they don't have an argument in parentheses, then they are treated
// like a variable, except that trailing ^ and ' have higher precedence
const functionSymbolsDefault = ['f', 'g'];



class textToAst {
  constructor({
    allowSimplifiedFunctionApplication=allowSimplifiedFunctionApplicationDefault,
    splitSymbols=splitSymbolsDefault,
    unsplitSymbols=unsplitSymbolsDefault,
    appliedFunctionSymbols=appliedFunctionSymbolsDefault,
    functionSymbols=functionSymbolsDefault
  } = {}){
    this.allowSimplifiedFunctionApplication = allowSimplifiedFunctionApplication;
    this.splitSymbols = splitSymbols;
    this.unsplitSymbols = unsplitSymbols;
    this.appliedFunctionSymbols = appliedFunctionSymbols;
    this.functionSymbols = functionSymbols;
    this.symbolDictionary = {
    "**": ['^'],
    "*": ['*'],
    "\xB7": ['*'],
    "\u03B1": ['VARMULTICHAR', yytext='alpha'] // 'α'

    }
  }

  sanitizeSymbol(symbol){
    //remove whitespace
    //return a number


  }

  convert(input){
    this.input = input;
  //   lexer.setInput(input);
  //   advance();
  //   var result=statement_list(params)
  //   if (symbol != EOFsymbol) {
	// throw new ParseError("Invalid location of '" + yytext() + "'", yyloc());
  //   }
  //   return simplify.clean(result);

  }


}

var obj = new textToAst();
console.log(obj.convert('1+x+3'));

export default textToAst;
