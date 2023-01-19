# bible-preview-app

A uW (DCS) Bible preview app

View the App: https://bible-preview-app.netlify.app

# The Below comes from https://github.com/mandolyte/bible-ref-pk-demo (to be changed/updated)

## Observations

- Importing USFM documents is a lengthly process. It took several minutes to manually load all 66 books in uW ULT repository.
    - Given that our near term effort will be to switch to the Door43-Catalog and use fixed releases, we could build into our publishing process a way to pre-create the Proskomma (PK) database.
    - In theory, we could build one instance per language; but if the PK database is small enough, perhaps one instance could hold then entire catalog
- I used a global variable for the Proskomma instance
    - A better approach would be a React Context (essentially a safer way to provide globally accessable data)
    - Such a context approach already exists and it might be possible to switch to it
    - This effort is here: https://github.com/unfoldingWord-box3/proskomma-scripture-resources-rcl and here:
    https://github.com/unfoldingWord-box3/uw-proskomma
- Once a book is imported, the content of a verse is instantaneous.

Things left to ponder:

- Need to try the Original Language repostories
- Most of our tools require alignment in order to highlight a word or phrase in multiple texts. I do not yet understand how PK captures this so we can leverage it.
- There is also the deprecation of translation words in the original language texts and use of TSV data instead. I do not if our tools will need to write custom logic to handle this association or whether PK can help.


# Overview of Rendering Feature

*`package.json`*

Imports needed/used:
- "proskomma": "0.6.12",
- "proskomma-render-pdf": "0.6.8",

*Startup*

At app startup, the App Context creates an instance of Proskomma, storing it as state variable and including it in the Context state. The code is:

```js
  const [pk, /*setPk*/] = useState(new Proskomma([
  {
      name: "org",
      type: "string",
      regex: "^[^\\s]+$"
  },
  {
      name: "lang",
      type: "string",
      regex: "^[^\\s]+$"
  },
  {
      name: "abbr",
      type: "string",
      regex: "^[A-za-z0-9_-]+$"
  }
]));
```

Note that there is not set function provided to update the state. Proskomma manages is own state via side effects of its API.

*Initiation*

After importing some books to show some verses, the books imported can now be used to render an HTML page with the content ready for printing or saving as a PDF. This is initiated by clicking a button labelled "PRINT IMPORTED BOOKS".

*Actions Taken*

When the button is clicked, the onClick handler sets a state variable:
```js
        setPrintPreview(true)
```

This set function exists in the app context and there is defined:
```js
  const [printPreview, setPrintPreview] = useState(false)
```

**React Hook Actions**

*Render Hook - creates the HTML*

There is a useEffect hook that monitors when the variable `printPreview` becomes true.
Once it becomes true a function named "renderHtml" runs:
```js
      const html = await renderHTML({ proskomma: pk, 
        language: 'eng',
        textDirection: 'ltr',
        books: importedBooks,
      });
      // console.log("doRender html is:", html); // the object has some interesting stuff in it
      setHtml(html.output);
      // return to false
      setPrintPreview(false)
```
When it completes, the html content is stored in a state variable (again, still in the app context code). Finally, the "printPreview" variable is reset to false.

*New Window Hook*

There is a useEffect hook that monitors the "html" state variable. This hook is also in the app context. It will do the following:
- It opens a new window
- Certain needed things are written to the new window, such as, a `title` attribute, a script pointing to the "pagedjs" package, some styling, and finally, the generated HTML is written to the new window.
- Lastly, the "html" state value is reset to null again.

