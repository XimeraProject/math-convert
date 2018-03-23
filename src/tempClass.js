

// var myGlobal = 0;
//
// function otherfunc(){
//   return myGlobal;
// }
//
// var myDefaultStart = 1000;
// function exportme({ start=myDefaultStart, end=5, step=2 } = {}) {
//   myGlobal = start;
//
//   return otherfunc();
// }
//

const allowSimplifiedFunctionApplication = true;
const myDefaultStart = true;

class x {
  constructor({ allowSimplifiedFunctionApplication2=allowSimplifiedFunctionApplication, end=5, step=2 } = {}){
    this.myparam = allowSimplifiedFunctionApplication2 ;
  }

 textToAst(text){
    return this.myparam+'--'+text;
  }
}

var defobj = new x();
// console.log(defobj.textToAst('x+y'));
console.log(defobj.textToAst('x+1'));
// var obj = new x({start:5});
// console.log(obj.textToAst('x+y'));
// console.log(obj.textToAst('x'));

// function exportme({ start=myDefaultStart, end=5, step=2 } = {}){


//   return obj.otherfunc();
// }

// exportme({start:5});


// export default exportme;
