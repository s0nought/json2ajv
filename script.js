"use strict";

// Functions

function getTimeNow() {
    const timeNow = new Date();

    const hours = ("0" + timeNow.getHours()).slice(-2);
    const minutes = ("0" + timeNow.getMinutes()).slice(-2);
    const seconds = ("0" + timeNow.getSeconds()).slice(-2);

    return [hours, minutes, seconds];
}

function log(message, messageType) {
    const [hours, minutes, seconds] = getTimeNow();

    const parent = document.createElement("DIV");
    const child = document.createTextNode(`[${hours}:${minutes}:${seconds}] ${message}`);

    parent.appendChild(child);

    if (messageType == "error") {
        parent.classList.add("error");
    }

    logBox.appendChild(parent);
    logBox.scrollTop = logBox.scrollHeight; // scroll to the bottom of element
}

function setAttribute(element, attrName, attrValue) {
    element[attrName] = attrValue;
}

function countKeys(obj) { // -> Int
    return (Object.keys(obj)).length;
}

function copyTextToClipboard(element) {
    const prefix = "(copy)";

    if ((element.value).length == 0) {
        log(`${prefix} No data provided.`, "error");
        return;
    }

    try {
        element.select();
        element.setSelectionRange(0, 99999); // for mobile
        document.execCommand("copy"); // deprecated; farewell, my friend
        element.selectionStart = element.selectionEnd; // unselect
        log(`${prefix} Copied to clipboard.`);
    } catch (errorMessage) {
        log(`${prefix} ${errorMessage}`, "error");
    }
}

function getDataType(data) { // -> String
    if (data === null) {
        return "null";
    }

    if (data.constructor === Object) {
        return "object";
    }

    if (data.constructor === Array) {
        return "array";
    }

    let result;

    switch (typeof data) {
        case "string":
            result = "string";
            break;

        case "number":
            if (String(data).indexOf(".") > -1) {
                result = "number"; // float
            } else {
                result = "integer";
            }
            break;

        case "boolean":
            result = "boolean";
            break;

        default:
            result = "unknown";
    }

    return result;
}

function loadJson(element) { // -> null || Object || Array
    const prefix = "(load JSON)";
    const value = element.value;

    if (value == "") {
        log(`${prefix} No data provided.`, "error");
        return null;
    }

    let data;

    try {
        data = JSON.parse(value);
    } catch (errorMessage) {
        log(`${prefix} ${errorMessage}`, "error");
        return null;
    }

    const dataType = getDataType(data);

    if (dataType !== "object" && dataType !== "array") {
        log(`${prefix} Request body is not an object or array.`, "error");
        return null;
    }

    return data;
}

function preprocessData(data) { // -> Object || Array
    switch (getDataType(data)) {
        case "object":
            return preprocessObject(data);

        case "array":
            return preprocessArray(data);
    }
}

function preprocessObject(obj) { // -> Object
    // Values are replaced with strings describing their types. In-place replacement.

    if (countKeys(obj) == 0) {
        return obj;
    }

    for (const [key, value] of Object.entries(obj)) {
        switch (getDataType(value)) {
            case "null":
                obj[key] = "null";
                continue;

            case "object":
                obj[key] = preprocessObject(value);
                continue;

            case "array":
                obj[key] = preprocessArray(value);
                continue;

            case "string":
                obj[key] = "string";
                continue;

            case "integer":
                obj[key] = "integer";
                continue;

            case "number":
                obj[key] = "number";
                continue;

            case "boolean":
                obj[key] = "boolean";
                continue;

            default: // just in case
                log(`${prefix} Unknown type for ${key}. Fallback to string.`, "error");
                obj[key] = "string";
                continue;
        }
    }

    return obj;
}

function preprocessArray(arr) { // -> Array
    // Primitives are replaced with strings describing their types.
    // Keeps looping till there is no more nesting.
    // Only the first item is processed.
    // [0, "zero"] -> items: { type: "integer" }

    if (arr.length == 0) {
        return arr;
    }

    let result = [];

    const item = arr[0];
    const itemDataType = getDataType(item);

    switch (itemDataType) {
        case "object":
            result.push(preprocessObject(item));
            break;

        case "array":
            result.push(preprocessArray(item));
            break;

        default:
            result.push(itemDataType);
    }

    return result;
}

