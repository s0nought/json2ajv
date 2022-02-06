# json2ajv

## Summary
Static website.

## What it does
Converts JSON to Ajv compatible schema for Postman.

### Supported data types
- null
- object
- array
- string
- number (float)
- integer
- boolean

### Nesting
Supports nested arrays and/or objects.

### Limitations
Enum is not supported; only the first item in the array is processed.

## Sample
**Input**
<pre>{
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
}</pre>

**Output**
<pre>var schema = {
    type: "object",
    properties: {
        books: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: {
                        type: "integer"
                    },
                    title: {
                        type: "string"
                    },
                    is_published: {
                        type: "boolean"
                    },
                    price: {
                        type: "number"
                    },
                    genre: {
                        type: "null"
                    },
                    sellers: {
                        type: "array",
                        items: {
                            type: "string"
                        }
                    },
                    isbn: {
                        type: "object",
                        properties: {
                            prefix: {
                                type: "integer"
                            },
                            language_code: {
                                type: "integer"
                            },
                            publisher_id: {
                                type: "integer"
                            },
                            title_info: {
                                type: "integer"
                            },
                            check: {
                                type: "integer"
                            }
                        },
                        required: [
                            "prefix",
                            "language_code",
                            "publisher_id",
                            "title_info",
                            "check"
                        ]
                    },
                    comments: {
                        type: "array",
                        items: {}
                    }
                },
                required: [
                    "id",
                    "title",
                    "is_published",
                    "price",
                    "genre",
                    "sellers",
                    "isbn",
                    "comments"
                ]
            }
        },
        authors: {
            type: "array",
            items: {
                type: "string"
            }
        }
    },
    required: [
        "books",
        "authors"
    ]
};</pre>

## How to install
Not required (portable).

## Changelog

### version 1 (2022.02.06)
- Initial commit
