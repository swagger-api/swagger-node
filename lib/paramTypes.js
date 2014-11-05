/**
 *  Copyright 2013 Wordnik, Inc.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

'use strict';


exports.query = exports.q = function(name, description, type, required, allowableValuesEnum, defaultValue) {
  return {
    'name' : name,
    'description' : description,
    'type' : type,
    'required' : required,
    'enum' : allowableValuesEnum,
    'defaultValue' : defaultValue,
    'paramType' : 'query'
  };
};

exports.path = function(name, description, type, allowableValuesEnum, defaultValue) {
  return {
    'name' : name,
    'description' : description,
    'type' : type,
    'required' : true,
    'enum' : allowableValuesEnum,
    'paramType' : 'path',
    'defaultValue' : defaultValue
  };
};

exports.body = function(name, description, type, defaultValue, required) {
  return {
    'name' : name,
    'description' : description,
    'type' : type,
    'required' : required || false,
    'paramType' : 'body',
    'defaultValue' : defaultValue
  };
};

exports.form = function(name, description, type, required, allowableValuesEnum, defaultValue) {
  return {
    'name' : name,
    'description' : description,
    'type' : type,
    'required' : (typeof required !== 'undefined') ? required : true,
    'enum' : allowableValuesEnum,
    'paramType' : 'form',
    'defaultValue' : defaultValue
  };
};

exports.header = function(name, description, type, required) {
  return {
    'name' : name,
    'description' : description,
    'type' : type,
    'required' : required,
    'allowMultiple' : false,
    'paramType' : 'header'
  };
};
