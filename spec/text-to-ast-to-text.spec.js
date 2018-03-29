import textToAst from '../src/text-to-ast';
import astToText from '../src/ast-to-text';

var converter_text_to_ast = new textToAst();
var converter_ast_to_text = new astToText();

var round_trip = input => converter_ast_to_text.convert(
  converter_text_to_ast.convert(input));


// Inputs that are strings should render as exactly the same string
// (other than white space changes) after one round trip to ast.
// For inputs that are arrays, the first component should render to
// be exactly as the second component (other than white space changes)
// after one round trip to ast.
var inputs = [
  '3+4',
  '3-4',
  '1+2+3',
  '1/2',
  '-2',
  'x+y-z+w',
  '-x-y+z-w',
  'x^2(x-3)',
  'x^2(x-3)-z^3e^(2x+1)+x/(x-1)',
  '-1/x+((x-3)x)/((x-3)(x+4))',
  '(x/y)/(z/w)',
  'x!',
  'n!',
  '17!',
  '(x+1)!',
  '(x^2+1)!',
  '(n+1)!',
  '(n-1)!',
  'x_(n+1)!',
  'x^2',
  'sin(x)',
  'sin(3)',
  'cos(x)',
  'cos(3)',
  'tan(x)',
  'tan(3)',
  'sec(x)',
  'sec(3)',
  ['theta','θ'],
  'csc(x)',
  'csc(3)',
  'arcsin(x)',
  'arcsin(3)',
  'arccos(x)',
  'arccos(3)',
  'arctan(x)',
  'arctan(3)',
  'arccsc(x)',
  'arccsc(3)',
  'arcsec(x)',
  'arcsec(3)',
  'arccot(x)',
  'arccot(3)',
  'log(x)',
  'log(3)',
  'log(exp(x))',
  'e^x',
  'sqrt(x)',
  'sqrt(4)',
  '1/sqrt(3)',
  '1/sqrt(-x)',
  'x+y+z',
  'sin(3x)',
  'sin(3x)^2',
  'sin(x)^2 + cos(x)^2',
  'sin(x)^2 / cos(x)^2',
  'sin(x+y+z)^2',
  'sqrt(x+y+z)',
  'sqrt(sqrt(x))',
  'sqrt(1/(x+y))',
  'log(-x^2)',
  '|3|',
  'sin(|x|)',
  '|sin(|x|)|',
  '|sin(||x||)|',
  '||x|+|y|+|z||',
  '|x+y < z|',
  ['infinity','∞'],
  "sin(x)'",
  "sin(x)''",
  'f(x)',
  "f'(x)",
  "f''(x)",
  "f(x)'",
  "sin'(x)",
  ['sin x', 'sin(x)'],
  ['sin xy', 'sin(x)y'],
  ['sin^xyz', 'sin^x(y)z'],
  ['y(x)', 'yx'],
  ["y'(x)", "y'x"],
  'x^22',
  'x^ab',
  ['x^y^z', 'x^(y^z)'],
  '(x^y)^z',
  ['x_y_z', 'x_(y_z)'],
  '(x_y)_z',
  'x_y^z',
  ['x^y_z', 'x^(y_z)'],
  'f^2',
  'f^2(x)',
  'f(x)^2',
  'f_t',
  'f_t(x)',
  'f_t^2(x)',
  'f_t\'(x)',
  'f\'^2(x)',
  'f_t\'^2(x)',
  'f_(s+t)\'\'^2(x)',
  'sin(x)\'',
  'x_(s+t)\'\'',
  '(x-1-2)^2',
  '(a,b)',
  '(a,b]',
  '[a,b)',
  '[a,b]',
  '{a,b}',
  '{a,b,c}',
  '{a}',
  '(a,b,c)',
  '[a,b,c]',
  '[a,b,c] + (a,b]',
  'a,b,c',
  'a,b',
  'x=y',
  'x=y=z',
  'x>y',
  ['x>=y', 'x≥y'],
  'x>y>z',
  ['x>y>=z', 'x>y≥z'],
  ['x>=y>z', 'x≥y>z'],
  ['x>=y>=z', 'x≥y≥z'],
  'x<y',
  ['x<=y', 'x≤y'],
  'x<y<z',
  ['x<y<=z', 'x<y≤z'],
  ['x<=y<z','x≤y<z'],
  ['x<=y<=z','x≤y≤z'],
  ['A union B', 'A ∪ B'],
  ['A intersect B', 'A ∩ B'],
  'C = A ∩ B',
  ['A=1 & B=2', '(A=1) and (B=2)'],
  'A or B',
  '(A and B) or C',
  'A and (B or C)',
  'not(A and B)',
  '(A and B) < C',
  '(not A) = B',
  '(A and B) > (C and D) > (E and F)',
  '(A and B) + (C and D)',
  '(A and B) ∪ (C and D)',
  '(A and B) ∩ (C and D)',
  ['x/y/z/w', '((x/y)/z)/w'],
  ['x(x-1)/z', '(x(x-1))/z'],
  ['A && B or C', '(A and B) or C'],
  ['A or B & C', 'A or (B and C)'],
  ['!A or B', '(not A) or B'],
  ['A=1 or B=x/y', '(A=1) or (B=x/y)'],
  ['x elementof (a,b)', 'x ∈ (a,b)'],
  ['x notelementof (a,b)', 'x ∉ (a,b)'],
  ['(a,b) containselement x', '(a,b) ∋ x'],
  ['(a,b) notcontainselement x', '(a,b) ∌ x'],
  ['(a,b) subset (c,d)', '(a,b) ⊂ (c,d)'],
  ['(a,b) notsubset (c,d)', '(a,b) ⊄ (c,d)'],
  ['(a,b) superset (c,d)', '(a,b) ⊃ (c,d)'],
  ['(a,b) notsuperset (c,d)', '(a,b) ⊅ (c,d)'],
];


inputs.forEach(function(input) {
  test(input, function () {
    if(Array.isArray(input))
      expect(round_trip(input[0]).replace(/ /g,'')).toEqual(input[1].replace(/ /g,''));
    else
      expect(round_trip(input).replace(/ /g,'')).toEqual(input.replace(/ /g,''));
  });

});


// Additional round trips to ast should not alter the strings at all
inputs.forEach(function(input) {
  test(input, function () {
    if(Array.isArray(input))
      expect(round_trip(round_trip(input[0]))).toEqual(round_trip(input[0]));
    else
      expect(round_trip(round_trip(input))).toEqual(round_trip(input));
  });

});

