import textToAst from '../src/text-to-ast';
import { ParseError } from '../src/error';

var converter = new textToAst();

var trees = {
  '1+x+3': ['+',1,'x',3],
  "1 + - x": ['+',1,['-','x']],
  "1 - x": ['+',1,['-','x']],
  "1 - - x": ['+',1,['-',['-','x']]],
  "1 + x/2": ['+',1,['/','x',2]],
  '1-x-3': ['+',1,['-','x'],['-',3]],
  'x^2': ['^', 'x', 2],
  '-x^2': ['-',['^', 'x', 2]],
  '-3^2': ['-',['^', 3, 2]],
  'x^47': ['^', 'x', 47],
  'x^ab': ['*', ['^', 'x', 'a'], 'b'],
  'x^a!':  ['^', 'x', ['apply', 'factorial', 'a']],
  'x*y*z': ['*','x','y','z'],
  'xyz': ['*','x','y','z'],
  'xyz2': 'xyz2',
  'in': ['*', 'i', 'n'],
  'ni': ['*', 'n', 'i'],
  'x*y*z*w': ['*','x','y','z','w'],
  'xyzw': ['*','x', 'y', 'z', 'w'],
  '(x*y)*(z*w)': ['*','x','y','z','w'],
  'c*(a+b)': ['*', 'c', ['+', 'a', 'b']],
  '(a+b)*c': ['*', ['+', 'a', 'b'], 'c'],
  '|x|': ['apply', 'abs','x'],
  'a!': ['apply', 'factorial','a'],
  'theta': 'theta',
  'cos(theta)': ['apply', 'cos','theta'],
  'x!': ['apply', 'factorial','x'],
  '|sin(|x|)|': ['apply', 'abs', ['apply', 'sin', ['apply', 'abs', 'x']]],
  'sin(θ)': ['apply', 'sin', 'theta'],
  '|x+3=2|': ['apply', 'abs', ['=', ['+', 'x', 3], 2]],
  'x_y_z': ['_', 'x', ['_','y','z']],
  'x_(y_z)': ['_', 'x', ['_','y','z']],
  '(x_y)_z': ['_', ['_', 'x', 'y'],'z'],
  'x^y^z': ['^', 'x', ['^','y','z']],
  'x^(y^z)': ['^', 'x', ['^','y','z']],
  '(x^y)^z': ['^', ['^', 'x', 'y'],'z'],
  'x^y_z': ['^', 'x', ['_','y','z']],
  'x_y^z': ['^', ['_','x','y'],'z'],
  'xyz!': ['*','x','y', ['apply', 'factorial', 'z']],
  'x': 'x',
  'f': 'f',
  'fg': ['*', 'f','g'],
  'f+g': ['+', 'f', 'g'],
  'f(x)': ['apply', 'f', 'x'],
  'f(x,y,z)': ['apply', 'f', ['tuple', 'x', 'y', 'z']],
  'fg(x)': ['*', 'f', ['apply', 'g', 'x']],
  'fp(x)': ['*', 'f', 'p', 'x'],
  'fx': ['*', 'f', 'x'],
  'f\'': ['prime', 'f'],
  'fg\'': ['*', 'f', ['prime', 'g']],
  'f\'g': ['*', ['prime', 'f'], 'g'],
  'f\'g\'\'': ['*', ['prime', 'f'], ['prime', ['prime', 'g']]],
  'x\'': ['prime', 'x'],
  'f\'(x)' : ['apply', ['prime', 'f'], 'x'],
  'f(x)\'' : ['prime', ['apply', 'f', 'x']],
  'sin(x)\'': ['prime', ['apply', 'sin', 'x']],
  'sin\'(x)': ['apply', ['prime', 'sin'], 'x'],
  'f\'\'(x)': ['apply', ['prime', ['prime', 'f']],'x'],
  'sin(x)\'\'': ['prime', ['prime', ['apply','sin','x']]],
  'f(x)^t_y': ['^', ['apply', 'f','x'], ['_','t','y']],
  'f_t(x)': ['apply', ['_', 'f', 't'], 'x'],
  'f(x)_t': ['_', ['apply', 'f', 'x'], 't'],
  'f^2(x)': ['apply', ['^', 'f', 2], 'x'],
  'f(x)^2': ['^', ['apply', 'f', 'x'],2],
  'f\'^a(x)': ['apply', ['^', ['prime', 'f'], 'a'], 'x'],
  'f^a\'(x)': ['apply', ['^', 'f', ['prime', 'a']], 'x'],
  'f_a^b\'(x)': ['apply', ['^', ['_', 'f', 'a'], ['prime', 'b']],'x'],
  'f_a\'^b(x)': ['apply', ['^', ['prime', ['_', 'f','a']],'b'],'x'],
  'sin x': ['apply', 'sin', 'x'],
  'f x': ['*', 'f', 'x'],
  'sin^xyz': ['*', ['apply', ['^', 'sin', 'x'], 'y'], 'z'],
  'sin xy': ['*', ['apply', 'sin', 'x'], 'y'],
  'sin^2(x)': ['apply', ['^', 'sin', 2], 'x'],
  'x^2!': ['^', 'x', ['apply', 'factorial', 2]],
  'x^2!!': ['^', 'x', ['apply', 'factorial', ['apply', 'factorial', 2]]],
  'x_t^2': ['^', ['_', 'x', 't'], 2],
  'x_f^2': ['_', 'x', ['^', 'f', 2]],
  'x_t\'': ['prime', ['_', 'x', 't']],
  'x_f\'': ['_', 'x', ['prime', 'f']],
  '(x,y,z)': ['tuple', 'x', 'y', 'z'],
  '(x,y)-[x,y]': ['+', ['tuple','x','y'], ['-', ['array','x','y']]],
  '2[z-(x+1)]': ['*', 2, ['+', 'z', ['-', ['+', 'x', 1]]]],
  '{1,2,x}': ['set', 1, 2, 'x'],
  '{x, x}': ['set', 'x', 'x'],
  '{x}': ['set', 'x'],
  '(1,2]': ['interval', ['tuple', 1, 2], ['tuple', false, true]],
  '[1,2)': ['interval', ['tuple', 1, 2], ['tuple', true, false]],
  '[1,2]': ['array', 1, 2 ],
  '(1,2)': ['tuple', 1, 2 ],
  '1,2,3': ['list', 1, 2, 3],
  'x=a': ['=', 'x', 'a'],
  'x=y=1': ['=', 'x', 'y', 1],
  'x=(y=1)': ['=', 'x', ['=', 'y', 1]],
  '(x=y)=1': ['=', ['=','x', 'y'], 1],
  '7 != 2': ['ne', 7, 2],
  '7 ≠ 2': ['ne', 7, 2],
  'not x=y': ['not', ['=', 'x', 'y']],
  '!x=y': ['not', ['=', 'x', 'y']],
  '!(x=y)': ['not', ['=', 'x', 'y']],
  'x>y': ['>', 'x','y'],
  'x>=y': ['ge', 'x','y'],
  'x≥y': ['ge', 'x','y'],
  'x>y>z': ['gts', ['tuple', 'x', 'y','z'], ['tuple', true, true]],
  'x>y>=z': ['gts', ['tuple', 'x', 'y','z'], ['tuple', true, false]],
  'x>=y>z': ['gts', ['tuple', 'x', 'y','z'], ['tuple', false, true]],
  'x>=y>=z': ['gts', ['tuple', 'x', 'y','z'], ['tuple', false, false]],
  'x<y': ['<', 'x','y'],
  'x<=y': ['le', 'x','y'],
  'x≤y': ['le', 'x','y'],
  'x<y<z': ['lts', ['tuple', 'x', 'y','z'], ['tuple', true, true]],
  'x<y<=z': ['lts', ['tuple', 'x', 'y','z'], ['tuple', true, false]],
  'x<=y<z': ['lts', ['tuple', 'x', 'y', 'z'], ['tuple', false, true]],
  'x<=y<=z': ['lts', ['tuple', 'x', 'y', 'z'], ['tuple', false, false]],
  'x<y>z': ['>', ['<', 'x', 'y'], 'z'],
  'A subset B': ['subset', 'A', 'B'],
  'A ⊂ B': ['subset', 'A', 'B'],
  'A notsubset B': ['notsubset', 'A', 'B'],
  'A ⊄ B': ['notsubset', 'A', 'B'],
  'A superset B': ['superset', 'A', 'B'],
  'A ⊃ B': ['superset', 'A', 'B'],
  'A notsuperset B': ['notsuperset', 'A', 'B'],
  'A ⊅ B': ['notsuperset', 'A', 'B'],
  'x elementof A': ['in', 'x', 'A'],
  'x ∈ A': ['in', 'x', 'A'],
  'x notelementof A': ['notin', 'x', 'A'],
  'x ∉ A': ['notin', 'x', 'A'],
  'A containselement x': ['ni', 'A', 'x'],
  'A ∋ x': ['ni', 'A', 'x'],
  'A notcontainselement x': ['notni', 'A', 'x'],
  'A ∌ x': ['notni', 'A', 'x'],
  'A union B': ['union', 'A', 'B'],
  'A ∪ B': ['union', 'A', 'B'],
  'A intersect B': ['intersect', 'A', 'B'],
  'A ∩ B': ['intersect', 'A', 'B'],
  'A and B': ['and', 'A', 'B'],
  'A & B': ['and', 'A', 'B'],
  'A && B': ['and', 'A', 'B'],
  'A ∧ B': ['and', 'A', 'B'],
  'A or B': ['or', 'A', 'B'],
  'A ∨ B': ['or', 'A', 'B'],
  'A ∧ B ∧ C': ['and', 'A', 'B', 'C'],
  'A ∨ B ∨ C': ['or', 'A', 'B', 'C'],
  'A and B or C': ['or', ['and', 'A', 'B'], 'C'],
  'A or B and C': ['or', 'A', ['and', 'B', 'C']],
  '!x=1': ['not', ['=', 'x', 1]],
  '!(x=1)': ['not', ['=', 'x', 1]],
  '!(x=y) or z != w': ['or', ['not', ['=','x','y']], ['ne','z','w']],
  '1.2E3': 1200,
  '1.2E+3': 1200,
  '3.1E-3': 0.0031,
  '1.2e-3': ['+', ['*', 1.2, 'e'], ['-', 3]],
  '+2': 2,
  'oo': 'infinity',
  '+oo': 'infinity',
};

