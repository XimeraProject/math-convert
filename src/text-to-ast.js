import {ParseError} from './error';
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


const text_rules = [
  ['[0-9]+(\\.[0-9]+)?(E[+\\-]?[0-9]+)?', 'NUMBER'],
  ['\\.[0-9]+(E[+\\-]?[0-9]+)?', 'NUMBER'],
  ['\\*\\*', '^'],
  ['\\*', '*'], // there is some variety in multiplication symbols
  ['\\xB7', '*'], // '·'
  ['\u00B7', '*'], // '·'
  ['\u2022', '*'], // '•'
  ['\u22C5', '*'], // '⋅'
  ['\u00D7', '*'], // '×'
  ['\/', '/'],
  ['-', '-'], // there is quite some variety with unicode hyphens
  ['\u058A', '-'], // '֊'
  ['\u05BE', '-'], // '־'
  ['\u1806', '-'], // '᠆'
  ['\u2010', '-'], // '‐'
  ['\u2011', '-'], // '‑'
  ['\u2012', '-'], // '‒'
  ['\u2013', '-'], // '–'
  ['\u2014', '-'], // '—'
  ['\u2015', '-'], // '―'
  ['\u207B', '-'], // '⁻'
  ['\u208B', '-'], // '₋'
  ['\u2212', '-'], // '−'
  ['\u2E3A', '-'], // '⸺'
  ['\u2E3B', '-'], // '⸻'
  ['\uFE58', '-'], // '﹘'
  ['\uFE63', '-'], // '﹣'
  ['\uFF0D', '-'], // '－'
  ['\\+', '+'],
  ['\\^', '^'], // a few ways to denote exponentiation
  ['\u2038', '^'], // '‸'
  ['\u028C', '^'], // 'ʌ'
  ['\\|', '|'],
  ['\\(', '('],
  ['\\)', ')'],
  ['\\[', '['],
  ['\\]', ']'],
  ['\\{', '{'],
  ['\\}', '}'],
  [',', ','],

  ['\u03B1', 'VARMULTICHAR', 'alpha'], // 'α'
  ['\u03B2', 'beta'], // 'β'
  ['\u03D0', 'VARMULTICHAR', 'beta'], // 'ϐ'
  ['\u0393', 'VARMULTICHAR', 'Gamma'], // 'Γ'
  ['\u03B3', 'VARMULTICHAR', 'gamma'], // 'γ'
  ['\u0394', 'VARMULTICHAR', 'Delta'], // 'Δ'
  ['\u03B4', 'VARMULTICHAR', 'delta'], // 'δ'
  ['\u03B5', 'VARMULTICHAR', 'epsilon'], // 'ε' should this be varepsilon?
  ['\u03F5', 'VARMULTICHAR', 'epsilon'], // 'ϵ'
  ['\u03B6', 'VARMULTICHAR', 'zeta'], // 'ζ'
  ['\u03B7', 'VARMULTICHAR', 'eta'], // 'η'
  ['\u0398', 'VARMULTICHAR', 'Theta'], // 'Θ'
  ['\u03F4', 'VARMULTICHAR', 'Theta'], // 'ϴ'
  ['\u03B8', 'VARMULTICHAR', 'theta'], // 'θ'
  ['\u1DBF', 'VARMULTICHAR', 'theta'], // 'ᶿ'
  ['\u03D1', 'VARMULTICHAR', 'theta'], // 'ϑ'
  ['\u03B9', 'VARMULTICHAR', 'iota'], // 'ι'
  ['\u03BA', 'VARMULTICHAR', 'kappa'], // 'κ'
  ['\u039B', 'VARMULTICHAR', 'Lambda'], // 'Λ'
  ['\u03BB', 'VARMULTICHAR', 'lambda'], // 'λ'
  ['\u03BC', 'VARMULTICHAR', 'mu'], // 'μ'
  ['\u00B5', 'VARMULTICHAR', 'mu'], // 'µ' should this be micro?
  ['\u03BD', 'VARMULTICHAR', 'nu'], // 'ν'
  ['\u039E', 'VARMULTICHAR', 'Xi'], // 'Ξ'
  ['\u03BE', 'VARMULTICHAR', 'xi'], // 'ξ'
  ['\u03A0', 'VARMULTICHAR', 'Pi'], // 'Π'
  ['\u03C0', 'VARMULTICHAR', 'pi'], // 'π'
  ['\u03D6', 'VARMULTICHAR', 'pi'], // 'ϖ' should this be varpi?
  ['\u03C1', 'VARMULTICHAR', 'rho'], // 'ρ'
  ['\u03F1', 'VARMULTICHAR', 'rho'], // 'ϱ' should this be varrho?
  ['\u03A3', 'VARMULTICHAR', 'Sigma'], // 'Σ'
  ['\u03C3', 'VARMULTICHAR', 'sigma'], // 'σ'
  ['\u03C2', 'VARMULTICHAR', 'sigma'], // 'ς' should this be varsigma?
  ['\u03C4', 'VARMULTICHAR', 'tau'], // 'τ'
  ['\u03A5', 'VARMULTICHAR', 'Upsilon'], // 'Υ'
  ['\u03C5', 'VARMULTICHAR', 'upsilon'], // 'υ'
  ['\u03A6', 'VARMULTICHAR', 'Phi'], // 'Φ'
  ['\u03C6', 'VARMULTICHAR', 'phi'], // 'φ' should this be varphi?
  ['\u03D5', 'VARMULTICHAR', 'phi'], // 'ϕ'
  ['\u03A8', 'VARMULTICHAR', 'Psi'], // 'Ψ'
  ['\u03C8', 'VARMULTICHAR', 'psi'], // 'ψ'
  ['\u03A9', 'VARMULTICHAR', 'Omega'], // 'Ω'
  ['\u03C9', 'VARMULTICHAR', 'omega'], // 'ω'

  ['oo\\b', 'INFINITY'],
  ['OO\\b', 'INFINITY'],
  ['infty\\b', 'INFINITY'],
  ['infinity\\b', 'INFINITY'],
  ['Infinity\\b', 'INFINITY'],
  ['\u221E', 'INFINITY'], // '∞'

  ['\u212F', 'VAR', 'e'], // 'ℯ'

  ['\u2660', 'VARMULTICHAR', 'spade'], // '♠'
  ['\u2661', 'VARMULTICHAR', 'heart'], // '♡'
  ['\u2662', 'VARMULTICHAR', 'diamond'], // '♢'
  ['\u2663', 'VARMULTICHAR', 'club'], // '♣'
  ['\u2605', 'VARMULTICHAR', 'bigstar'], // '★'
  ['\u25EF', 'VARMULTICHAR', 'bigcirc'], // '◯'
  ['\u25CA', 'VARMULTICHAR', 'lozenge'], // '◊'
  ['\u25B3', 'VARMULTICHAR', 'bigtriangleup'], // '△'
  ['\u25BD', 'VARMULTICHAR', 'bigtriangledown'], // '▽'
  ['\u29EB', 'VARMULTICHAR', 'blacklozenge'], // '⧫'
  ['\u25A0', 'VARMULTICHAR', 'blacksquare'], // '■'
  ['\u25B2', 'VARMULTICHAR', 'blacktriangle'], // '▲'
  ['\u25BC', 'VARMULTICHAR', 'blacktriangledown'], //'▼'
  ['\u25C0', 'VARMULTICHAR', 'blacktriangleleft'], // '◀'
  ['\u25B6', 'VARMULTICHAR', 'blacktriangleright'], // '▶'
  ['\u25A1', 'VARMULTICHAR', 'Box'], // '□'
  ['\u2218', 'VARMULTICHAR', 'circ'], // '∘'
  ['\u22C6', 'VARMULTICHAR', 'star'], // '⋆'

  ['and\\b', 'AND'],
  ['\\&\\&?', 'AND'],
  ['\u2227', 'AND'], // '∧'

  ['or\\b', 'OR'],
  ['\u2228', 'OR'], // '∨'

  ['not\\b', 'NOT'],
  ['\u00ac', 'NOT'], // '¬'

  ['=', '='],
  ['\u1400', '='], // '᐀'
  ['\u30A0', '='], // '゠'
  ['!=', 'NE'],
  ['\u2260', 'NE'], // '≠'
  ['<=', 'LE'],
  ['\u2264', 'LE'], // '≤'
  ['>=', 'GE'],
  ['\u2265', 'GE'], // '≥'
  ['<', '<'],
  ['>', '>'],

  ['elementof\\b', 'IN'],
  ['\u2208', 'IN'], // '∈'

  ['notelementof\\b', 'NOTIN'],
  ['\u2209', 'NOTIN'], //'∉'

  ['containselement\\b', 'NI'],
  ['\u220B', 'NI'], // '∋'

  ['notcontainselement\\b', 'NOTNI'],
  ['\u220C', 'NOTNI'], // '∌'

  ['subset\\b', 'SUBSET'],
  ['\u2282', 'SUBSET'], // '⊂'

  ['notsubset\\b', 'NOTSUBSET'],
  ['\u2284', 'NOTSUBSET'], // '⊄'

  ['superset\\b', 'SUPERSET'],
  ['\u2283', 'SUPERSET'], // '⊃'

  ['notsuperset\\b', 'NOTSUPERSET'],
  ['\u2285', 'NOTSUPERSET'], //'⊅'

  ['union\\b', 'UNION'],
  ['\u222A', 'UNION'], // '∪'

  ['intersect\\b', 'INTERSECT'],
  ['\u2229', 'INTERSECT'], //'∩'

  ['!', '!'],
  ['\'', '\''],
  ['_', '_'],

  ['d[a-zA-Z]\\s*\/\\s*d[a-zA-Z]\\b', 'DERIVATIVE'],

  ['d\\^([0-9])[a-zA-Z]\\s*\/\\s*d[a-zA-Z]\\^\\1\\b', 'DERIVATIVEMULT'],

  
  ['[a-zA-Z][a-zA-Z0-9]*', 'VAR']
];


