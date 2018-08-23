Pragma = {
    Global: {
        Instructions: {
            global: 0,
            local: 1,
            push: 2,
            add: 3,
            sub: 4,
            mul: 5,
            div: 6,
            return: 7
        }
    },
    Parser: function(praInput, praFunctions={}) {
        this.Functions = praFunctions;
        this.Input = praInput.replace(/\s/g,'');
        this.Output = [];
        this.Stack = [];
        this.Operators = {
            "*": 3,
            "/": 3,
            "+": 2,
            "-": 2
        }

        this.Precedence = {
            Equal: 0,
            Less: 1,
            Greater: 2,
            Get: function(a, b) {
                if (a == b) {
                    return this.Equal;
                } else if (a < b) {
                    return this.Less;
                } else if (a > b) {
                    return this.Greater;
                }
                return this.Equal;
            }
        }

        this.IsNumber = function(value) {
            if (typeof(value) == "string") {
                if ((value.charCodeAt(0) >= 48 && value.charCodeAt(0) <= 57) || value == ".") {
                    return true;
                }
                return false;
            }
            return true;
        }

        this.IsFunction = function(value) {
            return (value in this.Functions);
        }

        this.IsOperator = function(value) {
            return (value in this.Operators);
        }

        this.GetType = function(value) {
            return (this.IsNumber(value) == true ? 0 : ((value in this.Operators) ? 1 : 2));
        }

        this.Parse = function() {
            let praTokens = [], praType = -1, praIndex = -1, praBuild = "";
            for(var i = 0; i < this.Input.length; i++) {
                // Token Completion
                console.log(this.Functions);
                for(var praFunction in this.Functions) {
                    console.log(`funnnnnnnnnn: ${praFunction}`);
                }

                if (this.GetType(this.Input[i]) != praType || (["(", ")"].includes(this.Input[i]) == true)) {
                    if (praBuild != "") {
                        praTokens.push(praBuild);
                    }
                    praType = this.GetType(this.Input[i]);
                    praBuild = "";
                }
                praBuild += this.Input[i];
                praIndex = i;
            }
            praTokens.push(praBuild);
            console.log(praTokens);
            praTokens.forEach((praToken) => {
                if (this.IsNumber(praToken) == true) {
                    this.Output.push(praToken);
                } else if (praToken in this.Operators) {
                    while (this.Stack[this.Stack.length - 1] in this.Operators && this.Operators[praToken] <= this.Operators[this.Stack[this.Stack.length - 1]]) {
                        this.Output.push(this.Stack.pop());
                    }
                    this.Stack.push(praToken);
                } else if (praToken == "(") {
                    this.Stack.push(praToken);
                } else if (praToken == ")") {
                    while (this.Stack[this.Stack.length - 1] != "(") {
                        this.Output.push(this.Stack.pop());
                    }
                    this.Stack.pop();
                } else {
                    this.Stack.push(praToken);
                }
            });
            while (this.Stack.length) {this.Output.push(this.Stack.pop());}
            return this.Output;
        }
    },
    Compiler: function(praInput, praBytecode=[]) {
        this.Input = praInput;
        this.Token = "";
        this.Index = 0;
        this.Functions = {};
        this.Global = {};
        this.Local = {};

        this.Evaluate = function(input) {
            console.log(input.length);
            input.forEach((praToken) => {
                console.log(`token:${praToken}`);
                switch (praToken) {
                    case "+": {
                        this.Bytecode.Add("add");
                        break;
                    }

                    case "-": {
                        this.Bytecode.Add("sub");
                        break;
                    }

                    case "/": {
                        this.Bytecode.Add("div");
                        break;
                    }

                    case "*": {
                        this.Bytecode.Add("mul");
                        break;
                    }

                    default: {
                        console.log(`aa ${praToken}`);
                        this.Bytecode.Add("push", [this.GetType(praToken), praToken])
                    }
                }
            });
        }

        this.GetType = function(value) { 
            if (typeof(value) == "string") {
                value = value.trim();
                if (value[0] == "\"" && value[value.length - 1] == "\"") {
                    return 1; // string
                } else {
                    let praNumber = true;
                    for(praChar in value) {
                        if (value.charCodeAt(praChar) < 32 || value.charCodeAt(praChar) > 64) {
                            return 2; // variable
                        }
                    }
                    return 0; // number
                }
            }
            return 0;
        }

        this.SetType = function(value) {
            if (typeof(value) == "number") {
                return value;
            } else {
                switch (this.GetType(value)) {
                    case 0: return parseFloat(value);
                    case 1: return value.slice(1, -1);
                }
                return value;
            }
        }

        this.MoveTo = function(praFind, praStart=true) {
            var praBase = this.Index, praFind = (typeof(praFind) == "object" ? praFind : [praFind]);
            for(;this.Index < this.Input.length; this.Index++) {
                for(var praGet in praFind) {
                    if (this.Input.slice(this.Index, this.Index + praFind[praGet].length) == praFind[praGet]) {
                        return (praStart ? praBase : this.Index);
                    }
                }
            }
            return -1;
        }

        this.FindAt = function(praFind) {
            var praFind = (typeof(praInput) == "object" ? praFind : [praFind]);
            for(i = this.Index; i < this.Input.length; i++) {
                for(var praGet in praFind) {
                    if (this.Input.slice(i, i + praFind[praGet].length) == praFind[praGet]) {
                        return i;
                    }
                }
            }
            return -1;
        }

        this.Compile = function() {
            console.log(this.Input.trim());
            for(this.Index = 0; this.Index < this.Input.length; this.Index++) {
                let praFound = false;
                for(this.Token in this.Tokens) {
                    if (this.Input.slice(this.Index, this.Index + this.Token.length) == this.Token) {
                        this.Index += this.Token.length;
                        this.Tokens[this.Token]();
                        praFound = true;
                        break;
                    }
                }

                if (praFound == false) {
                    // TODO: Functions
                }

                if (praFound == false) {
                    // Local Variables
                    for(var praVariable in this.Local) {
                        if (this.Input.slice(this.Index, this.Index + praVariable.length) == praVariable) {
                            this.Tokens["local"]();
                            praFound = true;
                            break;
                        }
                        //console.log(praVariable);
                    }
                }

                if (praFound == false) {
                    // Global Variables
                    for(var praVariable in this.Global) {
                        if (this.Input.slice(this.Index, this.Index + praVariable.length) == praVariable) {
                            this.Tokens["global"]();
                            praFound = true;
                            break;
                        }
                        //console.log(praVariable);
                    }
                }
            }
            console.log(this.Functions);
            return this.Bytecode.List;
        }

        this.Bytecode = {
            Add: (name, data=[]) => {
                this.Bytecode.List.push(Pragma.Global.Instructions[name]);
                if (data.length > 0) {
                    data.forEach((e) => {
                        this.Bytecode.List.push(this.SetType(e));
                    });
                }
            },
            List: []
        }

        this.Tokens = {
            "function": () => {
                let praName = this.Input.slice(this.MoveTo("("), this.Index++).trim(), praArguments = this.Input.slice(this.MoveTo(")"), this.Index).trim(), praBase = this.MoveTo("{", false) + 1, praCode = "", praBrackets = 1;
                while (praBrackets > 0) {
                    switch (this.Input[++this.Index]) {
                        case "{": {
                            praBrackets++;
                            break;
                        }

                        case "}": {
                            praBrackets--;
                            break;
                        }
                    }
                }
                this.Functions[praName] = {Arguments: praArguments, Bytecode: new Pragma.Compiler(this.Input.slice(praBase, this.Index).trim()).Compile()};
                //console.log(`Name: ${praName}, Arguments: ${praArguments}, Function: "${praCompile}"`);
            },
            "global": () => {
                let praOperator = this.Input[this.FindAt("=") - 1], praName = this.Input.slice(this.MoveTo("="), this.Index++).trim(), praValue = this.Input.slice(this.MoveTo([",", ";"]), this.Index).trim();
                switch (praOperator) {
                    case "+": { // Add
                        praName = praName.slice(0, praName.length - 1).trim();
                        this.Bytecode.Add("push", [this.GetType(praName), praName]);
                        this.Bytecode.Add("push", [this.GetType(praValue), praValue]);
                        this.Bytecode.Add("add");
                        break;
                    }

                    case "-": { // Subtract
                        praName = praName.slice(0, praName.length - 1).trim();
                        this.Bytecode.Add("push", [this.GetType(praName), praName]);
                        this.Bytecode.Add("push", [this.GetType(praValue), praValue]);
                        this.Bytecode.Add("sub");
                        break;
                    }

                    case "/": { // Divide
                        praName = praName.slice(0, praName.length - 1).trim();
                        this.Bytecode.Add("push", [this.GetType(praName), praName]);
                        this.Bytecode.Add("push", [this.GetType(praValue), praValue]);
                        this.Bytecode.Add("div");
                        break;
                    }

                    case "*": { // Multiply
                        praName = praName.slice(0, praName.length - 1).trim();
                        this.Bytecode.Add("push", [this.GetType(praName), praName]);
                        this.Bytecode.Add("push", [this.GetType(praValue), praValue]);
                        this.Bytecode.Add("mul");
                        break;
                    }

                    default: { // None
                        this.Evaluate(new Pragma.Parser(praValue, this.Functions).Parse());
                        //this.Bytecode.Add("push", [this.GetType(praValue), praValue]);
                    }
                }
                this.Bytecode.Add("global", [praName]);
                this.Global[praName] = praValue;

                if (this.Input[this.Index++] == ",") {
                    this.Tokens[this.Token]();
                }
            },
            "local": () => {
                let praOperator = this.Input[this.FindAt("=") - 1], praName = this.Input.slice(this.MoveTo("="), this.Index++).trim(), praValue = this.Input.slice(this.MoveTo([",", ";"]), this.Index).trim();
                switch (praOperator) {
                    case "+": { // Add
                        praName = praName.slice(0, praName.length - 1).trim();
                        this.Bytecode.Add("push", [this.GetType(praName), praName]);
                        this.Bytecode.Add("push", [this.GetType(praValue), praValue]);
                        this.Bytecode.Add("add");
                        break;
                    }

                    case "-": { // Subtract
                        praName = praName.slice(0, praName.length - 1).trim();
                        this.Bytecode.Add("push", [this.GetType(praName), praName]);
                        this.Bytecode.Add("push", [this.GetType(praValue), praValue]);
                        this.Bytecode.Add("sub");
                        break;
                    }

                    case "/": { // Divide
                        praName = praName.slice(0, praName.length - 1).trim();
                        this.Bytecode.Add("push", [this.GetType(praName), praName]);
                        this.Bytecode.Add("push", [this.GetType(praValue), praValue]);
                        this.Bytecode.Add("div");
                        break;
                    }

                    case "*": { // Multiply
                        praName = praName.slice(0, praName.length - 1).trim();
                        this.Bytecode.Add("push", [this.GetType(praName), praName]);
                        this.Bytecode.Add("push", [this.GetType(praValue), praValue]);
                        this.Bytecode.Add("mul");
                        break;
                    }

                    default: { // None
                        console.log(this.Functions);
                        this.Evaluate(new Pragma.Parser(praValue, this.Functions).Parse());
                        //this.Bytecode.Add("push", [this.GetType(praValue), praValue]);
                    }
                }
                this.Bytecode.Add("local", [praName]);
                this.Local[praName] = praValue;

                if (this.Input[this.Index++] == ",") {
                    this.Tokens[this.Token]();
                }
            },
            "return": () => {
                let praReturn = this.Input.slice(this.MoveTo(";"), this.Index).trim();
                this.Bytecode.Add("push", [this.GetType(praReturn), praReturn]);
                this.Bytecode.Add("return");
                console.log(praReturn);
            }
        }
    },
    Runner: function(praBytecode) {
        this.Bytecode = praBytecode;
        this.Pointer = 0;
        this.Stack = [];
    
        this.Global = {};
        this.Local = {};
        this.Run = function() {
            console.log(this.Bytecode);
            while (this.Pointer < this.Bytecode.length) {
            // Runner Start
                switch (this.Bytecode[this.Pointer++]) {
                    case Pragma.Global.Instructions.global: {
                        this.Global[this.Bytecode[this.Pointer++]] = this.Stack.pop();
                        break;
                    }

                    case Pragma.Global.Instructions.local: {
                        this.Local[this.Bytecode[this.Pointer++]] = this.Stack.pop();
                        break;
                    }

                    case Pragma.Global.Instructions.add: {
                        let b = this.Stack.pop(), a = this.Stack.pop();
                        this.Stack.push(a + b);
                        break;
                    }

                    case Pragma.Global.Instructions.sub: {
                        let b = this.Stack.pop(), a = this.Stack.pop();
                        this.Stack.push(a - b);
                        break;
                    }

                    case Pragma.Global.Instructions.mul: {
                        let b = this.Stack.pop(), a = this.Stack.pop();
                        this.Stack.push(a * b);
                        break;
                    }

                    case Pragma.Global.Instructions.div: {
                        let b = this.Stack.pop(), a = this.Stack.pop();
                        this.Stack.push(a / b);
                        break;
                    }

                    case Pragma.Global.Instructions.push: {
                        if (this.Bytecode[this.Pointer++] == 2) {
                            // variable
                            for(var praVariable in this.Global) {
                                if (praVariable == this.Bytecode[this.Pointer]) {
                                    this.Stack.push(this.Global[praVariable]);
                                    break;
                                }
                            }

                            for(var praVariable in this.Local) {
                                if (praVariable == this.Bytecode[this.Pointer]) {
                                    this.Stack.push(this.Local[praVariable]);
                                    break;
                                }
                            }
                            this.Pointer++;
                        } else {
                            this.Stack.push(this.Bytecode[this.Pointer++]);
                        }
                    }
                }
            }
            console.log(this.Local);
            // Runner End
        }
    },
    Debugger: function(praBytecode) {
        this.Bytecode = praBytecode;
        this.Pointer = 0;

        this.Output = function() {
            let praOutput = "";
            console.log(Pragma.Global.Instructions.push)
            while (this.Pointer < this.Bytecode.length) {
                console.log(`ptr: ${this.Pointer}`);
                switch (this.Bytecode[this.Pointer++]) {
                    case Pragma.Global.Instructions.global: {
                        praOutput += "GlobalVar(name=" + this.Bytecode[this.Pointer++] + ")\n";
                        break;
                    }

                    case Pragma.Global.Instructions.local: {
                        praOutput += "LocalVar(name=" + this.Bytecode[this.Pointer++] + ")\n";
                        break;
                    }

                    case Pragma.Global.Instructions.push: {
                        praOutput += "Push(type=";
                        switch (this.Bytecode[this.Pointer++]) {
                            case 0: {
                                praOutput += "number,value=" + this.Bytecode[this.Pointer++];
                                break;
                            }

                            case 1: {
                                praOutput += "string,value=" + this.Bytecode[this.Pointer++];
                                break;
                            }

                            case 2: {
                                praOutput += "variable,value=" + this.Bytecode[this.Pointer++];
                                break;
                            }
                        }
                        praOutput += ")\n";
                        break;
                    }

                    case Pragma.Global.Instructions.add: {
                        praOutput += "Add()\n";
                        break;
                    }

                    case Pragma.Global.Instructions.sub: {
                        praOutput += "Subtract()\n";
                        break;
                    }

                    case Pragma.Global.Instructions.div: {
                        praOutput += "Divide()\n";
                        break;
                    }

                    case Pragma.Global.Instructions.mul: {
                        praOutput += "Multiply()\n";
                        break;
                    }

                    case Pragma.Global.Instructions.return: {
                        praOutput += "Return()\n";
                        break;
                    }
                }
            }
            return praOutput;
        }
    }
}