function handleObject(obj) { // -> Object
    // Convert Object to Ajv compatible schema
    const schemaKeyType = "type";
    const schemaKeyProperties = "properties";
    const schemaKeyRequired = "required";

    const result = {};

    result[schemaKeyType] = "object";
    result[schemaKeyProperties] = {};
    result[schemaKeyRequired] = [];

    if (countKeys(obj) == 0) {
        return result;
    }

    for (const [key, value] of Object.entries(obj)) {
        result[schemaKeyRequired].push(key);

        switch (getDataType(value)) {
            case "object":
                result[schemaKeyProperties][key] = handleObject(value);
                continue;

            case "array":
                result[schemaKeyProperties][key] = handleArray(value);
                continue;

            default:
                result[schemaKeyProperties][key] = {};
                result[schemaKeyProperties][key][schemaKeyType] = value;
        }
    }

    return result;
}

function handleArray(arr) { // -> Object
    // Convert Array to Ajv compatible schema
    const schemaKeyType = "type";
    const schemaKeyItems = "items";

    const result = {};

    result[schemaKeyType] = "array";

    if (arr.length == 0) {
        result[schemaKeyItems] = {};
        return result;
    }

    const itemDataType = getDataType(arr[0]);

    switch (itemDataType) {
        case "object":
            result[schemaKeyItems] = handleObject(arr[0]);
            break;

        case "array":
            result[schemaKeyItems] = handleArray(arr[0]);
            break;

        default:
            result[schemaKeyItems] = {};
            result[schemaKeyItems][schemaKeyType] = arr[0]; // value is already preprocessed
    }

    return result;
}

function convertToSchema(data) { // -> String
    let result;

    switch (getDataType(data)) {
        case "object":
            result = JSON.stringify(handleObject(data), null, 4);
            break;

        case "array":
            result = JSON.stringify(handleArray(data), null, 4);
            break;
    }

    return result;
}

function handleConvert() {
    const json = loadJson(jsonTextBox);
    let result = "var schema = ";

    if (json) {
        result += convertToSchema(preprocessData(loadJson(jsonTextBox)));

        result += ";";
        result = result.replace(/"([^"]+)":/g, '$1:'); // unquote keys; https://stackoverflow.com/a/11233515

        setAttribute(schemaTextBox, "value", result);
    }
}

// Constants

const REQUEST_BODY_SAMPLE = `{
    "books": [
        {
            "id": 0,
            "title": "Le Cat",
            "is_published": true,
            "price": 13.37,
            "genre": null,
            "sellers": [
                "FOX BOOKS",
                "The Shop Around the Corner",
                "Flourish and Blotts"
            ],
            "isbn": {
                "prefix": 978,
                "language_code": 1,
                "publisher_id": 56619,
                "title_info": 909,
                "check": 4
            },
            "comments": []
        }
    ],
    "authors": [
        "Edgar Allan Poe",
        "Jack London",
        "J. K. Rowling"
    ]
}`;

const HOW_TO_TEXT = `Hello, world!
~~~~~~~~~~~~~~~~~~~~~~ How-To ~~~~~~~~~~~~~~~~~~~~~~
1. Copy 'Example Value' from Swagger.
2. Paste it in 'JSON' text box above.
3. Click button 'Convert to schema'.
----------------------------------------------------
Limitations: enum is not supported; only the first
item in the array is processed.
----------------------------------------------------
Learn more: https://ajv.js.org/json-schema.html`;

const playDemoButton = document.getElementById("play-demo-button");

const clearJsonBoxButton = document.getElementById("clear-json-box-button");
const convertToSchemaButton = document.getElementById("convert-to-schema-button");
const jsonTextBox = document.getElementById("json-box");

const clearSchemaBoxButton = document.getElementById("clear-schema-box-button");
const copySchemaButton = document.getElementById("copy-schema-button");
const schemaTextBox = document.getElementById("schema-box");

const logBox = document.getElementById("log-box");

// Handlers

playDemoButton.addEventListener("click", () => {
    setAttribute(jsonTextBox, "value", REQUEST_BODY_SAMPLE);

    handleConvert();
});

clearJsonBoxButton.addEventListener("click", () => {
    setAttribute(jsonTextBox, "value", "");
});

convertToSchemaButton.addEventListener("click", () => {
    handleConvert();
});

clearSchemaBoxButton.addEventListener("click", () => {
    setAttribute(schemaTextBox, "value", "");
});

copySchemaButton.addEventListener("click", () => {
    copyTextToClipboard(schemaTextBox);
});

// Init routine

log(HOW_TO_TEXT);
