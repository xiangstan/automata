var file = document.getElementById("input-file");
var show = document.getElementById("result-display");
var run = document.getElementById("button-run");
var upload = document.getElementById("button-load");
var display = document.getElementById("panel-display");
// accepted states
var accept = [];
// alphabet
var alphabet = [];
var hasResult = false;
// input string
var inputs = [];
var language = {};
var transitions = [];
const a = [ "0", "1", "e" ];

const AnimateCSS = (element, animation, prefix = 'animate__') =>
  // We create a Promise and return it
  new Promise((resolve, reject) => {
    const animationName = `${prefix}${animation}`;
    const node = document.getElementById(element);
    node.classList.add(`${prefix}animated`, animationName);
    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd() {
      node.classList.remove(`${prefix}animated`, animationName);
      resolve('Animation ended');
    }
    node.addEventListener('animationend', handleAnimationEnd, {once: true});
});

var chkLetterCount = (string) => {
  let error = false;
  if (string.length < 1) {
    ShowError.Start("Please provide a string of inputs");
    return false;
  }
  else {
    inputs = [];
    for (let i = 0; i < string.length; i++) {
      if (string[i] != 0 && string[i] != 1 && string[i] !== "e") {
        error = true;
        break;
      }
      else {
        inputs.push(string[i])
      }
    }
    if (error) {
      ShowError.Start("This is a simple NFA Language, it should only contains two different characters");
      return false;
    }
    else {
      return true;
    }
  }
}

var errNote = (data) => {
  document.getElementById("err-note").textContent = data;
}

const Nfa = {
  hasInput: false,
  start: 0,
  states: [],
  // check if NFA has input string and it is enabled
  Check() {
    let input = document.getElementById("input-value");
    input.classList.remove("is-danger");
    if (chkLetterCount(input.value)) {
      this.Simulation(input.value)
    }
    else {
      input.classList.add("is-danger")
    }
  },
  Display(content) {
    let lines = content.split(/\r?\n/);
    lines = lines.filter(function (el) {
      return el != "";
    });
    transitions = [];
    this.GetAlphabet(lines[0]);
    this.GetStates(lines[1]);
    this.GetStart();
    this.GetAccept(lines[lines.length - 1]);
    this.GetTrans(lines);
    if (accept.length > 0 && this.states.length > 0) {
      this.hasInput = true;
      run.classList.toggle("is-static")
    }
  },
  // get accept state
  GetAccept(data) {
    let temp = [];
    let cmt = data.split(";");
    accept = cmt[0].trim().split("");
    for (let i = 0; i < accept.length; i++) {
      temp.push(this.states[parseInt(accept[i])])
    }
    document.getElementById("var-accept").textContent = "{ " + temp.join(", ") + " }";
  },
  // get alphabet
  GetAlphabet(data) {
    let cmt = data.split(";");
    alphabet = cmt[0].trim().split("");
    document.getElementById("var-lang").textContent = "{ " + alphabet.join(", ") + " }";
  },
  // get start state
  GetStart() {
    document.getElementById("var-start").textContent = "{ " + this.states[this.start] + " }";
  },
  // get all states
  GetStates(data) {
    for(let i = 0; i < parseInt(data); i++) {
      this.states.push("q" + i)
    }
    document.getElementById("var-state").textContent = "{ " + this.states.join(", ") + " }";
  },
  // get all transitions
  GetTrans(data) {
    const removed = [ 0, 1, (data.length -1)];
    let temp = '<table class="table is-striped"><tr><td> </td><td>0</td><td>1</td><td>e</td></tr>';
    for (let i = 0; i < data.length; i ++) {
      if (removed.indexOf(i) === -1) {
        let cmt = data[i].split(";");
        let cell = cmt[0].trim().split(" ");
        transitions.push(cell);
        temp += `<tr><td>${this.states[transitions.length -1]}</td>`;
        for (let j = 0; j < cell.length; j++) {
          temp += "<td>";
          let multi = cell[j].split(",");
          let value = [];
          for (let k = 0; k < multi.length; k++) {
            let v = (!isNaN(parseInt(multi[k]))) ? this.states[multi[k]] : multi[k];
            value.push(v);
          }
          temp += value.join(",");
          temp += "</td>";
        }
        temp += "</tr>";
      }
    }
    temp += "</table>";
    document.getElementById("var-trans").innerHTML = temp;
  },
  // get result
  Result(result) {
    const total = result.size;
    let count = 1;
    let temp = "";
    for (let r of result) {
      temp += `<li class="list-item">A input value <strong>${r.input}</strong> had entered state <strong>q${r.current}</strong>, and `;
      if (count < total) {
        temp += `transitioned to state <strong>q${r.next}</strong>;</li>`;
      }
      else {
        temp += `the transition had been <strong>${r.next}</strong>.</li>`;
      }
      count++;
    }
    document.getElementById("result-list").innerHTML = temp;
    show.classList.remove("is-hidden");
    AnimateCSS("result-display", "fadeIn");
  },
  // run nfa simulation
  Simulation(input) {
    //console.log(inputs);
    //console.log(alphabet)
    //console.log(transitions)
    //console.log("Running")
    hasResult = false;
    let curState = new State(0, 0);
    curState.Fetch();
  }
}