// defaults for parsers if not overridden by context

// if true, allowed applied functions to omit parentheses around argument
// if false, omitting parentheses will lead to a Parse Error
const allowSimplifiedFunctionApplicationDefault = true;

// if true, split multicharacter symbols into a product of letters
const splitSymbolsDefault = true;

// symbols that won't be split into a product of letters if splitSymbols==true
const unsplitSymbolsDefault = ['pi', 'theta', 'Theta', 'alpha', 'nu', 'beta', 'xi', 'Xi', 'gamma', 'Gamma', 'delta', 'Delta', 'pi', 'Pi', 'epsilon', 'epsilon', 'rho', 'rho', 'zeta', 'sigma', 'Sigma', 'eta', 'tau', 'upsilon', 'Upsilon', 'iota', 'phi', 'phi', 'Phi', 'kappa', 'chi', 'lambda', 'Lambda', 'psi', 'Psi', 'omega', 'Omega'];

// Applied functions must be given an argument so that
// they are applied to the argument
const appliedFunctionSymbolsDefault = ["abs", "exp", "log", "ln", "log10", "sign", "sqrt", "erf", "acos", "acosh", "acot", "acoth", "acsc", "acsch", "asec", "asech", "asin", "asinh", "atan", "atanh", "cos", "cosh", "cot", "coth", "csc", "csch", "sec", "sech", "sin", "sinh", "tan", "tanh", 'arcsin', 'arccos', 'arctan', 'arccsc', 'arcsec', 'arccot', 'cosec', 'arg'];

