// import { doRender } from "proskomma-render-pdf";
import {isNT} from '../common/BooksOfTheBible';

export const SINGLE_BOOK_CONFIG = {
  "title": "unfoldingWord Literal Translation",
  "language": "en",
  "textDirection": "ltr",
  "uid": "ULT",
  "structure": [
    [
      "section",
      "nt",
      [
        [
          "bookCode",
          "%bookID%"
        ]
      ]
    ]
  ],
  "i18n": {
    "notes": "Notes",
    "tocBooks": "Books of the Bible",
    "titlePage": "unfoldingWord Literal Translation",
    "copyright": "Licensed under a Creative Commons Attribution-Sharealike 4.0 International License",
    "coverAlt": "Cover",
    "preface": "Preface",
    "ot": "Old Testament",
    "nt": "New Testament"
  }
};

export async function renderHTML({ proskomma, language, textDirection, books }) {
  let response = {};
  let docSetIds = [];
  let _structure = [];
  let ntList = []
  let otList = []
  _structure.push("section");
  for (let i=0; i < books.length; i++) {
    // first, create the docSetId
    const docSetId = language + "_"+ books[i].toUpperCase();
    docSetIds.push(docSetId);

    // second an entry for the array of bookcodes
    let entry = [];
    entry.push('bookCode');
    entry.push(books[i].toUpperCase());
    
    // third add it to the ot or nt array
    if ( isNT(books[i]) ) {
      ntList.push( entry );
    } else {
      otList.push( entry );
    }
  }

  // Next the ot/nt lists to the structure
  _structure.push("nt");
  _structure.push(ntList);
  _structure.push("ot");
  _structure.push(otList);
  console.log("finished structure is:", _structure);
  console.log("finished docSetIds is:", docSetIds)

  // const docSetIds = [docSetId]
  // const testamentIds = Object.keys(structure);
  // const _structure = testamentIds.map((testamentId) => {
  //   const testament = structure[testamentId];

  //   const testamentBookCodes = testament.map((bookId) => (
  //     ['bookCode', bookId.toUpperCase()]
  //   ));
  //   return ['section', testamentId, testamentBookCodes];
  // }).filter(section => section[2].length > 0);

  const config = {
    ...SINGLE_BOOK_CONFIG,
    title: SINGLE_BOOK_CONFIG.title,
    language,
    textDirection,
    structure: _structure,
    i18n: SINGLE_BOOK_CONFIG.i18n,
    bookOutput: {}, //?
  };

  // response = await doRender(proskomma, config, docSetIds);
  return config;
  // return response;
}


export function printBooks(books) {
    console.log("printBooks() input was:", books)
}