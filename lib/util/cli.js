/****************************************************************************
 Copyright 2015 Apigee Corporation

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ****************************************************************************/
'use strict';

var _ = require('lodash');
var inquirer = require('inquirer');
var feedback = require('./feedback');
var config = require('../../config');
var yaml = require('js-yaml');
var util = require('util');

module.exports = {
  requireAnswers: requireAnswers,
  updateAnswers: updateAnswers,
  printAndExit: printAndExit,
  chooseOne: chooseOne,
  validate: validate,
  execute: execute,
  confirm: confirm,
  prompt: prompt,
  version: version
};

function version() {
  return require('../../package.json').version;
}

// questions are array of objects like these:
// { name: 'key', message: 'Your prompt?' }
// { name: 'key', message: 'Your prompt?', type: 'password' }
// { name: 'key', message: 'Your prompt?', type: 'list', choices: ['1', '2'] }
// results is an (optional) object containing existing results like this: { key: value }
function requireAnswers(questions, results, cb) {
  if (!cb) { cb = results; results = {}; }
  var unanswered = getUnanswered(questions, results);
  if (unanswered.length === 0) {
    return cb(results);
  }
  inquirer.prompt(unanswered, function(answers) {
    _.extend(results, answers);
    requireAnswers(questions, results, cb);
  });
}

function updateAnswers(questions, results, cb) {
  if (!cb) { cb = results; results = {}; }
  for (var i = 0; i < questions.length; i++) {
    var question = questions[i];
    if (question.type !== 'password') {
      question.default = results[question.name];
    }
  }
  inquirer.prompt(questions, function(answers) {
    _.extend(results, answers);
    requireAnswers(questions, results, cb);
  });
}

function getUnanswered(questions, results) {
  var unanswered = [];
  for (var i = 0; i < questions.length; i++) {
    var question = questions[i];
    if (!results[question.name]) {
      unanswered.push(question);
    }
  }
  return unanswered;
}

function printAndExit(err, output, code) {
  if (err) {
    print(err);
    code = code || 1;
  } else if (output !== null && output !== undefined) {
    print(output);
  }
  process.exit(code || 0);
}

function print(object) {
  if (util.isError(object)) {
    console.log(config.debug ? object.stack : object);
  } else if (_.isObject(object)) {
    if (object.password) {
      object.password = '******';
    }
    console.log(yaml.safeDump(object, { indent: 2 }));
  } else if (object !== null && object !== undefined) {
    console.log(object);
  } else {
    console.log();
  }
}

// prompt: 'Your prompt?', choices: ['1', '2'] }
// result passed to cb() is the choice selected
function chooseOne(prompt, choices, cb) {
  var questions = { name: 'x', message: prompt, type: 'list', choices: choices };
  inquirer.prompt(questions, function(answers) {
    cb(answers.x);
  });
}

// defaultBool is optional (default == true)
// result passed to cb() is the choice selected
function confirm(prompt, defaultBool, cb) {
  if (!cb) { cb = defaultBool; defaultBool = true; }
  var question = { name: 'x', message: prompt, type: 'confirm', default: defaultBool};
  inquirer.prompt(question, function(answers) {
    cb(answers.x);
  });
}

// defaultValue is optional
// result passed to cb() is the response
function prompt(prompt, defaultValue, cb) {
  if (!cb) { cb = defaultValue; defaultValue = undefined; }
  var question = { name: 'x', message: prompt, default: defaultValue};
  inquirer.prompt(question, function(answers) {
    cb(answers.x);
  });
}

function validate(app) {
  var commands = app.commands.map(function(command) { return command._name; });
  if (!_.contains(commands, app.rawArgs[2])) {
    if (app.rawArgs[2]) {
      console.log();
      console.log('error: invalid command: ' + app.rawArgs[2]);
    }
    app.help();
  }
}

function execute(command, header) {
  var cb = function(err, reply) {
    if (header && !err) {
      print(header);
      print(Array(header.length + 1).join('='));
    }
    if (!reply && !err) { reply = 'done'; }
    printAndExit(err, reply);
  };
  return function() {
    try {
      var args = Array.prototype.slice.call(arguments);
      args.push(cb);
      if (!command) {
        return cb(new Error('missing command method'));
      }
      if (args.length !== command.length) {
        return cb(new Error('incorrect arguments'));
      }
      var reply = command.apply(this, args);
      if (reply) {
        cb(null, reply);
      }
    } catch (err) {
      cb(err);
    }
  }
}

if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
  };
}

feedback.on(function(feedback) {
  if (_.isString(feedback) && feedback.endsWith('\\')) {
    process.stdout.write(feedback.substr(0, feedback.length - 1));
  } else {
    print(feedback);
  }
});
