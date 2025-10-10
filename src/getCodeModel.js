import parseExpression from './grammar/parser';
const queryState = require('query-state');

var qs = queryState({
  code: getInitialCode()
}, {
  useSearch: true
});

// Create a Parser object from our grammar.
let standardCollection = [
`// Dragon
axiom: X
rules: 
 X => X+YF+
 Y => -FX-Y

depth: 10
angle: 90`,

`// William McWorters: Terdragon
axiom: F
rules: 
 F => F+F-F

depth: 8
angle: 120`,

`// William McWorters: Pentl
axiom: F-F-F-F-F
rules: 
  F => cF-F-F++dF+F-F 

depth: 4
angle: 72
actions:
  c => setColor("mediumpurple")
  d => setColor("violet") `,

`// William McWorters: Pentant
axiom: X-X-X-X-X
rules: 
  F => 
  X => dFX-FX-FX+FY+FY+FX-FX
  Y => cFY+FY-FX-FX-FY+FY+FY

depth: 3
angle: 72
actions:
  c => setColor("goldenrod")
  d => setColor("gold") `,

`// William McWorter: Sierπnski Carpet 
axiom: F
rules: 
 F => cF+F-F-F-f+dF+F+F-F
 f => fff

angle: 90
depth: 4
actions:
  c => setColor("goldenrod")
  d => setColor("gold") `,

`// Hexagonal Gosper
axiom: X
rules:
 X => X+YF++YF-FX--FXFX-YF+
 Y => -FX+YFYF++YF+FX--FX-Y 

angle: 60`,

`// Peano curve
axiom: X
rules: 
 X => XFYFX-F-YFXFY+F+XFYFX
 Y => YFXFY+F+XFYFX-F-YFXFY

depth:4
angle: 90`,

`// Gary Teachout: Pean-c
axiom: FX
rules:
 F => 
 X =>  FX-FY-FX+FY+FX+FY+FX+FY+FX-FY-FX-FY-FX-FY-FX+FY+FX
 Y => FY

depth: 3
angle: 45`,

`// Square Sierpinski
axiom: F+XF+F+XF
rules: 
 X => XF-F+F-XF+F+XF-F+F-X

depth: 4
angle: 90 `,

`// Tree
axiom: X
rules: 
 F => FF
 X => F-[[X]+X]+F[+FX]-X

direction: [0, 1, 0]
angle: 22.5`,
`// Tree (color)
axiom: X
rules: 
 F => FF
 X => F-[[X]+X]+cF[+dFX]-X

color:brown
direction: [0, 1, 0]
angle: 22.5a
actions:
  c => setColor('green')
  d => setColor('lightgreen')`,

`// P. Bourke: Bush
axiom: Y
rules: 
  X => X[-FFF]c[+FFF]FX
  Y => dYFXe[+Y][-Y]

color: brown
direction: [0, 1, 0]
angle: 22.5
actions:
  c => setColor('green')
  d => setColor('lime')
  e => setColor('brown')`,

` // P. Bourke: Grains
axiom: Y
rules: 
  X => dX[-F+FF]cg[+F-FF]dFX
  Y => eYFX[+Y][-Y]

depth:5
direction: [0, 1, 0]
angle: 27
actions:
  c => setColor('green')
  d => setColor('lime')
  e => setColor('lightgreen')
  g => rotate(0.3)`,

` // P. Bourke: Grains 2
axiom: Y
rules: 
  X => cX[-FF-F]g[+FF+F]dFX
  Y => eYFX[+Y][-Y]XFY

depth:4
direction: [0, 1, 0]
angle: 27
actions:
  c => setColor('green')
  d => setColor('lime')
  e => setColor('gold')
  g => rotate(0.2)`,

`// P. Bourke: Bush
axiom: F
rules: 
  F => FF+[c+F-F-F]-[-F+F+dF]

color: green
direction: [0, 1, 0]
angle: 21
depth:4
actions:
  c => setColor('green')
  d => setColor('lime')`,

`// P. Bourke: Pentaplexy
axiom: F++F++F++F++F
rules: 
  F => cF++F++F+++++dF-F++F

depth:3
angle: 36
actions:
  c => setColor('mediumpurple')
  d => setColor('violet')`,

`// Poetasters Shrub
axiom: F
rules: 
 F => Fe[+cFF]Fd[-FF]cF

color:brown
direction: [0, 1, 0]
angle: 322
depth: 4
actions:
  c => setColor('green')
  d => setColor('lightgreen')
  e => setColor('brown')`,

`// Poetasters Weed
axiom: F
rules:
  F -> F-[XY]+[XY]F+[XY]-[XY]
  X -> +dFY
  Y -> -cFX

color: brown
direction: [0, 1, 0.5]
angle: 22.5
depth:5
actions:
  c => setColor('green')
  d => setColor('lime')`,

`// Unlikely Bush
axiom: F
rules: 
  F => eF[+cFF][-FF]cF[-F]d[+F]F

color: brown
direction: [0, 1, 0]
angle: 330
depth:3
actions:
  c => setColor('green')
  d => setColor('lime')
  e => setColor('brown')`,

`// Weed
axiom: F
rules:
  F -> FF-[XY]+[XY]
  X -> +cFY
  Y -> -dFX

color: brown
direction: [0, 1, 1]
angle: 22.5
actions:
  c => setColor('green')
  d => setColor('lime')`,

`// Saupe
axiom: VZFFF
rules:
  V -> [+++W][---W]YV
  W -> +X[-W]Z
  X -> -W[+X]Z
  Y -> YZ
  Z -> [-FcFF][+FdFF]F

color: green
depth:8
direction: [0, 1, 0]
angle: 20
actions:
  c => setColor('lightgreen')
  d => setColor('lime')`,

`// Poetaster's curly
axiom: F+F-F+F
rules: 
  F => eF-F-F++[cF+F-dF[GGG]][GGG]
  G => c--g--g--g--g--g--g--g

depth: 3
angle: 17
width:2
direction: [-0.5,0.7,-0.5]
actions:
  c => setColor("palegreen")
  d => setColor("violet") 
  e => setColor("green")
  g => draw(2)`,

`// Aquatic Plant
axiom: F
rules:
  F -> FFc[-F++F]d[+F--F]e++F--F

color: brown
direction: [0, 1, 0.5]
angle: 27
depth:4
actions:
  c => setColor('green')
  d => setColor('lime')
  e => setColor('goldenrod')`,

`// Aquatic Plant 2
axiom: F
rules:
  F => FMNOMBxPNMyO
  M => e[-F++F++]
  N => d[+F--F--]
  O => c++F--F
  P => d--F++F

color: brown
direction: [0, 1, -1]
angle: 27
depth:5
actions:
  c => setColor('green')
  d => setColor('lime')
  e => setColor('goldenrod')
  x => rotateX(2)
  y => rotateY(-3)`,

`// Poetasters Aquatic Plant
axiom: F
rules:
  F -> FMNxQRyQR[O-O-O-O-0]
  M => d[++FF+FF+]
  N => d[--FF-FF-]
  O => e[F-F-F++dF+F-F]
  Q => c++F--F
  R => c--F++F

color: brown
direction: [0, 1, -1]
angle: 17
depth:4
actions:
  c => setColor('green')
  d => setColor('lime')
  e => setColor('goldenrod')
  x => rotateX(2)
  y => rotateY(-1.5)`,

`// Poetasters Sallow Thorn
axiom: F
rules:
  F -> FMNxQRyQROP
  M => d[++FF+FF+]
  N => d[--FF-FF-]
  O => e[-F++F++]
  P => e[+F--F--]
  Q => c++F--F
  R => c--F++F

color: brown
direction: [0.5, 1, -1]
angle: 27
depth:5
actions:
  c => setColor('green')
  d => setColor('lime')
  e => setColor('goldenrod')
  x => rotateX(2)
  y => rotateY(-1.5)`,

`// Pean-c Flower
axiom: FXhFXiFX
rules:
 F => 
 X =>  [FX-FY][-cFX-FY-FX][ZZ]-dFY-FX+FY+FX
 Y => FY
 Z => -cFX-FY-FX

color: green
depth: 3
angle: 340
width: 2
direction: [1,1,1]
actions:
  c => setColor("violet")
  d => setColor("lime")
  h => rotate(5)
  i => rotate(-3)`,

`// Poetasters Succulent 1
axiom: A
rules:
 A =>[FL]gAhg[FLA]
 F => cSF 
 S => dFL
 L => c[F+F+F]fe[F-F-F]

color:green
direction: [0, 1, 0.5]
width: 4
angle: 17
depth: 7
actions:
  c => setColor('green')
  d => setColor('lime')
  e => setColor('lightgreen')
  g => rotate(4.5)
  h => rotate(-3)`,

`// Pyramids
axiom: F++F++F+++F--F--F
rules: 
  F =>  cFF++F++F++dFFF

color: gold
angle: 60
depth:3
actions:
  c => setColor('gold')
  d => setColor('goldenrod')`,

`// Hilbert Curve
axiom: X
rules: 
 X => -YF+XFX+FY-
 Y => +XF-YFY-FX+

angle: 90`,

`// Levey Curve
axiom: F++F++F++F
rules: 
  F => -dF++cF-
angle: 45
depth: 12
actions:
  c => setColor("goldenrod")
  d => setColor("gold")`,

`// Blocks
axiom: F+F+F+F
rules: 
 F => F-f+FF-FF-FF-FFf-FFFF
 f => ffffff

angle: 90
depth: 3 `,

`// Aztec Blocks
axiom: F-F-F-F
rules: 
 F => F-cf+FF-F-FF-Ff-FF+df-FF+F+FF+Ff+FFF
 f => ffffff

angle: 90
depth: 2
actions:
  c => setColor("goldenrod")
  d => setColor("gold")`,

`// Color Mosaic
axiom: F+F+F+F
rules: 
  F => dFF+F+cF+F+FF

color: green
depth: 3
angle: 90
actions:
  c => setColor('lime')
  d => setColor('green')`,

`// 3 Blocks
axiom: F^^F^^F
rules: 
 F => F-fff^F^^F^^F&&fff-FFF
 f => fff

depth: 3
actions:
 - => rotate(-90)
 ^ => rotate(60)
 & => rotate(-60) `,
`// Leaf
axiom: Y---Y
rules: 
 X => F-FF-F--[--X]F-FF-F--F-FF-F--
 Y => f-F+X+F-fY

depth: 8
angle: 60`, `// Esum
axiom: X+X+X+X+X+X+X+X
rules: 
 X => [F[-X++Y]]
 Y => [F[-Y--X]]
 F => F

depth: 6
angle: -45`,
`// Penrose tiling
axiom: [N]++[N]++[N]++[N]++[N]
rules: 
  M => OF++PF----NF[-OF----MF]++
  N => +OF--PF[---MF--NF]+
  O => -MF++NF[+++OF++PF]-
  P => --OF++++MF[+PF++++NF]--NF
  F => 

depth: 4
angle: 36
`,
`// L-System Leaf
axiom: a
rules: 
 F => >F<
 a => F[+x]Fb
 b => F[-y]Fa
 x => a
 y => b

depth: 4
angle: 45`,

`// L-System Bushes 1
axiom: Y
rules: 
 X => X[-FFF][+FFF]FX
 Y => YFX[+Y][-Y]

depth: 4
angle: 25.7`,

`// L-System Bushes 2
axiom: F
rules: 
 F => FF+[+F-F-F]-[-F+F+F]

depth: 4
angle: 22.5`,

`// L-System Bushes 3
axiom: F
rules: 
 F => F[+FF][-FF]F[-F][+F]F

depth: 4
angle: 35`,

`// L-System Bushes (Saupe)
axiom: VZFFF
rules: 
 V => [+++W][---W]YV
 W => +X[-W]Z
 X => -W[+X]Z
 Y => YZ
 Z => [-FFF][+FFF]F

depth: 4
angle: 20`,

`// L-System Bushes (angle-scaled)
axiom: FX
rules: 
 X => >[-FX]+FX

depth: 4
angle: 40`,

`// L-System Sticks
axiom: X
rules: 
 F => FF
 X => F[+X]F[-X]+X

depth: 4
angle: 20`,

`// L-System Algae 1
axiom: aF
rules: 
 a => FFFFFv[+++h][---q]fb
 b => FFFFFv[+++h][---q]fc
 c => FFFFFv[+++fa]fd
 d => FFFFFv[+++h][---q]fe
 e => FFFFFv[+++h][---q]fg
 g => FFFFFv[---fa]fa
 h => ifFF
 i => fFFF[--m]j
 j => fFFF[--n]k
 k => fFFF[--o]l
 l => fFFF[--p]
 m => fFn
 n => fFo
 o => fFp
 p => fF
 q => rfF
 r => fFFF[++m]s
 s => fFFF[++n]t
 t => fFFF[++o]u
 u => fFFF[++p]
 v => Fv

depth: 4
angle: 12`,

`// L-System Algae 2
axiom: aF
rules: 
 a => FFFFFy[++++n][----t]fb
 b => +FFFFFy[++++n][----t]fc
 c => FFFFFy[++++n][----t]fd
 d => -FFFFFy[++++n][----t]fe
 e => FFFFFy[++++n][----t]fg
 g => FFFFFy[+++fa]fh
 h => FFFFFy[++++n][----t]fi
 i => +FFFFFy[++++n][----t]fj
 j => FFFFFy[++++n][----t]fk
 k => -FFFFFy[++++n][----t]fl
 l => FFFFFy[++++n][----t]fm
 m => FFFFFy[---fa]fa
 n => ofFFF
 o => fFFFp
 p => fFFF[-s]q
 q => fFFF[-s]r
 r => fFFF[-s]
 s => fFfF
 t => ufFFF
 u => fFFFv
 v => fFFF[+s]w
 w => fFFF[+s]x
 x => fFFF[+s]
 y => Fy

depth: 4
angle: 12`,

`// L-System Weed
axiom: F
rules: 
 F => FF-[XY]+[XY]
 X => +FY
 Y => -FX

depth: 4
angle: 22.5`,

`// Triangle
axiom: F+F+F
rules: 
 F => F-F+F

depth: 4
angle: 120`,

`// Quadratic Gosper
axiom: -YF
rules: 
 X => XFX-YF-YF+FX+FX-YF-YFFX+YF+FXFXYF-FX+YF+FXFX+YF-FXYF-YF-FX+FX+YFYF-
 Y => +FXFX-YF-YF+FX+FXYF+FX-YFYF-FX-YF+FXYFYF-FX-YFFX+FX+YF-YF-FX+FX+YFY

depth: 4
angle: 90`,

`// Square Sierpinski
axiom: F+XF+F+XF
rules: 
 X => XF-F+F-XF+F+XF-F+F-X

depth: 4
angle: 90`,

`// Crystal
axiom: F+F+F+F
rules: 
 F => FF+F++F+F

depth: 4
angle: 90`,

`// Peano Curve
axiom: X
rules: 
 X => XFYFX+F+YFXFY-F-XFYFX
 Y => YFXFY-F-XFYFX+F+YFXFY

depth: 4
angle: 90`,

`// Quadratic Snowflake
axiom: F
rules: 
 F => F-F+F+F-F

depth: 4
angle: 90`,

`// Quadratic Snowflake
axiom: FF+FF+FF+FF
rules: 
 F => F+F-F-F+F

depth: 4
angle: 90`,

`// Quadratic Koch Island 1
axiom: F+F+F+F
rules: 
 F => F+F-F-FFF+F+F-F

depth: 4
angle: 90`,

`// Quadratic Koch Island 2
axiom: F+F+F+F
rules: 
 F => F-FF+FF+F+F-F-FF+F+F-F-FF-FF+F

depth: 4
angle: 90`,

`// Quadratic Koch Island (Hasan Hosam variation)
axiom: X+X+X+X+X+X+X+X
rules: 
 X => X+YF++YF-FX--FXFX-YF+X
 Y => -FX+YFYF++YF+FX--FX-YF

depth: 4
angle: 45`,

`// Koch Curve
axiom: F+F+F+F
rules: 
 F => F+F-F-FF+F+F-F

depth: 4
angle: 90`,

`// Board
axiom: F+F+F+F
rules: 
 F => FF+F+F+F+FF

depth: 4
angle: 90`,

`// Hilbert
axiom: X
rules: 
 X => -YF+XFX+FY-
 Y => +XF-YFY-FX+

depth: 4
angle: 90`,

`// Sierpinski Arrowhead
axiom: YF
rules: 
 X => YF+XF+Y
 Y => XF-YF-X

depth: 4
angle: 60`,

`// Von Koch Snowflake
axiom: F++F++F
rules: 
 F => F-F++F-F

depth: 4
angle: 60`,

`// Cross
axiom: F+F+F+F
rules: 
 F => F+FF++F+F

depth: 4
angle: 90`,

`// Cross 2
axiom: F+F+F+F
rules: 
 F => F+F-F+F+F

depth: 4
angle: 90`,

`// Pentaplexity
axiom: F++F++F++F++F
rules: 
 F => F++F++F|F-F++F

depth: 4
angle: 36`,

`// Tiles
axiom: F+F+F+F
rules: 
 F => FF+F-F+F+FF

depth: 4
angle: 90`,

`// Rings
axiom: F+F+F+F
rules: 
 F => FF+F+F+F+F+F-F

depth: 4
angle: 90`,

`// Dragon Curve
axiom: FX
rules: 
 X => X+YF+
 Y => -FX-Y

depth: 4
angle: 90`,

`// Hexagonal Gosper
axiom: XF
rules: 
 X => X+YF++YF-FX--FXFX-YF+
 Y => -FX+YFYF++YF+FX--FX-Y

depth: 4
angle: 60`,

`// Lévy curve
axiom: F
rules: 
 F => -F++F-

depth: 4
angle: 45`,

`// Classic Sierpinski Curve
axiom: F--XF--F--XF
rules: 
 X => XF+F+XF--F--XF+F+X

depth: 4
angle: 45`,

`// Krishna Anklets
axiom: -X--X
rules: 
 X => XFX--XFX

depth: 4
angle: 45`,

`// Mango Leaf
axiom: Y---Y
rules: 
 X => {F-F}{F-F}--[--X]{F-F}{F-F}--{F-F}{F-F}--
 Y => f-F+X+F-fY

depth: 4
angle: 60`,

`// Snake Kolam
axiom: F+XF+F+XF
rules: 
 X => X{F-F-F}+XF+F+X{F-F-F}+X

depth: 4
angle: 90`,

`// Kolam
axiom: (-D--D)
rules: 
 A => F++FFFF--F--FFFF++F++FFFF--F
 B => F--FFFF++F++FFFF--F--FFFF++F
 C => BFA--BFA
 D => CFC--CFC

depth: 4
angle: 45`,

  ]

