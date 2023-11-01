const DOWNLOAD_URL = "http://localhost:3000/minio/download";

const getFilesList = () => {
  const bucketList = document.getElementById("bucketList");
  XHR = new XMLHttpRequest();

  // on success, append the name of stored files on <ol> list element
  XHR.addEventListener("load", (event) => {
    const bucketData = JSON.parse(event.target.response);
    console.log("Length: ");
    console.log(bucketData.length);
    for (let index = 0; index < bucketData.length; index++) {
      // pass the bucket data for the specific file
      appendBucket(bucketData[index], bucketList); 
    }
  });

  // on failure, log event
  XHR.addEventListener("error", (event) => {
    console.error(event);
  });

  XHR.open("GET", DOWNLOAD_URL);
  XHR.send();
};

const appendBucket = (bucketData, bucketList) => {
  // anchor element referencing specific file download url
  console.log(bucketData, 'appendBucket')
  const a = document.createElement("a");
  a.setAttribute(
    "href",
    `${DOWNLOAD_URL}/${bucketData.url}`
  );
  a.innerHTML = decodeURIComponent(bucketData.name);

  // append anchor element to the list as a list item
  const item = bucketList.appendChild(document.createElement("li"));
  item.appendChild(a);
};

window.onload = getFilesList;
