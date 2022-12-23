import React, { useEffect, useState } from "react";
import { AppContextProvider } from './App.context';
import AlignedBible from "./components/AlignedBible";
import { BibleBookData } from "./common/books";
import { fetchRepositoryZipFile, cachedGetManifest, getFileCached } from "./utils/zipUtils";
import { fetchGitRefs } from "./utils/dcsApis";


export default function App(props) {
  const [resourceComponent, setResourceComponent] = useState(null);

  useEffect(() => {
    let [owner, repo, branchOrTag, initialBook, initialChapter, initialVerse] = window.location.href.split('/').slice(3);
    console.log(owner, repo, branchOrTag, initialBook, initialChapter, initialVerse);
    let language = "";
    let textDirection = "ltr";
    let title = "";
    let supportedBooks = null;
    let isTcRepo = false;
    let resource = "";
    let commitID = "";
    let refType = "";

    if (!owner)
      owner = "unfoldingWord";
    if (!repo)
      repo = "en_ult";
    if (!branchOrTag)
      branchOrTag = "master";
    if (!initialChapter)
      initialChapter = "1";
    if (!initialVerse)
      initialVerse = "1";

    const loadManifest = async () => {
      const zipFetchSucceeded = await fetchRepositoryZipFile({ username: owner, repository: repo, branch: commitID });
      if (zipFetchSucceeded) {
        if (repo.endsWith("_book")) {
          isTcRepo = true;
          const manifestText = await getFileCached({ username: owner, repository: repo, path: "manifest.json", branch: commitID });
          if (manifestText) {
            const manifest = JSON.parse(manifestText);
            title = manifest.resource.id.toUpperCase();
            language = manifest.target_language.id;
            textDirection = manifest.target_language.direction;
            supportedBooks = [manifest.project.id];
            resource = manifest.resource.id;
          }
        } else {
          console.log("Fetching RC manifest: ", owner, repo, branchOrTag);
          const manifest = await cachedGetManifest({ username: owner, repository: repo, branch: commitID });
          console.log(manifest);
          if (manifest) {
            title = manifest.dublin_core.title;
            language = manifest.dublin_core.language.identifier;
            textDirection = manifest.dublin_core.language.direction;
            supportedBooks = manifest.projects.map(project => project.identifier).filter(id => BibleBookData[id] !== undefined);
            resource = manifest.dublin_core.identifier;
          }
        }
      }

      if (!title)
        return;

      if (!initialBook || !supportedBooks.includes(initialBook)) {
        if (supportedBooks && supportedBooks.length) {
          initialBook = supportedBooks[0];
        }
        else {
          initialBook = "tit";
        }
      }

      window.history.pushState({ id: "100" }, "Page", `/${owner}/${repo}/${branchOrTag}/${initialBook}`);

      const props = {
        initialBook,
        initialChapter,
        initialVerse,
        supportedBooks,
        owner,
        repo,
        branchOrTag,
        language,
        textDirection,
        resource,
        title,
        commitID,
        refType,
        isTcRepo,
      };

      setResourceComponent(<AlignedBible {...props} />);
    };

    const loadCommitInfo = async () => {
      let commitInfo = await fetchGitRefs(owner, repo, "refs/heads/"+branchOrTag);
      console.log("FIRST COMMIT INFO!!!!!: ", commitInfo);
      if (commitInfo) {
        refType = "Branch";
        commitID = commitInfo[0].object.sha;
      } else {
        commitInfo = await fetchGitRefs(owner, repo, "refs/tags/"+branchOrTag);
        if (commitInfo) {
          refType = "Tag"
          commitID = commitInfo[0].object.sha;
        } else {
          commitInfo = await fetchGitRefs(owner, repo, "commits/"+branchOrTag);
          if (commitInfo) {
            commitID = commitInfo.sha;
            refType = "Commit";
          }
        }
      }
      if (commitID) {
        commitID = commitID.slice(0, 10);
        loadManifest();
      }
    };

    loadCommitInfo();
  }, []);

  return (
    <AppContextProvider >
      {resourceComponent}
    </AppContextProvider >
  );
}


/* example query
cv (chapter:"3" verses:["6"]) { scopeLabels, items { type subType payload } tokens { subType payload } text }
<ReactJson src={my_json_object} />
{
    processor
    packageVersion
    documents {
        mainSequence {
            blocks(withScopes:["chapter/1", "verse/1"]) {
              text(normalizeSpace: true)
            }
        }
    }
}

    const bookParameter    = `${state.bookId}`.toUpperCase()
    const chapterParameter = `chapter/${state.chapter}`
    const verseParameter   = `verse/${state.verse}`

    const gql = `{
      processor
      packageVersion
      documents(withBook: "${bookParameter}") {
          mainSequence {
              blocks(withScopes:["${chapterParameter}", "${verseParameter}"]) {
                text(normalizeSpace: true)
              }
          }
      }
    }`

*/
