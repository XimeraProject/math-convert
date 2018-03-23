import astToLatex from '../src/ast-to-latex';

var texts = {
	'1+x+3': '1 + x + 3',
	'1-x-3': '1 - x - 3',
	'1 + x^2 + 3x^5': '1 + x^{2} + 3 \\, x^{5}',
	'|x|': '\\left|x\\right|',
	'sin^2 x': '\\sin^{2}\\left(x\\right)',
	'log x': '\\log\\left(x\\right)',
	'log |x|': '\\log\\left(\\left|x\\right|\\right)',
	'ln x': '\\ln\\left(x\\right)',
	'ln |x|': '\\ln\\left(\\left|x\\right|\\right)',
	'sin^2 (3x)': '\\sin^{2}\\left(3 \\, x\\right)',
	'sin x': '\\sin\\left(x\\right)',
	'x!': 'x!',
	'17!': '17!',
	'sqrt(-x)': '\\sqrt{- x}',
	'x^y z': 'x^{y} \\, z',
	'2^(2^x)': '2^{2^{x}}',
	'(2^x)^y': '\\left(2^{x}\\right)^{y}',
	'x^(2y) z': 'x^{2 \\, y} \\, z',
	'n!': 'n!',
	'1/(x^2 + x + 1)': '\\frac{1}{x^{2} + x + 1}',
	'oo': '\\infty',
    };


test("log x", () => {
  expect(astToLatex(["apply","log","x"])).toMatch('\\log\\left(x\\right)');
})

// test("log x", () => {
//   expect(astToLatex(["apply","log","x"])).toMatchSnapshot();
// })
