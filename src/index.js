import React from "react";
import ReactDOM from "react-dom";

import App from "./App";

const supportedBooks = null; // if empty array or null then all books available
// const supportedBooks = [ 'mat', 'mrk', 'mal', '1ti', '2ti']; // if non-empty array then only these books are shown
const initialBook = "tit";
const initialChapter = "1";
const initialVerse = "1";

const props = {
  initialBook,
  initialChapter,
  initialVerse,
  supportedBooks
};

const rootElement = document.getElementById("root");
ReactDOM.render(
  <React.StrictMode>
    <App {...props} />
  </React.StrictMode>,
  rootElement
);
