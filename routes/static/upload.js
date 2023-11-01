// constants and global variables
const CHUNK_SIZE = 5 * 1024 * 1024;
const UPLOAD_URL = "http://localhost:3000/minio/upload";
let file;
let xhr;
let chunkNumber = 0;
let isPaused = false;
let fileId = 0

const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const progressContainer = document.getElementById("progressContainer");
const tickIcon = document.getElementById("tickIcon");
const metaData = document.getElementById("metaData");
const pauseButton = document.getElementById("pauseButton");
const resumeButton = document.getElementById("resumeButton");
const restartButton = document.getElementById("restartButton");

const showMetaData = () => {

  if (file && file.size) {
    metaData.innerHTML = `
    <div class="overflow-hidden bg-white outline outline-1 outline-slate-200 sm:rounded-lg mt-4">
        <div class="px-4 py-2 sm:px-6">
            <h3 class="text-base font-semibold leading-6 text-gray-900">
                File Details
            </h3>
        </div>
        <div class="border-t border-gray-200">
            <dl>
                <div class="bg-gray-50 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">
                        Name: ${file.name}
                    </dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                        
                    </dd>
                </div>
                <div class="bg-white px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">
                        Type: ${file.type}
                    </dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                        
                    </dd>
                </div>
                <div class="bg-gray-50 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">
                        Size: ${file.size} bytes
                    </dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                        
                    </dd>
                </div>
            </dl>
        </div>
    </div>`
  } else {
    metaData.innerHTML = "No file selected";
  }
}
// code that handles user selecting a file
const handleChange = (event) => {
  file = event.target.files[0];
  showMetaData();
};

const input = document.getElementById("fileInput");
input.addEventListener("change", handleChange);

// function to update the progress bar
const updateProgressBar = (percentage) => {
  progressBar.style.width = percentage + "%";
  const progressFill = document.getElementById("progressFill");
  progressFill.style.width = percentage + "%";
  progressText.innerText = percentage + "%";
};

// code that handles user clicking on 'send' button
const handleStart = (idx) => {
  progressContainer.classList.remove("hidden"); // Show the progress bar container
  // set total number of chunks
  const chunksTotal = Math.ceil(file.size / CHUNK_SIZE);
  console.log(fileId, 'fileId in handleStart')
  // set file identifier to be used by the server to handle exceptions
  // const fileId = crypto.randomUUID().replaceAll("-", "");
  // const fileId = generateRandomUUID(); // call the function that generate a random UUID

  // for (let chunkIndex = idx; chunkIndex < chunksTotal; chunkIndex++) {
    // each loop picks a chunk of the file to be sent to the server
    let chunk;
    let chunkIndex = idx;
    const isLastChunk = chunkIndex + 1 === chunksTotal;
    if (isLastChunk) {
      chunk = file.slice(chunkIndex * CHUNK_SIZE);
    } else {
      chunk = file.slice(
        chunkIndex * CHUNK_SIZE,
        (chunkIndex + 1) * CHUNK_SIZE
      );
    }

    const chunkMetaData = {
      chunkIndex: chunkIndex,
      chunksTotal: chunksTotal,
      originalFileId: fileId,
    };
    const chunkFormData = getFormData(chunk, chunkMetaData);
    sendData(chunkFormData, chunkIndex, chunksTotal, fileId)
    chunkNumber = chunkIndex;

//   if (chunkIndex == chunksTotal - 1) {
//   // notice appendBucket function comes from download.js,
//   // so the script loading order is IMPORTANT!!
//  }
};

const button = document.getElementById("sendButton");
button.addEventListener("click", () => {
  fileId = generateRandomUUID();
  handleStart(0, fileId)
});

pauseButton.addEventListener('click', () => {
  console.log('pause button clicked')
  if (xhr) {
      xhr.abort();
  console.log('pause button clicked')

      isPaused = true;
      console.log('Upload paused');
  }
});

resumeButton.addEventListener('click', () => {
  if (xhr) {
      isPaused = false;
      if (fileId != 0) {handleStart(chunkNumber)}
      console.log('Upload resumed');
  }
});

restartButton.addEventListener('click', async () => {
  if (xhr) {
      xhr.abort();
      updateProgressBar(0);
      isPaused = false;
      if (fileId != 0) {
        console.log(fileId, 'fileId in restartButton')
        deleteBucket(fileId)
        fileId = generateRandomUUID();
        console.log(fileId, 'fileId in restartButton2')
        handleStart(0)
      }
      console.log('Upload restarted');
  }
});

// function to generate a random UUID (pseudo-random)
function generateRandomUUID() {
  return uuidv4();
}

const getFormData = (chunk, metaData) => {
  const chunkForm = new FormData();

  // appending metaData attributes
  for (const [key, value] of Object.entries(metaData)) {
    chunkForm.append(key, value);
  }
  // append the slice blob with a descriptive name
  const chunkName =
    file.name + ".chunk" + ++metaData.chunkIndex + "of" + metaData.chunksTotal;
  chunkForm.append("chunk", chunk, chunkName);

  return chunkForm;
};

const deleteBucket = (bucketName) => {
  xhr = new XMLHttpRequest()
  xhr.open("DELETE", `http://localhost:3000/minio/delete/${bucketName}`, true);

  xhr.onload = function() {
    if (xhr.status === 204) {
      console.log(`Bucket "${bucketName}" deleted successfully.`);
    } else {
      console.error('Failed to delete the bucket:', xhr.status, xhr.statusText);
    }
  };

  xhr.send()
  console.log("ended")
}

const sendData = (formData, chunkIndex, chunksTotal, fileId) => {
  xhr = new XMLHttpRequest();

  xhr.open("POST", UPLOAD_URL);

  // Listen to the progress event to update the progress bar
  xhr.upload.addEventListener("progress", (event) => {
    if (event.lengthComputable) {
      // Calculate the loaded amount for the current chunk
      const loaded = event.loaded + chunkIndex * CHUNK_SIZE;
      const total = file.size;

      // Calculate the percentage based on the loaded amount
      const percentage = (loaded / total) * 100;

      // Update the progress bar
      updateProgressBar(percentage.toFixed(2));
    }
  });

  // code that listens for success or exceptions and handles it
  xhr.addEventListener("load", (event) => {
    console.info(event.target.status, event);
    console.log(chunkIndex)
    if (chunkIndex === chunksTotal - 1) {
      // Hide the progress bar when the last chunk is uploaded
      console.log(chunksTotal - 1, 'here')
      progressContainer.classList.add("hidden");
      tickIcon.classList.remove("hidden");
      console.log([fileId], 'fileId');
      appendBucket({ 'url': fileId, 'name': file.name }, document.getElementById("bucketList"));
    }
    else handleStart(chunkIndex + 1, fileId)
  });

  xhr.addEventListener("error", (event) => {
    console.error(event.target.status, event);
  });

  // sets up the request then sends the form
  // HTTP headers are set automatically
  xhr.send(formData);
};
