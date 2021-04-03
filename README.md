# bible-ref-pk-demo
Use of Bible Ref Component with Proskomma


View Github Pages: https://mandolyte.github.io/bible-ref-pk-demo/

## Observations

- Importing USFM documents is a lengthly process. It took several minutes to manually load all 66 books in uW ULT repository.
    - Given that our near term effort will be to switch to the Door43-Catalog and use fixed releases, we could build into our publishing process a way to pre-create the Proskomma (PK) database.
    - In theory, we could build one instance per language; but if the PK database is small enough, perhaps one instance could hold then entire catalog
- I used a global variable for Proskomman instance
    - A better approach would be a React Context (essentially a safer way to provide globally accessable data)
    - Such a context approach already exists and it might be possible to switch to it
    - This effort is here: https://github.com/unfoldingWord-box3/proskomma-scripture-resources-rcl and here:
    https://github.com/unfoldingWord-box3/uw-proskomma
- Once a book is imported, the content of a verse is instantaneous.

Things left to ponder:

- Need to try the Original Language repostories
- Most of our tools require alignment in order to highlight a word or phrase in multiple texts. I do not yet understand how PK captures this so we can leverage it.
- There is also the deprecation of translation words in the original language texts and use of TSV data instead. I do not if our tools will need to write custom logic to handle this association or whether PK can help.
