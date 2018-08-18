Pragma = {
	Util: {
		Convert: function(v) {
			let praNumber = true, praInput = v;
			if (typeof v == "string") {
				praInput = praInput.trim();
				for(var i = 0; i < praInput.length; i++) {
					if (praInput.charCodeAt(i) < 48 || praInput.charCodeAt(i) > 57) {
						praNumber = false;
						break;
					}
				}
			}
			return (praNumber ? parseFloat(v) : praInput);
		}
	},
	Runner: {
		Pointer: 0,
		Error: function(error) {
			console.error(`A runner error has occured at position ${Pragma.Runner.Pointer}:\n${error}`);
		},
		Process: function(praBytecode) {
			let praTimer = new Date();
			while (Pragma.Runner.Pointer < praBytecode.length) {
				switch (praBytecode[Pragma.Runner.Pointer]) {
					case 0: { // push
						if (praBytecode[++Pragma.Runner.Pointer] == 2) {
							Pragma.Runner.Stack.push(Pragma.Runner.GetVariable(praBytecode[++Pragma.Runner.Pointer]));
						} else {
							Pragma.Runner.Stack.push(praBytecode[++Pragma.Runner.Pointer]);
						}
						break;
					}

					case 1: { // locl
						Pragma.Runner.Local[praBytecode[++Pragma.Runner.Pointer]] = Pragma.Runner.Stack.pop();
						break;
					}

					case 2: { // glob
						Pragma.Runner.Global[praBytecode[++Pragma.Runner.Pointer]] = Pragma.Runner.Stack.pop();
						break;
					}

					case 3: { // call
						let praFunction = praBytecode[++Pragma.Runner.Pointer], praArguments = [];
						for(let i = 0, _i = Pragma.Runner.Stack.pop(); i < _i; i++) {
							praArguments.push(Pragma.Runner.Stack.pop());
						}
						Pragma.Runner.Functions[praFunction](praArguments);
						break;
					}

					case 4: { // add
						Pragma.Runner.Stack.push(Pragma.Runner.Stack.pop() + Pragma.Runner.Stack.pop());
						break;
					}

					case 5: { // sub
						Pragma.Runner.Stack.push(Pragma.Runner.Stack.pop() - Pragma.Runner.Stack.pop());
						break;
					}

					case 6: { // div
						Pragma.Runner.Stack.push(Pragma.Runner.Stack.pop() / Pragma.Runner.Stack.pop());
						break;
					}

					case 7: { // mul
						Pragma.Runner.Stack.push(Pragma.Runner.Stack.pop() * Pragma.Runner.Stack.pop());
						break;
					}
				}
				Pragma.Runner.Pointer++;

				if (new Date().getTime() - praTimer > 1000) {
					console.error("Runner has timed out in 1000ms");
					break;
				}
			}
			console.log(`Bytecode was successfully ran in ${new Date().getTime() - praTimer}ms}`);
			console.log(Pragma.Runner.Local)
		},
		GetVariable: function(name) {
			for(var praVariable in Pragma.Runner.Local) {
				if (praVariable == name) {
					return Pragma.Runner.Local[praVariable];
				}
			}
			for(var praVariable in Pragma.Runner.Global) {
				if (praVariable == name) {
					return Pragma.Runner.Global[praVariable];
				}
			}
			Pragma.Runner.Error(`Unable to find variable with name: ${name}`);
		},
		Functions: {
			"print": function(argument) {
				console.log(argument[0]);
			}
		},
		Stack: [],
		Local: {},
		Global: {}
	},
	Runtime: {
		Locals: {
			List: {},
			Add: function(name, value) {
				if (name in Pragma.Compiler.Tokens == false) {
					Pragma.Runtime.Locals.List[name] = Pragma.Util.Convert(value);
				} else {
					Pragma.Compiler.Error(`Unable to define local variable with reserved name: ${name} (Pragma.Compiler.Tokens)`);
				}
			}	
		},
		Globals: {
			List: [],
			Add: function(name, value) {
				if (name in Pragma.Compiler.Tokens == false) {
					Pragma.Runtime.Globals.List.name = Pragma.Util.Convert(value);
				} else {
					Pragma.Compiler.Error(`Unable to define global variable with reserved name: ${name} (Pragma.Compiler.Tokens)`);
				}
			}	
		},
		Functions: {
			List: [],
			Add: function(name, arguments) {
				if (name in Pragma.Compiler.Tokens == false) {
					let praFunction = {Name: name, MinArguments: arguments.length, MaxArguments: arguments.length};
					arguments.forEach(function (e) {
						if (e.includes("=") == true) {
							praFunction.MinArguments--;
						}
					});
					Pragma.Runtime.Functions.List.push(praFunction);
				} else {
					Pragma.Compiler.Error(`Unable to define function with reserved name: ${name} (Pragma.Compiler.Tokens)`);
				}
			}	
		},
		Instructions: {
			Add: function(n, d=[]) {
				Pragma.Runtime.Bytecode.push(Pragma.Runtime.Instructions.Find(n));
				if (d.length > 0) {
					d.forEach(function (e) {
						Pragma.Runtime.Bytecode.push(Pragma.Util.Convert(e));
					});
				}
			},
			Find: function(n) {
				if (n in Pragma.Runtime.Instructions.List == false) {
					Pragma.Compiler.Warning(`Could not find unsupported instruction: ${n}`);
					return -1;
				}
				return Pragma.Runtime.Instructions.List[n];
			},
			List: {
				"push": 0,
				"locl": 1,
				"glob": 2,
				"call": 3,
				"add": 4,
				"sub": 5,
				"div": 6,
				"mul": 7
			}
		},
		Types: {
			Get: function(v) {
				let praInput = (typeof v == "string" ? v.trim() : v);
				if (typeof praInput == "string") {
					if (praInput[0] == "\"" && praInput[praInput.length - 1] == "\"") {
						return Pragma.Runtime.Types.Find("string")
					} else {
						for(var i = 0; i < praInput.length; i++) {
							if (praInput.charCodeAt(i) < 48 || praInput.charCodeAt(i) > 57) {
								return Pragma.Runtime.Types.Find("variable");
							}
						}
						return Pragma.Runtime.Types.Find("number");
					}
				}
				return Pragma.Runtime.Types.Find("number");
			},
			Find: function(n) {
				if (n in Pragma.Runtime.Types.List == false) {
					Pragma.Compiler.Warning(`Could not find unsupported type: ${n}`);
					return -1;
				}
				return Pragma.Runtime.Types.List[n];
			},
			List: {
				"number": 0,
				"string": 1,
				"variable": 2
			}
		},
		Bytecode: []
	},
	Compiler: {
		Input: "",
		Index: 0,
		Lines: [],
		Start: null,
		Continue: true,
		Error: function(error) {
			let praLine = -1;
			for(var i = 0; i < Pragma.Compiler.Lines.length; i++) {
				let praPosition = Pragma.Compiler.Lines[i];
				if (i < Pragma.Compiler.Lines.length - 1) {
					if (Pragma.Compiler.Index > praPosition && Pragma.Compiler.Index < Pragma.Compiler.Lines[i + 1]) {
						praLine = i + 1;
						break;
					}
				} else {
					praLine = i + 1;
					break;
				}
			}
			console.error(`An error has occured at L${praLine}, C${Pragma.Compiler.Index - Pragma.Compiler.Lines[praLine - 1]}:\n${error}`);
			Pragma.Compiler.Continue = false;
		},
		Warning: function(warn) {
			console.error(`Compiler warning has been recieved:\n${warn}`);
		},
		MoveTo: function(find, start=true) {
			let praStart = Pragma.Compiler.Index, praChars = (typeof find == "object" ? find : [find]);
			for(Pragma.Compiler.Index = Pragma.Compiler.Index; Pragma.Compiler.Index < Pragma.Compiler.Input.length; Pragma.Compiler.Index++) {
				for(var praChar in praChars) {
					if (Pragma.Compiler.Input.slice(Pragma.Compiler.Index, Pragma.Compiler.Index + praChars[praChar].length) == praChars[praChar]) {
						return (start ? praStart : Pragma.Compiler.Index);
					}
				}
			}
			Pragma.Compiler.Error(`Could not find characters: ${find} inside of input`);
			return -1;
		},
		FindAt: function(find) {
			let praChars = (typeof find == "object" ? find : [find]);
			for(var i = Pragma.Compiler.Index; i < Pragma.Compiler.Input.length; i++) {
				for(var praChar in praChars) {
					if (Pragma.Compiler.Input.slice(i, i + praChars[praChar].length) == praChars[praChar]) {
						return i;
					}
				}
			}
			Pragma.Compiler.Error(`Could not find characters: ${find} inside of input`);
			return -1;
		},
		Clean: function(array) {
			var _array = [];
			array.forEach(function (e) {
				if (e.trim() != "") {
					_array.push(e);
				}
			});
			return _array;
		},
		Tokens: {
			"local": function() {
				let praAssignment = Pragma.Compiler.FindAt("="),
					praName = Pragma.Compiler.Input.slice(Pragma.Compiler.MoveTo("="), Pragma.Compiler.Index++).trim(),
					praValue = Pragma.Compiler.Input.slice(Pragma.Compiler.MoveTo([";", ","]), Pragma.Compiler.Index).trim();
				
				switch (Pragma.Compiler.Input[praAssignment - 1]) {
					case "+": {
						praName = praName.slice(0, praName.length - 1).trim();
						if (praName in Pragma.Runtime.Locals.List) {
							Pragma.Runtime.Locals.List[praName] += Pragma.Util.Convert(praValue);
							Pragma.Runtime.Locals.Add(praName, praValue);
							Pragma.Runtime.Instructions.Add("push", [Pragma.Runtime.Types.List["variable"], praName]);
							Pragma.Runtime.Instructions.Add("push", [Pragma.Runtime.Types.Get(praValue), praValue]);
							Pragma.Runtime.Instructions.Add("add");
						} else {
							Pragma.Compiler.Error(`Could not add to uninitalized variable: ${praName}`);
						}
						break;
					}

					case "-": {
						praName = praName.slice(0, praName.length - 1).trim();
						if (praName in Pragma.Runtime.Locals.List) {
							Pragma.Runtime.Locals.List[praName] += Pragma.Util.Convert(praValue);
							Pragma.Runtime.Locals.Add(praName, praValue);
							Pragma.Runtime.Instructions.Add("push", [Pragma.Runtime.Types.List["variable"], praName]);
							Pragma.Runtime.Instructions.Add("push", [Pragma.Runtime.Types.Get(praValue), praValue]);
							Pragma.Runtime.Instructions.Add("sub");
						} else {
							Pragma.Compiler.Error(`Could not subtract from uninitalized variable: ${praName}`);
						}
						break;
					}

					case "/": {
						praName = praName.slice(0, praName.length - 1).trim();
						if (praName in Pragma.Runtime.Locals.List) {
							Pragma.Runtime.Locals.List[praName] += Pragma.Util.Convert(praValue);
							Pragma.Runtime.Locals.Add(praName, praValue);
							Pragma.Runtime.Instructions.Add("push", [Pragma.Runtime.Types.List["variable"], praName]);
							Pragma.Runtime.Instructions.Add("push", [Pragma.Runtime.Types.Get(praValue), praValue]);
							Pragma.Runtime.Instructions.Add("div");
						} else {
							Pragma.Compiler.Error(`Could not divide by uninitalized variable: ${praName}`);
						}
						break;
					}

					case "*": {
						praName = praName.slice(0, praName.length - 1).trim();
						if (praName in Pragma.Runtime.Locals.List) {
							Pragma.Runtime.Locals.List[praName] += Pragma.Util.Convert(praValue);
							Pragma.Runtime.Locals.Add(praName, praValue);
							Pragma.Runtime.Instructions.Add("push", [Pragma.Runtime.Types.List["variable"], praName]);
							Pragma.Runtime.Instructions.Add("push", [Pragma.Runtime.Types.Get(praValue), praValue]);
							Pragma.Runtime.Instructions.Add("mul");
						} else {
							Pragma.Compiler.Error(`Could not multiply by uninitalized variable: ${praName}`);
						}
						break;
					}

					default: {
						Pragma.Runtime.Instructions.Add("push", [Pragma.Runtime.Types.Get(praValue), praValue]);
					}
				}

				Pragma.Runtime.Locals.Add(praName, praValue);
				Pragma.Runtime.Instructions.Add("locl", [praName]);

				if (Pragma.Compiler.Input[Pragma.Compiler.Index] == ",") {
					Pragma.Compiler.Index++;
					this.local();
				}
			},
			"global": function() {
				let praName = Pragma.Compiler.Input.slice(Pragma.Compiler.MoveTo("="), Pragma.Compiler.Index++).trim(),
					praValue = Pragma.Compiler.Input.slice(Pragma.Compiler.MoveTo([";", ","]), Pragma.Compiler.Index).trim();
				console.log(`global = [Name: ${praName}, Value: ${praValue}]`);
				Pragma.Runtime.Locals.Add(praName, praValue);
				Pragma.Runtime.Instructions.Add("push", [Pragma.Runtime.Types.Get(praValue), praValue]);
				Pragma.Runtime.Instructions.Add("glob", [praName]);
				if (Pragma.Compiler.Input[Pragma.Compiler.Index] == ",") {
					Pragma.Compiler.Index++;
					this.globalvar();
				}
			},
			"function": function() {
				let praName = Pragma.Compiler.Input.slice(Pragma.Compiler.MoveTo("("), Pragma.Compiler.Index++).trim(),
					praArguments = Pragma.Compiler.Clean(Pragma.Compiler.Input.slice(Pragma.Compiler.MoveTo(")"), Pragma.Compiler.Index).trim().split(","));
				console.log(`function = [Name: "${praName}", Arguments: [${praArguments}]]`);
				Pragma.Runtime.Functions.Add(praName, praArguments);
				//Pragma.Runtime.Bytecode.push()
			}
		}
	},
	Compile: function(e) {
		Pragma.Compiler.Start = new Date();
		Pragma.Compiler.Input = e;
		Pragma.Compiler.Index = 0;
		Pragma.Compiler.Lines = [];
		Pragma.Compiler.Line = 0;
		// Load in built functions
		for(var praFunction in Pragma.Runner.Functions) {
			Pragma.Runtime.Functions.Add(praFunction, []);
			console.log(Pragma.Runtime.Functions.List[Pragma.Runtime.Functions.List.length - 1]);
			console.log(Pragma.Runner.Functions);
		}

		// Get line numbers
		for(Pragma.Compiler.Index = 0; Pragma.Compiler.Index < Pragma.Compiler.Input.length; Pragma.Compiler.Index++) {
			if (Pragma.Compiler.Input[Pragma.Compiler.Index].charCodeAt(0) == 10) {
				Pragma.Compiler.Lines.push(Pragma.Compiler.Index);
			}
		}

		// Compile program
		for(Pragma.Compiler.Index = 0; Pragma.Compiler.Index < Pragma.Compiler.Input.length; Pragma.Compiler.Index++) {
			if (Pragma.Compiler.Input.charCodeAt(Pragma.Compiler.Index) <= 32) {continue;}
			if (Pragma.Compiler.Continue == true) {
				// Tokens
				let praFound = false;
				for(praToken in Pragma.Compiler.Tokens) {
					if (Pragma.Compiler.Input.slice(Pragma.Compiler.Index, Pragma.Compiler.Index + praToken.length) == praToken) {
						Pragma.Compiler.Index += praToken.length;
						Pragma.Compiler.Tokens[praToken]();
						praFound = true;
						break;
					}
				}

				// Functions
				if (praFound == false) {
					for(var i = 0; i < Pragma.Runtime.Functions.List.length; i++) {
						let praFunction = Pragma.Runtime.Functions.List[i];
						if (Pragma.Compiler.Input.slice(Pragma.Compiler.Index, Pragma.Compiler.Index + praFunction.Name.length) == praFunction.Name) {
							let praArguments = Pragma.Compiler.Clean(Pragma.Compiler.Input.slice(Pragma.Compiler.MoveTo("(", false) + 1, Pragma.Compiler.MoveTo(")", false)).trim().split(","));
							if (praArguments.length < praFunction.MinArguments) {
								Pragma.Compiler.Error(`Function call recieved less arguments than required (${praArguments.length} recieved, at least ${praFunction.MinArguments} expected)`);
							} else if (praArguments.length > praFunction.MaxArguments) {
								Pragma.Compiler.Error(`Function call recieved more arguments than required (${praArguments.length} recieved, at least ${praFunction.MinArguments} expected)`);
							}

							for(var j = praArguments.length - 1; j >= 0; j--) {
								Pragma.Runtime.Instructions.Add("push", [Pragma.Runtime.Types.Get(praArguments[j]), praArguments[j]]);
							}
							Pragma.Runtime.Instructions.Add("push", [Pragma.Runtime.Types.List["number"], praArguments.length]);
							Pragma.Runtime.Instructions.Add("call", [praFunction.Name]);
							praFound = true;
							break;
						}
					}
				}

				// Local Variables
				if (praFound == false) {
					for(var praVariable in Pragma.Runtime.Locals.List) {
						if (Pragma.Compiler.Input.slice(Pragma.Compiler.Index, Pragma.Compiler.Index + praVariable.length) == praVariable) {
							Pragma.Compiler.Tokens["local"]();
							praFound = true;
							break;
						}
					}
				}

				// Global Variables
				if (praFound == false) {
					for(var praVariable in Pragma.Runtime.Globals.List) {
						if (Pragma.Compiler.Input.slice(Pragma.Compiler.Index, Pragma.Compiler.Index + praVariable.length) == praVariable) {
							Pragma.Compiler.Tokens["global"]();
							praFound = true;
							break;
						}
					}
				}
			} else {
				break;
			}
		}
		console.log(`Compile has finished at ${((new Date()).getHours()%13).toString().padStart(2, "0")}:${((new Date()).getMinutes()).toString().padStart(2, "0")}:${((new Date()).getSeconds()).toString().padStart(2, "0")} ${(new Date()).getHours()>12?"PM":"AM"} in ${(new Date()).getTime() - Pragma.Compiler.Start}ms`);
		Pragma.Runner.Process(Pragma.Runtime.Bytecode);
	}
}
/*Pragma = {
	Compiler: {
		Tokens: {
			"var": function(praInput, praIndex) {
				Pragma.Compiler.MoveTo("")
				console.log("token code ran!");
				return praIndex;
			}
		},
		Clean: function(praElement) {
			let praInput = "";
			for(var praIndex = 0; praIndex < praElement.length; praIndex++) {
				let praCharacter = praElement.charCodeAt(praIndex);
				if (praCharacter > 32) {
					praInput += praElement[praIndex];
				}
			}
			return praInput;
		},
		MoveTo: function(praInput, praIndex, praChar) {
			for(var i = praIndex; i < praInput.count; i++) {

			}
		}
	},
	Run: function() {
		let praElements = document.getElementsByTagName("script");
		for(var i = 0; i < praElements.length; i++) {
			if (praElements[i].type == "text/pragma") {
				Pragma.Compile(praElements[i].innerText);
			}
		}
	},
	Compile: function(praElement) {
		// Clear whitespace from input
		let praInput = Pragma.Compiler.Clean(praElement);
		// Find tokens
		for(var praIndex = 0; praIndex < praInput.length; praIndex++) {
			for(var praToken in Pragma.Compiler.Tokens) {
				if (praInput.slice(praIndex, praIndex + praToken.length) == praToken) {
					praIndex = Pragma.Compiler.Tokens[praToken](praIndex, praInput);
					console.log("Found: " + praToken);
				}
			}
		}
		
		console.log(praInput);
	}
}*/