export default function getCodeModel(scene) {
  let model = {
    setCode,
    error: null,
    randomize,
    trueRandomize,
    getExamples,
    loadExample,
    code: qs.get('code')
  }
  let lastPickedIndex = -1;

  setCode(model.code);

  return model;

  function randomize() {
    let index;
    do { index = pickRandomIndex(standardCollection) } while (index === lastPickedIndex);
    lastPickedIndex = index;
    let code = standardCollection[lastPickedIndex];
    setCode(code);
    model.ignoreNextUpdate = true;
    model.code = code;
    return lastPickedIndex;
  }

  function trueRandomize() {
    let length = Math.floor(Math.random() * 5) + 5; // 5-9 characters
    let system = getRandomSystem(length);
    let depth = Math.floor(Math.random() * 4) + 4; // depth 4-7

    // Generate random color scheme
    let colors = getRandomColors();
    let useColors = true;

    let code = `axiom: X
rules:
  X => ${system.X}
  Y => ${system.Y}

depth: ${depth}
angle: ${system.angle}`;

    if (useColors && colors.length > 0) {
      code += '\nactions:';
      colors.forEach((color, index) => {
        let actionChar = String.fromCharCode(99 + index); // c, d, e, f, g...
        code += `\n  ${actionChar} => setColor('${color}')`;
      });
    }

    setCode(code);
    model.ignoreNextUpdate = true;
    model.code = code;
  }

  function getExamples() {
    return standardCollection.map((code, index) => {
      // Extract name from comment at the beginning
      let match = code.match(/\/\/\s*(.+)/);
      let name = match ? match[1].trim() : `Example ${index + 1}`;
      return { name, code, index };
    });
  }

  function loadExample(index) {
    if (index >= 0 && index < standardCollection.length) {
      lastPickedIndex = index;
      let code = standardCollection[index];
      setCode(code);
      model.ignoreNextUpdate = true;
      model.code = code;
    }
  }

  function setCode(newCode) {
    newCode = newCode.trim();
    if (!newCode) {
      model.error = 'Enter a system description above'
      return;
    }
    try {
      let system = parseExpression(newCode);
      if (system) {
        // TODO: I messed up with grammar, and seems like string value takes precedence over
        // axiom clause. A little hack here to put them back on the same page until better fix:
        if (system.axiom) system.start = system.axiom;
        scene.setSystem(system);
        if (scene.isComplete()) {
          model.error = null;
        } else {
          model.error = 'The system limit reached.\nRendering first 1,000,000 characters'
        }
        qs.set('code', newCode);
      } else {
        model.error = 'Could not parse the input string';
      }
    } catch (e) {
      model.error = e.message;
    }
  }
}