/*** status object ***/
const State = class {
  constructor(curState, curInput, visited = new Set()) {
    this.allpath = [];
    this.curState = transitions[curState];
    this.curInput = inputs[curInput];
    this.inputIdx = curInput;
    this.state = curState;
    this.visited = new Set();
    console.log(visited)
    for (let s of visited) {
      this.visited.add(s);
    }
    console.log(this.visited)
  }
  /***
   * Accept function checks if the state is accepted
   * -2: final accept state
   * -1: rejected
   * return value next as the next state
  ***/
  Accept() {
    let pos = a.indexOf(this.curInput);
    let next = this.curState[pos];
    if (this.inputIdx >= (inputs.length -1)) {
      if (this.Final(next)) {
        return -2;
      }
      else {
        return -1;
      }
    }
    else {
      //console.log(next)
      if (next === "d" || next === "x") {
        return -1;
      }
      else {
        return next;
      }
    }
  }
  /***
  * fetch function is the main function within State class object.
  * it checks the input string does not go to the dead state or final accepted state; otherwise send to the next state.
  ***/
  Fetch() {
    let next = this.Accept();
    // console.log(next)
    if (next !== -1 && next !== -2) {
      let nextStates = this.MultiTarget(next);
      for (let s in nextStates) {
        this.NextState(nextStates[s]);
      }
    }
    else {
      let result = "";
      if (next == -2) {
        hasResult = true;
        this.visited.add({input: parseInt(this.curInput), current: this.state, next: "accepted"});
        Nfa.Result(this.visited);
      }
      else {
        if (!hasResult) {
          this.visited.add({input: parseInt(this.curInput), current: this.state, next: "rejected"});
          Nfa.Result(this.visited);
        }
      }
      return;
    }
  }
  /***
   * final function check if the end of input string lands on the accept state.
   * It also considered if there are multiple accept states by looping through
   * all the possible accept states given by the upload the file
  ***/
  Final(next) {
    let flag = false;
    let states = this.MultiTarget(next);
    for (let i in accept) {
      for (let j in states) {
        if (states[j] == accept[i]) {
          flag = true;
          break;
        }
      }
    }
    return flag;
  }
  /***
   * MultiTarget function split possible multiple states into an array
  ***/
  MultiTarget(states) {
    return states.split(",")
  }
  /***
   * NextState function writes the current state record into visited Set record
   * then call a new State class object cursively.
  ***/
  NextState(next) {
    this.visited.add({input: this.curInput, current: this.state, next: next});
    //console.log(this.visited);
    let nextInput = this.inputIdx + 1;
    let curState = new State(next, nextInput, this.visited)
    //console.log(curState)
    return curState.Fetch();
  }
}

/*** check upload file ***/
var Upload = () => {
  if ("files" in file && file.files.length > 0) {
    ReadFileContent(file.files[0]).then(content => {
      display.classList.toggle("is-hidden");
      AnimateCSS("panel-display", "fadeIn");
      Nfa.Display(content);
    }).catch(error => {
      errNote(error);
      ShowError.Start(error)
    })
  }
  else {
    ShowError.Start("Please select a input file first");
  }
}

/*** read file content ***/
var ReadFileContent = (file) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = event => resolve(event.target.result)
    reader.onerror = error => reject(error)
    reader.readAsText(file)
  })
}

/*** show error message ***/
const ShowError = {
  note() {
    return document.getElementById("err-note")
  },
  ToastId: "toast-container",
  ToastElem: document.getElementById("toast-container"),
  Show(data = false) {
    this.ToastElem.classList.toggle("is-hidden");
    if (data) {
      this.ToastElem.classList.remove("animate__animated");
      this.ToastElem.classList.remove("animate__" + data);
    }
  },
  Start(data) {
    errNote(data + ".");
    this.Show();
    AnimateCSS(this.ToastId, "fadeInRight")
    window.setTimeout(function() {
      this.End()
    }.bind(this), 2000)
  },
  End() {
    AnimateCSS(this.ToastId, "fadeOutRight")
    window.setTimeout(function() {
      this.Show("fadeOutRight")
    }.bind(this), 800)
  }
}

// event trigger for clicking on run button.
run.addEventListener("click", () => {
  Nfa.Check()
});
// event trigger for clicking load button.
upload.addEventListener("click", Upload);