// Functions could have an argument, in which case they are applied
// or, if they don't have an argument in parentheses, then they are treated
// like a variable, except that trailing ^ and ' have higher precedence
const functionSymbolsDefault = ['f', 'g'];



class textToAst {
  constructor({
    allowSimplifiedFunctionApplication = allowSimplifiedFunctionApplicationDefault,
    splitSymbols = splitSymbolsDefault,
    unsplitSymbols = unsplitSymbolsDefault,
    appliedFunctionSymbols = appliedFunctionSymbolsDefault,
    functionSymbols = functionSymbolsDefault
  } = {}) {
    this.allowSimplifiedFunctionApplication = allowSimplifiedFunctionApplication;
    this.splitSymbols = splitSymbols;
    this.unsplitSymbols = unsplitSymbols;
    this.appliedFunctionSymbols = appliedFunctionSymbols;
    this.functionSymbols = functionSymbols;

    this.lexer = new lexer(text_rules);

  }

  advance() {
    this.token = this.lexer.advance();
    if (this.token[0] == 'INVALID') {
      throw new ParseError("Invalid symbol '" + this.token[1] + "'",
        this.lexer.location);
    }
  }

  convert(input) {

    this.lexer.set_input(input);
    this.advance();

    var result = this.statement_list();

    if (this.token[0] != 'EOF') {
      throw new ParseError("Invalid location of '" + this.token[1] + "'",
        this.lexer.location);
    }

    return flatten(result);

  }