function getInitialCode() {
  // todo: query state?
  return `axiom: X
rules:
  X => -YF+XFX+FY-
  Y => +XF-YFY-FX+

depth: 5
stepsPerFrame: 10
width: 2

actions:
  - => rotate(-90)
  + => rotate(90)
  F => draw()
`
}


function getRandomSystem(length) {
  let states = 'FXY';
  let colorChars = 'cdefg'; // Color action characters

  let res = [];
  let lastCh = '';
  while (res.length < length) {
    let ch = pickChar();
    if (ch === '+' && lastCh === '-') ch = '-'
    else if (ch === '-' && lastCh === '+') ch = '+';
    else if (ch === 'F' && lastCh === 'F') ch = Math.random() < 0.5 ? 'X': 'Y';
    res.push(ch);
    lastCh = ch;
  }

  for (let ch of 'FXY') {
    if (res.indexOf(ch) < 0) {
      res[Math.floor(Math.random() * res.length)] = ch;
    }
  }

  let X = res.join('');
  let Y = res.reverse().map( x => {
    if (x === '+') return '-';
    if (x === '-') return '+';
    if (x === 'Y') return 'X';
    if (x === 'X') return 'Y';
    // Keep color characters the same in Y
    return x;
  } ).join('')

  let angle = Math.random() < 0.5 ? 60 : 90;
  if (angle === 90 && ( X.match(/(\+\+|\+-|--)/) || Y.match(/(\+\+|\+-|--)/))) angle = 45;
  return {X, Y, angle}

  function pickChar() {
    let r = Math.random();
    if (r < 0.78) {
      r = Math.random();
      return states[Math.floor(states.length * r)]
    } else if (r < 0.89) {
      return '+';
    } else if (r < 0.95) {
      return '-';
    } else {
      return Math.random() < 0.5 ? '+' : '-';
    }
  }
}

function getRandomColors() {
  const colorPalettes = [
    // Nature greens
    ['green', 'lime', 'lightgreen', 'darkgreen'],
    // Autumn
    ['goldenrod', 'gold', 'orange', 'brown'],
    // Purples
    ['mediumpurple', 'violet', 'purple', 'orchid'],
    // Blues
    ['dodgerblue', 'skyblue', 'steelblue', 'navy'],
    // Warm
    ['coral', 'salmon', 'tomato', 'crimson'],
    // Cool
    ['cyan', 'turquoise', 'teal', 'aquamarine'],
    // Mixed vibrant
    ['red', 'blue', 'green', 'yellow'],
    // Pastels
    ['lightcoral', 'lightblue', 'lightgreen', 'lightyellow'],
    // Earth tones
    ['sienna', 'peru', 'chocolate', 'saddlebrown'],
    // Pink/Red
    ['hotpink', 'deeppink', 'pink', 'lightpink']
  ];

  let palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
  let numColors = Math.floor(Math.random() * 3) + 2; // 2-4 colors

  return palette.slice(0, numColors);
}

function pickRandomIndex(arr) {
  return Math.floor(Math.random() * arr.length);
}
