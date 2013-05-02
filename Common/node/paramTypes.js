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

exports.query = exports.q = function(name, description, dataType, required, allowMultiple, allowableValues, defaultValue) {
  return {
    "name" : name,
    "description" : description,
    "dataType" : dataType,
    "required" : required,
    "allowMultiple" : allowMultiple,
    "allowableValues" : allowableValues,
    "defaultValue" : defaultValue,
    "paramType" : "query"
  };
};

exports.path = function(name, description, dataType, allowableValues) {
  return {
    "name" : name,
    "description" : description,
    "dataType" : dataType,
    "required" : true,
    "allowMultiple" : false,
    "allowableValues" : allowableValues,
    "paramType" : "path"
  };
};

exports.post = function(dataType, description, defaultValue) {
  return {
    "description" : description,
    "dataType" : dataType,
    "required" : true,
    "paramType" : "body",
    "defaultValue" : defaultValue
  };
};

exports.header = function(name, description, dataType, required) {
  return {
    "name" : name,
    "description" : description,
    "dataType" : dataType,
    "required" : true,
    "allowMultiple" : false,
    "paramType" : "header"
  };
};