  statement_list() {

    var list = [this.statement()];

    while (this.token[0] == ",") {
      this.advance();
      list.push(this.statement());
    }

    if (list.length > 1)
      list = ['list'].concat(list);
    else
      list = list[0];

    return list;
  }

  statement() {

    var lhs = this.statement2();

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

    var lhs = this.relation();

    while (this.token[0] == 'AND') {

      var operation = this.token[0].toLowerCase();

      this.advance();

      var rhs = this.relation();

      lhs = [operation, lhs, rhs];
    }

    return lhs;
  }


  relation() {

    if (this.token[0] == 'NOT' || this.token[0] == '!') {
      this.advance();
      return ['not', this.relation()];
    }

    var lhs = this.expression();

    while ((this.token[0] == '=') || (this.token[0] == 'NE') ||
      (this.token[0] == '<') || (this.token[0] == '>') ||
      (this.token[0] == 'LE') || (this.token[0] == 'GE') ||
      (this.token[0] == 'IN') || (this.token[0] == 'NOTIN') ||
      (this.token[0] == 'NI') || (this.token[0] == 'NOTNI') ||
      (this.token[0] == 'SUBSET') || (this.token[0] == 'NOTSUBSET') ||
      (this.token[0] == 'SUPERSET') || (this.token[0] == 'NOTSUPERSET')) {

      var operation = this.token[0].toLowerCase();

      var inequality_sequence = 0;

      if ((this.token[0] == '<') || (this.token[0] == 'LE')) {
        inequality_sequence = -1;
      } else if ((this.token[0] == '>') || (this.token[0] == 'GE')) {
        inequality_sequence = 1;
      }

      this.advance();
      var rhs = this.expression();

      if (inequality_sequence == -1) {
        if ((this.token[0] == '<') || this.token[0] == 'LE') {
          // sequence of multiple < or <=
          var strict = ['tuple'];
          if (operation == '<')
            strict.push(true)
          else
            strict.push(false)

          var args = ['tuple', lhs, rhs];
          while ((this.token[0] == '<') || this.token[0] == 'LE') {
            if (this.token[0] == '<')
              strict.push(true)
            else
              strict.push(false)

            this.advance();
            args.push(this.expression());
          }
          lhs = ['lts', args, strict];
        } else {
          lhs = [operation, lhs, rhs];
        }

      } else if (inequality_sequence == 1) {
        if ((this.token[0] == '>') || this.token[0] == 'GE') {
          // sequence of multiple > or >=
          var strict = ['tuple'];
          if (operation == '>')
            strict.push(true)
          else
            strict.push(false)

          var args = ['tuple', lhs, rhs];
          while ((this.token[0] == '>') || this.token[0] == 'GE') {
            if (this.token[0] == '>')
              strict.push(true)
            else
              strict.push(false)

            this.advance();
            args.push(this.expression());
          }
          lhs = ['gts', args, strict];
        } else {
          lhs = [operation, lhs, rhs];
        }

      } else if (operation === '=') {
        lhs = ['=', lhs, rhs];

        // check for sequence of multiple =
        while (this.token[0] === '=') {
          this.advance();
          lhs.push(this.expression());
        }
      } else {

        lhs = [operation, lhs, rhs];
      }

    }

    return lhs;
  }


