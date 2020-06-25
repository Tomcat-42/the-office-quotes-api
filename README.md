# The Office Quotes API

A simple Node.js REST API that serves quotes from the NBC's US show _The Office_.

![Michael](https://media.comicbook.com/2019/10/michael-scott-two-headed-michael-1193498.jpeg)

## Hosts

**API base endpoint:**

https://the-office-quotes-api.herokuapp.com/

**Example page for requesting random quotes**
[![Netlify Status](https://api.netlify.com/api/v1/badges/2df89e8f-9fad-467e-8ae2-7095c2d6443b/deploy-status)](https://app.netlify.com/sites/the-office-random-quotes/deploys):

https://the-office-random-quotes.netlify.app/

## How to use

All responses will be a JSON document in the form:

```javascript
{
    result: ...,
    status: "ok"|"not found"|"error",
}
```

Where **status** is self explanatory and **result** is a object or an array of
objects depending of the requested data.

On requests that might return multiple results, the response document is
paginated:

```javascript
{
    result: [...],
    status: "ok"|"not found"|"error",
    total: Int,
    limit: Int,
    page: Int,
    pages: Int,
}
```

Where **total** is the number of objects, **limit** is the number of objects
returned by page, **page** is the current page and **pages** is the number of
pages. For requesting paginated data, simply append the url encoded parameter
**page** to the request url, the default page value is 1.

Ex:

https://the-office-quotes-api.herokuapp.com/characters?page=2

### Chacters

A **Character** document takes the form:

```javascript
{
    _id: ObjectId,
    name: String,
}
```

Where **\_id** is the Character id on the database.

#### Routes

| method | route             | optional url parameters | result                     |
| ------ | ----------------- | ----------------------- | -------------------------- |
| GET    | characters/       | page                    | list of characters         |
| GET    | characters/random |                         | show a random character    |
| GET    | characters/search | names[], page           | search characters by names |
| GET    | characters/:id    |                         | show a character by id     |

##### characters/

Returns a paginated document with the index of characters. The **page** url
parameter change the page of documents.

Ex:

https://the-office-quotes-api.herokuapp.com/characters?page=2

Should return:

```javascript
{
    result: [Character],
    status: "ok",
    total: Int,
    limit: Int,
    page: Int,
    pages: Int,
}
```

##### characters/random

Returns a random character.

Ex:

https://the-office-quotes-api.herokuapp.com/characters/random

Should return:

```javascript
{
    result: Character,
    status: "ok",
}
```

##### characters/search

Search characters by names. The **names** url parameter is an array containing
one or more strings to search characters names. A Character will be matched if:

-   for any names[i] his name match the regex: `/names[i]/i`.

Ex:

https://the-office-quotes-api.herokuapp.com/characters/search?names=Dwight&page=2

https://the-office-quotes-api.herokuapp.com/characters/search?names[]=Dwight&names[]=angela&names[]=mered

Should return:

```javascript
{
    result: [Character],
    status: "ok",
    total: Int,
    limit: Int,
    page: Int,
    pages: Int,
}
```

##### characters/:id

Returns a Character by his id.

Ex:

https://the-office-quotes-api.herokuapp.com/characters/5eee1a13d26b76a7e6522358

Should return:

```javascript
{
    result: [Character],
    status: "ok",
}
```

### Quotes

A **Quote** document takes the form:

```javascript
{
    _id: ObjectId,
    character: Character,
    episode: {
        name: String,
        season: Int,
        number: Int,
    },
    quote: String
}
```

Where **\_id** is the Quote id on the database, **character** is the character
that said the quote, **episode** is the episode which the quote occured and
**quote** is the quote text.

#### Routes

| method | route         | optional url parameters                           | result                                                         |
| ------ | ------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| GET    | quotes/       | page                                              | list of quotes                                                 |
| GET    | quotes/random |                                                   | show a random quote                                            |
| GET    | quotes/search | page, seasons[], episodes[], names[] and quotes[] | search quotes by seasons , episodes, names and quotes contents |
| GET    | quotes/:id    |                                                   | show a quote by id                                             |

##### quotes/

Returns a paginated document with the index of quotes. The **page** url
parameter change the page of documents.

Ex:

https://the-office-quotes-api.herokuapp.com/quotes

Should return:

```javascript
{
    result: [Quote],
    status: "ok",
    total: Int,
    limit: Int,
    page: Int,
    pages: Int,
}
```

##### quotes/random

Returns a random quote.

Ex:

https://the-office-quotes-api.herokuapp.com/quotes/random

Should return:

```javascript
{
    result: Quote,
    status: "ok",
}
```

##### quotes/search

Search quotes by season, episode, name and quote content. The **seasons** and
**episodes** url parameters are integers arrays and **names** and **quotes** are
string arrays.

A Quote will be matched if:

-   for any names[i] the character name of the quote match the regex
    `/names[i]/i`. **and**
-   for any quotes[i] the quote text match the regex: `/quotes[i]/i`.**and**
-   for any seasons[i] the quote seasons number is equal to seasons[i]. **and**
-   for any episodes[i] the quote number is equal to seasons[i].

Ex:

https://the-office-quotes-api.herokuapp.com/quotes/search?seasons=1&episodes=1&names=dwight&quotes=jell-o

https://the-office-quotes-api.herokuapp.com/quotes/search?seasons[]=1&seasons[]=2&seasons[]=3&episodes[]=1&episodes[]=2&names[]=michael&names[]=jan&quotes=she%20said

Should return:

```javascript
{
    result: [Quote],
    status: "ok",
    total: Int,
    limit: Int,
    page: Int,
    pages: Int,
}
```

##### quotes/:id

Returns a Quote by his id.

Ex:

https://the-office-quotes-api.herokuapp.com/quotes/5eee1a1463fcc994d170ecc5

Should return:

```javascript
{
    result: Quote,
    status: "ok",
}
```

### Conversations

A **Conversation** document takes the form:

```javascript
{
    _id: ObjectId,
    episode: {
        name: String,
        season: Int,
        number: Int,
    },
    quotes: [Quote],
}
```

Where **\_id** is the Conversation id on the database, **episode** is the
episode which the conversation occured and **quotes** is and array of the quotes
that make the conversation.

#### Routes

| method | route                | optional url parameters                           | result                                                                |
| ------ | -------------------- | ------------------------------------------------- | --------------------------------------------------------------------- |
| GET    | conversations/       | page                                              | list of conversations                                                 |
| GET    | conversations/random |                                                   | show a random conversation                                            |
| GET    | conversations/search | page, seasons[], episodes[], names[] and quotes[] | search conversations by seasons , episodes, names and quotes contents |
| GET    | conversations/:id    |                                                   | show a conversation by id                                             |

##### conversations/

Returns a paginated document with the index of conversations. The **page** url
parameter change the page of documents.

Ex:

https://the-office-quotes-api.herokuapp.com/conversations

Should return:

```javascript
{
    result: [Conversation],
    status: "ok",
    total: Int,
    limit: Int,
    page: Int,
    pages: Int,
}
```

##### conversations/random

Returns a random conversation.

Ex:

https://the-office-quotes-api.herokuapp.com/conversations/random

Should return:

```javascript
{
    result: Conversation,
    status: "ok",
}
```

##### conversations/search

Search conversations by season, episode, name and quote content. The **seasons**
and **episodes** url parameters are integers arrays and **names** and **quotes**
are string arrays.

A Conversation will be matched if:

-   for any names[i] the character name in any of the conversation quotes match
    the regex `/names[i]/i`. **and**
-   for any quotes[i] the quote text in any of the quotes of the conversation
    match the regex: `/quotes[i]/i`.**and**
-   for any seasons[i] the conversation seasons number is equal to seasons[i].
    **and**
-   for any episodes[i] the conversation number is equal to seasons[i].

Ex:

https://the-office-quotes-api.herokuapp.com/conversations/search?seasons=1&episodes=1&names=dwight&quotes=jell-o

https://the-office-quotes-api.herokuapp.com/conversations/search?seasons[]=1&seasons[]=2&seasons[]=3&episodes[]=1&episodes[]=2&names[]=michael&names[]=jan&quotes=she%20said

Should return:

```javascript
{
    result: [Conversation],
    status: "ok",
    total: Int,
    limit: Int,
    page: Int,
    pages: Int,
}
```

##### conversations/:id

Returns a Conversation by his id.

Ex:

https://the-office-quotes-api.herokuapp.com/conversations/5eee1c6663fcc994d171d5aa

Should return:

```javascript
{
    result: Conversation,
    status: "ok",
}
```
