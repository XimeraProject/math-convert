/*
 * convert syntax trees back to string representations
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




const unicode_operators = {
    "+": function(operands) { return operands.join( ' ' ); },
    "-": function(operands) { return "- " + operands[0]; },
    "*": function(operands) { return operands.join( " " ); },
    "/": function(operands) { return operands[0] + "/" + operands[1]; },
    "_": function(operands) { return operands[0]  + "_" + operands[1]; },
    "^": function(operands) { return operands[0]  + "^" + operands[1]; },
    "prime": function(operands) { return operands[0] + "'"; },
    "tuple": function(operands) { return '( ' + operands.join( ', ' ) + ' )';},
    "array": function(operands) { return '[ ' + operands.join( ', ' ) + ' ]';},
    "list": function(operands) { return operands.join( ', ' );},
    "set": function(operands) { return '{ ' + operands.join( ', ' ) + ' }';},
    "vector": function(operands) { return '( ' + operands.join( ', ' ) + ' )';},
    "interval": function(operands) { return '( ' + operands.join( ', ' ) + ' )';},
    "and": function(operands) { return operands.join( ' and ' );},
    "or": function(operands) { return operands.join( ' or ' );},
    "not": function(operands) { return 'not ' + operands[0]; },
    "=": function(operands) { return operands.join( ' = ' );},
    "<": function(operands) { return operands.join( ' < ' );},
    ">": function(operands) { return operands.join( ' > ' );},
    "lts": function(operands) { return operands.join( ' < ' );},
    "gts": function(operands) { return operands.join( ' > ' );},

    "le": function(operands) { return operands.join( ' ≤ ' );},
    "ge": function(operands) { return operands.join( ' ≥ ' );},
    "ne": function(operands) { return operands.join( ' ≠ ' );},
    "in": function(operands) { return operands[0] + " ∈ " + operands[1]; },
    "notin": function(operands) { return operands[0] + " ∉ " + operands[1]; },
    "ni": function(operands) { return operands[0] + " ∋ " + operands[1]; },
    "notni": function(operands) { return operands[0] + " ∌ " + operands[1]; },
    "subset": function(operands) { return operands[0] + " ⊂ " + operands[1]; },
    "notsubset": function(operands) { return operands[0] + " ⊄ " + operands[1]; },
    "superset": function(operands) { return operands[0] + " ⊃ " + operands[1]; },
    "notsuperset": function(operands) { return operands[0] + " ⊅ " + operands[1]; },
    "union": function (operands) { return operands.join(' ∪ '); },
    "intersect": function (operands) { return operands.join(' ∩ '); },
};

const nonunicode_operators = {
    "+": function(operands) { return operands.join( ' ' ); },
    "-": function(operands) { return "- " + operands[0]; },
    "*": function(operands) { return operands.join( " " ); },
    "/": function(operands) { return operands[0] + "/" + operands[1]; },
    "_": function(operands) { return operands[0]  + "_" + operands[1]; },
    "^": function(operands) { return operands[0]  + "^" + operands[1]; },
    "prime": function(operands) { return operands[0] + "'"; },
    "tuple": function(operands) { return '( ' + operands.join( ', ' ) + ' )';},
    "array": function(operands) { return '[ ' + operands.join( ', ' ) + ' ]';},
    "list": function(operands) { return operands.join( ', ' );},
    "set": function(operands) { return '{ ' + operands.join( ', ' ) + ' }';},
    "vector": function(operands) { return '( ' + operands.join( ', ' ) + ' )';},
    "interval": function(operands) { return '( ' + operands.join( ', ' ) + ' )';},
    "and": function(operands) { return operands.join( ' and ' );},
    "or": function(operands) { return operands.join( ' or ' );},
    "not": function(operands) { return 'not ' + operands[0]; },
    "=": function(operands) { return operands.join( ' = ' );},
    "<": function(operands) { return operands.join( ' < ' );},
    ">": function(operands) { return operands.join( ' > ' );},
    "lts": function(operands) { return operands.join( ' < ' );},
    "gts": function(operands) { return operands.join( ' > ' );},

    "le": function(operands) { return operands.join( ' <= ' );},
    "ge": function(operands) { return operands.join( ' >= ' );},
    "ne": function(operands) { return operands.join( ' ne ' );},
    "in": function(operands) { return operands[0] + " elementof " + operands[1]; },
    "notin": function(operands) { return operands[0] + " notelementof " + operands[1]; },
    "ni": function(operands) { return operands[0] + " containselement " + operands[1]; },
    "notni": function(operands) { return operands[0] + " notcontainselement " + operands[1]; },
    "subset": function(operands) { return operands[0] + " subset " + operands[1]; },
    "notsubset": function(operands) { return operands[0] + " notsubset " + operands[1]; },
    "superset": function(operands) { return operands[0] + " superset " + operands[1]; },
    "notsuperset": function(operands) { return operands[0] + " notsuperset " + operands[1]; },
    "union": function (operands) { return operands.join(' union '); },
    "intersect": function (operands) { return operands.join(' intersect '); },
};


const output_unicodeDefault = true;


class astToText {
  constructor({
    output_unicode = output_unicodeDefault
  } = {}) {
    this.output_unicode = output_unicode;
    this.operators = unicode_operators;
    if(!output_unicode){ this.operators = nonunicode_operators;}
  }

  convert(tree) {
      return this.statement(tree);
  }

 statement(tree) {
    if ((typeof tree === 'string') || (typeof tree === 'number')) {
	return this.single_statement(tree);
    }

    var operator = tree[0];
    var operands = tree.slice(1);

    if((!(operator in this.operators)) && operator!=="apply")
	throw new Error("Badly formed ast: operator " + operator + " not recognized.");

    if (operator === 'and' || operator === 'or')  {
	return this.operators[operator]( operands.map( function(v,i) {
	    var result = this.single_statement(v);
	    // for clarity, add parenthesis unless result is
	    // single quantity (with no spaces) or already has parens
	    if (result.toString().match(/ /)
		&& (!(result.toString().match(/^\(.*\)$/))))
		return '(' + result  + ')';
	    else
		return result;
	}.bind(this)));
    }
    return this.single_statement(tree);
}

 single_statement(tree) {
    if ((typeof tree === 'string') || (typeof tree === 'number')) {
	return this.expression(tree);
    }

    var operator = tree[0];
    var operands = tree.slice(1);

    if (operator == 'not') {
	return this.operators[operator]( operands.map( function(v,i) {
	    var result = this.single_statement(v);
	    // for clarity, add parenthesis unless result is
	    // single quantity (with no spaces) or already has parens
	    if (result.toString().match(/ /)
		&& (!(result.toString().match(/^\(.*\)$/))))
		return '(' + result  + ')';
	    else
		return result;
	}.bind(this)));
    }

    if((operator == '=') || (operator == 'ne')
       || (operator == '<') || (operator == '>')
       || (operator == 'le') || (operator == 'ge')
       || (operator == 'in') || (operator == 'notin')
       || (operator == 'ni') || (operator == 'notni')
       || (operator == 'subset') || (operator == 'notsubset')
       || (operator == 'superset') || (operator == 'notsuperset')) {
	return this.operators[operator]( operands.map( function(v,i) {
	    return this.expression(v);
	}.bind(this)));
    }

    if(operator == 'lts' || operator == 'gts') {
	var args = operands[0]
	var strict = operands[1];

	if(args[0] != 'tuple' || strict[0] != 'tuple')
	    // something wrong if args or strict are not tuples
	    throw new Error("Badly formed ast");

	var result = this.expression(args[1]);
	for(var i=1; i< args.length-1; i++) {
	    if(strict[i]) {
		if(operator == 'lts')
		    result += " < ";
		else
		    result += " > ";
	    }
	    else {
		if(operator == 'lts') {
		    if(this.output_unicode)
			result += " ≤ ";
		    else
			result += " <= ";
		}
		else {
		    if(this.output_unicode)
			result += " ≥ ";
		    else
			result += " >= ";
		}
	    }
	    result += this.expression(args[i+1]);
	}
	return result;
    }

    return this.expression(tree);
}

 expression(tree) {
    if ((typeof tree === 'string') || (typeof tree === 'number')) {
	return this.term(tree);
    }

    var operator = tree[0];
    var operands = tree.slice(1);

    if (operator == '+') {
	return this.operators[operator]( operands.map( function(v,i) {
	    if(i>0)
		return this.termWithPlusIfNotNegated(v);
	    else
		return this.term(v);
	}.bind(this) ));
    }

    if ((operator == 'union') || (operator == 'intersect')) {
	return this.operators[operator]( operands.map( function(v,i) {
	    return this.term(v);
	}.bind(this)));
    }

    return this.term(tree);
}

 term(tree) {
    if ((typeof tree === 'string') || (typeof tree === 'number')) {
	return this.factor(tree);
    }

    var operator = tree[0];
    var operands = tree.slice(1);

    if (operator == '-') {
	return this.operators[operator]( operands.map( function(v,i) {
	    return this.term(v);
	}.bind(this)));
    }
    if (operator == '*') {
	return this.operators[operator]( operands.map( function(v,i) {
	    var result;
	    if(i > 0) {
		result = this.factorWithParenthesesIfNegated(v);
		if (result.toString().match( /^[0-9]/ ))
		    return '* ' + result;
		else
		    return result
	    }
	    else
		return this.factor(v);
	}.bind(this)));
    }

    if (operator == '/') {
	return this.operators[operator]( operands.map( function(v,i) { return this.factor(v); }.bind(this) ) );
    }

    return this.factor(tree);
}

 symbolConvert(symbol) {
    var symbolConversions= {
	'infinity': '∞',
	'alpha': 'α',
	'beta': 'β',
	'Gamma': 'Γ',
	'gamma': 'γ',
	'Delta': 'Δ',
	'delta': 'δ',
	'epsilon': 'ε',
	'zeta': 'ζ',
	'eta': 'η',
	'Theta': 'ϴ',
	'theta': 'θ',
	'iota': 'ι',
	'kappa': 'κ',
	'Lambda': 'Λ',
	'lambda': 'λ',
	'mu': 'μ',
	'nu': 'ν',
	'Xi': 'Ξ',
	'xi': 'ξ',
	'Pi': 'Π',
	'pi': 'π',
	'rho': 'ρ',
	'Sigma': 'Σ',
	'sigma': 'σ',
	'tau': 'τ',
	'Upsilon': 'Υ',
	'upsilon': 'υ',
	'Phi': 'Φ',
	'phi': 'ϕ',
	'Psi': 'Ψ',
	'psi': 'ψ',
	'Omega': 'Ω',
	'omega': 'ω',
    }
    if (this.output_unicode && (symbol in symbolConversions))
	return symbolConversions[symbol];
    else
	return symbol
}

 simple_factor_or_function_or_parens(tree) {
    // return true if
    // factor(tree) is a single character
    // or tree is a number
    // or tree is a string
    // or tree is a function call
    // or factor(tree) is in parens

    var result = this.factor(tree);

    if (result.toString().length == 1
	|| (typeof tree == 'number')
	|| (typeof tree == 'string')
	|| (tree[0] == 'apply')
	|| result.toString().match( /^\(.*\)$/)
       )
	return true;
    else
	return false
}

 factor(tree) {
    if (typeof tree === 'string') {
	return this.symbolConvert(tree);
    }

    if (typeof tree === 'number') {
	return tree;
    }

    var operator = tree[0];
    var operands = tree.slice(1);

    if (operator === "^") {
	var operand0 = this.factor(operands[0]);

	// so that f_(st)'^2(x) doesn't get extra parentheses
	// (and no longer recognized as function call)
	// check for simple factor after removing primes
	var remove_primes = operands[0];
	while(remove_primes[0] == 'prime') {
	    remove_primes=remove_primes[1];
	}

	if(!(this.simple_factor_or_function_or_parens(remove_primes) ||
	     (remove_primes[0] == '_' &&  (typeof remove_primes[1] == 'string'))
	    ))
	    operand0 = '(' + operand0.toString() + ')';

	var operand1 = this.factor(operands[1]);
	if(!(this.simple_factor_or_function_or_parens(operands[1])))
	    operand1 = '(' + operand1.toString() + ')';

	return operand0 + '^' + operand1;
    }
    else if (operator === "_") {
	return this.operators[operator]( operands.map( function(v,i) {
	    var result = this.factor(v);
	    if(this.simple_factor_or_function_or_parens(v))
		return result;
	    else
		return '(' + result.toString() + ')';
	}.bind(this)));
    }
    else if(operator === "prime") {
	var op = operands[0];

	var n_primes=1;
	while(op[0] === "prime") {
	    n_primes+=1;
	    op=op[1];
	}

	var result = this.factor(op);

	if (!(this.simple_factor_or_function_or_parens(op) ||
	      (op[0] == '_' &&  (typeof op[1] == 'string'))
	     ))
	    result = '(' + result.toString() + ')';
	for(var i=0; i<n_primes; i++) {
	    result += "'";
	}
	return result;
    }
    else if(operator === "-") {
	return this.operators[operator]( operands.map( function(v,i) {
	    return this.factor(v);
	}.bind(this)));
    }
    else if(operator === 'tuple' || operator === 'array'
	    || operator === 'list'
	    || operator === 'set' || operator === 'vector') {
	return this.operators[operator]( operands.map( function(v,i) {
	    return this.statement(v);
	}.bind(this)));

    }
    else if(operator === 'interval') {

	var args = operands[0];
	var closed = operands[1];
	if(args[0] !== 'tuple' || closed[0] !== 'tuple')
	    throw new Error("Badly formed ast");

	var result = this.statement(args[1]) + ", "
	    + this.statement(args[2]);

	if(closed[1])
	    result = '[ ' + result;
	else
	    result = '( ' + result;

	if(closed[2])
	    result = result + ' ]';
	else
	    result = result + ' )';

	return result;

    }
    else if(operator == 'apply'){

	if(operands[0] === 'abs') {
	    return '|' + this.statement(operands[1]) + '|';
	}

	if (operands[0] === "factorial") {
	    var result = this.factor(operands[1]);
	    if(this.simple_factor_or_function_or_parens(operands[1]) ||
	       (operands[1][0] == '_' &&  (typeof operands[1][1] == 'string'))
	      )
		return result + "!";
	    else
		return '(' + result.toString() + ')!';

	}

	var f = this.factor(operands[0]);
	var f_args = this.statement(operands[1]);

	if(operands[1][0] != 'tuple')
	    f_args = "(" + f_args + ")";

	return f+f_args;
    }
    else {
	return '(' + this.statement(tree) + ')';
    }
}

 factorWithParenthesesIfNegated(tree){
    var result = this.factor(tree);

    if (result.toString().match( /^-/ ))
	return '(' + result.toString() + ')';

    // else
    return result;
}

 termWithPlusIfNotNegated(tree){
    var result = this.term(tree);

    if (!result.toString().match( /^-/ ))
	return '+ ' + result.toString();

    // else
    return result;
}

}


export default astToText;