Object.keys(trees).forEach(function(string) {
  test("parses " + string, () => {
    expect(converter.convert(string)).toEqual(trees[string]);
  });

});


// inputs that should throw an error
var bad_inputs = {
  '1++1': "Invalid location of '+'",
  ')1++1': "Invalid location of ')'",
  '(1+1': "Expected )",
  'x-y-': "Unexpected end of input",
  '|x| |y|': "Invalid location of '|'",
  '_x': "Invalid location of _",
  'x_': "Unexpected end of input",
  'x@2': "Invalid symbol '@'",
  '|y/v': "Expected |",
  'x+^2': "Invalid location of ^",
  'x/\'y': "Invalid location of '",
  '[1,2,3)': "Expected ]",
  '(1,2,3]': "Expected )",
  '[x)': "Expected ]",
  '(x]': "Expected )",
  'sin': "Unexpected end of input",
  'sin+cos': "Invalid location of '+'",
  '\\cos(x)': "Invalid symbol '\\'",
}

Object.keys(bad_inputs).forEach(function(string) {
  test("throws " + string, function() {
    expect(() => {converter.convert(string)}).toThrow(bad_inputs[string]);
  });
});



test("split symbols", function () {
  
  let converter_default = new textToAst();
  let converter_split = new textToAst({splitSymbols: true});
  let converter_nosplit = new textToAst({splitSymbols: false});
  
  expect(converter_default.convert('xzy')).toEqual(['*', 'x', 'z', 'y']);
  expect(converter_split.convert('xzy')).toEqual(['*', 'x', 'z', 'y']);
  expect(converter_nosplit.convert('xzy')).toEqual('xzy');

});

