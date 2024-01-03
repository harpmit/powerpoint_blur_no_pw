function add_paragraph(text) {
    let para = document.createElement("p");
    para.innerHTML = text;

    let element = document.getElementById("main");
    element.appendChild(para);
}

function download(file) {
    const link = document.createElement('a')
    const url = URL.createObjectURL(file)
  
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
  
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }


async function setupPython(pyodide) {
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");

    // Before importing a package in python, we have to install it in the pyodide environemnt
    // We have two options to do this

    // For common packages and if we are using the cdn version of pyiodide (see index.html), we may be able to just use their name
    // For example, pyiodide makes numpy available by default
    // await micropip.install('numpy')

    // If we are using a local version of pyiodide (see index.html) or if the package isn't included in pyodide's default pakage list,
    // Then we need to include a python .whl for the package and use that to install it
    // For example, here's how to install numpy from a .whl file
    // await micropip.install('pyodide/python_wheels/numpy-1.24.2-cp311-cp311-emscripten_3_1_32_wasm32.whl');


    // Load the custom python code included in this app
    // The code should include a function called "js_entry_point(arg)"
    //// This function should take one argument
    ////// The path to read the file we will manipulate from (as a string)
    //// This function should return a list of string
    ////// Each value in the list should be the path to a file that will be downloaded by the browser
    await micropip.install('python_code/dist/python_code-0.0.0-py3-none-any.whl');
    pyodide.runPython(`from python_code import *`);
}

async function main(){
    add_paragraph('Downloading and setting up Pyodide (broswer-compatible python interpretter)')
    pyodide = await loadPyodide();
    add_paragraph('...Pyodide ready')

    add_paragraph('Setting up our python environment with micropip...')
    await setupPython(pyodide)
    add_paragraph('...Python environment ready')

    add_file_upload_button()
}

function add_file_upload_button() {
    let input = document.createElement("input")
    input.type = 'file'
    input.multiple = true
    input.accept = '.jpg'
    input.id='fileUploadButton'
    input.addEventListener('change',file_upload_listener)

    let element = document.getElementById("main");
    element.appendChild(input);
}


function file_upload_listener(event) {

    let saved_files = [];
    function save_file(event) {
        let file_name = '/'+event.srcElement.file_name_tmp;
        let binary_data = new Uint8Array(event.srcElement.result)
        pyodide.FS.writeFile(file_name, binary_data, 
                            { encoding: "binary" })
        saved_files.push(file_name)
    }

    file_reader_promises = []
    for (let i = 0; i < event.srcElement.files.length; i++) {
        file_reader_promises.push(
            new Promise((resolve,reject) => {
                let fileReader = new FileReader();
                fileReader.file_name_tmp = event.srcElement.files[i].name
                fileReader.onload = (event) => resolve(save_file(event));
                fileReader.onerror = (err) => reject(err);
                fileReader.readAsArrayBuffer(event.srcElement.files[i]);
                file_reader_promises.push(fileReader)
            })
        );
    }

    let all_files_loaded = Promise.all(file_reader_promises)
    all_files_loaded.then(() => pass_files_to_python(saved_files))
}

function pass_files_to_python(file_path_array) {

    let js_entry_point = pyodide.globals.get('js_entry_point');
    let manipulated_files = js_entry_point(file_path_array).toJs()
    
    for (let i = 0; i < manipulated_files.length; i++) {
        let file_contents = pyodide.FS.readFile(manipulated_files[i],
                                                  {encoding: "binary" })
        let file_to_download = new File([file_contents],manipulated_files[i])
        download(file_to_download)
    }
}

var pyodide;
main()