  expression() {
    if (this.token[0] == '+')
      this.advance();

    var lhs = this.term();
    while ((this.token[0] == '+') || (this.token[0] == '-') || (this.token[0] == 'UNION') ||
      (this.token[0] == 'INTERSECT')) {

      var operation = this.token[0].toLowerCase();
      var negative = false;

      if (this.token[0] == '-') {
        operation = '+';
        negative = true;
        this.advance();
      } else {
        this.advance();
      }
      var rhs = this.term();
      if (negative) {
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
    } while (keepGoing);

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

    if (result === false) {
      if (this.token[0] == "EOF") {
        throw new ParseError("Unexpected end of input", this.lexer.location);
      } else {
        throw new ParseError("Invalid location of '" + this.token[1] + "'",
          this.lexer.location);
      }
    } else {
      return result;
    }

  }

  nonMinusFactor() {

    var result = this.baseFactor();

    // allow arbitrary sequence of factorials
    if (this.token[0] == '!' || this.token[0] == "'") {
      if (result === false)
        throw new ParseError("Invalid location of " + this.token[0],
          this.lexer.location);
      while (this.token[0] == '!' || this.token[0] == "'") {
        if (this.token[0] == '!')
          result = ['apply', 'factorial', result]
        else
          result = ['prime', result];
        this.advance();
      }
    }

    if (this.token[0] == '^') {
      if (result === false) {
        throw new ParseError("Invalid location of ^", this.lexer.location);
      }
      this.advance();
      return ['^', result, this.factor()];
    }

    return result;
  }


  baseFactor() {
    var result = false;

    if (this.token[0] == 'NUMBER') {
      result = parseFloat(this.token[1]);
      this.advance();
    } else if (this.token[0] == 'INFINITY') {
      result = 'infinity';
      this.advance();
    } else if (this.token[0] == 'DERIVATIVE') {

      let match = /d([a-zA-Z])\s*\/\s*d([a-zA-Z])/.exec(this.token[1]);

      result = ['derivative_leibniz', match[1], match[2]];
      this.advance();
      return result;
      
    } else if (this.token[0] == 'DERIVATIVEMULT') {

      let match = /d\^([0-9])([a-zA-Z])\s*\/\s*d([a-zA-Z])\^\1/.exec(this.token[1]);

      result = ['derivative_leibniz_mult', parseFloat(match[1]), match[2], match[3]];
      this.advance();
      return result;
      
    } else if (this.token[0] == 'VAR' || this.token[0] == 'VARMULTICHAR') {
      result = this.token[1];

      if (this.appliedFunctionSymbols.includes(result) ||
        this.functionSymbols.includes(result)) {
        var must_apply = false
        if (this.appliedFunctionSymbols.includes(result))
          must_apply = true;

        result = result.toLowerCase();
        this.advance();

        if (this.token[0] == '_') {
          this.advance();
          var subresult = this.baseFactor();

          // since baseFactor could return false, must check
          if (subresult === false) {
            if (this.token[0] == "EOF") {
              throw new ParseError("Unexpected end of input",
                this.lexer.location);
            } else {
              throw new ParseError("Invalid location of '" + this.token[1] +
                "'", this.lexer.location);
            }
          }
          result = ['_', result, subresult];
        }

        var n_primes = 0;
        while (this.token[0] == "'") {
          n_primes += 1;
          result = ['prime', result];
          this.advance();
        }

        if (this.token[0] == '^') {
          this.advance();
          result = ['^', result, this.factor()];
        }

        if (this.token[0] == '(') {
          this.advance();
          var parameters = this.statement_list();

          if (this.token[0] != ')') {
            throw new ParseError('Expected )', this.lexer.location);
          }
          this.advance();

          if (parameters[0] == 'list') {
            // rename from list to tuple
            parameters[0] = 'tuple';
          }

          result = ['apply', result, parameters];
        } else {
          // if was an applied function symbol,
          // cannot omit argument
          if (must_apply) {
            if (!this.allowSimplifiedFunctionApplication)
              throw new ParseError("Expected ( after function",
                this.lexer.location);

            // if allow simplied function application
            // let the argument be the next factor
            result = ['apply', result, this.factor()];
          }
        }
      } else {
        // determine if should split text into single letter factors
        var split = this.splitSymbols;

        if (split) {
          if (this.token[0] == 'VARMULTICHAR' ||
            this.unsplitSymbols.includes(result) ||
            result.length == 1) {
            split = false;
          } else if (result.match(/[\d]/g)) {
            // don't split if has a number in it
            split = false;
          }
        }

        if (split) {
          // so that each character gets processed separately
          // put all characters back on the input
          // but with spaces
          // then process again

          for (var i = result.length - 1; i >= 0; i--) {
            this.lexer.unput(" ");
            this.lexer.unput(result[i]);
          }
          this.advance();

          return this.baseFactor();
        } else {
          this.advance();
        }
      }
    } else if (this.token[0] == '(' || this.token[0] == '[' ||
      this.token[0] == '{') {
      var token_left = this.token[0];
      var expected_right, other_right;
      if (this.token[0] == '(') {
        expected_right = ')';
        other_right = ']';
      } else if (this.token[0] == '[') {
        expected_right = ']';
        other_right = ')';
      } else {
        expected_right = '}';
        other_right = null;
      }

      this.advance();
      result = this.statement_list();

      var n_elements = 1;
      if (result[0] == "list") {
        n_elements = result.length - 1;
      }

      if (this.token[0] != expected_right) {
        if (n_elements != 2 || other_right === null) {
          throw new ParseError('Expected ' + expected_right,
            this.lexer.location);
        } else if (this.token[0] != other_right) {
          throw new ParseError('Expected ) or ]', this.lexer.location);
        }

        // half-open interval
        result[0] = 'tuple';
        result = ['interval', result];
        var closed;
        if (token_left == '(')
          closed = ['tuple', false, true];
        else
          closed = ['tuple', true, false];
        result.push(closed);

      } else if (n_elements >= 2) {
        if (token_left == '(') {
          result[0] = 'tuple';
        } else if (token_left == '[') {
          result[0] = 'array';
        } else {
          result[0] = 'set';
        }
      } else if (token_left === '{') {
        // singleton set
        result = ['set'].concat(result);
      }

      this.advance();
    }

    if (this.token[0] == '_') {
      if (result === false) {
        throw new ParseError("Invalid location of _", this.lexer.location);
      }
      this.advance();
      var subresult = this.baseFactor();

      if (subresult === false) {
        if (this.token[0] == "EOF") {
          throw new ParseError("Unexpected end of input", this.lexer.location);
        } else {
          throw new ParseError("Invalid location of '" + this.token[1] + "'",
            this.lexer.location);
        }
      }
      return ['_', result, subresult];
    }

    return result;
  }

}

export default textToAst;