test("unsplit symbols", function () {

  let converter = new textToAst({unsplitSymbols: []});
  expect(converter.convert('3pi')).toEqual(['*', 3, 'p', 'i']);

  converter = new textToAst({unsplitSymbols: ['pi']});
  expect(converter.convert('3pi')).toEqual(['*', 3, 'pi']);

});

test("function symbols", function () {

  let converter = new textToAst({functionSymbols: []});
  expect(converter.convert('f(x)+h(y)')).toEqual(
    ['+',['*', 'f', 'x'], ['*', 'h', 'y']]);
  
  converter = new textToAst({functionSymbols: ['f']});
  expect(converter.convert('f(x)+h(y)')).toEqual(
    ['+',['apply', 'f', 'x'], ['*', 'h', 'y']]);

  converter = new textToAst({functionSymbols: ['f', 'h']});
  expect(converter.convert('f(x)+h(y)')).toEqual(
    ['+',['apply', 'f', 'x'], ['apply', 'h', 'y']]);

  converter = new textToAst({functionSymbols: ['f', 'h', 'x']});
  expect(converter.convert('f(x)+h(y)')).toEqual(
    ['+',['apply', 'f', 'x'], ['apply', 'h', 'y']]);

});

test("applied function symbols", function () {

  let converter = new textToAst({appliedFunctionSymbols: []});
  expect(converter.convert('sin(x) + custom(y)')).toEqual(
    ['+', ['*', 's', 'i', 'n', 'x'], ['*', 'c', 'u', 's', 't', 'o', 'm', 'y']]);
  expect(converter.convert('sin x  + custom y')).toEqual(
    ['+', ['*', 's', 'i', 'n', 'x'], ['*', 'c', 'u', 's', 't', 'o', 'm', 'y']]);

  converter = new textToAst({appliedFunctionSymbols: ['custom']});
  expect(converter.convert('sin(x) + custom(y)')).toEqual(
    ['+', ['*', 's', 'i', 'n', 'x'], ['apply', 'custom', 'y']]);
  expect(converter.convert('sin x  + custom y')).toEqual(
    ['+', ['*', 's', 'i', 'n', 'x'], ['apply', 'custom', 'y']]);

  converter = new textToAst({appliedFunctionSymbols: ['custom', 'sin']});
  expect(converter.convert('sin(x) + custom(y)')).toEqual(
    ['+', ['apply', 'sin', 'x'], ['apply', 'custom', 'y']]);
  expect(converter.convert('sin x  + custom y')).toEqual(
    ['+', ['apply', 'sin', 'x'], ['apply', 'custom', 'y']]);

});

it("allow simplified function application", function () {
  let converter = new textToAst();
  expect(converter.convert('sin x')).toEqual(
    ['apply', 'sin', 'x']);

  converter = new textToAst({allowSimplifiedFunctionApplication: false});
  expect(() => {converter.convert('sin x')}).toThrow(
    "Expected ( after function");

  converter = new textToAst({allowSimplifiedFunctionApplication: true});
  expect(converter.convert('sin x')).toEqual(
    ['apply', 'sin', 'x']);

});
